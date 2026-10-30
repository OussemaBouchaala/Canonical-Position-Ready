// ===== Canonical Academy app
const $ = s => document.querySelector(s);
const LSK = 'ca_state_v1';
const LEVELS = ['Intern', 'Apprentice', 'Pod Wrangler', 'Deployer', 'Cluster Operator', 'Charm Smith', 'MLOps Engineer', 'Kubeflow Hero', 'Canonical-ready 🟠'];

const defaults = () => ({ xp: 0, done: {}, quiz: {}, labs: {}, labXp: {}, yaml: {}, missions: {}, bosses: {}, flash: {}, flashReviews: 0, flags: {}, badges: {}, vids: {}, days: [], tutorQs: 0, theme: 'dark', cur: null, epoch: 0,
  profile: { name: 'Oussema', role: 'Python & Kubernetes Software Engineer @ Canonical (target)', avatar: '🧑‍💻' },
  prefs: { goal: 60, accent: 'orange', size: 'm', motion: true, lessonMode: 'steps', minutes: 60, studyDays: 6, pyeng: true },
  daily: {}, qstats: { answered: 0, correct: 0 }, step: {}, read: {}, checks: {}, notes: {}, grades: {}, qans: {}, picks: {}, pred: {}, yamlIn: {}, tab: {}, simYaml: '' });
let st = defaults();
try { Object.assign(st, JSON.parse(localStorage.getItem(LSK) || '{}')); } catch {}
const SERVER = location.protocol.startsWith('http');
let saveT, syncOk = null, serverRev = null;

// Merge two copies of the progress (this browser + progress.json) without losing anything:
// every completed item from either side is kept. A reset/import sets a newer `epoch`, which wins outright.
const mergeStates = (a, b) => {
  if ((a.epoch || 0) !== (b.epoch || 0)) return { ...defaults(), ...((a.epoch || 0) > (b.epoch || 0) ? a : b) };
  const m = { ...defaults(), ...b, ...a };
  ['xp', 'flashReviews', 'tutorQs'].forEach(k => { m[k] = Math.max(a[k] || 0, b[k] || 0); });
  ['done', 'quiz', 'yaml', 'missions', 'bosses', 'badges', 'flags', 'labXp', 'vids', 'read', 'checks', 'notes', 'grades', 'qans', 'picks', 'pred', 'yamlIn', 'tab', 'labDir'].forEach(k => { m[k] = { ...(b[k] || {}), ...(a[k] || {}) }; });
  m.labs = { ...(b.labs || {}) }; Object.entries(a.labs || {}).forEach(([k, v]) => { m.labs[k] = { ...(m.labs[k] || {}) }; Object.entries(v).forEach(([i, x]) => { m.labs[k][i] = x || !!m.labs[k][i]; }); });
  m.flash = { ...(b.flash || {}) }; Object.entries(a.flash || {}).forEach(([i, c]) => { const o = m.flash[i]; if (!o || (c.t || c.due || 0) >= (o.t || o.due || 0)) m.flash[i] = c; });
  m.days = [...new Set([...(b.days || []), ...(a.days || [])])].sort();
  m.daily = { ...(b.daily || {}) }; Object.entries(a.daily || {}).forEach(([d, v]) => { m.daily[d] = Math.max(v, m.daily[d] || 0); });
  m.step = { ...(b.step || {}) }; Object.entries(a.step || {}).forEach(([k, v]) => { const o = m.step[k]; m.step[k] = !o ? v : { i: v.i, max: Math.max(v.max, o.max) }; });
  const qa = a.qstats || {}, qb = b.qstats || {}; m.qstats = (qa.answered || 0) >= (qb.answered || 0) ? { ...defaults().qstats, ...qa } : { ...defaults().qstats, ...qb };
  return m;
};
const replaceState = n => { Object.keys(st).forEach(k => delete st[k]); Object.assign(st, n); };
// Lab steps ticked before XP was tracked per step already paid their XP: record them so re-ticking can't pay again.
const migrate = () => { const D = defaults(); st.profile = { ...D.profile, ...st.profile }; st.prefs = { ...D.prefs, ...st.prefs }; st.qstats = { ...D.qstats, ...st.qstats };
  ['daily', 'step', 'read', 'checks', 'notes', 'grades', 'vids', 'qans', 'picks', 'pred', 'yamlIn', 'tab', 'labDir'].forEach(k => { st[k] = st[k] || {}; }); st.labXp = st.labXp || {}; Object.entries(st.labs || {}).forEach(([k, v]) => Object.entries(v).forEach(([i, x]) => { if (x) st.labXp[k + ':' + i] = 1; })); };
migrate();

function push() {
  return fetch('/api/progress', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ state: st, baseRev: serverRev }) })
    .then(async r => {
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { replaceState(mergeStates(st, j.state || {})); migrate(); serverRev = j.rev; try { localStorage.setItem(LSK, JSON.stringify(st)); } catch {} renderSide(); return push(); }
      syncOk = r.ok; if (r.ok) serverRev = j.rev;
    }).catch(() => { syncOk = false; });
}
const save = () => { try { localStorage.setItem(LSK, JSON.stringify(st)); } catch {}
  if (SERVER && serverRev !== null) { clearTimeout(saveT); saveT = setTimeout(push, 400); } };
if (!st.start) st.start = new Date().toISOString().slice(0, 10);
// ---------- study plan: every lesson and boss laid out on study days from your time budget (Settings → Learning)
// Estimated time per lesson = reading the steps twice as long as the "min" figure, + 15 min for quiz & video, + lab time.
// Lab steps take 10 min unless LAB_MIN gives a realistic figure (installs, tutorials, PRs and mock interviews take hours).
const LAB_MIN = { l1: [30, 20], l3: [15], p1: [30, 10, 20], p3: [20, 15], p4: [25, 5], c1: [30], c2: [25, 15, 10, 20], c3: [30], k1: [30],
  k5: [15, 15, 15], a2: [40, 15], a3: [25, 15], a4: [20], a5: [30, 25], m1: [20], m2: [20, 25], m3: [180, 90, 30, 45], m4: [60],
  j1: [40, 40], j2: [300, 120, 60, 30], j3: [45], o1: [60, 150, 240], x1: [30, 45, 45], x2: [90, 20],
  e1: [40, 30, 30], e2: [30, 40, 15], e3: [45, 30], e4: [30, 10, 60], e5: [20, 45, 10, 60], e6: [120, 60, 30] };
