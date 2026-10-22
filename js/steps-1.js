// ===== Interactive lesson steps, part 1: Linux, Python, Containers
// Step types: concept {h, html, d?} · example {h, html?, code, out?} · predict {q, a} · check {q, o, a, e}
//             key {items} · mistake {items: [[wrong, right]]}. `d` = a DIAGRAMS id shown above the text.
const STEPS = {};

STEPS.l1 = [
  { t: 'concept', h: 'What "the kernel" actually does', d: 'syscall', html: `<p>Your Python program can't touch the disk, the network card or RAM directly. Every time it opens a file or sends a request, it asks the kernel with a <b>system call</b> (syscall).</p>
<div class="analogy">🏦 <b>Analogy:</b> a bank. You (the program) never walk into the vault. You fill a form at the counter (<code>open()</code>, <code>read()</code>, <code>socket()</code>) and the clerk (the kernel) does it for you, after checking you're allowed.</div>
<p>This is why the kernel can isolate things: it sees every request, so it can lie to a process about what exists.</p>` },
  { t: 'example', h: 'See the syscalls of a real command', html: `<p><code>strace</code> prints every syscall a program makes. Try it in WSL:</p>`, code: `strace -e trace=openat,read,write cat /etc/hostname`, out: `openat(AT_FDCWD, "/etc/hostname", O_RDONLY) = 3
read(3, "my-laptop\\n", 131072)        = 10
write(1, "my-laptop\\n", 10)            = 10
my-laptop`, note: '<code>cat</code> opened the file (got file descriptor 3), read it, then wrote to file descriptor 1 (your screen). Three syscalls, that is all "cat" is.' },
  { t: 'concept', h: 'Namespaces: a private view of the system', d: 'namespaces', html: `<p>A <b>namespace</b> makes the kernel show a process its own copy of something:</p>
<ul><li><b>PID</b>: the process thinks it is PID 1 and sees no other processes.</li><li><b>NET</b>: its own network interfaces and IP.</li><li><b>MNT</b>: its own filesystem root (<code>/</code>).</li><li><b>UTS</b>: its own hostname.</li><li><b>USER</b>: it can be "root" inside, a normal user outside.</li></ul>
<p>Put a process in all of these at once and it looks like it has its own machine. That is a container.</p>` },
  { t: 'example', h: 'Make a "container" with one command', html: `<p><code>unshare</code> starts a process in new namespaces. No Docker involved:</p>`, code: `sudo unshare --pid --fork --mount-proc bash
ps aux`, out: `USER  PID %CPU %MEM COMMAND
root    1  0.0  0.0 bash
root    8  0.0  0.0 ps aux`, note: 'Inside, bash is PID 1 and sees only itself. On the host, the same bash has a normal PID like 41237. Type <code>exit</code> to leave.' },
  { t: 'predict', q: 'You run <code>hostname inside-box</code> inside a process that has its own UTS namespace. What does the host machine\'s hostname become?', a: 'Nothing changes on the host. The UTS namespace gives the process its own hostname, so only processes in that namespace see "inside-box". This is exactly why two containers can both be called "web" without fighting.' },
  { t: 'concept', h: 'cgroups: a budget for resources', html: `<p>Namespaces control what a process can <b>see</b>. <b>cgroups</b> (control groups) control how much it can <b>use</b>: CPU time, memory, disk I/O, number of processes.</p>
<div class="analogy">📱 <b>Analogy:</b> a mobile data plan. You can browse anything (namespaces decide which sites exist for you), but after 2&nbsp;GB you're cut off (cgroups).</div>
<p>When a Kubernetes pod is <b>OOMKilled</b>, that's the memory cgroup enforcing the limit you wrote in the YAML.</p>` },
  { t: 'example', h: 'Watch a memory limit kill a process', code: `sudo systemd-run --scope -p MemoryMax=50M python3 -c "x = bytearray(200_000_000)"`, out: `Killed`, note: 'Python tried to allocate 200&nbsp;MB inside a cgroup capped at 50&nbsp;MB. The kernel killed it, the same thing that happens to a pod with <code>limits.memory: 50Mi</code>.' },
  { t: 'check', q: 'A container can see only its own processes, but it is using all 16 CPU cores and slowing the host. Which feature is missing?', o: ['A cgroup CPU limit', 'A PID namespace', 'A network namespace', 'A separate kernel'], a: 0, e: 'It already has a PID namespace (it sees only its own processes). Limiting how much CPU it uses is the job of cgroups.' },
  { t: 'key', items: ['Programs ask the kernel for everything through system calls.', 'Namespaces = what a process can see (PID, network, filesystem, hostname, users).', 'cgroups = how much it can use (CPU, memory, I/O).', 'A container = an ordinary process + namespaces + cgroups. Same kernel as the host.'] },
  { t: 'mistake', items: [['"A container has its own kernel."', 'All containers share the host kernel. That is why a Linux container can\'t run a Windows kernel, and why containers start in milliseconds.'], ['"Docker invented containers."', 'The kernel features existed first (namespaces since 2002, cgroups since 2008). Docker made them easy to use. LXD, Podman and containerd use the same features.']] }
];

