"""Canonical Academy local server (Python stdlib only).
- Serves the app on http://localhost:8768 (only the app files: index.html, css/, js/)
- Saves progress to progress.json (+ daily backups in backups/, kept 21 days)
- Proxies the AI tutor to the provider chosen in the UI (Gemini, Groq, OpenRouter, Ollama, Anthropic).
  Keys live in config.json and are never sent to the page.
- Optional, off by default (Linux only): runs lab commands in ~/canonical-labs and streams their output.
"""
import json, os, re, secrets, shutil, signal, subprocess, sys, time, datetime, platform, posixpath, threading, urllib.parse, urllib.request, urllib.error, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("CA_PORT", 8768))
PROG = os.path.join(ROOT, "progress.json")
CONF = os.path.join(ROOT, "config.json")
BK = os.path.join(ROOT, "backups")
LOG = os.path.join(ROOT, "activity_log.csv")
VIDCACHE = os.path.join(ROOT, "videos_cache.json")
YT = os.environ.get("CA_YT_BASE", "https://www.youtube.com")  # overridable for tests

# Requests must come from the app itself: blocks other websites and DNS rebinding.
HOSTS = {f"localhost:{PORT}", f"127.0.0.1:{PORT}"}
ORIGINS = {f"http://{h}" for h in HOSTS}
STATIC = re.compile(r"^/(index\.html|css/[\w.-]+\.css|js/[\w.-]+\.js)$")
MAX_BODY = 2_000_000
MAX_TOKENS = 1500
LOCK = threading.Lock()

# Lab runner (the learner turned it on in Settings → Labs; off by default, Linux only).
HOME = os.path.realpath(os.path.expanduser("~"))
LABS = os.path.expanduser(os.environ.get("CA_LABS_DIR", "~/canonical-labs"))
RUN_LIMIT = 30 * 60      # seconds before a lab command is stopped
RUN_OUT_MAX = 2_000_000  # bytes of output streamed per command
RUN_TOKEN = secrets.token_urlsafe(24)  # new on every start; only the app's own page can read it
RUNS = {}                # run id -> Popen, for the Stop button
CAN_RUN = os.name == "posix" and shutil.which("bash") is not None

PROVIDERS = {
    "gemini": {"label": "Google Gemini (free tier)", "kind": "openai", "base": "https://generativelanguage.googleapis.com/v1beta/openai",
               "model": "gemini-2.5-flash", "key_url": "https://aistudio.google.com/apikey"},
    "groq": {"label": "Groq (free tier)", "kind": "openai", "base": "https://api.groq.com/openai/v1",
             "model": "llama-3.3-70b-versatile", "key_url": "https://console.groq.com/keys"},
    "openrouter": {"label": "OpenRouter (free models)", "kind": "openai", "base": "https://openrouter.ai/api/v1",
                   "model": "meta-llama/llama-3.3-70b-instruct:free", "key_url": "https://openrouter.ai/keys"},
    "ollama": {"label": "Ollama (runs on your PC, free)", "kind": "openai", "base": "http://localhost:11434/v1",
               "model": "llama3.2", "key_url": "https://ollama.com/download", "no_key": True},
    "anthropic": {"label": "Anthropic Claude (paid)", "kind": "anthropic", "base": "https://api.anthropic.com/v1",
                  "model": "claude-sonnet-5-5", "key_url": "https://console.anthropic.com/settings/keys"},
}


def read_json(p, default):
    try:
        with open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def write_json(p, data):
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, p)


def backup(tag=None):
    """Copy progress.json into backups/ BEFORE it is changed: once per day, or always when tagged (reset, import)."""
    os.makedirs(BK, exist_ok=True)
    name = f"progress-{tag}-{datetime.datetime.now():%Y-%m-%d_%H%M%S}.json" if tag else f"progress-{datetime.date.today().isoformat()}.json"
    dst = os.path.join(BK, name)
    if os.path.exists(PROG) and not os.path.exists(dst):
        shutil.copy(PROG, dst)  # copy (not copy2) so the backup's age is the day it was made
    cutoff = time.time() - 21 * 86400
    for f in os.listdir(BK):
        fp = os.path.join(BK, f)
        if f.startswith("progress-") and os.path.getmtime(fp) < cutoff:
            os.remove(fp)