const lessonMins = l => Math.round(l.min * 2 + 15 + (l.lab ? l.lab.steps.reduce((s, _, i) => s + ((LAB_MIN[l.id] || [])[i] || 10), 0) : 0)), BOSS_MIN = 20;
const REVIEW_MIN = 10; // kept out of each study day for the daily flashcard review
const newMins = () => Math.max(20, (+st.prefs.minutes || 60) - REVIEW_MIN);
const inPlan = t => t.id !== 'pyeng' || st.prefs.pyeng !== false;
function plan() {
  const per = newMins(), dpw = +st.prefs.studyDays || 6, start = new Date(st.start + 'T00:00');
  const studyDay = n => { const d = new Date(start); d.setDate(d.getDate() + 7 * Math.floor(n / dpw) + n % dpw); return d; };
  let used = 0;
  const items = TRACKS.filter(inPlan).flatMap(t => [...t.lessons.map(l => ({ id: l.id, l: { ...l, track: t }, t, mins: lessonMins(l), done: !!st.done[l.id] })),
    { id: 'boss_' + t.id, boss: true, t, mins: BOSS_MIN, done: !!st.bosses[t.id] }])
    .map(it => { const s = used; used += it.mins; const endDay = Math.ceil(used / per) - 1; return { ...it, week: Math.floor(Math.floor(s / per) / dpw), end: studyDay(endDay) }; });
  const days = Math.ceil(used / per);
  return { items, per, dpw, totalMin: used, days, weeks: Math.ceil(days / dpw), end: studyDay(days - 1), studyDay };
}
const fmtDate = (d, y) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(y ? { year: 'numeric' } : {}) });
const weekDates = (P, w) => { const d = P.studyDay(w * P.dpw), e = new Date(d); e.setDate(e.getDate() + 6); return fmtDate(d) + ' – ' + fmtDate(e); };
const pace = () => { const P = plan(), today = new Date(new Date().toDateString()); const expected = P.items.filter(i => i.end < today).length, done = P.items.filter(i => i.done).length; return { done, expected, total: P.items.length, diff: done - expected }; };

// ---------- derived
const allLessons = () => TRACKS.flatMap(t => t.lessons.map(l => ({ ...l, track: t })));
const trackPct = t => Math.round(100 * (t.lessons.filter(l => st.done[l.id]).length + (st.bosses[t.id] ? 1 : 0)) / (t.lessons.length + 1));
const trackDone = id => { const t = TRACKS.find(x => x.id === id); return t.lessons.every(l => st.done[l.id]) && !!st.bosses[t.id]; };
const level = () => { const i = Math.min(LEVELS.length - 1, Math.floor(Math.sqrt(st.xp / 120))); const lo = 120 * i * i, hi = 120 * (i + 1) * (i + 1); return { i, name: LEVELS[i], pct: Math.min(100, 100 * (st.xp - lo) / (hi - lo)), next: hi }; };
const streak = () => { const set = new Set(st.days); let n = 0; const d = new Date(); for (;;) { const k = d.toISOString().slice(0, 10); if (set.has(k)) { n++; d.setDate(d.getDate() - 1); } else break; } return n; };
const reqPct = r => Math.round(r.tracks.reduce((s, id) => s + trackPct(TRACKS.find(t => t.id === id)), 0) / r.tracks.length);
// Starting points come from your CV (Octomiro CV/ML pipelines, Bit & Books full-stack + CI/CD, Yonnov'IA data pipelines); they grow with each finished track.
JOB.base = { py: 60, linux: 30, mlops: 40, quality: 25, app: 20, k8s: 5, canon: 0, dist: 5, oss: 0 };
const reqScore = (job, r) => Math.round(Math.max(job.base[r.id] || 0, (job.base[r.id] || 0) + (100 - (job.base[r.id] || 0)) * reqPct(r) / 100));
const matchFor = job => { const v = job.reqs.map(r => reqScore(job, r)); return Math.round(v.reduce((a, b) => a + b) / v.length); };
const match = () => matchFor(JOB);
const summary = () => ({ doneCount: Object.keys(st.done).length, trackDone, missions: Object.keys(st.missions).length, flags: st.flags, bosses: Object.keys(st.bosses).length, flashReviews: st.flashReviews, streak: streak(), tutorQs: st.tutorQs, match: match() });

// ---------- gamification
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = msg; document.body.append(t); setTimeout(() => t.remove(), 2600); }
function confetti() {
  if (st.prefs && !st.prefs.motion) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; c.width = innerWidth; c.height = innerHeight; document.body.append(c);
  const x = c.getContext('2d'), P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 3, vx: (Math.random() - .5) * 14, vy: Math.random() * -12 - 2, c: ['#e95420', '#3ecf8e', '#4f8cff', '#f5c542', '#b46cff'][Math.floor(Math.random() * 5)], s: 4 + Math.random() * 5 }));
  let f = 0; (function tick() { x.clearRect(0, 0, c.width, c.height); P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .35; x.fillStyle = p.c; x.fillRect(p.x, p.y, p.s, p.s); }); if (++f < 110) requestAnimationFrame(tick); else c.remove(); })();
}
function gain(n, why) {
  const before = level().i; st.xp += n;
  const today = new Date().toISOString().slice(0, 10); if (!st.days.includes(today)) st.days.push(today);
  const goalBefore = (st.daily[today] || 0) >= st.prefs.goal; st.daily[today] = (st.daily[today] || 0) + n;
  if (!goalBefore && st.daily[today] >= st.prefs.goal) setTimeout(() => toast(`🎯 Daily goal reached: ${st.prefs.goal} XP today!`), 1800);
  save(); toast(`+${n} XP · ${why}`);
  if (level().i > before) { setTimeout(() => toast(`⬆️ Level up! You are now <b>${level().name}</b>`), 900); confetti(); }
  checkBadges(); renderSide();
}
function checkBadges() { const s = summary(); BADGES.forEach(b => { if (!st.badges[b.id] && b.test(s)) { st.badges[b.id] = Date.now(); save(); setTimeout(() => { toast(`${b.e} Badge unlocked: <b>${b.t}</b>`); confetti(); }, 1400); } }); }

