// Inline SVG diagrams. Colors use CSS variables so they follow light/dark theme.
const box = (x, y, w, h, label, color = 'var(--k8s)', sub = '') =>
  `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" style="fill:var(--card);stroke:${color};stroke-width:2"/>
   <text x="${x + w / 2}" y="${y + (sub ? h / 2 - 4 : h / 2 + 5)}" text-anchor="middle" font-size="14" font-weight="600">${label}</text>
   ${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle" font-size="11" style="fill:var(--mut)">${sub}</text>` : ''}</g>`;
const arrow = (x1, y1, x2, y2, label = '', color = 'var(--mut)') =>
  `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${color};stroke-width:2" marker-end="url(#ah)"/>
   ${label ? `<text x="${(x1 + x2) / 2 + 6}" y="${(y1 + y2) / 2 - 6}" font-size="11" style="fill:var(--mut)">${label}</text>` : ''}</g>`;
const defs = `<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--mut)"/></marker></defs>`;
const zone = (x, y, w, h, label, color) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" style="fill:none;stroke:${color};stroke-width:2;stroke-dasharray:6 5"/>
   <text x="${x + 12}" y="${y + 20}" font-size="13" font-weight="700" style="fill:${color}">${label}</text>`;
const svg = (w, h, body) => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${defs}${body}</svg>`;

