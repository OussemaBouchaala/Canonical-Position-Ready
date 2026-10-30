// ===== Run lab commands on this Ubuntu machine, from the page (opt-in: Settings → Labs).
// The local server runs each command with bash in ~/canonical-labs/<lesson> and streams its output here.
const RUN = (() => {
  let info = { canRun: false, allowRun: false, os: '', labsDir: '~/canonical-labs', token: '' };
  const out = {};  // slot -> { text, code, running, id }: survives re-renders while the page is open
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Commands that need a password or a keyboard can't run without a terminal.
  const TERM = /(^|[\s;&|(])(sudo|su|newgrp|passwd|vim?|nano|less|more|top|htop|ssh|watch)(\s|$)|\s-(it|ti)\b|\bjournalctl\b.*\s-f\b|\bsource\s+~\/\.bashrc/;
  const needsTerminal = c => TERM.test(c);

  async function load() {
    if (!SERVER) return;
    try { info = await (await fetch('/api/system')).json(); } catch { /* old server: no runner */ }
  }

  function outHTML(slot) {
    const o = out[slot]; if (!o) return '';
    const tail = o.running ? '<span class="run-live">● running…</span>' : o.code === undefined ? '' : o.code === 0 ? '<span class="t-ok">✓ exit 0</span>' : o.code < 0 ? '<span class="t-dim">■ stopped</span>' : `<span class="t-err">✗ exit ${o.code}</span>`;
    return `<div class="runbox"><pre class="runout">${esc(o.text) || '<span class="t-dim">(no output yet)</span>'}</pre><div class="runfoot">${tail}${o.running ? `<button class="ghost" onclick="event.preventDefault();RUN.stop('${slot}')">■ Stop</button>` : `<button class="ghost" onclick="event.preventDefault();RUN.clear('${slot}')">✕ Clear</button>`}</div></div>`;
  }

  // Button + output area for one command. slot = unique id on the page, dir = lesson id (its own folder).
  function btn(cmd, slot, dir) {
    if (!SERVER || !info.canRun) return '';
    const tip = needsTerminal(cmd)
      ? '<span class="pill" title="It asks for your password or needs a keyboard">⌨️ run this one in your terminal</span>'
      : `<button class="run" onclick="event.preventDefault();RUN.go(${JSON.stringify(cmd).replace(/"/g, '&quot;')},'${slot}','${dir || ''}')">▶ Run</button>`;
    return `${tip}<div id="run_${slot}" onclick="event.preventDefault()">${outHTML(slot)}</div>`;
  }

  const paint = slot => { const el = document.getElementById('run_' + slot); if (el) { el.innerHTML = outHTML(slot); const p = el.querySelector('pre'); if (p) p.scrollTop = p.scrollHeight; } };

  async function go(cmd, slot, dir) {
    if (!info.allowRun) return toast('Turn on "Run lab commands" in Settings → Labs first');
    if (out[slot]?.running) return;
    const id = slot.replace(/[^\w-]/g, '') + '-' + Date.now().toString(36);
    out[slot] = { text: `$ ${cmd}\n`, running: true, id };
    paint(slot);
    try {
      const r = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ca-token': info.token }, body: JSON.stringify({ cmd, id, dir, cwd: slot.startsWith('ex_') ? '' : projDir(dir) }) });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.status); }
      const rd = r.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { value, done } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i; while ((i = buf.indexOf('\n\n')) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!line.startsWith('data:')) continue;
          const j = JSON.parse(line.slice(5));
          if (j.t) out[slot].text += j.t;
          if (j.done) out[slot].code = j.code;
        }
        paint(slot);
      }
    } catch (e) { out[slot].text += `\n[${e.message}]`; }
    out[slot].running = false; paint(slot);
  }

  function stop(slot) {
    const o = out[slot]; if (!o?.running) return;
    fetch('/api/run/stop', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ca-token': info.token }, body: JSON.stringify({ id: o.id }) });
  }

  async function setAllow(v) {
    const r = await fetch('/api/run/settings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ allow: v }) }).catch(() => null);
    if (!r || !r.ok) return toast('❌ Could not change the setting');
    const j = await r.json(); info.allowRun = j.allowRun; info.token = j.token;
    toast(v ? '▶ Lab commands can run from the app' : 'Run from the app is off'); route();
  }

  // Free terminal under each lab: type any command, run it in that lab's folder.
  function shell(dir) {
    if (!SERVER || !info.canRun || !info.allowRun) return '';
    const slot = 'sh_' + dir;
    return `<div class="card runshell"><b>🖥️ Terminal</b> <span class="req">runs in <code>${esc(projDir(dir) || info.labsDir + '/' + dir)}</code>, no password prompts</span>
      <form onsubmit="event.preventDefault();const c=this.c.value.trim();if(c)RUN.go(c,'${slot}','${dir}')"><input name="c" placeholder="ls -la" autocomplete="off" spellcheck="false"><button>▶ Run</button></form><div id="run_${slot}">${outHTML(slot)}</div></div>`;
  }

  // ---------- labs that work in one of your own projects: pick the folder, then get it ready step by step
  const PY = 'one of your Python projects (Fake_Real_Reviews_Classifier or your intern_assignment work well)';
  const NEEDS = {
    p1: { what: PY, py: 1 }, p2: { what: PY, py: 1, tests: 1 }, p3: { what: PY, py: 1 }, p4: { what: 'the project you want a CI badge on', py: 1, gh: 1 },
    e1: { what: PY, py: 1 }, e2: { what: 'your ETL or inference project (it needs a main script to profile)', py: 1 },
    c2: { what: 'your FastAPI inference project (the API you will containerise)', py: 1, docker: 1 },
    c3: { what: 'your FastAPI inference project (the API that goes next to MLflow)', py: 1, docker: 1, compose: 1 },
    k5: { what: 'your FastAPI inference project', py: 1 }, a5: { what: 'your FastAPI inference project', py: 1 },
    m2: { what: 'your YOLO training project', py: 1 } };
  const facts = {}, projects = { list: null };  // lesson -> folder facts, read from the server
  const projDir = id => (NEEDS[id] && st.labDir[id]) || '';

  async function folderApi(path) {
    const r = await fetch('/api/run/folder', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ca-token': info.token }, body: JSON.stringify({ path }) });
    const j = await r.json(); projects.list = j.projects || []; return j;
  }

  async function pick(id, path) {
    path = (path || '').trim(); if (!path) return;
    const j = await folderApi(path).catch(() => ({ error: 'server not reachable' }));
    if (j.error) return toast('❌ ' + j.error);
    facts[id] = j.facts; st.labDir[id] = j.facts.path; save(); route();
  }

  async function recheck(id) {
    const j = await folderApi(st.labDir[id] || '').catch(() => ({}));
    if (j.facts) facts[id] = j.facts; else if (st.labDir[id]) { delete st.labDir[id]; save(); }
    route();
  }

  function setupSteps(id, f) {
    const n = NEEDS[id], lab = `lab-${id}`, out = [];
    out.push({ t: f ? `Project folder: <code>${esc(f.short)}</code>` : `Choose ${n.what}`, ok: !!f, pick: 1 });
    if (!f) return out;
    out.push(f.git
      ? { t: `Work on a branch, so you can throw the lab away with <code>git switch -</code>`, c: `git add -A && git commit -qm "Before lab ${id}" ; git switch -c ${lab}`, ok: f.branch === lab, note: `You are on <code>${esc(f.branch || '?')}</code>.` }
      : { t: 'Put the folder under git first, so every lab change can be undone', c: `git init && git add -A && git commit -qm "Before lab ${id}" && git switch -c ${lab}`, ok: false });
    if (n.py) out.push({ t: 'Create a virtual environment and install the project in it', ok: f.venv,
      c: `python3 -m venv .venv && . .venv/bin/activate && pip install -U pip && ${f.pyproject ? 'pip install -e .' : f.requirements ? 'pip install -r requirements.txt' : 'echo "no pyproject.toml or requirements.txt: install what the project imports"'}`,
      note: f.venv ? 'Run buttons below activate it for you.' : 'If it says <i>ensurepip is not available</i>, run <code>sudo apt install python3-venv</code> in your terminal first.' });
    if (n.tests) out.push({ t: 'Add a tests folder and the test tools', c: 'mkdir -p tests && touch tests/__init__.py && pip install pytest pytest-cov', ok: f.tests });
    if (n.docker) out.push({ t: 'Docker is installed', ok: f.docker, note: f.docker ? '' : 'Do the <a href="#lesson/c1">First containers</a> lab first.' });
    if (n.docker) out.push({ t: 'The project has a Dockerfile', ok: f.dockerfile, note: f.dockerfile ? '' : 'Write it from the lesson\'s Dockerfile (Learn tab), save it at the project root, then re-check.' });
    if (n.compose) out.push({ t: 'The project has a compose file', ok: f.compose, note: f.compose ? '' : 'Save the compose file from the lesson as <code>compose.yaml</code>, then re-check.' });
    if (n.gh) out.push({ t: 'The project is on GitHub', ok: /github\.com/.test(f.remote), c: 'gh repo create --source . --private --push',
      note: /github\.com/.test(f.remote) ? `Remote: <code>${esc(f.remote)}</code>` : 'Needs the GitHub CLI: <code>sudo snap install gh</code> then <code>gh auth login</code> in your terminal.' });
    return out;
  }

  // The "Before you start" card at the top of a lab that works in your own project.
  function folder(id) {
    const n = NEEDS[id]; if (!n || !SERVER) return '';
    if (!info.allowRun) return `<div class="card projcard"><b>📁 This lab works in ${n.what}.</b>
      <p class="req">Open a terminal in that folder (<code>cd ~/projects/&lt;name&gt;</code>), make a branch (<code>git switch -c lab-${id}</code>) and activate its virtualenv. Turn on Settings → Labs → "Run lab commands from the app" and this card checks the folder and guides each step for you.</p></div>`;
    const dir = st.labDir[id], f = facts[id];
    if (dir && !f) { recheck(id); return '<div class="card projcard">📁 Checking your project folder…</div>'; }
    if (!projects.list) folderApi('').then(() => route()).catch(() => {});
    const steps = setupSteps(id, f), ready = steps.every(s => s.ok);
    const chips = (projects.list || []).map(p => `<button class="ghost chip" onclick="RUN.pick('${id}',${JSON.stringify(p).replace(/"/g, '&quot;')})">${esc(p)}</button>`).join('');
    return `<div class="card projcard"><h3>📁 Before you start ${ready ? '<span class="pill ok">✓ ready</span>' : ''}</h3>
      <p class="sub">This lab works in ${n.what}. The ▶ Run buttons and the terminal below run inside it.</p>
      <ol class="setup">${steps.map((s, i) => `<li class="${s.ok ? 'ok' : ''}"><span class="mark">${s.ok ? '✓' : i + 1}</span><div style="flex:1"><b>${s.t}</b>
        ${s.pick ? `<form class="pickf" onsubmit="event.preventDefault();RUN.pick('${id}',this.p.value)"><input name="p" value="${esc(f ? f.short : '')}" placeholder="~/projects/my-project" spellcheck="false"><button>Use this folder</button></form>${chips && !f ? `<div class="chips">Found in your home folder: ${chips}</div>` : ''}` : ''}
        ${s.c && !s.ok ? `<pre>${esc(s.c)}</pre>${btn(s.c, `setup_${id}_${i}`, id)}` : ''}${s.note ? `<p class="req">${s.note}</p>` : ''}</div></li>`).join('')}</ol>
      ${f ? `<button class="ghost" onclick="RUN.recheck('${id}')">↻ Re-check the folder</button> <button class="ghost" onclick="RUN.change('${id}')">Change folder</button>` : ''}</div>`;
  }

  const settingsCard = () => !SERVER ? '' : `<div class="card"><h3>🖥️ Labs</h3><p class="sub">Your machine: <b>${esc(info.os || 'unknown')}</b>.</p>
    ${info.canRun ? `<label class="fld" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" ${info.allowRun ? 'checked' : ''} onchange="RUN.setAllow(this.checked)"> Run lab commands from the app</label>
    <p class="req">Adds ▶ Run to lab steps and examples. Commands run as you, in <code>${esc(info.labsDir)}</code>, and stop after 30 min. Steps with <code>sudo</code> stay in your own terminal. Only turn this on for labs you trust.</p>` : '<p class="req">Running commands from the app needs Linux with bash.</p>'}</div>`;

  return { load, btn, go, folder, pick, recheck, change: id => { delete st.labDir[id]; delete facts[id]; save(); route(); }, needs: id => !!NEEDS[id], stop, clear: s => { delete out[s]; paint(s); }, setAllow, shell, settingsCard, needsTerminal, get info() { return info; } };
})();