STEPS.l2 = [
  { t: 'concept', h: 'Everything is a file, and every file has an owner', d: 'perms', html: `<p>Run <code>ls -l</code> and each line starts with something like <code>-rwxr-xr--</code>. Read it in three groups of three:</p>
<ul><li><b>owner</b> (rwx): read, write, execute</li><li><b>group</b> (r-x): read and execute</li><li><b>others</b> (r--): read only</li></ul>
<p>As numbers: r=4, w=2, x=1, added per group. <code>rwx</code>=7, <code>r-x</code>=5, <code>r--</code>=4, so this file is <b>754</b>.</p>` },
  { t: 'example', h: 'Fix a "Permission denied" script', code: `echo 'echo hello from script' > hi.sh
./hi.sh
ls -l hi.sh
chmod u+x hi.sh
./hi.sh`, out: `bash: ./hi.sh: Permission denied
-rw-r--r-- 1 oussema oussema 23 Oct 20 10:00 hi.sh
hello from script`, note: 'The file had no <code>x</code> bit. <code>chmod u+x</code> adds execute for the owner (u). You will do exactly this for entrypoint scripts in Docker images.' },
  { t: 'check', q: 'A secret file should be readable and writable by you only. Which mode?', o: ['600', '644', '755', '777'], a: 0, e: '6 = rw for the owner, 0 for group and others. SSH refuses private keys that are more open than 600.' },
  { t: 'concept', h: 'Processes, PIDs and signals', html: `<p>Every running program is a <b>process</b> with a PID and a parent. You stop or nudge processes by sending <b>signals</b>:</p>
<ul><li><code>SIGTERM</code> (15, the default of <code>kill</code>): "please shut down cleanly".</li><li><code>SIGKILL</code> (9): "die now", can't be caught, no cleanup.</li><li><code>SIGINT</code> (2): what Ctrl+C sends.</li></ul>
<p>Kubernetes stops a pod by sending SIGTERM, waiting 30 seconds (the grace period), then SIGKILL. Your FastAPI app should finish in-flight requests when it gets SIGTERM.</p>` },
  { t: 'example', h: 'Find and stop a process', code: `python3 -m http.server 8000 &
ss -tlnp | grep 8000
kill %1          # SIGTERM to the background job
ps aux | grep http.server | grep -v grep || echo "gone"`, out: `LISTEN 0 5 0.0.0.0:8000 0.0.0.0:* users:(("python3",pid=5123,fd=3))
gone`, note: '<code>ss -tlnp</code> answers "who is listening on which port", the first thing to check when "the API doesn\'t respond".' },
  { t: 'concept', h: 'Pipes: small tools, chained', d: 'pipes', html: `<p>Linux tools each do one thing. The pipe <code>|</code> sends the output of one into the input of the next.</p>
<p><code>journalctl -u api --since today | grep ERROR | wc -l</code> reads as: <i>today's logs of the api service → keep error lines → count them</i>.</p>
<p>Useful filters: <code>grep</code> (keep matching lines), <code>sort</code>, <code>uniq -c</code> (count duplicates), <code>head</code>/<code>tail</code>, <code>awk '{print $1}'</code> (pick a column), <code>jq</code> (JSON).</p>` },
  { t: 'predict', q: 'What does <code>cat access.log | awk \'{print $1}\' | sort | uniq -c | sort -rn | head -3</code> show?', a: 'The 3 IP addresses that made the most requests. awk keeps the first column (the IP), sort groups identical IPs, uniq -c counts each group, sort -rn puts the biggest counts first, head -3 keeps the top 3.' },
  { t: 'check', q: 'Your service hangs on shutdown and Kubernetes kills it after 30 s. Which signal did your app ignore?', o: ['SIGTERM', 'SIGKILL', 'SIGINT', 'SIGHUP'], a: 0, e: 'Kubernetes sends SIGTERM first. If the app ignores it, SIGKILL follows after the grace period. SIGKILL itself can\'t be ignored.' },
  { t: 'key', items: ['Permissions: owner/group/others × read(4)/write(2)/execute(1).', 'kill sends SIGTERM by default; kill -9 is the last resort.', 'ss -tlnp, ps aux, journalctl -u, df -h, free -h: the first-response toolkit.', 'Pipes chain tiny tools into powerful one-liners.'] },
  { t: 'mistake', items: [['chmod 777 to "fix" permission errors', 'Give the minimum: usually u+x for scripts, 600 for secrets, 644 for config.'], ['kill -9 as the first move', 'Try plain kill (SIGTERM) first so the program can flush data and close connections.']] }
];