// ---------- sidebar
function renderSide() {
  const L = level(), r = location.hash.split('/')[0] || '#home';
  $('#side').innerHTML = `<div class="brand"><div class="logo">◉</div>Canonical Academy</div>
  <nav class="nav">${[['#home', '🏠', 'Dashboard'], ['#road', '🗺️', 'Roadmap'], ['#sim', '☸️', 'K8s Simulator'], ['#flash', '🃏', 'Flashcards'], ['#match', '🎯', 'Job match'], ['#badges', '🏅', 'Badges']]
    .map(([h, i, t]) => `<a href="${h}" class="${r === h ? 'on' : ''}">${i} ${t}</a>`).join('')}</nav>
  <h3 style="font-size:13px;color:var(--mut);margin:18px 6px 6px">TRACKS</h3>
  <nav class="nav">${TRACKS.map(t => `<a href="#track/${t.id}" class="${location.hash.includes(t.id) ? 'on' : ''}">${t.icon} <span style="flex:1">${t.title.split(':')[0].split('(')[0]}</span><span class="pill">${trackPct(t)}%</span></a>`).join('')}</nav>`;
  renderTop(L);
}
// Top bar: menu toggle on the left, XP / streak and the profile button on the right
function renderTop(L = level()) {
  const menuOpen = $('#pmenu')?.classList.contains('open');
  $('#top').innerHTML = `<button class="ghost icon" id="menuBtn" onclick="toggleMenu()" title="Show / hide the menu" aria-label="Toggle menu">☰</button>
    <b class="top-brand">◉ Canonical Academy</b><span style="flex:1"></span>
    <span class="chip-s" title="Total XP">⚡ ${st.xp}</span><span class="chip-s" title="Day streak">🔥 ${streak()}</span>
    <div class="pwrap"><button class="avbtn" id="avBtn" onclick="document.getElementById('pmenu').classList.toggle('open')" title="${escH(st.profile.name)}" aria-label="Profile menu">${st.profile.avatar}</button>
      <div class="pmenu ${menuOpen ? 'open' : ''}" id="pmenu"><div class="pm-head"><span class="av">${st.profile.avatar}</span><div><b>${escH(st.profile.name)}</b><div class="req">Lv ${L.i + 1} · ${L.name}</div></div></div>
        <div class="bar"><i style="width:${L.pct}%"></i></div><div class="stats"><span>⚡ ${st.xp} XP</span><span>🔥 ${streak()} day${streak() === 1 ? '' : 's'}</span><span>🎯 ${match()}%</span></div>
        <a href="#profile">👤 My profile</a><a href="#settings">⚙️ Settings</a><a href="#badges">🏅 Badges</a>
        <button class="ghost" onclick="setPref('theme', document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')">${document.documentElement.dataset.theme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode'}</button></div></div>`;
}
// ☰ hides the menu on wide screens (remembered) and slides it in on phones
function toggleMenu() {
  if (innerWidth <= 900) return $('#side').classList.toggle('open');
  st.prefs.menu = st.prefs.menu === 'closed' ? 'open' : 'closed'; save(); $('.app').classList.toggle('collapsed', st.prefs.menu === 'closed');
}

// ---------- views
const V = {};
V.home = () => {
  const next = plan().items.find(i => !i.boss && !i.done)?.l || allLessons().find(l => !st.done[l.id]);
  const s = summary();
  const td = st.daily[new Date().toISOString().slice(0, 10)] || 0, gp = Math.min(100, Math.round(100 * td / st.prefs.goal));
  return `<h1>Welcome back, ${escH(st.profile.name)} ${st.profile.avatar}</h1><p class="sub">Target: <a href="${JOB.url}" target="_blank">${JOB.title}</a> @ Canonical</p>
  <div class="grid g4">
    <div class="card"><div class="kpi">${match()}%<small> job match</small></div><div class="bar"><i style="width:${match()}%"></i></div></div>
    <div class="card"><div class="kpi">${s.doneCount}<small>/${allLessons().length} lessons</small></div></div>
    <div class="card"><div class="kpi">${pace().diff >= 0 ? '+' : ''}${pace().diff}<small> vs plan</small></div><div class="req">${s.missions}/${Object.keys(MISSIONS).length} sim missions</div></div>
    <div class="card"><div class="kpi">${td}<small>/${st.prefs.goal} XP today</small></div><div class="bar"><i style="width:${gp}%"></i></div><div class="req">${gp >= 100 ? '🎯 Daily goal done!' : 'Daily goal'} · <a href="#profile">profile</a></div></div></div>
  ${next ? `<div class="card" style="margin-top:16px;border-color:var(--acc)"><span class="pill acc">Up next</span><h2 style="margin:8px 0">${next.track.icon} ${next.title}</h2>
    <p class="sub" style="margin:0 0 12px">${next.track.title} · ⏱ ${next.min} min · ⚡ ${next.xp} XP</p><button class="pri" onclick="location.hash='#lesson/${next.id}'">Continue ▶</button></div>` : `<div class="card"><h2>🏆 All lessons complete. Go apply!</h2></div>`}
  <h2>Daily quest</h2><div class="grid g3">
    <div class="card"><h3>🃏 Review 10 flashcards</h3><p class="sub">Spaced repetition locks concepts in.</p><button onclick="location.hash='#flash'">Review</button></div>
    <div class="card"><h3>☸️ One simulator mission</h3><p class="sub">Type real kubectl, watch the cluster react.</p><button onclick="location.hash='#sim'">Play</button></div>
    <div class="card"><h3>🤖 Explain it back</h3><p class="sub">Ask Kube to grade your explanation of today's concept.</p><button onclick="TUT.open('I will explain the last concept I learned in my own words. Grade my explanation and fix gaps: ')">Open tutor</button></div></div>
  <h2>Your tracks</h2><div class="grid g3">${TRACKS.map(trackCard).join('')}</div>`;
};
const trackCard = t => `<div class="card track" onclick="location.hash='#track/${t.id}'"><div class="top"><span class="ic">${t.icon}</span><span class="pill ${trackPct(t) === 100 ? 'ok' : ''}">${trackPct(t)}%</span></div>
  <h3 style="margin:8px 0 4px">${t.title}</h3><div class="bar"><i style="width:${trackPct(t)}%"></i></div><div class="req">🎯 ${t.req}</div></div>`;

