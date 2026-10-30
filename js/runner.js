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
      const r = await fetch('/api/run', { method: 'POST', headers: { 'content-type': 'application/json', 'x-ca-token': info.token }, body: JSON.stringify({ cmd, id, dir }) });
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
    return `<div class="card runshell"><b>🖥️ Terminal</b> <span class="req">runs in <code>${esc(info.labsDir)}/${dir}</code>, no password prompts</span>
      <form onsubmit="event.preventDefault();const c=this.c.value.trim();if(c)RUN.go(c,'${slot}','${dir}')"><input name="c" placeholder="ls -la" autocomplete="off" spellcheck="false"><button>▶ Run</button></form><div id="run_${slot}">${outHTML(slot)}</div></div>`;
  }

  const settingsCard = () => !SERVER ? '' : `<div class="card"><h3>🖥️ Labs</h3><p class="sub">Your machine: <b>${esc(info.os || 'unknown')}</b>.</p>
    ${info.canRun ? `<label class="fld" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" ${info.allowRun ? 'checked' : ''} onchange="RUN.setAllow(this.checked)"> Run lab commands from the app</label>
    <p class="req">Adds ▶ Run to lab steps and examples. Commands run as you, in <code>${esc(info.labsDir)}</code>, and stop after 30 min. Steps with <code>sudo</code> stay in your own terminal. Only turn this on for labs you trust.</p>` : '<p class="req">Running commands from the app needs Linux with bash.</p>'}</div>`;

  return { load, btn, go, stop, clear: s => { delete out[s]; paint(s); }, setAllow, shell, settingsCard, needsTerminal, get info() { return info; } };
})();
