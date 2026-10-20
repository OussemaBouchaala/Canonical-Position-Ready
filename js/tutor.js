// ===== AI tutor "Kube". Goes through the local server (/api/chat), which talks to the provider chosen in ⚙️ AI settings.
// API keys are saved in config.json by server.py and never reach the page.
const Tutor = (() => {
  let settings = null; // { provider, providers: { name: { label, hasKey, keyHint, model, ... } } }
  let history = [];
  let context = () => '';

  const SYSTEM = () => `You are "Kube", a friendly, rigorous tutor inside "Canonical Academy", a learning platform preparing Oussema Bouchaala (Tunisian engineering student at INSAT, strong in Python, computer vision/YOLO, FastAPI, Docker basics, DVC, ETL; NEW to Kubernetes) for Canonical's role "Python and Kubernetes Software Engineer – Data, Workflows, AI/ML & Analytics" (Charmed Kubeflow, MLflow, Juju charms, MicroK8s).
Teaching style:
- Start from intuition and analogies, then precise technical detail, then a concrete command or code snippet he can run on MicroK8s/Ubuntu.
- Connect concepts to his own projects (YOLO livestock detection, SAHI, FastAPI inference API, clinical-trial ETL) and to Canonical's products.
- Keep answers short by default (under ~200 words) unless asked for depth. Use markdown code blocks.
- When asked to quiz or interview, ask ONE question at a time, wait for the answer, grade it honestly, give the model answer, then ask the next.
- Correct misconceptions directly but kindly.
Hard rule: Canonical's application forbids AI-generated content. NEVER write his cover letter, CV text, or answers to application/essay questions. If asked, refuse briefly, then offer to quiz him, review facts for accuracy, or explain concepts so he can write it himself.
Current context in the platform: ${context()}`;

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function md(s) {
    let h = esc(s);
    h = h.replace(/```(\w*)\n([\s\S]*?)```/g, (_, l, c) => `<pre>${c}</pre>`);
    h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
    return h;
  }
  const post = (url, body) => fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const cur = () => settings && settings.providers[settings.provider];
  const ready = () => { const p = cur(); return !!p && (p.hasKey || p.no_key); };
  const summary = () => { const p = cur(); return p ? `${p.label} · ${p.model}${ready() ? '' : ' (no key yet)'}` : 'not set'; };

  async function ask(text, onDelta) {
    if (!ready()) throw new Error('NO_KEY');
    history.push({ role: 'user', content: text });
    // Keep the last ~20 turns, starting on a user turn (APIs reject a conversation that opens with the assistant).
    let msgs = history.slice(-20); while (msgs.length && msgs[0].role !== 'user') msgs = msgs.slice(1);
    let full = '';
    try {
      const res = await post('/api/chat', { system: SYSTEM(), messages: msgs });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error === 'NO_KEY' ? 'NO_KEY' : (j.error || `HTTP ${res.status}`)); }
      const rd = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) {
        const { done, value } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop();
        for (const l of lines) {
          if (!l.startsWith('data:')) continue;
          let j; try { j = JSON.parse(l.slice(5)); } catch { continue; }
          if (j.error) throw new Error(j.error);
          if (j.t) { full += j.t; onDelta(full); }
        }
      }
    } catch (e) { if (!full) history.pop(); else history.push({ role: 'assistant', content: full }); throw e; }
    history.push({ role: 'assistant', content: full });
    return full;
  }

  function mount(getContext, onAsk, srv) {
    context = getContext;
    const fab = document.createElement('button'); fab.className = 'fab'; fab.title = 'AI tutor'; fab.textContent = '🤖';
    const box = document.createElement('div'); box.className = 'chat';
    box.innerHTML = `<header><div><b>Kube</b> <span class="pill" id="tProv">AI tutor</span></div><div><button class="ghost" id="tSet" title="AI settings">⚙️</button><button class="ghost" id="tClr" title="New chat">🧹</button><button class="ghost" id="tX">✕</button></div></header>
    <div class="msgs" id="tMsgs"></div>
    <div class="quick">
      <button data-q="Explain the concept of the lesson I'm on like I'm new to it, with an analogy, then the precise version.">Explain simply</button>
      <button data-q="Quiz me with 5 questions on the lesson I'm on, one at a time. Wait for my answer each time.">Quiz me</button>
      <button data-q="Give me a hands-on exercise for this lesson that I can do on MicroK8s in 15 minutes, with the expected output.">Exercise</button>
      <button data-q="Run a realistic Canonical technical interview with me on Kubernetes and MLOps. One question at a time, grade my answers.">Mock interview</button>
      <button data-q="Review this YAML/command for mistakes and explain each issue:\n">Check my YAML</button>
    </div>
    <form id="tForm"><textarea id="tIn" placeholder="Ask anything… (Enter to send, Shift+Enter for newline)"></textarea><button class="pri">➤</button></form>`;

    // ---- AI settings dialog
    const dlg = document.createElement('div'); dlg.className = 'modal'; dlg.hidden = true;
    dlg.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="llmTitle">
      <header><h3 id="llmTitle" style="margin:0">⚙️ AI settings</h3><button class="ghost" id="llmX" aria-label="Close">✕</button></header>
      <label>Provider<select id="llmProv"></select></label>
      <p class="req" id="llmHelp"></p>
      <label id="llmKeyRow">API key<input id="llmKey" type="password" autocomplete="off" spellcheck="false"></label>
      <label id="llmBaseRow">Server URL<input id="llmBase" spellcheck="false"></label>
      <label>Model<div style="display:flex;gap:8px"><select id="llmModelSel"></select><button type="button" id="llmLoad" title="Reload the list of models" style="white-space:nowrap">↻ Refresh</button></div><input id="llmModel" spellcheck="false" placeholder="type a model id" hidden></label>
      <p class="req" id="llmStatus" aria-live="polite"></p>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button type="button" id="llmClear" style="margin-right:auto">Remove saved key</button><span style="display:flex;gap:8px"><button type="button" id="llmTest">Test</button><button type="button" class="pri" id="llmSave">Save</button></span></div>
    </div>`;
    document.body.append(fab, box, dlg);
    const q = s => dlg.querySelector(s);
    const msgs = box.querySelector('#tMsgs'), input = box.querySelector('#tIn');
    const add = (cls, html) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; msgs.append(d); msgs.scrollTop = 1e9; return d; };
    const hello = () => {
      if (!srv) return add('a', 'The tutor needs the local server. Start the app with <b>start.bat</b>, then open <code>http://localhost:8768</code>.');
      if (!settings) return add('a', '<span class="t-dim">Loading AI settings…</span>');
      if (!ready()) return add('a', `Hi 👋 To chat, pick an AI provider and add its key in <a href="#" data-set>⚙️ AI settings</a>. Free options: Google Gemini, Groq, OpenRouter (":free" models) or Ollama on your PC.`);
      add('a', `Hi Oussema 👋 I'm Kube, your tutor (<code>${esc(cur().label)}</code> · <code>${esc(cur().model)}</code>). Ask me anything about Kubernetes, MLOps or charms. I know which lesson you're on.`);
    };
    const refreshHeader = () => { box.querySelector('#tProv').textContent = cur() ? cur().model : 'AI tutor'; const el = document.getElementById('setProv'); if (el) el.textContent = summary(); };
    msgs.addEventListener('click', e => { if (e.target.matches('[data-set]')) { e.preventDefault(); openSettings(); } });

    const fillProvider = name => {
      const p = settings.providers[name];
      q('#llmHelp').innerHTML = p.no_key ? `Runs models on your own PC. Install it from <a href="${p.key_url}" target="_blank" rel="noopener">ollama.com</a>, then run <code>ollama pull ${esc(p.default_model)}</code>.`
        : `Get a key at <a href="${p.key_url}" target="_blank" rel="noopener">${esc(new URL(p.key_url).host)}</a>. It is saved in <code>config.json</code> on your PC only.`;
      q('#llmKeyRow').hidden = p.no_key; q('#llmClear').hidden = p.no_key || !p.hasKey; q('#llmBaseRow').hidden = !p.no_key;
      q('#llmKey').value = ''; q('#llmKey').placeholder = p.hasKey ? `saved (${p.keyHint || '••••'}). Leave empty to keep it` : 'paste your key';
      q('#llmBase').value = p.base_url; q('#llmStatus').textContent = '';
      setModels([p.model], p.model); if (p.hasKey || p.no_key) loadModels();
    };
    // Model dropdown: the provider's live list (loaded with your key) + "Other…" to type any model id.
    const setModels = (list, current) => {
      const ids = [...new Set([current, ...list].filter(Boolean))];
      q('#llmModelSel').innerHTML = ids.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('') + '<option value="__custom">Other (type a model id)…</option>';
      q('#llmModelSel').value = current || ids[0] || '__custom'; q('#llmModel').hidden = q('#llmModelSel').value !== '__custom';
    };
    const curModel = () => q('#llmModelSel').value === '__custom' ? q('#llmModel').value.trim() : q('#llmModelSel').value;
    async function loadModels() {
      const prov = q('#llmProv').value; status('Loading models…');
      try { const j = await call('/api/llm/models', form()); if (q('#llmProv').value !== prov) return; setModels(j.models, curModel()); status(`${j.models.length} models available.`, 't-ok'); }
      catch (e) { if (q('#llmProv').value === prov) status('Could not load models: ' + e.message, 't-err'); }
    }
    const form = () => ({ provider: q('#llmProv').value, api_key: q('#llmKey').value.trim(), model: curModel(), base_url: q('#llmBase').value.trim() });
    const status = (t, cls = '') => { q('#llmStatus').className = 'req ' + cls; q('#llmStatus').textContent = t; };
    async function call(url, body) { const r = await post(url, body); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`); return j; }
    function openSettings() {
      if (!settings) return;
      q('#llmProv').innerHTML = Object.entries(settings.providers).map(([k, p]) => `<option value="${k}">${esc(p.label)}${p.hasKey ? ' ✓' : ''}</option>`).join('');
      q('#llmProv').value = settings.provider; fillProvider(settings.provider); dlg.hidden = false; q('#llmProv').focus();
    }
    q('#llmProv').onchange = e => fillProvider(e.target.value);
    q('#llmX').onclick = () => { dlg.hidden = true; };
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.hidden = true; });
    dlg.addEventListener('keydown', e => { if (e.key === 'Escape') dlg.hidden = true; });
    q('#llmLoad').onclick = loadModels;
    q('#llmModelSel').onchange = () => { q('#llmModel').hidden = q('#llmModelSel').value !== '__custom'; if (!q('#llmModel').hidden) q('#llmModel').focus(); };
    q('#llmKey').addEventListener('change', () => { if (q('#llmKey').value.trim()) loadModels(); });
    q('#llmTest').onclick = async () => { status('Testing…'); try { const j = await call('/api/llm/test', form()); status(`✅ Works: ${j.model} replied "${j.reply}" in ${(j.ms / 1000).toFixed(1)}s`, 't-ok'); } catch (e) { status('❌ ' + e.message, 't-err'); } };
    q('#llmClear').onclick = async () => { if (!confirm('Remove the saved key for this provider?')) return; try { settings = await call('/api/llm/settings', { provider: q('#llmProv').value, clear_key: true }); fillProvider(settings.provider); refreshHeader(); status('Key removed.'); } catch (e) { status(e.message, 't-err'); } };
    q('#llmSave').onclick = async () => {
      try { settings = await call('/api/llm/settings', form()); } catch (e) { return status(e.message, 't-err'); }
      dlg.hidden = true; refreshHeader(); add('a', `Saved ✔ now using <code>${esc(cur().label)}</code> · <code>${esc(cur().model)}</code>${ready() ? '' : '. Add a key to start chatting.'}`);
    };

    fab.onclick = () => box.classList.toggle('open');
    box.querySelector('#tX').onclick = () => box.classList.remove('open');
    box.querySelector('#tClr').onclick = () => { history = []; msgs.innerHTML = ''; hello(); };
    box.querySelector('#tSet').onclick = () => srv ? openSettings() : null;
    box.querySelectorAll('.quick button').forEach(b => b.onclick = () => { input.value = b.dataset.q; if (!b.dataset.q.endsWith('\n')) box.querySelector('#tForm').requestSubmit(); else input.focus(); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); box.querySelector('#tForm').requestSubmit(); } });
    box.querySelector('#tForm').onsubmit = async e => {
      e.preventDefault(); const t = input.value.trim(); if (!t) return; input.value = '';
      add('u', esc(t)); const out = add('a', '<span class="t-dim">thinking…</span>'); onAsk && onAsk();
      try { await ask(t, full => { out.innerHTML = md(full); msgs.scrollTop = 1e9; }); }
      catch (er) { out.innerHTML = er.message === 'NO_KEY' ? 'Add an API key first in <a href="#" data-set>⚙️ AI settings</a>.' : `<span class="t-err">${esc(er.message)}</span>`; }
    };

    if (srv) fetch('/api/llm/settings').then(r => r.json()).then(s => { settings = s; msgs.innerHTML = ''; hello(); refreshHeader(); }).catch(() => { msgs.innerHTML = ''; add('a', '<span class="t-err">Could not load AI settings. Is start.bat running?</span>'); });
    hello();
    return { open: q => { box.classList.add('open'); if (q) { input.value = q; input.focus(); } }, settings: () => { box.classList.add('open'); openSettings(); }, summary,
      send: q => { box.classList.add('open'); input.value = q; box.querySelector('#tForm').requestSubmit(); } };
  }
  return { mount };
})();