V.road = () => {
  const P = plan(), weeks = [];
  P.items.forEach(it => (weeks[it.week] = weeks[it.week] || []).push(it));
  let curSet = false; const p = pace();
  return `<h1>🗺️ Roadmap: zero → Canonical-ready</h1>
  <p class="sub">${P.weeks} weeks at ${st.prefs.minutes} min/day (${P.per} new + ${REVIEW_MIN} flashcard review), ${P.dpw} days/week (about ${Math.round(P.totalMin / 60)} h in total) · ${fmtDate(P.studyDay(0), 1)} → ${fmtDate(P.end, 1)} · <a href="#settings">change your time budget</a></p>
  <div class="card" style="margin-bottom:16px;border-color:${p.diff >= 0 ? 'var(--ok)' : 'var(--warn)'}"><b>${p.diff >= 0 ? '✅ On track' : '⏳ Behind'}</b>: ${p.done}/${p.total} items done, plan expects ${p.expected} by today (${p.diff >= 0 ? '+' + p.diff + ' ahead' : -p.diff + ' behind'}).</div>
  <div class="road">${weeks.map((its, w) => { const pct = Math.round(100 * its.filter(i => i.done).length / its.length);
    const cls = pct === 100 ? 'done' : !curSet ? (curSet = true, 'cur') : '';
    const tracks = [...new Set(its.map(i => i.t))];
    return `<div class="stop ${cls}"><div class="dot">${pct === 100 ? '✓' : w + 1}</div><div class="card"><div class="top" style="display:flex;justify-content:space-between;gap:8px"><b>Week ${w + 1} <span class="pill">${weekDates(P, w)}</span> ${tracks.map(t => t.icon + ' ' + t.title.split(':')[0].split('(')[0].trim()).join(' · ')}</b><span class="pill">${pct}%</span></div>
      <div class="wk-items">${its.map(i => i.boss ? `<a href="#boss/${i.t.id}" class="${i.done ? 'ok' : ''}">${i.done ? '✅' : '👹'} Boss: ${i.t.title.split(':')[0]}</a>` : `<a href="#lesson/${i.id}" class="${i.done ? 'ok' : ''}">${i.done ? '✅' : '○'} ${i.l.title} <span class="req">~${i.mins} min</span></a>`).join('')}</div></div></div>`; }).join('')}
  <div class="stop"><div class="dot">🏁</div><div class="card"><b>Apply</b> once job match ≥ 85% and your flagship repo, one charm and your PRs are public: <a href="${JOB.url}" target="_blank">${JOB.title}</a>${inPlan({ id: 'pyeng' }) ? ` and/or <a href="${JOB2.url}" target="_blank">${JOB2.title}</a>` : ''}.</div></div></div>`;
};

V.track = id => {
  const t = TRACKS.find(x => x.id === id); if (!t) return V.home();
  return `<p><a href="#road">← Roadmap</a></p><h1>${t.icon} ${t.title}</h1><p class="sub">${t.intro}</p><div class="callout job">🎯 Job requirement: ${t.req}</div>
  <div class="road">${t.lessons.map((l, i) => { const done = st.done[l.id], cur = !done && t.lessons.slice(0, i).every(x => st.done[x.id]);
    return `<div class="stop ${done ? 'done' : cur ? 'cur' : ''}"><div class="dot">${done ? '✓' : i + 1}</div><div class="card track" onclick="location.hash='#lesson/${l.id}'">
      <div class="top"><b>${l.title}</b><span class="pill">⚡ ${l.xp}</span></div><div class="req">⏱ ${l.min} min · ${['📖 Learn', l.diagram && '📊 Diagram', '🎬 Videos', '❓ Quiz', l.yaml && '🧩 YAML puzzle', l.mission && '🎮 Mission', '🛠️ Lab'].filter(Boolean).join(' · ')}</div></div></div>`; }).join('')}
  <div class="stop ${st.bosses[t.id] ? 'done' : ''}"><div class="dot">👹</div><div class="card track" onclick="location.hash='#boss/${t.id}'"><div class="top"><b>Boss battle: prove the track</b><span class="pill acc">⚡ 150</span></div><div class="req">${t.boss.length} hard questions · need 80% · 3 lives</div></div></div></div>`;
};

let lessonTab = 'learn';
V.lesson = id => {
  const l = allLessons().find(x => x.id === id); if (!l) return V.home(); st.cur = id; save();
  const tabs = [['learn', '📖 Learn'], ['watch', '🎬 Watch & read'], ['quiz', '❓ Quiz'], l.yaml && ['yaml', '🧩 YAML puzzle'], l.mission && ['mission', '🎮 Simulator'], ['lab', '🛠️ Real lab']].filter(Boolean);
  if (!tabs.find(t => t[0] === lessonTab)) lessonTab = 'learn';
  return `<p><a href="#track/${l.track.id}">← ${l.track.title}</a></p><div class="lesson-head"><div><h1>${l.title}</h1><p class="sub">${l.track.icon} ${l.track.title} · ⏱ ${l.min} min · ⚡ ${l.xp} XP ${st.done[id] ? '· <span class="pill ok">completed</span>' : ''}</p></div>
  <button onclick="TUT.open('Explain the lesson \\'${l.title.replace(/'/g, '')}\\' to me simply, with an analogy, then check my understanding with one question.')">🤖 Ask Kube about this</button></div>
  <div class="tabs">${tabs.map(([k, n]) => `<button class="${k === lessonTab ? 'on' : ''}" onclick="lessonTab='${k}';st.tab['${l.id}']='${k}';save();route()">${n}</button>`).join('')}</div>
  <div class="content" id="lc">${tabView(l)}</div>${nav(l)}`;
};
function nav(l) { const all = allLessons(), i = all.findIndex(x => x.id === l.id); return `<div style="display:flex;justify-content:space-between;margin-top:30px">${i > 0 ? `<button onclick="lessonTab='learn';location.hash='#lesson/${all[i - 1].id}'">← ${all[i - 1].title}</button>` : '<span></span>'}${i < all.length - 1 ? `<button onclick="lessonTab='learn';location.hash='#lesson/${all[i + 1].id}'">${all[i + 1].title} →</button>` : ''}</div>`; }
function tabView(l) {
  if (lessonTab === 'learn') return Learn.view(l);
  if (lessonTab === 'watch') { setTimeout(() => loadVideos(l), 0); return `<h3>Videos</h3>${l.videos.map((v, i) => `<div class="vslot card" id="vs_${l.id}_${i}"><h3>🎬 ${v.l}</h3><p class="req">Finding videos…</p></div>`).join('')}
    <h3>Official docs</h3>${l.docs.map(d => `<a class="vid" target="_blank" href="${d.u}"><div class="play" style="background:var(--k8s)">📘</div><div><b>${d.t}</b><div class="req">${d.u}</div></div></a>`).join('') || '<p class="sub">—</p>'}`; }
  if (lessonTab === 'quiz') return quizHTML(l.quiz, 'q_' + l.id);
  if (lessonTab === 'yaml') return yamlHTML(l);
  if (lessonTab === 'mission') return simHTML(l.mission);
  if (lessonTab === 'lab') return labHTML(l);
}