STEPS.l3 = [
  { t: 'concept', h: 'apt vs snap in one picture', d: 'aptSnap', html: `<p><b>apt</b> installs <code>.deb</code> packages that share system libraries. Small and fast, but one app\'s upgrade can need a library another app doesn\'t like.</p>
<p><b>snap</b> bundles the app with its own libraries, runs it confined, and updates it automatically from a <b>channel</b> (<code>1.31/stable</code>, <code>latest/edge</code>…).</p>
<div class="analogy">🍱 <b>Analogy:</b> apt is a shared kitchen (everyone uses the same pans). A snap is a bento box: everything it needs is inside, sealed.</div>` },
  { t: 'example', h: 'Pin MicroK8s to a Kubernetes version', code: `snap info microk8s | grep -A3 channels
sudo snap install microk8s --classic --channel=1.31/stable
snap list microk8s`, out: `channels:
  1.32/stable: v1.32.1  2026-09-30
  1.31/stable: v1.31.5  2026-09-12
Name      Version  Rev   Tracking     Publisher
microk8s  v1.31.5  7600  1.31/stable  canonical✓`, note: 'The channel decides what auto-updates bring you. Staying on <code>1.31/stable</code> means you get 1.31 bug fixes but never a surprise jump to 1.32.' },
  { t: 'concept', h: 'systemd: the supervisor of your machine', html: `<p>systemd is PID 1 on Ubuntu. It starts services at boot, restarts them when they crash, and collects their logs in the <b>journal</b>.</p>
<p>A <b>unit file</b> is a small declaration: what to run, as which user, what to do if it dies. Then you control it with <code>systemctl start|stop|restart|status|enable</code>.</p>
<p>This is "desired state" on one machine: you declare <i>"this must be running"</i>, systemd makes it so. Kubernetes is the same idea for a whole cluster.</p>` },
  { t: 'example', h: 'Your API as a service, step by step', code: `sudo tee /etc/systemd/system/cvapi.service <<'EOF'
[Unit]
Description=CV API
After=network.target
[Service]
User=oussema
WorkingDirectory=/home/oussema/cvapi
ExecStart=/home/oussema/cvapi/.venv/bin/uvicorn app:app --port 8000
Restart=always
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now cvapi
systemctl status cvapi --no-pager | head -3`, out: `● cvapi.service - CV API
     Loaded: loaded (/etc/systemd/system/cvapi.service; enabled)
     Active: active (running) since Mon 2026-10-20 10:12:03 UTC; 2s ago`, note: '<code>enable --now</code> = start now and at every boot. <code>daemon-reload</code> is needed after editing a unit file.' },
  { t: 'predict', q: 'With <code>Restart=always</code>, you run <code>sudo kill -9 $(pgrep -f uvicorn)</code>. What does <code>systemctl status cvapi</code> show a few seconds later?', a: 'Active (running) again, with a new PID. systemd noticed the process died and restarted it. In <code>journalctl -u cvapi</code> you would see "Main process exited, status=9/KILL" followed by "Started CV API". That is self-healing on a single machine.' },
  { t: 'check', q: 'You edited cvapi.service but systemctl still uses the old command. What did you forget?', o: ['sudo systemctl daemon-reload', 'sudo snap refresh', 'sudo apt update', 'chmod +x on the unit file'], a: 0, e: 'systemd caches unit files. daemon-reload re-reads them; then restart the service.' },
  { t: 'key', items: ['apt = shared .deb packages; snap = self-contained, confined, auto-updating, with channels.', 'MicroK8s, Juju and LXD ship as snaps: know snap install/info/refresh and --channel.', 'systemd keeps services alive (Restart=always) and stores their logs (journalctl -u).'] },
  { t: 'mistake', items: [['Running your API in a terminal with nohup', 'Make it a systemd service: it restarts on crash, starts at boot, and logs go to the journal.'], ['Installing microk8s without a channel in a project', 'Pin a channel so the cluster version only changes when you decide.']] }
];

