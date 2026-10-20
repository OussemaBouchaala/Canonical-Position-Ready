// ===== Kubernetes cluster simulator (educational, simplified but faithful to real kubectl behaviour)
const Sim = (() => {
  const rnd = n => Math.random().toString(36).slice(2, 2 + n);
  let S, onEvent = () => {}, render = () => {};
  const NODES = ['uk8s-node-1', 'uk8s-node-2', 'uk8s-node-3'];

  function reset(setup) {
    S = { ns: ['default', 'kube-system', 'dev'].slice(0, 2), deploys: [], pods: [], svcs: [], cms: [], secrets: [], events: [], cmdLog: [] };
    S.pods.push(mkPod('coredns', 'registry.k8s.io/coredns:1.11', 'kube-system', null, 'Running'));
    S.pods.push(mkPod('calico-node', 'calico/node:3.28', 'kube-system', null, 'Running'));
    if (setup === 'broken') createDeploy('shop', 'nginx:1.27-typo', 2, 'default');
    render();
  }
  function mkPod(prefix, image, ns, owner, status = 'Pending') {
    const node = NODES[Math.floor(Math.random() * NODES.length)];
    return { name: `${prefix}-${rnd(5)}`, image, ns, owner, status, node, ip: `10.1.${NODES.indexOf(node)}.${2 + Math.floor(Math.random() * 250)}`, restarts: 0, age: Date.now(), labels: { app: owner || prefix } };
  }
  const badImage = img => /typo|doesnotexist|:bad$/.test(img);
  function ev(msg) { S.events.unshift({ t: new Date().toLocaleTimeString(), msg }); S.events = S.events.slice(0, 30); }

  function createDeploy(name, image, replicas, ns, rsHash) {
    const d = { name, image, replicas, ns, rs: rsHash || rnd(9), history: [], labels: { app: name } };
    S.deploys.push(d); ev(`Deployment ${name} created`); reconcile(); return d;
  }
  // The heart: reconciliation loop
  function reconcile() {
    for (const d of S.deploys) {
      const owned = S.pods.filter(p => p.owner === d.name && p.ns === d.ns && p.status !== 'Terminating');
      const cur = owned.filter(p => p.rs === d.rs);
      const old = owned.filter(p => p.rs !== d.rs);
      if (cur.length < d.replicas) {
        for (let i = cur.length; i < d.replicas; i++) {
          const p = mkPod(`${d.name}-${d.rs.slice(0, 5)}`, d.image, d.ns, d.name); p.rs = d.rs; p.labels = { ...d.labels };
          S.pods.push(p); ev(`Scheduled ${p.name} → ${p.node}`);
          setTimeout(() => { if (!S.pods.includes(p)) return; p.status = badImage(p.image) ? 'ImagePullBackOff' : 'Running'; if (p.status !== 'Running') ev(`Failed to pull image "${p.image}"`); else ev(`Started container in ${p.name}`); afterReady(d); render(); }, 900 + Math.random() * 900);
        }
      }
      if (cur.length > d.replicas) cur.slice(d.replicas).forEach(terminate);
      if (old.length && cur.filter(p => p.status === 'Running').length >= Math.min(d.replicas, cur.length) && cur.length >= d.replicas) old.forEach(terminate);
    }
    render();
  }
  function afterReady(d) { if (d) reconcile(); }
  function terminate(p) {
    if (p.status === 'Terminating') return; p.status = 'Terminating'; ev(`Killing ${p.name}`);
    setTimeout(() => { S.pods = S.pods.filter(x => x !== p); render(); }, 700);
  }

  // ---- output helpers
  const ago = t => { const s = Math.floor((Date.now() - t) / 1000); return s < 60 ? s + 's' : Math.floor(s / 60) + 'm'; };
  const table = (head, rows) => {
    const len = c => String(c).replace(/<[^>]+>/g, '').length;
    const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => len(r[i]))) + 3);
    return [head, ...rows].map(r => r.map((c, i) => String(c) + ' '.repeat(Math.max(1, w[i] - len(c)))).join('')).join('\n');
  };
  const nsOf = a => { const i = a.indexOf('-n'); const j = a.indexOf('--namespace'); return i > -1 ? a[i + 1] : j > -1 ? a[j + 1] : 'default'; };
  const flag = (a, f) => { const x = a.find(s => s.startsWith(f + '=')); if (x) return x.split('=').slice(1).join('='); const i = a.indexOf(f); return i > -1 ? a[i + 1] : undefined; };

  const HELP = `<span class="t-hl">Supported commands</span> (just like real kubectl):
  kubectl get nodes|pods|deploy|rs|svc|endpoints|cm|ns|events|all [-n ns|-A] [-o wide]
  kubectl create deployment NAME --image=IMG [--replicas=N]
  kubectl scale deployment NAME --replicas=N
  kubectl expose deployment NAME --port=80 [--target-port=8000] [--type=NodePort]
  kubectl set image deployment/NAME CONTAINER=IMG
  kubectl rollout status|history|undo deployment/NAME
  kubectl delete pod|deployment|svc|cm|ns NAME
  kubectl describe pod|deployment NAME
  kubectl logs POD
  kubectl create namespace NAME | create configmap NAME --from-literal=K=V
  kubectl create secret generic NAME --from-literal=K=V
  kubectl apply -f editor        (applies the YAML in the editor)
  kubectl explain pod|deployment|service
  clear · reset · help`;

  function exec(line) {
    line = line.trim(); if (!line) return '';
    if (line === 'clear') return '\x1bclear';
    if (line === 'help') return HELP;
    if (line === 'reset') { reset(); return '<span class="t-ok">cluster reset</span>'; }
    let a = line.replace(/^microk8s\s+/, '').split(/\s+/);
    if (a[0] === 'k') a[0] = 'kubectl';
    if (a[0] !== 'kubectl') return `<span class="t-err">command not found: ${a[0]}</span>  (try <b>help</b>)`;
    a = a.slice(1);
    const verb = a[0], kind = (a[1] || '').toLowerCase();
    S.cmdLog.push(a.join(' '));
    const ns = nsOf(a), all = a.includes('-A') || a.includes('--all-namespaces'), wide = a.includes('wide');
    onEvent('cmd', a.join(' '));
    try {
      switch (verb) {
        case 'get': return get(kind, ns, all, wide, a);
        case 'create': return create(a, ns);
        case 'scale': { const n = +flag(a, '--replicas'); const name = (a[2] || '').replace('deployment/', ''); const d = S.deploys.find(x => x.name === name && x.ns === ns); if (!d) return err(`deployments.apps "${name}" not found`); d.replicas = n; ev(`Scaled ${name} to ${n}`); reconcile(); onEvent('deploy', d); return `deployment.apps/${name} scaled`; }
        case 'expose': { const name = a[2]; const d = S.deploys.find(x => x.name === name && x.ns === ns); if (!d) return err(`deployments.apps "${name}" not found`); const port = flag(a, '--port') || 80; const s = { name, ns, type: flag(a, '--type') || 'ClusterIP', port, target: flag(a, '--target-port') || port, selector: { app: name }, ip: `10.152.183.${10 + Math.floor(Math.random() * 200)}` }; S.svcs.push(s); render(); onEvent('svc', s); return `service/${name} exposed`; }
        case 'set': { if (a[1] !== 'image') return err('only "set image" supported'); const name = a[2].replace('deployment/', '').replace('deploy/', ''); const d = S.deploys.find(x => x.name === name && x.ns === ns); if (!d) return err(`deployments.apps "${name}" not found`); const img = a[3].split('=')[1]; d.history.push({ rs: d.rs, image: d.image }); d.image = img; d.rs = rnd(9); ev(`Rolling update ${name} → ${img}`); reconcile(); onEvent('rolled', d); if (!badImage(img)) onEvent('fixed', d); return `deployment.apps/${name} image updated`; }
        case 'rollout': { const sub = a[1]; const name = (a[2] || '').split('/')[1]; const d = S.deploys.find(x => x.name === name && x.ns === ns); if (!d) return err(`deployment "${name}" not found`);
          if (sub === 'status') { const ready = S.pods.filter(p => p.owner === name && p.rs === d.rs && p.status === 'Running').length; return ready >= d.replicas ? `<span class="t-ok">deployment "${name}" successfully rolled out</span>` : `Waiting for deployment "${name}" rollout to finish: ${ready} of ${d.replicas} updated replicas are available...`; }
          if (sub === 'history') return table(['REVISION', 'IMAGE'], [...d.history.map((h, i) => [i + 1, h.image]), [d.history.length + 1, d.image + ' (current)']]);
          if (sub === 'undo') { const prev = d.history.pop(); if (!prev) return err('no rollout history found'); d.image = prev.image; d.rs = prev.rs; ev(`Rolled back ${name} to ${prev.image}`); reconcile(); onEvent('undo', d); if (!badImage(d.image)) onEvent('fixed', d); return `deployment.apps/${name} rolled back`; }
          return err('rollout status|history|undo'); }
        case 'delete': return del(kind, a[2], ns);
        case 'describe': return describe(kind, a[2], ns);
        case 'logs': { const p = S.pods.find(x => x.name === a[1]); if (!p) return err(`pods "${a[1]}" not found`); if (p.status !== 'Running') return err(`container in pod "${p.name}" is waiting to start: ${p.status}`); return `/docker-entrypoint.sh: Configuration complete; ready for start up\n10.1.0.1 - - "GET /health HTTP/1.1" 200 2\n10.1.0.1 - - "GET /ready HTTP/1.1" 200 2`; }
        case 'apply': return apply();
        case 'explain': return explain(kind);
        case 'cluster-info': return `<span class="t-ok">Kubernetes control plane</span> is running at https://127.0.0.1:16443`;
        default: return err(`unknown command "${verb}" (try help)`);
      }
    } catch (e) { return err(e.message); }
  }
  const err = m => `<span class="t-err">Error from server: ${m}</span>`;

  function get(kind, ns, all, wide, a) {
    const inNs = x => all || x.ns === ns;
    if (/^(nodes?|no)$/.test(kind)) return table(['NAME', 'STATUS', 'ROLES', 'VERSION'], NODES.map((n, i) => [n, 'Ready', i === 0 ? 'control-plane' : '<none>', 'v1.31.2']));
    if (/^(pods?|po)$/.test(kind)) { const ps = S.pods.filter(inNs); if (!ps.length) return `No resources found in ${ns} namespace.`;
      return table([...(all ? ['NAMESPACE'] : []), 'NAME', 'READY', 'STATUS', 'RESTARTS', 'AGE', ...(wide ? ['IP', 'NODE'] : [])], ps.map(p => [...(all ? [p.ns] : []), p.name, p.status === 'Running' ? '1/1' : '0/1', colorStatus(p.status), p.restarts, ago(p.age), ...(wide ? [p.ip, p.node] : [])])); }
    if (/^(deploy|deployments?)$/.test(kind)) { const ds = S.deploys.filter(inNs); if (!ds.length) return `No resources found in ${ns} namespace.`;
      return table(['NAME', 'READY', 'UP-TO-DATE', 'AVAILABLE', 'IMAGE'], ds.map(d => { const r = S.pods.filter(p => p.owner === d.name && p.status === 'Running').length; return [d.name, `${Math.min(r, d.replicas)}/${d.replicas}`, d.replicas, r, d.image]; })); }
    if (/^(rs|replicasets?)$/.test(kind)) { const rows = []; S.deploys.filter(inNs).forEach(d => { [...d.history.map(h => h.rs), d.rs].forEach(rs => { const c = S.pods.filter(p => p.rs === rs && p.status !== 'Terminating').length; rows.push([`${d.name}-${rs.slice(0, 9)}`, rs === d.rs ? d.replicas : 0, c]); }); });
      return rows.length ? table(['NAME', 'DESIRED', 'CURRENT'], rows) : 'No resources found.'; }
    if (/^(svc|services?)$/.test(kind)) return table(['NAME', 'TYPE', 'CLUSTER-IP', 'PORT(S)'], [['kubernetes', 'ClusterIP', '10.152.183.1', '443/TCP'], ...S.svcs.filter(inNs).map(s => [s.name, s.type, s.ip, `${s.port}${s.type === 'NodePort' ? ':3' + (1000 + Math.floor(Math.random() * 999)) : ''}/TCP`])]);
    if (/^(ep|endpoints)$/.test(kind)) { onEvent('cmd', 'get endpoints'); return table(['NAME', 'ENDPOINTS'], S.svcs.filter(inNs).map(s => { const eps = S.pods.filter(p => p.ns === s.ns && p.status === 'Running' && p.labels.app === s.selector.app).map(p => `${p.ip}:${s.target}`); return [s.name, eps.join(',') || '<none>  ← no pod matches the selector!']; })); }
    if (/^(cm|configmaps?)$/.test(kind)) return table(['NAME', 'DATA'], [['kube-root-ca.crt', 1], ...S.cms.filter(inNs).map(c => [c.name, Object.keys(c.data).length])]);
    if (/^(secrets?)$/.test(kind)) return table(['NAME', 'TYPE', 'DATA'], S.secrets.filter(inNs).map(c => [c.name, 'Opaque', Object.keys(c.data).length]));
    if (/^(ns|namespaces?)$/.test(kind)) return table(['NAME', 'STATUS'], S.ns.map(n => [n, 'Active']));
    if (/^(events?|ev)$/.test(kind)) return S.events.map(e => `${e.t}  ${e.msg}`).join('\n') || 'No events.';
    if (kind === 'all') return ['pods', 'svc', 'deploy', 'rs'].map(k => get(k, ns, all, wide, a)).join('\n\n');
    return err(`the server doesn't have a resource type "${kind}"`);
  }
  const colorStatus = s => s === 'Running' ? `<span class="t-ok">${s}</span>` : /BackOff|Crash/.test(s) ? `<span class="t-err">${s}</span>` : `<span class="t-hl">${s}</span>`;

  function create(a, ns) {
    const k = a[1];
    if (k === 'deployment' || k === 'deploy') { const name = a[2]; const img = flag(a, '--image'); if (!name || !img) return err('usage: kubectl create deployment NAME --image=IMG [--replicas=N]'); if (S.deploys.find(d => d.name === name && d.ns === ns)) return err(`deployments.apps "${name}" already exists`); if (!S.ns.includes(ns)) return err(`namespaces "${ns}" not found`); const d = createDeploy(name, img, +(flag(a, '--replicas') || 1), ns); onEvent('deploy', d); return `deployment.apps/${name} created`; }
    if (k === 'namespace' || k === 'ns') { if (S.ns.includes(a[2])) return err('already exists'); S.ns.push(a[2]); onEvent('ns', a[2]); return `namespace/${a[2]} created`; }
    if (k === 'configmap' || k === 'cm') { const data = {}; a.filter(x => x.startsWith('--from-literal=')).forEach(x => { const [kk, ...v] = x.slice(15).split('='); data[kk] = v.join('='); }); S.cms.push({ name: a[2], ns, data }); onEvent('cm', a[2]); return `configmap/${a[2]} created`; }
    if (k === 'secret') { const name = a[3]; const data = {}; a.filter(x => x.startsWith('--from-literal=')).forEach(x => { const [kk, ...v] = x.slice(15).split('='); data[kk] = btoa(v.join('=')); }); S.secrets.push({ name, ns, data }); return `secret/${name} created   (stored base64: ${Object.values(data).join(', ')}  ← not encryption!)`; }
    return err(`create ${k} not supported in the simulator`);
  }
  function del(kind, name, ns) {
    if (/^pods?$/.test(kind)) { const p = S.pods.find(x => x.name === name); if (!p) return err(`pods "${name}" not found`); terminate(p);
      if (p.owner) { setTimeout(() => { reconcile(); onEvent('healed', p); ev(`ReplicaSet noticed ${p.owner}: actual < desired → creating replacement`); }, 300); return `pod "${name}" deleted\n<span class="t-dim">💡 watch the cluster panel: the ReplicaSet will create a replacement…</span>`; }
      return `pod "${name}" deleted`; }
    if (/^(deploy|deployments?)$/.test(kind)) { const d = S.deploys.find(x => x.name === name && x.ns === ns); if (!d) return err(`deployments.apps "${name}" not found`); S.deploys = S.deploys.filter(x => x !== d); S.pods.filter(p => p.owner === name).forEach(terminate); return `deployment.apps "${name}" deleted`; }
    if (/^(svc|services?)$/.test(kind)) { S.svcs = S.svcs.filter(s => s.name !== name); render(); return `service "${name}" deleted`; }
    if (/^(cm|configmaps?)$/.test(kind)) { S.cms = S.cms.filter(s => s.name !== name); return `configmap "${name}" deleted`; }
    if (/^(ns|namespaces?)$/.test(kind)) { S.ns = S.ns.filter(n => n !== name); S.pods.filter(p => p.ns === name).forEach(terminate); S.deploys = S.deploys.filter(d => d.ns !== name); return `namespace "${name}" deleted`; }
    return err(`delete ${kind} not supported`);
  }
  function describe(kind, name, ns) {
    onEvent('cmd', 'describe ' + (kind.startsWith('po') ? 'pod' : kind));
    if (/^pods?$/.test(kind)) { const p = S.pods.find(x => x.name === name) || S.pods.find(x => x.name.startsWith(name || '~')); if (!p) return err(`pods "${name}" not found`);
      const evs = p.status === 'ImagePullBackOff' ? `  Warning  Failed     kubelet  Failed to pull image "${p.image}": not found\n  Normal   BackOff    kubelet  Back-off pulling image "${p.image}"` : `  Normal   Scheduled  default-scheduler  Successfully assigned ${p.ns}/${p.name} to ${p.node}\n  Normal   Pulled     kubelet  Container image "${p.image}" already present\n  Normal   Started    kubelet  Started container`;
      return `Name:         ${p.name}\nNamespace:    ${p.ns}\nNode:         ${p.node}\nLabels:       app=${p.labels.app}\nStatus:       ${colorStatus(p.status)}\nIP:           ${p.ip}\nControlled By: ReplicaSet/${p.owner || '-'}\nContainers:\n  ${p.owner || 'c'}:\n    Image:    ${p.image}\n<span class="t-hl">Events:</span>\n${evs}`; }
    if (/^(deploy|deployments?)$/.test(kind)) { const d = S.deploys.find(x => x.name === name); if (!d) return err('not found'); return `Name:        ${d.name}\nNamespace:   ${d.ns}\nSelector:    app=${d.name}\nReplicas:    ${d.replicas} desired\nStrategy:    RollingUpdate (25% max unavailable, 25% max surge)\nPod Template:\n  Labels:  app=${d.name}\n  Image:   ${d.image}`; }
    return err('describe pod|deployment');
  }
  function apply() {
    const txt = document.getElementById('simYaml')?.value || '';
    if (typeof jsyaml === 'undefined') return err('YAML parser not loaded (needs internet once for js-yaml from CDN)');
    const docs = jsyaml.loadAll(txt).filter(Boolean); const out = [];
    for (const o of docs) {
      const ns = o.metadata?.namespace || 'default', name = o.metadata?.name;
      if (!o.kind || !name) { out.push(err('missing kind or metadata.name')); continue; }
      if (o.kind === 'Deployment') {
        const sel = o.spec?.selector?.matchLabels, lab = o.spec?.template?.metadata?.labels;
        if (!sel || !lab || Object.keys(sel).some(k => sel[k] !== lab[k])) { out.push(err(`Deployment.apps "${name}" is invalid: spec.template.metadata.labels: Invalid value: selector does not match template labels`)); continue; }
        const c = o.spec.template.spec?.containers?.[0]; if (!c?.image) { out.push(err('spec.template.spec.containers[0].image: Required value')); continue; }
        if (!S.ns.includes(ns)) { out.push(err(`namespaces "${ns}" not found`)); continue; }
        const ex = S.deploys.find(d => d.name === name && d.ns === ns);
        if (ex) { if (ex.image !== c.image) { ex.history.push({ rs: ex.rs, image: ex.image }); ex.image = c.image; ex.rs = rnd(9); } ex.replicas = o.spec.replicas ?? 1; reconcile(); out.push(`deployment.apps/${name} configured`); }
        else { const d = createDeploy(name, c.image, o.spec.replicas ?? 1, ns); d.labels = lab; onEvent('deploy', d); out.push(`deployment.apps/${name} created`); }
      } else if (o.kind === 'Service') {
        S.svcs = S.svcs.filter(s => !(s.name === name && s.ns === ns));
        const p = o.spec?.ports?.[0] || {}; S.svcs.push({ name, ns, type: o.spec?.type || 'ClusterIP', port: p.port, target: p.targetPort || p.port, selector: o.spec?.selector || {}, ip: `10.152.183.${10 + Math.floor(Math.random() * 200)}` }); onEvent('svc', { name }); out.push(`service/${name} created`);
      } else if (o.kind === 'ConfigMap') { S.cms.push({ name, ns, data: o.data || {} }); onEvent('cm', name); out.push(`configmap/${name} created`); }
      else if (o.kind === 'Namespace') { if (!S.ns.includes(name)) S.ns.push(name); onEvent('ns', name); out.push(`namespace/${name} created`); }
      else out.push(err(`kind ${o.kind} not supported in simulator (Deployment, Service, ConfigMap, Namespace are)`));
    }
    onEvent('applied'); render(); return out.join('\n');
  }
  function explain(k) {
    const E = { pod: 'KIND: Pod\nThe smallest deployable unit. One or more containers sharing network namespace (one IP) and volumes.\nFIELDS: metadata, spec.containers[], spec.volumes[], spec.nodeSelector …',
      deployment: 'KIND: Deployment (apps/v1)\nDeclarative updates for Pods and ReplicaSets.\nFIELDS: spec.replicas, spec.selector (required), spec.template, spec.strategy',
      service: 'KIND: Service (v1)\nAbstract way to expose pods as a network service.\nFIELDS: spec.selector, spec.ports[].port/targetPort, spec.type (ClusterIP|NodePort|LoadBalancer)' };
    return E[k.replace(/s$/, '')] || err('try: explain pod|deployment|service');
  }

  function state() { return S; }
  return { reset, exec, state, set onEvent(f) { onEvent = f; }, set render(f) { render = f; }, NODES };
})();