// ---------- embedded videos: server.py searches YouTube and returns only videos that allow embedding
const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const VIDS = {};
function loadVideos(l) {
  l.videos.forEach(async (v, i) => {
    const key = `${l.id}:${i}`; VIDS[key] = { v, lid: l.id, i, list: [], err: '' };
    if (!SERVER) VIDS[key].err = 'Embedded videos need the app started with ./start.sh.';
    else try { const r = await fetch('/api/videos?q=' + encodeURIComponent(v.q)); const j = await r.json(); if (!r.ok) throw new Error(j.error || r.status); VIDS[key].list = j.videos; }
    catch (e) { VIDS[key].err = 'Could not load videos: ' + e.message; }
    renderSlot(key);
  });
}
function renderSlot(key) {
  const S = VIDS[key]; const el = S && $(`#vs_${S.lid}_${S.i}`); if (!el) return;
  const picked = st.vids[key], list = S.list;
  const cur = list.find(x => x.id === picked) || (picked ? { id: picked, title: 'Your video', channel: '' } : list[0]);
  const search = `<a href="${yt(S.v.q)}" target="_blank" rel="noopener">Search YouTube ↗</a>`;
  const own = `<button onclick="vidOwn('${key}')">🔗 Use my own link</button>`;
  if (!cur) { el.innerHTML = `<h3>🎬 ${S.v.l}</h3><p class="req">${escH(S.err || 'No embeddable video found.')}</p><div class="vacts">${search}${own}</div>`; return; }
  const info = [cur.channel, cur.length, cur.views, cur.age].filter(Boolean).map(escH).join(' · ');
  el.innerHTML = `<h3>🎬 ${S.v.l}</h3>
    <div class="vplayer" id="vp_${key.replace(':', '_')}"><button class="vthumb" onclick="vidPlay('${key}','${cur.id}')" aria-label="Play ${escH(cur.title)}"><img src="https://i.ytimg.com/vi/${cur.id}/hqdefault.jpg" alt="" loading="lazy"><span class="vbig">▶</span></button></div>
    <div class="vmeta"><b>${escH(cur.title)}</b><div class="req">${info}</div></div>
    ${list.length > 1 ? `<div class="req" style="margin-top:10px">Other videos for this topic:</div><div class="valts">${list.filter(x => x.id !== cur.id).map(x => `<button class="valt" onclick="vidPick('${key}','${x.id}')" title="${escH(x.title)}"><img src="https://i.ytimg.com/vi/${x.id}/mqdefault.jpg" alt="" loading="lazy"><span>${escH(x.title)}</span><small>${escH([x.channel, x.length].filter(Boolean).join(' · '))}</small></button>`).join('')}</div>` : ''}
    <div class="vacts"><a href="https://www.youtube.com/watch?v=${cur.id}" target="_blank" rel="noopener">Open on YouTube ↗</a>${search}${own}</div>`;
}
window.vidPlay = (key, id) => { const p = $('#vp_' + key.replace(':', '_')); if (p) p.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`; };
window.vidPick = (key, id) => { st.vids[key] = id; save(); renderSlot(key); };
window.vidOwn = key => { const u = prompt('Paste a YouTube link for this topic:'); if (!u) return; const m = u.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/) || u.trim().match(/^([\w-]{11})$/); if (!m) return toast('❌ Not a YouTube link'); vidPick(key, m[1]); };

// ---------- quiz engine
const QZ = {};
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function quizHTML(qs, key, boss) {
  // Options are shuffled on every render, so the right answer is never in a predictable position.
  // Button ids keep the ORIGINAL option (and question) index, so saved answers and highlighting still match.
  // Your answers are saved (st.qans), so leaving the page and coming back shows the quiz as you left it.
  const ans = { ...(st.qans[key] || {}) }, wrong = Object.entries(ans).filter(([i, j]) => qs[i] && j !== qs[i].a).length;
  QZ[key] = { qs, ans, boss, lives: 3 - wrong, over: boss && wrong >= 3 };
  const order = boss ? shuffle(qs.map((_, i) => i)) : qs.map((_, i) => i), done = Object.keys(ans).length;
  return `${boss ? `<div class="card" style="margin-bottom:14px">❤️ <span id="lives_${key}">${hearts(QZ[key].lives)}</span> · need 80% to win</div>` : ''}
    ${done && done < qs.length && !QZ[key].over ? `<p class="req">↩️ You answered ${done}/${qs.length}. Carry on where you left off, or <a href="#" onclick="quizRetry('${key}');return false">start over</a>.</p>` : ''}
    ${order.map((i, n) => { const q = qs[i], a = ans[i], got = a !== undefined; return `<div class="q card"><b>${n + 1}. ${q.q}</b>${shuffle(q.o.map((o, j) => [o, j])).map(([o, j]) => `<button class="opt ${got && j === q.a ? 'right' : ''} ${got && j === a && a !== q.a ? 'wrong' : ''}" id="${key}_${i}_${j}" onclick="answer('${key}',${i},${j})" ${got || QZ[key].over ? 'disabled' : ''}>${o}</button>`).join('')}<div id="${key}_e${i}">${got ? `<div class="expl">${a === q.a ? '✅' : '❌'} ${q.e}</div>` : ''}</div></div>`; }).join('')}
    <div id="${key}_res">${quizResult(key)}</div>`;
}
const hearts = n => '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(3 - Math.max(0, n));
window.quizRetry = key => { delete st.qans[key]; save(); route(); };
function quizResult(key) {
  const Q = QZ[key], retry = `<button onclick="quizRetry('${key}')">🔁 Retry</button>`;
  if (Q.over) return `<div class="card" style="border-color:var(--bad)"><h3>💀 Out of lives</h3><p>Review the lessons and try again.</p>${retry}</div>`;
  if (Object.keys(Q.ans).length < Q.qs.length) return '';
  const score = Q.qs.filter((q, k) => Q.ans[k] === q.a).length, pass = score / Q.qs.length >= (Q.boss ? .8 : .7);
  return `<div class="card" style="border-color:${pass ? 'var(--ok)' : 'var(--warn)'}"><h3>${pass ? '🎉 Passed' : '🔁 Almost'}: ${score}/${Q.qs.length}</h3>${pass ? `<p class="req">Saved. Practice again any time (XP is only given once).</p>${retry}` : `<p>Need ${Q.boss ? 80 : 70}%. Re-read and retry.</p>${retry}`}</div>`;
}
window.answer = (key, i, j) => {
  const Q = QZ[key]; if (Q.ans[i] !== undefined || Q.over) return; const q = Q.qs[i]; Q.ans[i] = j; st.qans[key] = { ...Q.ans }; st.qstats.answered++; if (j === q.a) st.qstats.correct++;
  document.querySelectorAll(`[id^="${key}_${i}_"]`).forEach(b => b.disabled = true);
  $(`#${key}_${i}_${q.a}`).classList.add('right'); if (j !== q.a) { $(`#${key}_${i}_${j}`).classList.add('wrong'); if (Q.boss) { Q.lives--; $('#lives_' + key).textContent = hearts(Q.lives); } }
  $(`#${key}_e${i}`).innerHTML = `<div class="expl">${j === q.a ? '✅' : '❌'} ${q.e}</div>`;
  if (Q.boss && Q.lives <= 0) Q.over = true;
  $(`#${key}_res`).innerHTML = quizResult(key);
  const score = Q.qs.filter((q, k) => Q.ans[k] === q.a).length;
  if (!Q.over && Object.keys(Q.ans).length === Q.qs.length && score / Q.qs.length >= (Q.boss ? .8 : .7)) {
    if (Q.boss) { const tid = key.slice(5); if (!st.bosses[tid]) { st.bosses[tid] = 1; gain(150, 'Boss defeated 👑'); confetti(); } }
    else { const id = key.slice(2); if (!st.done[id]) { st.done[id] = Date.now(); const l = allLessons().find(x => x.id === id); gain(l.xp, 'Lesson complete'); } }
    renderSide();
  }
  save();
};
V.boss = id => { const t = TRACKS.find(x => x.id === id); return `<p><a href="#track/${id}">← ${t.title}</a></p><h1>👹 Boss battle: ${t.title}</h1><p class="sub">${st.bosses[id] ? '✅ Already defeated. Replay for practice.' : 'Defeat it to complete the track.'}</p>${quizHTML(t.boss, 'boss_' + id, true)}`; };