STEPS.p1 = [
  { t: 'concept', h: 'Why virtual environments exist', d: 'venv', html: `<p>Project A needs <code>numpy 1.26</code>, project B needs <code>numpy 2.1</code>. Install both globally and one breaks. A <b>virtual environment</b> is a folder with its own Python and its own <code>site-packages</code>, one per project.</p>
<div class="analogy">🧰 <b>Analogy:</b> each project gets its own toolbox instead of everybody sharing one drawer.</div>
<p><code>source .venv/bin/activate</code> just puts <code>.venv/bin</code> first in your <code>PATH</code>, so <code>python</code> and <code>pip</code> mean the project\'s copies.</p>` },
  { t: 'example', h: 'Prove which Python you are using', code: `python3 -m venv .venv
which python3
source .venv/bin/activate
which python
pip install requests && pip list | head -4`, out: `/usr/bin/python3
/home/oussema/my-tool/.venv/bin/python
Package    Version
---------- -------
certifi    2026.8.30
requests   2.33.0`, note: 'After activation, <code>python</code> points inside the project. Delete <code>.venv</code> and the project is clean again: nothing leaked into the system.' },
  { t: 'concept', h: 'pyproject.toml: one file to describe the project', html: `<p><code>pyproject.toml</code> replaced <code>setup.py</code>, <code>setup.cfg</code> and many tool configs. It holds:</p>
<ul><li><b>[project]</b>: name, version, Python version, dependencies.</li><li><b>[project.optional-dependencies]</b>: extras like <code>dev = ["pytest", "ruff"]</code>.</li><li><b>[tool.ruff]</b>, <b>[tool.pytest.ini_options]</b>: tool settings.</li></ul>` },
  { t: 'example', h: 'A minimal, real pyproject.toml', code: `[project]
name = "my-tool"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = ["fastapi>=0.115", "pydantic>=2"]

[project.optional-dependencies]
dev = ["pytest", "pytest-cov", "ruff"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 99`, note: '<code>pip install -e ".[dev]"</code> installs the project in editable mode plus the dev extras. Edit <code>src/my_tool/core.py</code> and the change is live immediately.' },
  { t: 'predict', q: 'Your tests import <code>my_tool</code>. With a <code>src/</code> layout, what happens if you run <code>pytest</code> before <code>pip install -e .</code>?', a: 'ImportError: No module named my_tool. That is the point of src/ layout: Python can\'t accidentally import the folder next to it, so tests only pass against the installed package, the same way users will get it.' },
  { t: 'check', q: 'Where should "pytest" be listed for a library you publish?', o: ['In a dev extra (optional dependency)', 'In the main dependencies', 'Only in README.md', 'In requirements.txt for users'], a: 0, e: 'Users of your library don\'t need pytest. Put it in an optional "dev" (or "test") group so only contributors install it.' },
  { t: 'key', items: ['One virtual environment per project; never pip install into the system Python.', 'pyproject.toml holds metadata, dependencies and tool config.', 'src/ layout + editable install = tests run against the real package.', 'Canonical repos drive lint/unit/integration through tox environments.'] },
  { t: 'mistake', items: [['sudo pip install …', 'Use a venv (or pipx for CLI tools). System Python belongs to Ubuntu.'], ['Committing .venv to git', 'Add .venv/ to .gitignore; dependencies are rebuilt from pyproject.toml.']] }
];