def load_conf():
    c = read_json(CONF, {})
    if "providers" not in c:  # old format: {"api_key", "model"} was Anthropic only
        old_key, old_model = c.get("api_key"), c.get("model")
        c = {"provider": "anthropic" if old_key else "gemini", "providers": {}}
        if old_key or old_model:
            c["providers"]["anthropic"] = {k: v for k, v in (("api_key", old_key), ("model", old_model)) if v}
    if c.get("provider") not in PROVIDERS:
        c["provider"] = "gemini"
    return c


def provider_cfg(c, name, override=None):
    """Effective settings for one provider: catalog defaults < saved config < unsaved values from the form."""
    p, saved, o = PROVIDERS[name], c["providers"].get(name, {}), override or {}
    return {"name": name, "kind": p["kind"], "no_key": p.get("no_key", False),
            "base": (o.get("base_url") or saved.get("base_url") or p["base"]).rstrip("/"),
            "key": (o.get("api_key") or saved.get("api_key") or "").strip(),
            "model": (o.get("model") or saved.get("model") or p["model"]).strip()}


def public_settings(c):
    out = {}
    for name, p in PROVIDERS.items():
        s = c["providers"].get(name, {})
        key = s.get("api_key", "")
        out[name] = {"label": p["label"], "key_url": p["key_url"], "no_key": p.get("no_key", False),
                     "hasKey": bool(key), "keyHint": ("…" + key[-4:]) if len(key) > 8 else "",
                     "model": s.get("model") or p["model"], "default_model": p["model"],
                     "base_url": s.get("base_url") or p["base"]}
    return {"provider": c["provider"], "providers": out}


def llm_request(pc, path, body=None):
    if pc["kind"] == "anthropic":
        headers = {"x-api-key": pc["key"], "anthropic-version": "2023-06-01"}
    else:
        headers = {"Authorization": f"Bearer {pc['key'] or 'none'}"}
        if pc["name"] == "openrouter":
            headers.update({"HTTP-Referer": f"http://localhost:{PORT}", "X-Title": "Canonical Academy"})
    # Cloudflare (Groq, OpenRouter) blocks the default "Python-urllib" user agent with "error code: 1010"
    headers["User-Agent"] = "CanonicalAcademy/1.0 (+http://localhost)"
    headers["Accept"] = "application/json, text/event-stream"
    data = None
    if body is not None:
        headers["content-type"] = "application/json"
        data = json.dumps(body).encode()
    return urllib.request.Request(pc["base"] + path, data=data, headers=headers, method="POST" if data else "GET")


def chat_body(pc, system, messages, stream=True):
    if pc["kind"] == "anthropic":
        return {"model": pc["model"], "max_tokens": MAX_TOKENS, "stream": stream, "system": system, "messages": messages}
    return {"model": pc["model"], "max_tokens": MAX_TOKENS, "stream": stream,
            "messages": ([{"role": "system", "content": system}] if system else []) + messages}


def clean_messages(msgs):
    out = []
    for m in (msgs if isinstance(msgs, list) else [])[-40:]:
        if not isinstance(m, dict) or m.get("role") not in ("user", "assistant") or not isinstance(m.get("content"), str):
            continue
        text = m["content"][:20000]
        if out and out[-1]["role"] == m["role"]:
            out[-1]["content"] += "\n\n" + text
        else:
            out.append({"role": m["role"], "content": text})
    while out and out[0]["role"] != "user":
        out.pop(0)
    return out


def http_error_text(e):
    raw = e.read().decode(errors="replace")
    try:
        j = json.loads(raw)
        j = j[0] if isinstance(j, list) and j else j
        err = j.get("error", j)
        msg = err.get("message") if isinstance(err, dict) else err
        return f"{e.code}: {msg}"[:400]
    except Exception:
        return f"{e.code}: {raw}"[:400]