// ---------- YAML puzzle
function yamlHTML(l) {
  const y = l.yaml; let i = 0; const answers = [];
  const html = y.tpl.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])).replace(/\[\[(.+?)\]\]/g, (_, a) => { answers.push(a); return `<input data-i="${i}" size="${Math.max(6, a.length + 1)}" id="y_${l.id}_${i}" placeholder="?" value="${escH((st.yamlIn[l.id] || [])[i] || '')}" class="${st.yaml[l.id] ? 'ok' : ''}" oninput="yamlKeep('${l.id}',${i++},this.value)">`; });
  window['YA_' + l.id] = answers; window['YT_' + l.id] = y.tpl.replace(/\[\[|\]\]/g, '');
  return `<h3>🧩 ${y.title}</h3><p class="sub">Fill the blanks with the right Kubernetes keywords. Case matters, as in real YAML.</p><div class="yamlp">${html}</div>
  <p><button class="pri" onclick="checkYaml('${l.id}')">Check</button> <button onclick="TUT.open('Explain every line of this manifest:\\n'+window.YT_${l.id})">🤖 Explain each line</button></p><div id="yres">${st.yaml[l.id] ? '<div class="callout tip">✅ Solved. Your answers are saved.</div>' : ''}</div>`;
}
let yT; window.yamlKeep = (id, i, v) => { (st.yamlIn[id] = st.yamlIn[id] || [])[i] = v; clearTimeout(yT); yT = setTimeout(save, 600); };
window.checkYaml = id => { const A = window['YA_' + id]; let ok = 0; A.forEach((a, i) => { const e = $(`#y_${id}_${i}`); const good = e.value.trim() === a; e.className = good ? 'ok' : 'bad'; ok += good; });
  $('#yres').innerHTML = ok === A.length ? '<div class="callout tip">✅ Perfect manifest!</div>' : `<div class="callout">${ok}/${A.length} correct. Red ones need fixing.</div>`;
  if (ok === A.length && !st.yaml[id]) { st.yaml[id] = 1; gain(25, 'YAML puzzle solved'); } };

// ---------- lab
function labHTML(l) {
  const key = l.id, done = st.labs[key] || {};
  return `${RUN.folder(key)}<h3>🛠️ ${l.lab.title}</h3><p class="sub">Do this in a terminal on your Ubuntu machine${RUN.needs(key) ? ', inside your project folder' : ''}. Tick each step when done: +10 XP each.</p>
  ${l.lab.steps.map((s, i) => `<label class="step ${done[i] ? 'done' : ''}"><input type="checkbox" ${done[i] ? 'checked' : ''} onchange="labTick('${key}',${i},this.checked)"><div style="flex:1"><b>${s.t}</b>${s.c ? `<pre>${s.c.replace(/</g, '&lt;')}</pre><button style="font-size:12px;padding:3px 10px" onclick="event.preventDefault();navigator.clipboard.writeText(${JSON.stringify(s.c).replace(/"/g, '&quot;')});toast('Copied')">📋 copy</button> ${RUN.btn(s.c, `${key}_${i}`, key)}` : ''}</div></label>`).join('')}
  ${RUN.shell(key)}
  <div class="callout tip">Stuck? Paste the error into the 🤖 tutor: "I ran X and got Y".</div>`;
}
window.labTick = (k, i, v) => { st.labs[k] = st.labs[k] || {}; st.labs[k][i] = v; const paid = st.labXp[k + ':' + i]; if (v && !paid) st.labXp[k + ':' + i] = 1; save(); if (v && !paid) gain(10, 'Lab step'); route(); };

// ---------- simulator
let curMission = null;
const SIM_YAML = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: cvapi
  namespace: dev
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cvapi
  template:
    metadata:
      labels:
        app: cvapi
    spec:
      containers:
      - name: api
        image: ghcr.io/oussema/cvapi:0.1.0
---
apiVersion: v1
kind: Service
metadata:
  name: cvapi
  namespace: dev