const DIAGRAMS = {
  linuxStack: svg(760, 330,
    box(40, 20, 680, 50, 'Your apps: python, docker, kubectl, snap', 'var(--py)') +
    box(40, 90, 680, 50, 'Shell (bash) + user space tools (systemd, apt, coreutils)', 'var(--os)') +
    box(40, 160, 680, 50, 'System calls  ·  processes · files · sockets · permissions', 'var(--ml)') +
    box(40, 230, 680, 50, 'Linux kernel: scheduler · memory · namespaces · cgroups · drivers', 'var(--acc)') +
    `<text x="380" y="315" text-anchor="middle" font-size="12" style="fill:var(--mut)">Namespaces + cgroups (kernel) are exactly what containers are built from</text>`),

  vmVsContainer: svg(760, 330,
    zone(20, 10, 340, 310, 'Virtual machines', 'var(--warn)') +
    box(40, 40, 140, 60, 'App A', 'var(--py)', 'libs') + box(200, 40, 140, 60, 'App B', 'var(--py)', 'libs') +
    box(40, 110, 140, 50, 'Guest OS', 'var(--warn)') + box(200, 110, 140, 50, 'Guest OS', 'var(--warn)') +
    box(40, 175, 300, 50, 'Hypervisor', 'var(--mut)') + box(40, 240, 300, 50, 'Host OS + hardware', 'var(--mut)') +
    zone(400, 10, 340, 310, 'Containers', 'var(--k8s)') +
    box(420, 40, 95, 80, 'App A', 'var(--py)', 'libs') + box(525, 40, 95, 80, 'App B', 'var(--py)', 'libs') + box(630, 40, 95, 80, 'App C', 'var(--py)', 'libs') +
    box(420, 140, 305, 50, 'Container runtime (containerd)', 'var(--k8s)') + box(420, 210, 305, 80, 'ONE shared Linux kernel', 'var(--acc)', 'isolation = namespaces + cgroups')),

  dockerFlow: svg(760, 180,
    box(20, 60, 140, 60, 'Dockerfile', 'var(--py)', 'recipe') + arrow(160, 90, 220, 90, 'build') +
    box(220, 60, 140, 60, 'Image', 'var(--k8s)', 'layers, read-only') + arrow(360, 90, 420, 90, 'push') +
    box(420, 60, 140, 60, 'Registry', 'var(--ml)', 'Docker Hub / GHCR') + arrow(560, 90, 610, 90, 'run') +
    box(610, 60, 130, 60, 'Container', 'var(--ok)', 'running process')),

  k8sArch: svg(780, 400,
    zone(20, 10, 300, 380, 'Control plane', 'var(--acc)') +
    box(40, 45, 260, 55, 'kube-apiserver', 'var(--acc)', 'the ONLY front door (kubectl talks here)') +
    box(40, 115, 260, 55, 'etcd', 'var(--acc)', 'key-value store = desired state') +
    box(40, 185, 260, 55, 'kube-scheduler', 'var(--acc)', 'picks a node for each new pod') +
    box(40, 255, 260, 55, 'controller-manager', 'var(--acc)', 'loops: make actual = desired') +
    box(40, 325, 260, 45, 'kubectl / you', 'var(--py)') +
    zone(360, 10, 400, 180, 'Worker node 1', 'var(--k8s)') +
    box(380, 45, 170, 50, 'kubelet', 'var(--k8s)', 'runs pods on this node') + box(570, 45, 170, 50, 'kube-proxy', 'var(--k8s)', 'service networking') +
    box(380, 115, 110, 55, 'Pod', 'var(--ok)') + box(505, 115, 110, 55, 'Pod', 'var(--ok)') + box(630, 115, 110, 55, 'Pod', 'var(--ok)') +
    zone(360, 210, 400, 180, 'Worker node 2', 'var(--k8s)') +
    box(380, 245, 170, 50, 'kubelet', 'var(--k8s)') + box(570, 245, 170, 50, 'containerd', 'var(--k8s)', 'container runtime') +
    box(380, 315, 110, 55, 'Pod', 'var(--ok)') + box(505, 315, 110, 55, 'Pod', 'var(--ok)') +
    arrow(300, 72, 380, 72) + arrow(300, 72, 380, 270)),

  objects: svg(760, 330,
    box(250, 15, 260, 60, 'Deployment', 'var(--acc)', 'what you write: image + replicas + strategy') +
    arrow(380, 75, 380, 110, 'creates') +
    box(250, 110, 260, 60, 'ReplicaSet', 'var(--ml)', 'keeps N identical pods alive') +
    arrow(380, 170, 160, 215) + arrow(380, 170, 380, 215) + arrow(380, 170, 600, 215) +
    box(80, 215, 160, 70, 'Pod', 'var(--k8s)', 'container(s) + IP') + box(300, 215, 160, 70, 'Pod', 'var(--k8s)', 'container(s) + IP') + box(520, 215, 160, 70, 'Pod', 'var(--k8s)', 'container(s) + IP') +
    `<text x="380" y="315" text-anchor="middle" font-size="12" style="fill:var(--mut)">Delete a pod → ReplicaSet notices (count 2 ≠ 3) → creates a new one. That is "self-healing".</text>`),

  service: svg(760, 300,
    box(20, 120, 130, 60, 'Client', 'var(--py)', 'or Ingress') + arrow(150, 150, 240, 150, 'my-svc:80') +
    box(240, 110, 180, 80, 'Service', 'var(--ml)', 'stable IP + DNS name') +
    `<text x="330" y="215" text-anchor="middle" font-size="11" style="fill:var(--mut)">selector: app=web</text>` +
    arrow(420, 150, 560, 50) + arrow(420, 150, 560, 150) + arrow(420, 150, 560, 250) +
    box(560, 20, 180, 60, 'Pod app=web', 'var(--k8s)', '10.1.0.4:8000') + box(560, 120, 180, 60, 'Pod app=web', 'var(--k8s)', '10.1.0.7:8000') + box(560, 220, 180, 60, 'Pod app=web', 'var(--k8s)', '10.1.1.2:8000')),

  ingress: svg(780, 260,
    box(10, 100, 120, 60, 'Internet', 'var(--py)') + arrow(130, 130, 190, 130) +
    box(190, 90, 170, 80, 'Ingress', 'var(--acc)', 'HTTP routing rules') +
    arrow(360, 130, 470, 50, '/api') + arrow(360, 130, 470, 210, '/ui') +
    box(470, 20, 140, 60, 'Service api', 'var(--ml)') + box(470, 180, 140, 60, 'Service ui', 'var(--ml)') +
    arrow(610, 50, 660, 50) + arrow(610, 210, 660, 210) +
    box(660, 20, 110, 60, 'Pods', 'var(--k8s)') + box(660, 180, 110, 60, 'Pods', 'var(--k8s)')),

  config: svg(760, 260,
    box(20, 30, 200, 60, 'ConfigMap', 'var(--py)', 'non-secret settings') +
    box(20, 160, 200, 60, 'Secret', 'var(--bad)', 'passwords, tokens (base64)') +
    box(300, 70, 180, 110, 'Pod', 'var(--k8s)', 'env vars / mounted files') +
    arrow(220, 60, 300, 110) + arrow(220, 190, 300, 150) +
    box(560, 30, 180, 60, 'PVC', 'var(--ml)', '"I need 10Gi"') + box(560, 160, 180, 60, 'PersistentVolume', 'var(--ml)', 'real disk') +
    arrow(560, 60, 480, 110, 'mount') + arrow(650, 90, 650, 160, 'bound')),

  helm: svg(760, 220,
    box(20, 70, 170, 80, 'Chart', 'var(--k8s)', 'templates/*.yaml') + box(20, 160, 170, 45, 'values.yaml', 'var(--py)') +
    arrow(190, 110, 290, 110, 'helm install') +
    box(290, 70, 180, 80, 'Rendered YAML', 'var(--ml)', 'Deployment, Service…') + arrow(470, 110, 560, 110, 'apply') +
    box(560, 70, 180, 80, 'Release v1, v2…', 'var(--ok)', 'helm rollback works')),

  mlops: svg(820, 260,
    box(10, 90, 120, 70, 'Data', 'var(--py)', 'DVC versioned') + arrow(130, 125, 160, 125) +
    box(160, 90, 120, 70, 'Features', 'var(--py)', 'Feast') + arrow(280, 125, 310, 125) +
    box(310, 90, 130, 70, 'Train', 'var(--ml)', 'Kubeflow Pipeline') + arrow(440, 125, 470, 125) +
    box(470, 90, 120, 70, 'Track', 'var(--ml)', 'MLflow runs') + arrow(590, 125, 620, 125) +
    box(620, 90, 90, 70, 'Registry', 'var(--ml)', 'MLflow') + arrow(710, 125, 730, 125) +
    box(730, 90, 80, 70, 'Serve', 'var(--k8s)', 'KServe') +
    `<path d="M770 160 C 770 230, 70 230, 70 160" style="fill:none;stroke:var(--warn);stroke-width:2;stroke-dasharray:5 4" marker-end="url(#ah)"/>
     <text x="420" y="245" text-anchor="middle" font-size="12" style="fill:var(--warn)">monitor drift → retrain (the loop is what makes it Ops)</text>` +
    `<text x="410" y="40" text-anchor="middle" font-size="13" style="fill:var(--mut)">Everything runs on Kubernetes · Canonical ships it as Charmed Kubeflow + Charmed MLflow</text>`),

  juju: svg(780, 330,
    box(20, 20, 200, 60, 'juju CLI', 'var(--py)', 'juju deploy / integrate') + arrow(220, 50, 300, 50) +
    box(300, 20, 200, 60, 'Juju controller', 'var(--acc)') + arrow(500, 50, 560, 50) +
    box(560, 20, 200, 60, 'Model', 'var(--acc)', '= a K8s namespace') +
    zone(20, 110, 740, 210, 'Inside the model', 'var(--ml)') +
    box(50, 150, 200, 70, 'Charm: mlflow-server', 'var(--ml)', 'Python operator (ops)') +
    box(520, 150, 200, 70, 'Charm: mysql-k8s', 'var(--ml)', 'Python operator (ops)') +
    `<line x1="250" y1="185" x2="520" y2="185" style="stroke:var(--warn);stroke-width:3"/><text x="385" y="175" text-anchor="middle" font-size="12" style="fill:var(--warn)">relation / integration</text>` +
    `<text x="385" y="205" text-anchor="middle" font-size="11" style="fill:var(--mut)">charms exchange credentials automatically</text>` +
    box(50, 240, 200, 60, 'Workload pod', 'var(--k8s)', 'mlflow container') + box(520, 240, 200, 60, 'Workload pod', 'var(--k8s)', 'mysql container') +
    arrow(150, 220, 150, 240) + arrow(620, 220, 620, 240)),

  charmEvents: svg(760, 250,
    box(20, 20, 160, 50, 'install', 'var(--py)') + box(20, 85, 160, 50, 'config-changed', 'var(--py)') + box(20, 150, 160, 50, 'pebble-ready', 'var(--py)') + box(20, 200, 160, 40, 'relation-joined', 'var(--py)') +
    arrow(180, 45, 300, 120) + arrow(180, 110, 300, 120) + arrow(180, 175, 300, 125) + arrow(180, 220, 300, 130) +
    box(300, 80, 200, 90, 'Your charm.py', 'var(--ml)', 'observe(event, handler)') + arrow(500, 125, 570, 125, 'reconcile') +
    box(570, 80, 170, 90, 'Workload', 'var(--k8s)', 'via Pebble: start/stop')),

  gitflow: svg(780, 200,
    box(10, 70, 110, 60, 'Fork', 'var(--py)') + arrow(120, 100, 150, 100) +
    box(150, 70, 110, 60, 'Branch', 'var(--py)', 'fix/issue-42') + arrow(260, 100, 290, 100) +
    box(290, 70, 110, 60, 'Commit', 'var(--py)', '+ tests') + arrow(400, 100, 430, 100) +
    box(430, 70, 110, 60, 'Pull Request', 'var(--acc)') + arrow(540, 100, 570, 100) +
    box(570, 70, 90, 60, 'CI + review', 'var(--ml)') + arrow(660, 100, 680, 100) +
    box(680, 70, 90, 60, 'Merged 🎉', 'var(--ok)')),

  rollout: svg(760, 220,
    `<text x="20" y="25" font-size="13" style="fill:var(--mut)">RollingUpdate (maxSurge=1, maxUnavailable=0)</text>` +
    ['v1 v1 v1', 'v1 v1 v1 v2', 'v1 v1 v2', 'v1 v1 v2 v2', 'v1 v2 v2', 'v2 v2 v2'].map((row, i) =>
      `<text x="20" y="${60 + i * 27}" font-size="12" style="fill:var(--mut)">t${i}</text>` +
      row.split(' ').map((v, j) => `<rect x="${60 + j * 70}" y="${45 + i * 27}" width="62" height="20" rx="5" style="fill:${v === 'v1' ? 'var(--k8s)' : 'var(--ok)'}"/><text x="${91 + j * 70}" y="${59 + i * 27}" text-anchor="middle" font-size="11" style="fill:#fff">${v}</text>`).join('')).join('') +
    `<text x="400" y="110" font-size="13" style="fill:var(--tx)">Zero downtime: a new pod must be</text><text x="400" y="130" font-size="13" style="fill:var(--tx)">Ready (readinessProbe) before an old</text><text x="400" y="150" font-size="13" style="fill:var(--tx)">one is removed.  kubectl rollout undo</text><text x="400" y="170" font-size="13" style="fill:var(--tx)">goes back to the previous ReplicaSet.</text>`),

  observability: svg(760, 220,
    box(20, 80, 150, 60, 'Your app', 'var(--k8s)', '/metrics · logs · traces') +
    arrow(170, 95, 290, 40) + arrow(170, 110, 290, 110) + arrow(170, 125, 290, 180) +
    box(290, 15, 170, 50, 'Prometheus', 'var(--acc)', 'metrics (numbers)') + box(290, 85, 170, 50, 'Loki', 'var(--acc)', 'logs (text)') + box(290, 155, 170, 50, 'Tempo', 'var(--acc)', 'traces (request path)') +
    arrow(460, 40, 580, 100) + arrow(460, 110, 580, 110) + arrow(460, 180, 580, 120) +
    box(580, 80, 160, 60, 'Grafana', 'var(--ok)', 'dashboards + alerts'))
};