STEPS.p2 = [
  { t: 'concept', h: 'The shape of every good test', d: 'aaa', html: `<p>Write each test in three short parts, <b>Arrange, Act, Assert</b>:</p>
<ol><li><b>Arrange</b>: build the input (two boxes).</li><li><b>Act</b>: call the one function under test.</li><li><b>Assert</b>: check one clear outcome.</li></ol>
<p>A test name should read like a sentence: <code>test_iou_is_zero_when_boxes_do_not_overlap</code>. When it fails, the name tells you what broke.</p>` },
  { t: 'example', h: 'Test a real function from your CV work', code: `# src/my_tool/metrics.py
def iou(a, b):
    x1, y1 = max(a[0], b[0]), max(a[1], b[1])
    x2, y2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area = lambda r: (r[2] - r[0]) * (r[3] - r[1])
    return inter / (area(a) + area(b) - inter)

# tests/test_metrics.py
from my_tool.metrics import iou

def test_iou_half_overlap():
    a, b = (0, 0, 10, 10), (5, 0, 15, 10)   # Arrange
    result = iou(a, b)                      # Act
    assert result == 50 / 150               # Assert`, out: `$ pytest -q
.                                        [100%]
1 passed in 0.02s` },
  { t: 'predict', q: 'Add <code>assert iou((0,0,0,0), (0,0,0,0)) == 0</code>. What happens?', a: 'ZeroDivisionError: both areas are 0, so the union is 0. A tiny test just found a real bug for empty boxes. Fix: return 0.0 when the union is 0. This is why you test edge cases (empty, zero, negative, huge).' },
  { t: 'concept', h: 'Mocks: replace the slow or unpredictable part', html: `<p>A unit test must be fast and give the same result every time. Network calls, clocks, GPUs and random numbers break that.</p>
<p><code>monkeypatch</code> (pytest) swaps a function for a fake during one test, then restores it automatically.</p>
<div class="analogy">🎬 <b>Analogy:</b> a stunt double. The scene (your logic) is filmed for real; the dangerous part (the network) is played by a double.</div>` },
  { t: 'example', h: 'Fake a model download', code: `# src/my_tool/io.py
import urllib.request
def download(url): return urllib.request.urlopen(url).read()
def load_model(url): return {"bytes": len(download(url))}

# tests/test_io.py
from my_tool import io

def test_load_model_counts_bytes(monkeypatch):
    monkeypatch.setattr(io, "download", lambda url: b"12345")
    assert io.load_model("https://x/model.pt") == {"bytes": 5}`, note: 'No internet needed, runs in milliseconds. A separate integration test can download a real file in CI.' },
  { t: 'check', q: 'Coverage says 100% but users still hit a bug. Most likely reason?', o: ['Lines ran, but no test asserted the case that breaks', 'Coverage tools are always wrong', 'The tests ran too fast', 'pytest skipped the file'], a: 0, e: 'Coverage only says a line was executed, not that its result was checked. Assertions on edge cases matter more than the percentage.' },
  { t: 'key', items: ['Arrange, Act, Assert; one behaviour per test, named like a sentence.', 'parametrize runs one test with many inputs; great for edge cases.', 'monkeypatch/mocks keep unit tests fast and deterministic.', 'Unit tests check bricks; integration tests (e.g. deploying a charm) check the castle.'] },
  { t: 'mistake', items: [['One giant test that checks everything', 'Split it: when it fails you instantly know which behaviour broke.'], ['Chasing 100% coverage', 'Aim for meaningful assertions on risky code paths; 80% with good edge cases beats 100% with weak asserts.']] }
];