spec:
  selector:
    app: cvapi
  ports:
  - port: 80
    targetPort: 8000`;
function simHTML(mid) {
  curMission = mid || null;
  setTimeout(bootSim, 0);
  const ms = mid ? [mid] : Object.keys(MISSIONS);
  return `<div class="sim"><div><div class="term"><div class="out" id="tout"></div><div class="in"><span>oussema@ubuntu:~$</span><input id="tin" autocomplete="off" spellcheck="false" placeholder="kubectl get nodes   (type help)"></div></div>
    <div class="chips">${['kubectl get pods -o wide', 'kubectl get deploy', 'kubectl get svc', 'kubectl get events', 'help'].map(c => `<button onclick="simRun('${c}')">${c}</button>`).join('')}</div>
    <details style="margin-top:8px"><summary>📝 YAML editor (use <code>kubectl apply -f editor</code>)</summary><textarea id="simYaml" rows="14" class="mono" style="margin-top:8px" oninput="st.simYaml=this.value;clearTimeout(yT);yT=setTimeout(save,600)">${escH(st.simYaml || SIM_YAML)}</textarea></details></div>
    <div><div class="cluster" id="cview"></div></div></div>
  <h3>🎮 Missions</h3><div class="missions" id="mlist">${ms.map(m => missionHTML(m)).join('')}</div>`;
}
function missionHTML(m) { const M = MISSIONS[m]; return `<div class="card" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center"><b>${st.missions[m] ? '✅' : '🎯'} ${M.t}</b>${M.setup ? `<button onclick="Sim.reset('${M.setup}');simLog('<span class=t-hl>Scenario loaded: something is broken…</span>')">Load scenario</button>` : ''}</div>
  ${M.goals.map((g, i) => `<div class="m ${goalOk(g.k) ? 'ok' : ''}" id="g_${m}_${i}">${goalOk(g.k) ? '✅' : '⬜'} ${g.d}</div>`).join('')}</div>`; }
const simDone = { cmds: new Set(), flags: {} };
const sticky = new Set();
function goalOk(k) { if (sticky.has(k)) return true; const r = goalOk2(k); if (r) sticky.add(k); return r; }
function goalOk2(k) {
  const S = Sim.state && Sim.state(); if (!S) return false; const [t, a, b] = k.split(':');
  if (t === 'cmd') return [...simDone.cmds].some(c => { const w = c.split(' '); return a.split(' ').every(tok => w.includes(tok) || w.includes(tok.replace(/s$/, ''))); });
  if (t === 'deploy') return S.deploys.some(d => d.name === a && d.replicas === +b);
  if (t === 'exists') return a === 'deploy' ? S.deploys.some(d => d.name === b) : a === 'svc' ? S.svcs.some(s => s.name === b) : a === 'ns' ? S.ns.includes(b) : a === 'cm' ? S.cms.some(c => c.name === b) : false;
  if (t === 'flag') return !!simDone.flags[a];
  if (t === 'fixed') return !!simDone.flags['fixed_' + a];
}
function refreshMissions() {
  (curMission ? [curMission] : Object.keys(MISSIONS)).forEach(m => { const M = MISSIONS[m]; let all = true;
    M.goals.forEach((g, i) => { const ok = goalOk(g.k); all = all && ok; const el = $(`#g_${m}_${i}`); if (el) { el.className = 'm ' + (ok ? 'ok' : ''); el.innerHTML = (ok ? '✅ ' : '⬜ ') + g.d; } });
    if (all && !st.missions[m]) { st.missions[m] = 1; save(); gain(40, `Mission "${M.t}" complete 🎮`); confetti(); } });
}
const simLog = h => { const o = $('#tout'); if (!o) return; o.innerHTML += h + '\n'; o.scrollTop = 1e9; };
window.simRun = c => { const i = $('#tin'); if (i) { i.value = c; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' })); } };
function renderCluster() {
  const v = $('#cview'); if (!v) return; const S = Sim.state();
  v.innerHTML = `<b>Cluster: uk8s</b> <span class="pill">control plane ✓</span><div class="req">Live view: pods appear, die and resurrect as you type.</div>` +
    Sim.NODES.map(n => `<div class="node"><b>🖥️ ${n}</b><div class="pods">${S.pods.filter(p => p.node === n).map(p => `<span class="pod ${p.status === 'Running' ? '' : p.status === 'Terminating' ? 'term' : /BackOff/.test(p.status) ? 'crash' : 'pending'}" title="${p.ns}/${p.name} · ${p.status} · ${p.image}">${p.ns === 'kube-system' ? '⚙ ' : ''}${p.name.split('-').slice(0, 1)}·${p.name.slice(-3)}</span>`).join('')}</div></div>`).join('') +
    (S.svcs.length ? `<b>Services</b>` + S.svcs.map(s => { const n = S.pods.filter(p => p.ns === s.ns && p.status === 'Running' && p.labels.app === s.selector.app).length; return `<div class="svc">🔀 ${s.ns}/${s.name} :${s.port} → ${n} pod${n === 1 ? '' : 's'} ${n ? '' : '⚠️'}</div>`; }).join('') : '') +
    `<div style="margin-top:10px"><b>Namespaces</b> ${S.ns.map(n => `<span class="pill">${n}</span>`).join(' ')}</div>`;
  refreshMissions();
}
let simBooted = false;
function bootSim() {
  Sim.render = renderCluster;
  Sim.onEvent = (t, x) => { if (t === 'cmd') simDone.cmds.add(x); if (t === 'healed') { simDone.flags.healed = 1; if (!st.flags.healed) { st.flags.healed = 1; save(); checkBadges(); } setTimeout(refreshMissions, 2500); }
    if (t === 'rolled') simDone.flags.rolled = 1; if (t === 'undo') simDone.flags.undo = 1; if (t === 'applied') simDone.flags.applied = 1; if (t === 'fixed') simDone.flags['fixed_' + x.name] = 1; setTimeout(refreshMissions, 50); setTimeout(refreshMissions, 2200); };
  if (!simBooted) { Sim.reset(); simBooted = true; } else renderCluster();
  const hist = []; let hi = 0; const inp = $('#tin');
  simLog(`<span class="t-dim">Welcome to a simulated MicroK8s cluster (3 nodes). Type <b>help</b>. Real commands, safe sandbox.\nTip: "k" works as alias for kubectl.</span>`);
  inp.focus();
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const c = inp.value; inp.value = ''; if (!c.trim()) return; hist.push(c); hi = hist.length; simLog(`<span class="t-ok">$</span> ${c.replace(/</g, '&lt;')}`); const r = Sim.exec(c); if (r === '\x1bclear') $('#tout').innerHTML = ''; else if (r) simLog(r); }
    if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); }
    if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; }
  });
}
V.sim = () => `<h1>☸️ Kubernetes Simulator</h1><p class="sub">A safe cluster in your browser. Break things on purpose. When you're confident here, repeat it on real MicroK8s.</p>${simHTML()}`;

