// ===== Interactive lesson player: one idea per step, with predictions, quick checks, examples and a recap.
// Steps come from STEPS[lessonId] (js/steps-*.js); the lesson's original body becomes the first "big picture" step.
const Learn = (() => {
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const steps = l => [
    { t: 'intro', h: 'The big picture', d: l.diagram, html: l.body },
    ...(STEPS[l.id] || []),
    { t: 'explain', h: 'Explain it back' },
    { t: 'done', h: 'Lesson complete' }
  ];
  const pos = id => (st.step[id] = st.step[id] || { i: 0, max: 0 });
  const ICON = { intro: '🧭', concept: '💡', example: '🔧', predict: '🤔', check: '✅', key: '🔑', mistake: '⚠️', explain: '🗣️', done: '🎉' };
  const LABEL = { intro: 'Big picture', concept: 'Concept', example: 'Real example', predict: 'Predict', check: 'Quick check', key: 'Key takeaways', mistake: 'Common mistakes', explain: 'Explain it back', done: 'Finish' };
  const ask = q => `<button class="ghost askk" onclick="TUT.open(${JSON.stringify(q).replace(/"/g, '&quot;')})" title="Ask the tutor about this step">🤖 Ask Kube</button>`;
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Steps you must interact with before "Continue" (answer the check, reveal the prediction)
  const gate = (l, s, i) => (s.t === 'check' && st.checks[`${l.id}:${i}`] === undefined && answered[`${l.id}:${i}`] === undefined) || (s.t === 'predict' && !revealed[`${l.id}:${i}`]);
  const answered = {}, revealed = {};

  function body(l, s, i) {
    const k = `${l.id}:${i}`, dia = s.d && DIAGRAMS[s.d] ? `<div class="diagram">${DIAGRAMS[s.d]}</div>` : '';
    const head = `<div class="step-head"><span class="pill acc">${ICON[s.t]} ${LABEL[s.t]}</span>${s.h ? `<h2>${s.h}</h2>` : ''}</div>`;
    switch (s.t) {
      case 'intro': case 'concept':
        return head + dia + s.html + `<div class="step-tools">${ask(`About the lesson "${l.title}", step "${s.h}": explain it again in a different way, with a new simple example.`)}</div>`;
      case 'example':
        return head + dia + (s.html || '') + `<div class="ex"><div class="ex-bar"><span>💻 Try it</span><button class="ghost" onclick="navigator.clipboard.writeText(this.closest('.ex').querySelector('pre').innerText);toast('Copied')">📋 copy</button></div><pre>${esc(s.code)}</pre></div>` +
          (s.out ? `<div class="ex out"><div class="ex-bar"><span>📤 Output</span></div><pre>${esc(s.out)}</pre></div>` : '') + (s.note ? `<div class="callout tip">💡 ${s.note}</div>` : '') +
          `<div class="step-tools">${ask(`Explain this example line by line (lesson "${l.title}"):\n${s.code}`)}</div>`;
      case 'predict':
        return head + `<div class="predict"><p class="q">${s.q}</p><p class="req">Think of your answer first (say it out loud or type it), then reveal.</p>
          <textarea id="pg_${k.replace(':', '_')}" rows="2" placeholder="My guess…"></textarea>
          <p><button class="pri" onclick="Learn.reveal('${l.id}',${i})">Reveal the answer</button></p>
          <div class="reveal" ${revealed[k] ? '' : 'hidden'} id="pr_${k.replace(':', '_')}">✅ ${s.a}</div></div>`;
      case 'check': {
        const done = st.checks[k] !== undefined || answered[k] !== undefined;
        return head + `<div class="qc" id="qc_${k.replace(':', '_')}"><p class="q">${s.q}</p>${shuffle(s.o.map((o, j) => [o, j])).map(([o, j]) => `<button class="opt ${done && j === s.a ? 'right' : ''}" data-j="${j}" onclick="Learn.check('${l.id}',${i},${j})" ${done ? 'disabled' : ''}>${o}</button>`).join('')}<div class="qc-res">${done ? `<div class="expl">${s.e}</div>` : ''}</div></div>`;
      }
      case 'key':
        return head + `<ul class="keys">${s.items.map(x => `<li>${x}</li>`).join('')}</ul>`;
      case 'mistake':
        return head + `<div class="mist">${s.items.map(([w, r]) => `<div class="mrow"><div class="w">❌ ${w}</div><div class="r">✅ ${r}</div></div>`).join('')}</div>`;
      case 'explain':
        return head + `<p>Explaining a concept in your own words is the fastest way to find gaps. Write 3–5 sentences about <b>${l.title}</b>, as if to a classmate.</p>
          <textarea id="exp_${l.id}" rows="5" placeholder="In my own words…">${esc(st.notes[l.id] || '')}</textarea>
          <p style="display:flex;gap:8px;flex-wrap:wrap"><button class="pri" onclick="Learn.grade('${l.id}')">🤖 Ask Kube to grade it</button><button onclick="Learn.saveNote('${l.id}')">💾 Save as my note</button></p>
          <p class="req">Optional. Your note is saved with your progress and shown on your Profile.</p>`;
      case 'done': {
        const n = (STEPS[l.id] || []).filter(x => x.t === 'check').length, ok = (STEPS[l.id] || []).filter((x, j) => x.t === 'check' && st.checks[`${l.id}:${j + 1}`]).length;
        return head + `<div class="done-box"><div class="big">🎉</div><p>You went through every step of <b>${l.title}</b>.${n ? ` Quick checks right first time: <b>${ok}/${n}</b>.` : ''}</p>
          <div class="chips" style="justify-content:center"><button class="pri" onclick="lessonTab='quiz';route()">❓ Take the quiz</button><button onclick="lessonTab='watch';route()">🎬 Watch a video</button>${l.mission ? `<button onclick="lessonTab='mission';route()">🎮 Simulator mission</button>` : ''}<button onclick="lessonTab='lab';route()">🛠️ Real lab</button></div></div>`;
      }
    }
    return '';
  }

  function view(l) {
    const S = steps(l), p = pos(l.id);
    if (st.prefs.lessonMode === 'page') return `<div class="learn page">${S.slice(0, -1).map((s, i) => `<section class="lstep">${body(l, s, i)}</section>`).join('')}<section class="lstep">${body(l, S[S.length - 1], S.length - 1)}</section></div>`;
    p.i = Math.min(p.i, S.length - 1);
    const i = p.i, s = S[i];
    if (i === S.length - 1) finish(l);
    return `<div class="learn" id="learn">
      <div class="stepbar" role="tablist">${S.map((x, j) => `<button class="seg ${j < i ? 'past' : ''} ${j === i ? 'now' : ''}" ${j > p.max ? 'disabled' : ''} title="${LABEL[x.t]}${x.h ? ': ' + esc(x.h) : ''}" onclick="Learn.go('${l.id}',${j})"><span>${ICON[x.t]}</span></button>`).join('')}</div>
      <div class="req" style="margin:6px 0 14px">Step ${i + 1} of ${S.length} · use ← → keys</div>
      <section class="lstep card">${body(l, s, i)}</section>
      <div class="stepnav"><button onclick="Learn.go('${l.id}',${i - 1})" ${i === 0 ? 'disabled' : ''}>← Back</button>
        ${i < S.length - 1 ? `<button class="pri" id="stepNext" onclick="Learn.go('${l.id}',${i + 1})" ${gate(l, s, i) ? 'disabled title="Answer or reveal first"' : ''}>${gate(l, s, i) ? 'Answer to continue' : 'Continue →'}</button>` : ''}</div></div>`;
  }

  function rerender(l) { const lc = document.getElementById('lc'); if (lc) { lc.innerHTML = view(l); lc.scrollIntoView({ block: 'nearest' }); } }
  const lesson = id => allLessons().find(x => x.id === id);
  function go(id, j) { const l = lesson(id), S = steps(l), p = pos(id); if (j < 0 || j >= S.length) return; if (j > p.max + 1) return; if (j > p.i && gate(l, S[p.i], p.i)) return; p.i = j; p.max = Math.max(p.max, j); save(); rerender(l); }
  function unlock() { const b = document.getElementById('stepNext'); if (b) { b.disabled = false; b.removeAttribute('title'); b.textContent = 'Continue →'; } }
  function reveal(id, i) { const k = `${id}:${i}`; revealed[k] = 1; const el = document.getElementById('pr_' + k.replace(':', '_')); if (el) el.hidden = false; unlock(); }
  function check(id, i, j) {
    const s = steps(lesson(id))[i], k = `${id}:${i}`, box = document.getElementById('qc_' + k.replace(':', '_')); if (!box || answered[k] !== undefined) return;
    answered[k] = j; const right = j === s.a;
    box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (+b.dataset.j === s.a) b.classList.add('right'); else if (+b.dataset.j === j) b.classList.add('wrong'); });
    box.querySelector('.qc-res').innerHTML = `<div class="expl">${right ? '✅ Right!' : '❌ Not quite.'} ${s.e}</div>`;
    st.qstats.answered++; if (right) st.qstats.correct++;
    if (st.checks[k] === undefined) { st.checks[k] = right ? 1 : 0; if (right) gain(5, 'Quick check'); else save(); } else save();
    unlock();
  }
  function finish(l) { if (!st.read[l.id]) { st.read[l.id] = Date.now(); setTimeout(() => { gain(15, 'Lesson steps finished 📖'); if (st.prefs.motion) confetti(); }, 300); } }
  function saveNote(id) { const t = document.getElementById('exp_' + id)?.value.trim(); st.notes[id] = t; save(); toast('💾 Note saved'); }
  function grade(id) { const t = document.getElementById('exp_' + id)?.value.trim(); if (!t) return toast('Write your explanation first'); saveNote(id); TUT.send(`Grade my explanation of "${lesson(id).title}" out of 10. List what is correct, what is missing or wrong, and give a better version in simple words (keep mine recognisable). My explanation:\n${t}`); }

  // ← → keys move between steps when you're not typing
  addEventListener('keydown', e => {
    if (!location.hash.startsWith('#lesson/') || lessonTab !== 'learn' || st.prefs.lessonMode === 'page' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.querySelector('.modal:not([hidden])')) return;
    const id = location.hash.split('/')[1], p = st.step[id]; if (!p) return;
    if (e.key === 'ArrowRight') go(id, p.i + 1); if (e.key === 'ArrowLeft') go(id, p.i - 1);
  });

  const progress = id => { const l = lesson(id); if (!l) return 0; const n = steps(l).length; return Math.round(100 * ((st.step[id]?.max || 0) + 1) / n); };
  return { view, go, reveal, check, grade, saveNote, progress, count: l => steps(l).length };
})();