# ---------- lesson videos: search YouTube from this PC, keep only videos that allow embedding
def yt_get(url, timeout=15):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9", "Cookie": "SOCS=CAI; CONSENT=YES+1"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")


def yt_meta(html):
    """Duration/views/age per video id from the search page's videoRenderer blocks (best effort)."""
    meta = {}
    m = re.search(r"ytInitialData\s*=\s*(\{.+?\});\s*</script>", html, re.S)
    if not m:
        return meta
    try:
        data = json.loads(m.group(1))
    except ValueError:
        return meta
    stack = [data]
    while stack:
        x = stack.pop()
        if isinstance(x, dict):
            v = x.get("videoRenderer")
            if isinstance(v, dict) and v.get("videoId"):
                txt = lambda k: (v.get(k) or {}).get("simpleText") or "".join(r.get("text", "") for r in (v.get(k) or {}).get("runs", []))
                meta[v["videoId"]] = {"length": txt("lengthText"), "views": txt("shortViewCountText") or txt("viewCountText"), "age": txt("publishedTimeText")}
            stack.extend(x.values())
        elif isinstance(x, list):
            stack.extend(x)
    return meta


def yt_oembed(vid):
    """Title + channel, or None when the video can't be embedded (YouTube answers 401/403/404)."""
    try:
        j = json.loads(yt_get(f"{YT}/oembed?format=json&url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={vid}"), timeout=10))
        return {"title": j.get("title", ""), "channel": j.get("author_name", "")}
    except Exception:
        return None