// ---------- flashcards (Leitner boxes)
let fcCur = null;
V.flash = () => {
  const now = Date.now(); const due = FLASH.map((c, i) => ({ c, i, s: st.flash[i] || { box: 0, due: 0 } })).filter(x => x.s.due <= now).sort((a, b) => a.s.box - b.s.box);
  fcCur = due[0];
  const boxes = [0, 1, 2, 3, 4].map(b => FLASH.filter((_, i) => (st.flash[i]?.box || 0) === b).length);
  return `<h1>🃏 Flashcards</h1><p class="sub">Leitner spaced repetition: know it → card comes back later; don't know → back to box 1. ${due.length} due now · ${st.flashReviews} reviews done.</p>
  <div class="chips">${boxes.map((n, b) => `<span class="pill">Box ${b + 1}: ${n}</span>`).join('')}</div>
  ${fcCur ? `<div class="flash" id="fc" onclick="this.classList.toggle('flip')"><div class="in"><div class="f"><div><div class="req">tap to flip</div><h2>${fcCur.c[0]}</h2></div></div><div class="b">${fcCur.c[1]}</div></div></div>
  <div style="display:flex;gap:10px;justify-content:center;margin-top:16px"><button onclick="fcRate(0)">😵 Didn't know</button><button onclick="fcRate(1)">🤔 Hard</button><button class="pri" onclick="fcRate(2)">😎 Knew it</button></div>`
    : `<div class="card"><h3>🎉 Nothing due. Come back later!</h3></div>`}`;
};
window.fcRate = r => { const i = fcCur.i, s = st.flash[i] || { box: 0 }; s.box = r === 0 ? 0 : Math.min(4, s.box + (r === 2 ? 1 : 0)); s.t = Date.now(); s.due = Date.now() + [1, 10, 60 * 24, 60 * 24 * 3, 60 * 24 * 7][s.box] * 60000; st.flash[i] = s; st.flashReviews++; save(); if (st.flashReviews % 10 === 0) gain(15, '10 flashcards reviewed'); checkBadges(); route(); };

// ---------- badges / match / settings
V.badges = () => `<h1>🏅 Badges</h1><div class="grid g4">${BADGES.map(b => `<div class="card badge ${st.badges[b.id] ? 'got' : ''}"><div class="e">${b.e}</div><b>${b.t}</b><div class="req">${b.d}</div></div>`).join('')}</div>`;
const matchTable = job => `<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h3 style="margin:0"><a href="${job.url}" target="_blank">${job.title}</a></h3><div class="kpi">${matchFor(job)}%</div></div><div class="bar"><i style="width:${matchFor(job)}%"></i></div>
  <table class="matrix" style="margin-top:10px"><tr><th>Requirement</th><th>Your level</th><th>Train it</th></tr>
  ${job.reqs.map(r => `<tr><td>${r.label}</td><td style="width:150px"><div class="bar"><i style="width:${reqScore(job, r)}%"></i></div>${reqScore(job, r)}%</td><td>${r.tracks.map(id => `<a href="#track/${id}" title="${TRACKS.find(t => t.id === id).title}">${TRACKS.find(t => t.id === id).icon}</a>`).join(' ')}</td></tr>`).join('')}</table></div>`;
V.match = () => `<h1>🎯 Job match</h1><p class="sub">Your estimated fit for Canonical's two Python roles, starting from your CV and growing with each finished track. Both share the same core (Python, Linux, academics). Python Engineer starts higher because its list overlaps your full-stack work; the Data/AI/ML role is where your ML experience stands out, but it needs Kubernetes and the Canonical stack.</p>
  <div class="grid g2">${matchTable(JOB)}${matchTable(JOB2)}</div>
  <div class="callout job">Portfolio checklist (what recruiters actually see): ☐ CV API on Kubernetes with Helm + probes + /metrics · ☐ Kubeflow pipeline + MLflow repo · ☐ your own charm · ☐ 2–3 merged upstream PRs · ☐ a profiled + packaged Python tool (snap) · ☐ CV updated with numbers.</div>`;
V.settings = () => Pages.settings();
V.profile = () => Pages.profile();
window.resetAll = async () => {
  if (!confirm('Reset all progress?')) return;
  if (SERVER) { const r = await fetch('/api/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }).catch(() => null); if (!r || !r.ok) return toast('❌ Reset failed: is ./start.sh running?'); }
  clearTimeout(saveT); localStorage.removeItem(LSK); location.reload();
};
window.exportState = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' })); a.download = 'canonical-academy-progress.json'; a.click(); };
window.importState = f => f.text().then(t => {
  let d; try { d = JSON.parse(t); } catch { return toast('❌ Not a valid progress file'); }
  if (!d || typeof d !== 'object' || typeof (d.xp ?? 0) !== 'number' || typeof (d.done ?? {}) !== 'object') return toast('❌ Not a valid progress file');
  if (!confirm('Replace your current progress with this file?')) return;
  delete d._rev; replaceState({ ...defaults(), ...d, epoch: Date.now() }); migrate(); save(); setTimeout(() => location.reload(), 900);
});
window.applyTheme = () => Pages.apply();

// ---------- router
function route() {
  const [r, id] = (location.hash || '#home').slice(1).split('/');
  if (r !== 'lesson' && r !== 'sim') simBooted = simBooted; // keep cluster across pages
  $('#main').innerHTML = (V[r] || V.home)(id);
  $('#side').classList.remove('open'); renderSide(); window.scrollTo(0, r === 'lesson' ? scrollY : 0);
}
window.route = route; window.toast = toast; window.st = st; window.save = save;
addEventListener('hashchange', () => { if (location.hash.startsWith('#lesson')) lessonTab = st.tab[location.hash.split('/')[1]] || 'learn'; document.getElementById('side')?.classList.remove('open'); document.getElementById('pmenu')?.classList.remove('open'); route(); scrollTo(0, 0); });
// Mobile menu closes when you tap anywhere outside it
addEventListener('pointerdown', e => { const side = document.getElementById('side'); if (side?.classList.contains('open') && !side.contains(e.target) && !e.target.closest('#menuBtn')) side.classList.remove('open');
  const pm = document.getElementById('pmenu'); if (pm?.classList.contains('open') && !e.target.closest('.pwrap')) pm.classList.remove('open'); });
// Scrollbars stay hidden until you hover or scroll an area (see .scrolling in style.css)
addEventListener('scroll', e => { const el = e.target === document ? document.documentElement : e.target; if (!el.classList) return; el.classList.add('scrolling'); clearTimeout(el._sbT); el._sbT = setTimeout(() => el.classList.remove('scrolling'), 900); }, true);
addEventListener('mousemove', e => document.documentElement.classList.toggle('sb-edge', e.clientX > innerWidth - 18), { passive: true });

applyTheme();
window.TUT = Tutor.mount(() => {
  const [r, id] = (location.hash || '#home').slice(1).split('/');
  const l = r === 'lesson' && allLessons().find(x => x.id === id);
  return `Page: ${r}. ${l ? `Current lesson: "${l.title}" (track: ${l.track.title}). Lesson summary: ${l.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500)}` : ''} Progress: ${Object.keys(st.done).length} lessons done, level ${level().name}, job match ${match()}%.`;
}, () => { st.tutorQs++; save(); checkBadges(); }, SERVER);
(async () => {
  if (SERVER) { try { const r = await (await fetch('/api/progress')).json();
    const before = JSON.stringify(r.state || {}); replaceState(mergeStates(st, r.state || {})); migrate(); serverRev = r.rev || 0; syncOk = true;
    if (JSON.stringify(st) !== before) save(); else try { localStorage.setItem(LSK, JSON.stringify(st)); } catch {} } catch { syncOk = false; } }
  if (location.hash.startsWith('#lesson')) lessonTab = st.tab[location.hash.split('/')[1]] || 'learn';
  await RUN.load();
  applyTheme(); route();
})();