STEPS.p3 = [
  { t: 'concept', h: 'Type hints: documentation that tools can check', html: `<p><code>def f(dets: list[Detection], min_score: float = .5) -> list[Detection]</code> tells the reader <i>and</i> mypy what goes in and out. Python ignores hints at runtime; checkers like mypy or pyright catch mistakes before you run anything.</p>
<p>Use <code>X | None</code> for "may be missing", and <code>@dataclass</code> or pydantic models instead of loose dicts.</p>` },
  { t: 'example', h: 'mypy catches a bug before runtime', code: `def mean_score(scores: list[float]) -> float:
    return sum(scores) / len(scores)

mean_score(["0.9", "0.8"])`, out: `$ mypy app.py
app.py:4: error: List item 0 has incompatible type "str"; expected "float"
Found 1 error in 1 file (checked 1 source file)`, note: 'Without types this would crash at runtime with a confusing TypeError, maybe in production.' },
  { t: 'concept', h: 'How a FastAPI request flows', d: 'apiFlow', html: `<p>FastAPI reads your type hints to <b>validate</b> requests. Send a string where an int is expected and the client gets a clear 422 error before your code runs.</p>
<p>It also generates interactive docs at <code>/docs</code> from the same hints. One source of truth.</p>` },
  { t: 'example', h: 'A typed endpoint plus Kubernetes-ready health checks', code: `from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI()
model = None

class PredictIn(BaseModel):
    image_url: str
    min_score: float = Field(0.5, ge=0, le=1)

@app.on_event("startup")
def load():
    global model
    model = "yolo-weights"  # slow in real life

@app.get("/health")
def health(): return {"ok": True}           # process alive

@app.get("/ready")
def ready():
    return {"ready": model is not None}     # model loaded`, out: `$ curl -X POST localhost:8000/predict -d '{"image_url":"x","min_score":3}' -H 'content-type: application/json'
{"detail":[{"type":"less_than_equal","loc":["body","min_score"],"msg":"Input should be less than or equal to 1"}]}` },
  { t: 'concept', h: 'async: waiting without blocking', html: `<p><code>async def</code> lets one worker handle many requests while each is <i>waiting</i> (database, HTTP calls). It does not make CPU work faster.</p>
<p>Rule of thumb: <b>I/O-bound</b> (calling MLflow, S3) → <code>async</code> with an async client. <b>CPU/GPU-bound</b> (running YOLO) → normal <code>def</code> (FastAPI runs it in a thread pool) or a separate worker.</p>` },
  { t: 'check', q: 'You put a 2-second YOLO inference inside an <code>async def</code> endpoint without awaiting anything. What happens under load?', o: ['Every other request waits: the event loop is blocked', 'Requests run in parallel automatically', 'FastAPI converts it to a GPU task', 'Nothing, async is always faster'], a: 0, e: 'CPU work inside async def blocks the single event loop. Use a plain def endpoint (thread pool) or offload to a worker.' },
  { t: 'key', items: ['Type hints + mypy/pyright catch bugs before runtime.', 'FastAPI validates requests from type hints and documents them at /docs.', '/health = alive, /ready = can serve traffic; Kubernetes probes call these.', 'async helps waiting (I/O), not computing (CPU/GPU).'] },
  { t: 'mistake', items: [['Returning raw dicts everywhere', 'Use pydantic models for inputs/outputs: validation and docs for free.'], ['/ready that always returns 200', 'Return "not ready" until the model is actually loaded, or rollouts will send traffic too early.']] }
];

STEPS.p4 = [
  { t: 'concept', h: 'Git in one picture', d: 'gitModel', html: `<p>Git has three places: your <b>working tree</b> (files you edit), the <b>staging area</b> (what the next commit will contain) and the <b>repository</b> (history of commits). <code>git add</code> moves changes to staging, <code>git commit</code> saves a snapshot, <code>git push</code> sends commits to GitHub.</p>
<p>A <b>branch</b> is just a movable label pointing at a commit. Creating one is free, so make one per change.</p>` },
  { t: 'example', h: 'Clean up commits before a PR', code: `git switch -c fix/empty-boxes
# ...edit, commit, edit, commit "oops typo"...
git log --oneline -3
git rebase -i HEAD~2     # mark "oops typo" as fixup
git log --oneline -2`, out: `a1c9f0e oops typo
7be2d13 Fix IoU for empty boxes
e0f1a22 Add IoU metric
---
91d4c7a Fix IoU for empty boxes
e0f1a22 Add IoU metric`, note: 'Reviewers see one clean commit per idea. Only rewrite history on your own branch, never on main.' },
  { t: 'concept', h: 'CI: a robot that runs your checks on every push', d: 'ciFlow', html: `<p>GitHub Actions reads <code>.github/workflows/*.yml</code>. On each push or PR it starts a fresh Ubuntu machine, checks out your code and runs your steps. A red ❌ blocks the merge until you fix it.</p>
<p>Canonical repos typically run <code>tox -e lint</code>, <code>tox -e unit</code>, then integration tests that deploy charms to a real MicroK8s inside CI.</p>` },
  { t: 'predict', q: 'Your tests pass locally but fail in CI with <code>ModuleNotFoundError: torch</code>. Why?', a: 'CI starts from a clean machine. torch was installed in your local venv by hand but isn\'t declared in pyproject.toml (or the CI step doesn\'t install that extra). CI is doing its job: it proved your dependencies are incomplete.' },
  { t: 'check', q: 'Which commit message follows the convention used in most Canonical repos?', o: ['Fix crash when model path is empty', 'fixed stuff', 'WIP', 'Changes to charm.py and tests'], a: 0, e: 'Imperative mood, says what the commit does, short. "Fix …", "Add …", "Update …".' },
  { t: 'key', items: ['Working tree → staging (add) → commit → push.', 'One branch and one PR per change; clean history with rebase -i on your branch.', 'CI runs on a clean machine, so it catches missing dependencies and "works on my machine" bugs.'] },
  { t: 'mistake', items: [['git push --force on a shared branch', 'Use --force-with-lease, and only on your own branch.'], ['Huge PRs mixing refactors and fixes', 'Small PRs get reviewed fast and merged.']] }
];