def yt_search(q):
    html = yt_get(f"{YT}/results?search_query=" + urllib.parse.quote_plus(q) + "&hl=en")
    shorts = set(re.findall(r"/shorts/([\w-]{11})", html))
    ids = []
    for vid in re.findall(r'"videoId"\s*:\s*"([\w-]{11})"', html):
        if vid not in ids and vid not in shorts:
            ids.append(vid)
    ids = ids[:12]
    meta = yt_meta(html)
    found = [None] * len(ids)

    def check(i, vid):
        found[i] = yt_oembed(vid)
    threads = [threading.Thread(target=check, args=(i, v)) for i, v in enumerate(ids)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    return [{"id": v, **found[i], **meta.get(v, {})} for i, v in enumerate(ids) if found[i]][:6]


def os_info():
    name = platform.system()
    try:
        with open("/etc/os-release", encoding="utf-8") as f:
            rel = dict(line.rstrip("\n").split("=", 1) for line in f if "=" in line)
        name = rel.get("PRETTY_NAME", name).strip('"')
    except OSError:
        pass
    return name


def stop_run(p):
    """Stop a lab command and everything it started (it runs in its own process group)."""
    if p.poll() is not None:
        return
    try:
        os.killpg(p.pid, signal.SIGTERM)
        p.wait(timeout=3)
    except subprocess.TimeoutExpired:
        os.killpg(p.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError):
        pass


def home_dir(p):
    """A lab may work in one of your own projects: any existing folder inside your home folder."""
    if not isinstance(p, str) or not p.strip():
        return None
    real = os.path.realpath(os.path.expanduser(p.strip()))
    return real if (real == HOME or real.startswith(HOME + os.sep)) and os.path.isdir(real) else None


def folder_facts(path):
    """What a lab needs to know about a project folder, read from files only (nothing is run)."""
    has = lambda *names: any(os.path.exists(os.path.join(path, n)) for n in names)
    git_cfg = os.path.join(path, ".git", "config")
    remote = ""
    if os.path.isfile(git_cfg):
        with open(git_cfg, encoding="utf-8", errors="replace") as f:
            m = re.search(r"url\s*=\s*(\S+)", f.read())
            remote = m.group(1) if m else ""
    branch = ""
    try:
        with open(os.path.join(path, ".git", "HEAD"), encoding="utf-8") as f:
            branch = f.read().strip().removeprefix("ref: refs/heads/")
    except OSError:
        pass
    entries = os.listdir(path)
    return {"path": path, "short": path.replace(HOME, "~", 1), "git": has(".git"), "remote": remote, "branch": branch,
            "venv": has(".venv/bin/activate", "venv/bin/activate"),
            "python": has("pyproject.toml", "setup.py", "requirements.txt") or any(e.endswith(".py") for e in entries),
            "pyproject": has("pyproject.toml"), "requirements": has("requirements.txt"),
            "tests": has("tests", "test") or any(e.startswith("test_") and e.endswith(".py") for e in entries),
            "dockerfile": has("Dockerfile"), "compose": has("compose.yaml", "compose.yml", "docker-compose.yml", "docker-compose.yaml"),
            "ci": has(".github/workflows"), "docker": shutil.which("docker") is not None, "files": len(entries)}


def find_projects():
    """Folders under ~ (two levels deep) that look like projects: a git repo or a Python package."""
    out = []
    for base in (HOME, os.path.join(HOME, "projects"), os.path.join(HOME, "Projects"), os.path.join(HOME, "code")):
        try:
            entries = sorted(os.scandir(base), key=lambda e: e.name.lower())
        except OSError:
            continue
        for e in entries:
            if e.name.startswith((".", "snap")) or not e.is_dir(follow_symlinks=False):
                continue
            if any(os.path.exists(os.path.join(e.path, n)) for n in (".git", "pyproject.toml", "requirements.txt")):
                short = e.path.replace(HOME, "~", 1)
                if short not in out:
                    out.append(short)
    return out[:40]


def valid_state(s):
    return isinstance(s, dict) and isinstance(s.get("xp", 0), (int, float)) and isinstance(s.get("done", {}), dict)


class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        b = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(b)

    def _body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n < 0 or n > MAX_BODY:
            raise ValueError("request too large")
        return json.loads(self.rfile.read(n) or b"{}")

    def _host_ok(self):
        if self.headers.get("Host", "") in HOSTS:
            return True
        self._json(403, {"error": "forbidden host"})
        return False

    def do_GET(self):
        if not self._host_ok():
            return
        path = urllib.parse.urlsplit(self.path).path
        if path == "/api/progress":
            with LOCK:
                s = read_json(PROG, {})
            return self._json(200, {"rev": s.pop("_rev", 0), "state": s})
        if path == "/api/llm/settings":
            return self._json(200, public_settings(load_conf()))
        if path == "/api/system":
            allow = CAN_RUN and bool(load_conf().get("allow_run"))
            return self._json(200, {"os": os_info(), "canRun": CAN_RUN, "allowRun": allow, "labsDir": LABS,
                                    "token": RUN_TOKEN if allow else ""})
        if path == "/api/videos":
            return self._videos(urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query))
        # Static files: decode and normalise first, then allow only the app's own files.
        clean = posixpath.normpath(urllib.parse.unquote(path))
        if clean in ("/", "."):
            clean = "/index.html"
        if not STATIC.match(clean):
            return self._json(404, {"error": "not found"})
        self.path = clean
        self._static = True
        return super().do_GET()

    def end_headers(self):
        if getattr(self, "_static", False):
            self.send_header("Cache-Control", "no-cache")  # browser re-checks files, so updates show up without Ctrl+F5
        super().end_headers()

    def do_POST(self):
        if not self._host_ok():
            return
        origin = self.headers.get("Origin")
        if (origin and origin not in ORIGINS) or not self.headers.get("Content-Type", "").startswith("application/json"):
            return self._json(403, {"error": "forbidden"})
        path = urllib.parse.urlsplit(self.path).path
        try:
            d = self._body()
            if path == "/api/progress":
                return self._save_progress(d)
            if path == "/api/reset":
                return self._reset()
            if path == "/api/llm/settings":
                return self._save_settings(d)
            if path == "/api/llm/models":
                return self._models(d)
            if path == "/api/llm/test":
                return self._test(d)
            if path == "/api/chat":
                return self._chat(d)
            if path == "/api/run/settings":
                return self._run_settings(d)
            if path in ("/api/run", "/api/run/stop", "/api/run/folder"):
                if not (CAN_RUN and load_conf().get("allow_run")):
                    return self._json(403, {"error": "Running commands is off. Turn it on in Settings → Labs."})
                if not secrets.compare_digest(self.headers.get("X-CA-Token", ""), RUN_TOKEN):
                    return self._json(403, {"error": "bad token: reload the page"})
                if path == "/api/run":
                    return self._run(d)
                if path == "/api/run/folder":
                    out = {"projects": find_projects(), "home": HOME}
                    if d.get("path"):
                        real = home_dir(d["path"])
                        if not real:
                            return self._json(400, {**out, "error": "No such folder inside your home folder."})
                        out["facts"] = folder_facts(real)
                    return self._json(200, out)
                p = RUNS.get(str(d.get("id")))
                if p:
                    stop_run(p)
                return self._json(200, {"ok": True})
            self._json(404, {"error": "not found"})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:
            try:
                self._json(500, {"error": str(e)})
            except Exception:
                pass

    # ---------- videos
    def _videos(self, qs):
        q = (qs.get("q") or [""])[0].strip()[:200]
        if not q:
            return self._json(400, {"error": "missing q"})
        with LOCK:
            cache = read_json(VIDCACHE, {})
        hit = cache.get(q)
        if hit and hit.get("videos") and time.time() - hit.get("at", 0) < 30 * 86400 and "refresh" not in qs:
            return self._json(200, {"videos": hit["videos"]})
        try:
            vids = yt_search(q)
        except Exception as e:
            if hit and hit.get("videos"):
                return self._json(200, {"videos": hit["videos"]})
            return self._json(502, {"error": f"Could not search YouTube: {e}"})
        if vids:
            with LOCK:
                cache = read_json(VIDCACHE, {})
                cache[q] = {"at": time.time(), "videos": vids}
                write_json(VIDCACHE, cache)
        return self._json(200, {"videos": vids})

    # ---------- progress
    def _save_progress(self, d):
        data = d.get("state")
        if not valid_state(data):
            return self._json(400, {"error": "invalid progress"})
        with LOCK:
            old = read_json(PROG, {})
            rev = old.pop("_rev", 0)
            if d.get("baseRev") != rev:  # someone else saved first: the page merges and retries
                return self._json(409, {"rev": rev, "state": old})
            backup()
            data = {k: v for k, v in data.items() if k != "_rev"}
            write_json(PROG, {**data, "_rev": rev + 1})
        if data.get("xp", 0) != old.get("xp", 0):
            new_file = not os.path.exists(LOG)
            with open(LOG, "a", encoding="utf-8") as f:
                if new_file:
                    f.write("timestamp,xp,lessons_done,missions,bosses\n")
                f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')},{data.get('xp',0)},"
                        f"{len(data.get('done',{}))},{len(data.get('missions',{}))},{len(data.get('bosses',{}))}\n")
        return self._json(200, {"ok": True, "rev": rev + 1})

    def _reset(self):
        with LOCK:
            old = read_json(PROG, {})
            rev = old.get("_rev", 0)
            backup("before-reset")
            write_json(PROG, {"epoch": int(time.time() * 1000), "start": datetime.date.today().isoformat(), "_rev": rev + 1})
        return self._json(200, {"ok": True})

    # ---------- AI tutor
    def _provider(self, d, c):
        name = d.get("provider") or c["provider"]
        if name not in PROVIDERS:
            raise ValueError(f"unknown provider {name}")
        return provider_cfg(c, name, d)

    def _save_settings(self, d):
        c = load_conf()
        name = d.get("provider")
        if name not in PROVIDERS:
            return self._json(400, {"error": "unknown provider"})
        c["provider"] = name
        s = c["providers"].setdefault(name, {})
        if d.get("clear_key"):
            s.pop("api_key", None)
        elif (d.get("api_key") or "").strip():
            s["api_key"] = d["api_key"].strip()
        if (d.get("model") or "").strip():
            s["model"] = d["model"].strip()
        if name == "ollama" and (d.get("base_url") or "").strip():
            if not re.match(r"^https?://", d["base_url"].strip()):
                return self._json(400, {"error": "base URL must start with http:// or https://"})
            s["base_url"] = d["base_url"].strip()
        write_json(CONF, c)
        return self._json(200, public_settings(c))

    def _models(self, d):
        pc = self._provider(d, load_conf())
        if not pc["key"] and not pc["no_key"]:
            return self._json(400, {"error": "Add an API key first."})
        try:
            with urllib.request.urlopen(llm_request(pc, "/models"), timeout=20) as r:
                j = json.load(r)
        except urllib.error.HTTPError as e:
            return self._json(502, {"error": http_error_text(e)})
        except Exception as e:
            return self._json(502, {"error": f"Could not reach {pc['base']}: {e}"})
        ids = [m.get("id", "") for m in j.get("data", j.get("models", []))]
        ids = sorted({i.removeprefix("models/") for i in ids if i})
        if pc["name"] == "openrouter":
            ids.sort(key=lambda i: (not i.endswith(":free"), i))
        if pc["name"] == "gemini":
            ids = [i for i in ids if "gemini" in i or "gemma" in i]
        return self._json(200, {"models": ids})

    def _test(self, d):
        pc = self._provider(d, load_conf())
        if not pc["key"] and not pc["no_key"]:
            return self._json(400, {"error": "Add an API key first."})
        body = chat_body(pc, "Reply with exactly: OK", [{"role": "user", "content": "Say OK"}], stream=False)
        body["max_tokens"] = 20
        path = "/messages" if pc["kind"] == "anthropic" else "/chat/completions"
        t0 = time.time()
        try:
            with urllib.request.urlopen(llm_request(pc, path, body), timeout=60) as r:
                j = json.load(r)
        except urllib.error.HTTPError as e:
            return self._json(502, {"error": http_error_text(e)})
        except Exception as e:
            return self._json(502, {"error": f"Could not reach {pc['base']}: {e}"})
        if pc["kind"] == "anthropic":
            text = "".join(b.get("text", "") for b in j.get("content", []))
        else:
            text = ((j.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
        return self._json(200, {"ok": True, "model": pc["model"], "reply": text.strip()[:80], "ms": int((time.time() - t0) * 1000)})

    def _chat(self, d):
        c = load_conf()
        pc = self._provider({"provider": d.get("provider")}, c)
        if not pc["key"] and not pc["no_key"]:
            return self._json(400, {"error": "NO_KEY"})
        system = d.get("system") if isinstance(d.get("system"), str) else ""
        messages = clean_messages(d.get("messages"))
        if not messages:
            return self._json(400, {"error": "no message"})
        path = "/messages" if pc["kind"] == "anthropic" else "/chat/completions"
        try:
            r = urllib.request.urlopen(llm_request(pc, path, chat_body(pc, system[:8000], messages)), timeout=300)
        except urllib.error.HTTPError as e:
            return self._json(502, {"error": http_error_text(e)})
        except Exception as e:
            return self._json(502, {"error": f"Could not reach {pc['base']}: {e}"})
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        def send(obj):
            self.wfile.write(b"data: " + json.dumps(obj).encode() + b"\n\n")
            self.wfile.flush()

        # Normalise every provider's stream to {"t": text} / {"error": msg} / {"done": true}
        with r:
            for raw in r:
                line = raw.decode("utf-8", errors="replace").strip()
                if not line.startswith("data:"):
                    continue
                payload = line[5:].strip()
                if payload == "[DONE]":
                    break
                try:
                    j = json.loads(payload)
                except ValueError:
                    continue
                if j.get("error"):
                    err = j["error"]
                    send({"error": err.get("message", str(err)) if isinstance(err, dict) else str(err)})
                    return
                if pc["kind"] == "anthropic":
                    if j.get("type") == "content_block_delta" and j.get("delta", {}).get("text"):
                        send({"t": j["delta"]["text"]})
                else:
                    t = ((j.get("choices") or [{}])[0].get("delta") or {}).get("content")
                    if t:
                        send({"t": t})
        send({"done": True})

    # ---------- lab runner
    def _run_settings(self, d):
        if not CAN_RUN:
            return self._json(400, {"error": "Running commands needs Linux with bash."})
        c = load_conf()
        c["allow_run"] = bool(d.get("allow"))
        write_json(CONF, c)
        return self._json(200, {"allowRun": c["allow_run"], "token": RUN_TOKEN if c["allow_run"] else ""})

    def _run(self, d):
        cmd, rid = d.get("cmd"), str(d.get("id") or "")
        if not isinstance(cmd, str) or not cmd.strip() or len(cmd) > 10000 or not re.fullmatch(r"[\w-]{1,64}", rid):
            return self._json(400, {"error": "bad command"})
        sub = re.sub(r"[^\w-]", "", str(d.get("dir") or ""))[:40]
        cwd = home_dir(d.get("cwd")) if d.get("cwd") else None  # the project folder chosen for this lab
        if d.get("cwd") and not cwd:
            return self._json(400, {"error": "The lab's project folder no longer exists. Pick it again above."})
        if not cwd:
            cwd = os.path.join(LABS, sub) if sub else LABS
            os.makedirs(cwd, exist_ok=True)
        for venv in (".venv", "venv"):  # each command starts a fresh shell: use the project's virtualenv if it has one
            if os.path.isfile(os.path.join(cwd, venv, "bin", "activate")):
                cmd = f". {venv}/bin/activate\n{cmd}"
                break
        env = {**os.environ, "TERM": "dumb", "NO_COLOR": "1", "PYTHONUNBUFFERED": "1", "DEBIAN_FRONTEND": "noninteractive"}
        # No stdin: anything that waits for input (sudo's password prompt, "-it") fails fast instead of hanging.
        p = subprocess.Popen(["bash", "-lc", cmd], cwd=cwd, env=env, stdin=subprocess.DEVNULL,
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
        RUNS[rid] = p
        timer = threading.Timer(RUN_LIMIT, stop_run, args=(p,))
        timer.start()
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        def send(obj):
            self.wfile.write(b"data: " + json.dumps(obj).encode() + b"\n\n")
            self.wfile.flush()
        sent = 0
        try:
            while True:
                chunk = os.read(p.stdout.fileno(), 4096)
                if not chunk:
                    break
                sent += len(chunk)
                if sent > RUN_OUT_MAX:
                    send({"t": "\n[output too long: stopped]\n"})
                    stop_run(p)
                    break
                send({"t": chunk.decode("utf-8", errors="replace")})
            send({"done": True, "code": p.wait()})
        except (BrokenPipeError, ConnectionResetError):
            stop_run(p)  # the page went away: don't leave the command running
        finally:
            timer.cancel()
            p.stdout.close()
            RUNS.pop(rid, None)


if __name__ == "__main__":
    url = f"http://localhost:{PORT}"
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", PORT), H)
    except OSError:
        print(f"Port {PORT} busy: Canonical Academy is probably already running. Opening {url}")
        webbrowser.open(f"{url}/?v={int(time.time())}")
        sys.exit(0)
    backup()
    print(f"Canonical Academy running at {url}  (Ctrl+C to stop)")
    print(f"Progress file: {PROG}")
    if not os.environ.get("CA_NO_BROWSER"):
        threading.Timer(1.0, lambda: webbrowser.open(f"{url}/?v={int(time.time())}")).start()  # fresh URL: never a stale cached page
    srv.serve_forever()
