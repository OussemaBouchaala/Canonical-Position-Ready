// ===== Profile (your progress at a glance) and Settings (profile, appearance, learning, AI, data)
const Pages = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const day = d => d.toISOString().slice(0, 10);
  const AVATARS = ['🧑‍💻', '👨‍🎓', '🦊', '🐧', '🐍', '☸️', '🚀', '🧠', '🦉', '🐼', '⚡', '🟠'];
  const ACCENTS = { orange: ['#e95420', '#ff7a45'], blue: ['#3b82f6', '#60a5fa'], green: ['#16a34a', '#34d399'], purple: ['#8b5cf6', '#b48cff'], pink: ['#db2777', '#f472b6'] };

  const xpOn = d => st.daily[d] || (st.days.includes(d) ? 1 : 0);
  function bestStreak() { const ds = [...new Set(st.days)].sort(); let best = 0, run = 0, prev = null; ds.forEach(d => { const t = new Date(d + 'T00:00'); run = prev && (t - prev) / 864e5 === 1 ? run + 1 : 1; best = Math.max(best, run); prev = t; }); return best; }
  const today = () => day(new Date());

  function heatmap() {
    const weeks = 16, end = new Date(), start = new Date(end); start.setDate(end.getDate() - (weeks * 7 - 1) - end.getDay());
    const cells = []; const max = Math.max(20, ...Object.values(st.daily));
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) { const k = day(d), v = xpOn(k); const lvl = v ? Math.min(4, 1 + Math.floor(3 * v / max)) : 0; cells.push(`<i class="h${lvl}" title="${k}: ${st.daily[k] || 0} XP"></i>`); }
    return `<div class="heat">${cells.join('')}</div><div class="req heat-leg">less <i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i> more · last ${weeks} weeks</div>`;
  }
  function bars() {
    const ds = [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return day(d); }), max = Math.max(st.prefs.goal, ...ds.map(d => st.daily[d] || 0));
    return `<div class="bars">${ds.map(d => { const v = st.daily[d] || 0; return `<div class="b" title="${d}: ${v} XP"><i style="height:${Math.round(100 * v / max)}%" class="${v >= st.prefs.goal ? 'goal' : ''}"></i><span>${new Date(d + 'T00:00').toLocaleDateString('en-GB', { weekday: 'narrow' })}</span></div>`; }).join('')}
      <div class="goal-line" style="bottom:calc(${Math.round(100 * st.prefs.goal / max)}% * .78 + 22px)"></div></div><div class="req">Daily XP, last 14 days · line = your goal (${st.prefs.goal} XP)</div>`;
  }
  const ring = (pct, label) => `<div class="ring" style="--p:${Math.min(100, pct)}"><div><b>${label}</b><small>today</small></div></div>`;

  function profile() {
    const L = level(), s = summary(), acc = st.qstats.answered ? Math.round(100 * st.qstats.correct / st.qstats.answered) : null;
    const t = st.daily[today()] || 0, lessons = allLessons(), done = lessons.filter(l => st.done[l.id]);
    const recent = Object.entries(st.done).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id, ts]) => { const l = lessons.find(x => x.id === id); return l ? `<li><a href="#lesson/${id}">${l.track.icon} ${l.title}</a><span class="req">${typeof ts === 'number' ? new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</span></li>` : ''; }).join('');
    const notes = Object.entries(st.notes).filter(([, v]) => v).map(([id, v]) => { const l = lessons.find(x => x.id === id); return l ? `<details class="note"><summary>${l.track.icon} ${l.title}</summary><p>${esc(v)}</p><a href="#lesson/${id}">Open lesson →</a></details>` : ''; }).join('');
    return `<div class="prof-head card"><div class="avatar">${st.profile.avatar}</div><div style="flex:1;min-width:220px">
        <h1 style="margin:0">${esc(st.profile.name)}</h1><p class="sub" style="margin:2px 0 10px">${esc(st.profile.role)}</p>
        <div><b>Lv ${L.i + 1} · ${L.name}</b> <span class="req">· ${st.xp} / ${L.next} XP to next level</span></div><div class="bar"><i style="width:${L.pct}%"></i></div>
        <p class="req">Learning since ${st.start} · <a href="#settings">✏️ Edit profile</a></p></div>${ring(100 * t / st.prefs.goal, `${t}/${st.prefs.goal}`)}</div>
      <div class="grid g4" style="margin-top:16px">
        <div class="card"><div class="kpi">⚡ ${st.xp}</div><div class="req">total XP</div></div>
        <div class="card"><div class="kpi">🔥 ${streak()}</div><div class="req">day streak · best ${bestStreak()}</div></div>
        <div class="card"><div class="kpi">📚 ${done.length}<small>/${lessons.length}</small></div><div class="req">lessons completed</div></div>
        <div class="card"><div class="kpi">🎯 ${acc === null ? '–' : acc + '%'}</div><div class="req">quiz & check accuracy (${st.qstats.correct}/${st.qstats.answered})</div></div>
        <div class="card"><div class="kpi">🎮 ${s.missions}<small>/${Object.keys(MISSIONS).length}</small></div><div class="req">simulator missions</div></div>
        <div class="card"><div class="kpi">👹 ${s.bosses}<small>/${TRACKS.length}</small></div><div class="req">boss battles won</div></div>
        <div class="card"><div class="kpi">🃏 ${st.flashReviews}</div><div class="req">flashcard reviews</div></div>
        <div class="card"><div class="kpi">🤖 ${st.tutorQs}</div><div class="req">questions to Kube</div></div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Activity</h3>${heatmap()}</div>
        <div class="card"><h3>Daily XP</h3>${bars()}</div></div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Tracks</h3>${TRACKS.map(t => `<a class="trow" href="#track/${t.id}"><span>${t.icon} ${t.title.split(':')[0].split('(')[0]}</span><span class="bar"><i style="width:${trackPct(t)}%"></i></span><b>${trackPct(t)}%</b></a>`).join('')}
          <p class="req" style="margin-top:10px">🎯 Job match: <b>${match()}%</b> · <a href="#match">details</a></p></div>
        <div class="card"><h3>Recently completed</h3>${recent ? `<ul class="recent">${recent}</ul>` : '<p class="sub">Finish a lesson quiz to see it here.</p>'}
          <h3>Badges (${Object.keys(st.badges).length}/${BADGES.length})</h3><div class="mini-badges">${BADGES.map(b => `<span class="${st.badges[b.id] ? 'got' : ''}" title="${esc(b.t)}: ${esc(b.d)}">${b.e}</span>`).join('')}</div></div></div>
      <div class="card" style="margin-top:16px"><h3>🗒️ My notes</h3>${notes || '<p class="sub">Notes you save in a lesson\'s "Explain it back" step appear here.</p>'}</div>`;
  }

  const seg = (key, opts, cur) => `<div class="seg-ctl">${opts.map(([v, t]) => `<button class="${cur === v ? 'on' : ''}" onclick="setPref('${key}','${v}')">${t}</button>`).join('')}</div>`;
  function settings() {
    const P = st.prefs;
    return `<h1>⚙️ Settings</h1><div class="grid g2">
    <div class="card"><h3>👤 Profile</h3>
      <label class="fld">Name<input value="${esc(st.profile.name)}" onchange="st.profile.name=this.value.trim()||'Learner';save();renderSide()"></label>
      <label class="fld">Goal / role<input value="${esc(st.profile.role)}" onchange="st.profile.role=this.value.trim();save()"></label>
      <div class="fld">Avatar<div class="avatars">${AVATARS.map(a => `<button class="${st.profile.avatar === a ? 'on' : ''}" onclick="st.profile.avatar='${a}';save();route()">${a}</button>`).join('')}</div></div>
      <div class="fld">Daily goal${seg('goal', [['30', '30 XP'], ['60', '60 XP'], ['100', '100 XP'], ['150', '150 XP']], String(P.goal))}</div></div>
    <div class="card"><h3>🎨 Appearance</h3>
      <div class="fld">Theme${seg('theme', [['dark', '🌙 Dark'], ['light', '☀️ Light'], ['auto', '🖥️ System']], st.theme)}</div>
      <div class="fld">Accent colour<div class="swatches">${Object.entries(ACCENTS).map(([k, [c]]) => `<button class="${P.accent === k ? 'on' : ''}" style="background:${c}" title="${k}" aria-label="${k}" onclick="setPref('accent','${k}')"></button>`).join('')}</div></div>
      <div class="fld">Text size${seg('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']], P.size)}</div>
      <div class="fld">Celebrations${seg('motion', [['1', '🎉 Confetti on'], ['0', 'Calm']], P.motion ? '1' : '0')}</div></div>
    <div class="card"><h3>📖 Learning</h3>
      <div class="fld">Lesson "Learn" tab${seg('lessonMode', [['steps', 'Step by step'], ['page', 'All on one page']], P.lessonMode)}</div>
      <div class="fld">Time per day${seg('minutes', [['30', '30 min'], ['45', '45 min'], ['60', '1 h'], ['90', '1 h 30'], ['120', '2 h']], String(P.minutes))}</div>
      <div class="fld">Study days per week${seg('studyDays', [['5', '5'], ['6', '6'], ['7', '7']], String(P.studyDays))}</div>
      <div class="fld">Python Engineer track${seg('pyeng', [['1', 'In my plan'], ['0', 'Skip it']], P.pyeng === false ? '0' : '1')}</div>
      <p class="req" style="margin:-4px 0 10px">${(() => { const p = plan(); return `Your plan: <b>${p.weeks} weeks</b>, ending ${fmtDate(p.end, 1)} (~${Math.round(p.totalMin / 60)} h of lessons and labs; ${REVIEW_MIN} min of each day goes to flashcards).`; })()}</p>
      <label class="fld">Plan start date<input type="date" value="${st.start}" onchange="st.start=this.value;save();toast('Plan dates updated')"></label>
      <div class="fld">Lesson progress<div><button onclick="if(confirm('Restart all lessons from step 1? Your XP and completions stay.')){st.step={};save();toast('Lesson steps reset')}">↺ Restart lesson steps</button></div></div></div>
    ${RUN.settingsCard()}
    <div class="card"><h3>🤖 AI tutor</h3><p class="sub">${SERVER ? `Provider: <b id="setProv">${TUT.summary()}</b>. Free options: Gemini, Groq, OpenRouter, Ollama. Keys stay in <code>config.json</code> on your PC.` : 'The tutor needs the local server: start the app with <b>./start.sh</b>.'}</p>${SERVER ? '<button onclick="TUT.settings()">⚙️ AI settings</button>' : ''}</div>
    <div class="card"><h3>💾 Your data</h3><p class="sub">${SERVER ? `Saved to <code>progress.json</code> (daily backups in <code>backups/</code>). Last sync: ${syncOk === false ? '❌ failed (is ./start.sh running?)' : '✅ ok'}` : '⚠️ Opened as a file: progress only in this browser. Use <b>./start.sh</b> to save to disk.'}</p>
      <button onclick="exportState()">⬇ Export</button> <label><button onclick="this.nextElementSibling.click()">⬆ Import</button><input type="file" accept=".json" style="display:none" onchange="importState(this.files[0])"></label></div>
    <div class="card"><h3>⚠️ Danger zone</h3><button onclick="resetAll()">Reset all progress</button>${SERVER ? '<p class="req">A copy of your current progress is saved in <code>backups/</code> first.</p>' : ''}</div></div>`;
  }

  function apply() {
    const P = st.prefs, root = document.documentElement, dark = matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = st.theme === 'auto' ? (dark ? 'dark' : 'light') : st.theme;
    const [a, b] = ACCENTS[P.accent] || ACCENTS.orange; root.style.setProperty('--acc', a); root.style.setProperty('--acc2', b);
    document.querySelector('.app')?.classList.toggle('collapsed', P.menu === 'closed');
    document.body && (document.body.style.zoom = { s: .92, m: 1, l: 1.1 }[P.size] || 1);
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (st.theme === 'auto') apply(); });
  window.setPref = (k, v) => { if (k === 'theme') st.theme = v; else if (k === 'goal') st.prefs.goal = +v; else if (k === 'motion') st.prefs.motion = v === '1'; else if (k === 'pyeng') st.prefs.pyeng = v === '1'; else if (k === 'minutes' || k === 'studyDays') st.prefs[k] = +v; else st.prefs[k] = v; save(); apply(); route(); };
  return { profile, settings, apply };
})();