STEPS.c1 = [
  { t: 'concept', h: 'Image layers, explained with a sandwich', d: 'layers', html: `<p>An image is a stack of <b>read-only layers</b>: Ubuntu base, then Python, then your libraries, then your code. Each Dockerfile instruction adds one layer.</p>
<p>A running container adds one thin <b>writable layer</b> on top. Delete the container and that layer is gone, which is why data must live in volumes.</p>
<div class="analogy">🥪 <b>Analogy:</b> the image is a sandwich in the fridge. Each container is someone eating a copy with their own sauce on top. The fridge sandwich never changes.</div>` },
  { t: 'example', h: 'Look inside an image', code: `docker pull python:3.12-slim
docker history python:3.12-slim --format "{{.Size}}\\t{{.CreatedBy}}" | head -4
docker run --rm python:3.12-slim python -c "import sys; print(sys.version)"`, out: `0B      CMD ["python3"]
41MB    RUN /bin/sh -c set -eux; ... install python
9.2MB   RUN /bin/sh -c set -eux; apt-get update ...
74.8MB  # debian:bookworm-slim base
3.12.7 (main, Oct  1 2026, 08:15:11) [GCC 12.2.0]`, note: 'Each line is a layer. Two images built on the same base share those layers on disk.' },
  { t: 'predict', q: 'You run <code>docker run -it ubuntu bash</code>, create <code>/hello.txt</code>, exit, then run the same command again. Is the file there?', a: 'No. The second command starts a new container with a new empty writable layer. The first container still exists (docker ps -a) with your file inside, but new containers always start from the clean image.' },
  { t: 'concept', h: 'Ports and isolation', html: `<p>A container has its own network namespace. A server listening on port 8000 inside is invisible outside until you <b>publish</b> it: <code>-p 8080:8000</code> means "host port 8080 → container port 8000".</p>
<p>Inside the container, listen on <code>0.0.0.0</code>, not <code>127.0.0.1</code>: localhost inside the container is the container itself.</p>` },
  { t: 'check', q: 'Your FastAPI container runs with <code>-p 8000:8000</code>, but curl from the host gets "connection reset". Uvicorn logs "Running on http://127.0.0.1:8000". Fix?', o: ['Start uvicorn with --host 0.0.0.0', 'Use -p 127.0.0.1:8000', 'Run the container as root', 'Expose port 80 instead'], a: 0, e: '127.0.0.1 inside the container only accepts connections from inside it. 0.0.0.0 listens on the container\'s network interface that Docker forwards to.' },
  { t: 'key', items: ['Image = read-only layers; container = image + a thin writable layer + a running process.', 'Containers are disposable: anything written inside is lost with the container.', '-p HOST:CONTAINER publishes a port; servers must listen on 0.0.0.0.'] },
  { t: 'mistake', items: [['Storing uploads or models inside the container filesystem', 'Use a volume (Docker) or a PersistentVolume (Kubernetes).'], ['"docker run" every time and wondering where containers pile up', 'Use --rm for throwaway runs; docker ps -a shows stopped containers.']] }
];

STEPS.c2 = [
  { t: 'concept', h: 'The build cache, and why order matters', d: 'cache', html: `<p>Docker reuses a cached layer if the instruction <b>and everything before it</b> are unchanged. The first changed line invalidates every layer after it.</p>
<p>So put what changes rarely (system packages, <code>requirements.txt</code>) first, and what changes often (your code) last. Editing <code>app.py</code> then only rebuilds the final small layer instead of reinstalling torch.</p>` },
  { t: 'example', h: 'Fast rebuild vs slow rebuild', code: `# BAD: any code change reinstalls all dependencies
COPY . .
RUN pip install -r requirements.txt

# GOOD: dependencies cached until requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src`, out: `$ docker build -t cvapi:0.1.1 .    # after editing src/app.py
 => CACHED [3/5] COPY requirements.txt .
 => CACHED [4/5] RUN pip install --no-cache-dir -r requirements.txt
 => [5/5] COPY src/ ./src                                   0.1s` },
  { t: 'concept', h: 'Multi-stage builds: build fat, ship slim', html: `<p>Compilers and build tools are needed to <i>build</i> wheels, not to <i>run</i> your app. A multi-stage Dockerfile builds in a first stage, then copies only the result into a clean, small final stage.</p>` },
  { t: 'example', h: 'Two stages for a Python service', code: `FROM python:3.12 AS build
WORKDIR /w
COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt

FROM python:3.12-slim
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels
COPY src/ /app/src
USER 1000
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]`, note: 'The final image has no gcc, no build headers, no pip cache: smaller to pull and less to attack.' },
  { t: 'predict', q: 'You add <code>RUN apt-get update && apt-get install -y curl</code> as the very first line after FROM. You then change only <code>src/app.py</code>. Does the apt line run again?', a: 'No. It is before the changed COPY, and its own text did not change, so it stays cached. Only layers from the first changed instruction onward rebuild.' },
  { t: 'check', q: 'Your image is 6 GB because <code>COPY . .</code> included a 5 GB datasets/ folder. Best fix?', o: ['Add datasets/ to .dockerignore and mount data at runtime', 'Use docker build --squash', 'Compress the folder first', 'Use a bigger disk'], a: 0, e: '.dockerignore keeps it out of the build context entirely. Data belongs in a volume or object storage, not in the image.' },
  { t: 'key', items: ['Order instructions from least to most frequently changing.', 'Multi-stage builds keep build tools out of the runtime image.', 'Run as a non-root USER, add .dockerignore, tag with versions.'] },
  { t: 'mistake', items: [['Using :latest in deployments', 'Pin a version tag (cvapi:0.3.1) so every node runs the same thing and rollbacks are possible.'], ['Secrets in ENV lines of the Dockerfile', 'They end up in the image history. Inject them at runtime (env vars, Kubernetes Secrets).']] }
];

STEPS.c3 = [
  { t: 'concept', h: 'Two ways to keep data', d: 'volumes', html: `<ul><li><b>Named volume</b> (<code>mlruns:/mlruns</code>): Docker manages the storage. Best for databases and app data.</li><li><b>Bind mount</b> (<code>./data:/data</code>): a folder from your machine appears inside the container. Best for development and datasets you already have.</li></ul>
<p>Both survive <code>docker rm</code>. The container is disposable; the volume is not.</p>` },
  { t: 'example', h: 'Data survives a container', code: `docker volume create notes
docker run --rm -v notes:/data alpine sh -c 'echo hello > /data/a.txt'
docker run --rm -v notes:/data alpine cat /data/a.txt`, out: `hello`, note: 'Two different containers, same volume. The first one was deleted (--rm) but the file stayed.' },
  { t: 'concept', h: 'Container networking and DNS', html: `<p>Compose creates a private network for your services and a built-in DNS: each service is reachable by its <b>service name</b>. From <code>api</code>, MLflow is just <code>http://mlflow:5000</code>.</p>
<p>Only ports listed under <code>ports:</code> are reachable from your laptop. Service-to-service traffic doesn\'t need published ports at all.</p>` },
  { t: 'predict', q: 'In compose, the api calls <code>http://localhost:5000</code> to reach MLflow. What happens?', a: 'Connection refused. Inside the api container, localhost is the api container itself. Use the service name: http://mlflow:5000. Kubernetes works the same way with Service names.' },
  { t: 'check', q: 'You run <code>docker compose down -v</code>. What happens to the mlruns named volume?', o: ['It is deleted with the containers', 'It is kept', 'It is backed up automatically', 'It moves to the host folder'], a: 0, e: 'The -v flag also removes named volumes. Plain "docker compose down" keeps them.' },
  { t: 'key', items: ['Volumes and bind mounts keep data outside disposable containers.', 'Compose services find each other by name through built-in DNS.', 'Only publish ports you need to reach from outside.'] },
  { t: 'mistake', items: [['Using localhost between containers', 'Use the service name; each container has its own localhost.'], ['depends_on means "wait until ready"', 'It only orders startup. Add a healthcheck with condition: service_healthy, or retry in your app.']] }
];
