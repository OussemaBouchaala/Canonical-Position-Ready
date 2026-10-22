// More inline SVG diagrams for the interactive lesson steps (same helpers and theme colors as diagrams.js).
const note = (x, y, t, anchor = 'middle', color = 'var(--mut)', size = 12) => `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" style="fill:${color}">${t}</text>`;
const chip = (x, y, w, label, color) => `<rect x="${x}" y="${y}" width="${w}" height="24" rx="12" style="fill:${color};opacity:.9"/><text x="${x + w / 2}" y="${y + 16}" text-anchor="middle" font-size="12" style="fill:#fff">${label}</text>`;

Object.assign(DIAGRAMS, {
  syscall: svg(760, 230,
    box(20, 30, 200, 60, 'python app.py', 'var(--py)', 'user space') + box(20, 140, 200, 60, 'cat, bash, uvicorn', 'var(--py)', 'user space') +
    arrow(220, 60, 330, 100, 'open() read()') + arrow(220, 170, 330, 130, 'socket() write()') +
    box(330, 70, 170, 90, 'Kernel', 'var(--acc)', 'checks permissions') + arrow(500, 115, 560, 115) +
    box(560, 20, 180, 50, 'Disk', 'var(--mut)') + box(560, 90, 180, 50, 'Network card', 'var(--mut)') + box(560, 160, 180, 50, 'RAM / CPU', 'var(--mut)') +
    note(380, 222, 'Programs never touch hardware: every request is a system call')),

  namespaces: svg(760, 270,
    zone(20, 10, 720, 250, 'One Linux kernel', 'var(--acc)') +
    zone(45, 45, 320, 200, 'Container A', 'var(--k8s)') + zone(395, 45, 320, 200, 'Container B', 'var(--k8s)') +
    ['PID: I am PID 1', 'NET: eth0 10.1.0.4', 'MNT: my own /', 'UTS: hostname web'].map((t, i) => box(65, 75 + i * 42, 280, 34, t, 'var(--ok)')).join('') +
    ['PID: I am PID 1', 'NET: eth0 10.1.0.9', 'MNT: my own /', 'UTS: hostname db'].map((t, i) => box(415, 75 + i * 42, 280, 34, t, 'var(--ml)')).join('')),

  perms: svg(760, 200,
    `<text x="380" y="40" text-anchor="middle" font-size="30" font-family="monospace" style="fill:var(--tx)">-  rwx  r-x  r--</text>` +
    box(120, 70, 160, 60, 'owner', 'var(--acc)', 'rwx = 4+2+1 = 7') + box(300, 70, 160, 60, 'group', 'var(--k8s)', 'r-x = 4+0+1 = 5') + box(480, 70, 160, 60, 'others', 'var(--mut)', 'r-- = 4+0+0 = 4') +
    note(380, 165, 'chmod 754 file   ·   r = read (4)   w = write (2)   x = execute (1)', 'middle', 'var(--tx)', 14) +
    note(380, 188, 'first character: - file · d directory · l link')),

  pipes: svg(780, 170,
    box(10, 50, 170, 60, 'journalctl -u api', 'var(--py)', 'all log lines') + arrow(180, 80, 215, 80, '|') +
    box(215, 50, 160, 60, 'grep ERROR', 'var(--k8s)', 'keep errors') + arrow(375, 80, 410, 80, '|') +
    box(410, 50, 170, 60, 'sort | uniq -c', 'var(--ml)', 'count duplicates') + arrow(580, 80, 615, 80, '|') +
    box(615, 50, 155, 60, 'head -5', 'var(--ok)', 'top 5') +
    note(390, 150, 'Each tool reads the previous one\'s output: a conveyor belt of small programs')),

  aptSnap: svg(760, 250,
    zone(20, 10, 340, 230, 'apt (.deb)', 'var(--k8s)') + box(40, 45, 140, 45, 'app A', 'var(--py)') + box(200, 45, 140, 45, 'app B', 'var(--py)') +
    box(40, 115, 300, 50, 'shared libraries (libssl, python3…)', 'var(--mut)') + arrow(110, 90, 110, 115) + arrow(270, 90, 270, 115) +
    note(190, 200, 'small, fast · one upgrade can affect others') +
    zone(400, 10, 340, 230, 'snap', 'var(--acc)') + box(420, 45, 140, 120, 'app A', 'var(--py)', '+ its own libs') + box(580, 45, 140, 120, 'app B', 'var(--py)', '+ its own libs') +
    note(570, 200, 'self-contained · confined · auto-updates') + note(570, 220, 'channels: 1.31/stable, latest/edge')),

  venv: svg(760, 230,
    box(280, 15, 200, 50, 'System Python', 'var(--mut)', '/usr/bin/python3 (Ubuntu\'s)') +
    arrow(330, 65, 150, 110) + arrow(430, 65, 610, 110) +
    zone(30, 110, 300, 110, 'project-a/.venv', 'var(--k8s)') + box(50, 145, 260, 55, 'numpy 1.26 · torch 2.4', 'var(--py)') +
    zone(430, 110, 300, 110, 'project-b/.venv', 'var(--ml)') + box(450, 145, 260, 55, 'numpy 2.1 · fastapi', 'var(--py)')),

  aaa: svg(760, 170,
    box(20, 40, 220, 80, '1. Arrange', 'var(--py)', 'a, b = boxes') + arrow(240, 80, 270, 80) +
    box(270, 40, 220, 80, '2. Act', 'var(--k8s)', 'result = iou(a, b)') + arrow(490, 80, 520, 80) +
    box(520, 40, 220, 80, '3. Assert', 'var(--ok)', 'assert result == 1/3') +
    note(380, 155, 'One behaviour per test, named like a sentence')),

  apiFlow: svg(780, 200,
    box(10, 60, 130, 70, 'Client', 'var(--py)', 'JSON body') + arrow(140, 95, 190, 95, 'POST') +
    box(190, 50, 170, 90, 'Validation', 'var(--warn)', 'pydantic from hints') + arrow(360, 95, 410, 95, 'valid') +
    box(410, 50, 160, 90, 'Your function', 'var(--k8s)', 'typed arguments') + arrow(570, 95, 620, 95) +
    box(620, 50, 150, 90, 'Response', 'var(--ok)', 'model → JSON') +
    arrow(275, 140, 275, 175, '', 'var(--bad)') + note(285, 192, '422 with a clear error: your code never runs', 'start', 'var(--bad)')),

  gitModel: svg(780, 190,
    box(10, 50, 160, 70, 'Working tree', 'var(--py)', 'files you edit') + arrow(170, 85, 220, 85, 'git add') +
    box(220, 50, 160, 70, 'Staging', 'var(--warn)', 'next commit') + arrow(380, 85, 440, 85, 'git commit') +
    box(440, 50, 160, 70, 'Local repo', 'var(--k8s)', 'history') + arrow(600, 85, 650, 85, 'git push') +
    box(650, 50, 120, 70, 'GitHub', 'var(--ok)', 'origin') +
    note(390, 165, 'A branch is only a label pointing at a commit: create one per change')),

  ciFlow: svg(780, 170,
    box(10, 50, 120, 60, 'git push', 'var(--py)') + arrow(130, 80, 160, 80) +
    box(160, 50, 140, 60, 'Fresh runner', 'var(--mut)', 'ubuntu-24.04') + arrow(300, 80, 330, 80) +
    box(330, 50, 120, 60, 'tox -e lint', 'var(--k8s)') + arrow(450, 80, 480, 80) +
    box(480, 50, 120, 60, 'tox -e unit', 'var(--k8s)') + arrow(600, 80, 630, 80) +
    box(630, 50, 140, 60, '✔ / ❌ on PR', 'var(--ok)', 'merge gate') +
    note(390, 145, 'Integration tests (deploy to MicroK8s) usually run as a later job')),

  layers: svg(760, 270,
    box(200, 15, 360, 40, 'writable layer (per container)', 'var(--warn)', '') +
    ['COPY src/ ./src            (your code, KB)', 'RUN pip install -r requirements.txt  (MB)', 'COPY requirements.txt', 'python:3.12-slim base (Debian + Python)'].map((t, i) =>
      box(200, 70 + i * 47, 360, 40, t, ['var(--py)', 'var(--ml)', 'var(--k8s)', 'var(--mut)'][i])).join('') +
    note(600, 40, '← lost when the container is deleted', 'start') + note(600, 160, '← read-only image layers', 'start') + note(600, 180, 'shared between images', 'start')),

  cache: svg(760, 250,
    note(190, 22, 'Edit src/app.py, rebuild:', 'middle', 'var(--tx)', 13) + note(570, 22, 'Edit requirements.txt, rebuild:', 'middle', 'var(--tx)', 13) +
    ['FROM python:3.12-slim', 'COPY requirements.txt', 'RUN pip install', 'COPY src/'].map((t, i) =>
      chip(40, 40 + i * 48, 300, `${t}  ${i < 3 ? '✓ cached' : '⟳ rebuilt'}`, i < 3 ? 'var(--ok)' : 'var(--acc)') +
      chip(420, 40 + i * 48, 300, `${t}  ${i < 1 ? '✓ cached' : '⟳ rebuilt'}`, i < 1 ? 'var(--ok)' : 'var(--acc)')).join('') +
    note(380, 240, 'The first changed instruction invalidates every layer after it')),

  volumes: svg(760, 230,
    box(30, 30, 200, 70, 'container v1', 'var(--k8s)', 'deleted ✝') + box(30, 130, 200, 70, 'container v2', 'var(--k8s)', 'new') +
    arrow(230, 65, 320, 105) + arrow(230, 165, 320, 125) +
    box(320, 80, 180, 70, 'volume: mlruns', 'var(--ml)', 'Docker-managed') +
    box(560, 30, 180, 70, 'bind mount', 'var(--py)', './data → /data') + box(560, 130, 180, 70, 'your laptop folder', 'var(--mut)', 'edit files live') + arrow(650, 100, 650, 130) +
    note(380, 222, 'Containers come and go; volumes keep the data')),

  reconcile: svg(760, 270,
    box(290, 15, 180, 60, 'Desired state', 'var(--acc)', 'replicas: 3 (in etcd)') +
    box(560, 110, 180, 60, 'Compare', 'var(--warn)', '3 wanted, 2 running') +
    box(290, 195, 180, 60, 'Act', 'var(--ok)', 'create 1 pod') +
    box(20, 110, 180, 60, 'Observe', 'var(--k8s)', 'actual state') +
    arrow(470, 45, 600, 110) + arrow(600, 170, 470, 225) + arrow(290, 225, 160, 170) + arrow(160, 110, 290, 45) +
    note(380, 145, 'controller loop, forever', 'middle', 'var(--tx)', 13)),

  labels: svg(760, 270,
    box(20, 20, 220, 60, 'Deployment', 'var(--acc)', 'selector: app=cvapi') + box(20, 180, 220, 60, 'Service', 'var(--ml)', 'selector: app=cvapi') +
    box(480, 15, 260, 52, 'Pod  app=cvapi', 'var(--ok)') + box(480, 80, 260, 52, 'Pod  app=cvapi', 'var(--ok)') + box(480, 145, 260, 52, 'Pod  app=cvapi', 'var(--ok)') +
    box(480, 210, 260, 52, 'Pod  app=cv-api  (typo!)', 'var(--bad)') +
    arrow(240, 50, 480, 41) + arrow(240, 50, 480, 106) + arrow(240, 50, 480, 171) +
    arrow(240, 210, 480, 41) + arrow(240, 210, 480, 106) + arrow(240, 210, 480, 171) +
    note(360, 258, 'no selector matches →', 'middle', 'var(--bad)')),

  dns: svg(760, 230,
    zone(20, 10, 340, 210, 'namespace: dev', 'var(--k8s)') + zone(400, 10, 340, 210, 'namespace: mlflow', 'var(--ml)') +
    box(40, 50, 140, 55, 'api pod', 'var(--py)') + box(200, 50, 140, 55, 'Service cvapi', 'var(--k8s)') +
    box(420, 50, 140, 55, 'Service mlflow', 'var(--ml)') + box(580, 50, 140, 55, 'mlflow pod', 'var(--py)') +
    arrow(110, 105, 240, 105) + note(40, 140, 'same namespace → "cvapi"', 'start', 'var(--tx)', 13) +
    arrow(180, 78, 420, 78) + note(40, 170, 'other namespace → "mlflow.mlflow"', 'start', 'var(--tx)', 13) +
    note(40, 198, 'full name → mlflow.mlflow.svc.cluster.local', 'start')),

  probes: svg(780, 230,
    box(10, 80, 160, 70, 'Container starts', 'var(--py)', 'model loading…') + arrow(170, 115, 210, 115) +
    box(210, 20, 180, 60, 'startupProbe', 'var(--warn)', 'done booting?') + box(210, 90, 180, 60, 'readinessProbe', 'var(--k8s)', 'send traffic?') + box(210, 160, 180, 60, 'livenessProbe', 'var(--bad)', 'stuck?') +
    arrow(390, 50, 450, 50) + arrow(390, 120, 450, 120) + arrow(390, 190, 450, 190) +
    box(450, 20, 320, 60, 'fail → wait, other probes paused', 'var(--warn)') + box(450, 90, 320, 60, 'fail → removed from Service (no restart)', 'var(--k8s)') + box(450, 160, 320, 60, 'fail → container restarted', 'var(--bad)')),

  podLife: svg(780, 220,
    box(10, 40, 130, 60, 'Pending', 'var(--warn)', 'waiting for a node') + arrow(140, 70, 170, 70) +
    box(170, 40, 160, 60, 'ContainerCreating', 'var(--k8s)', 'pull image, mount') + arrow(330, 70, 360, 70) +
    box(360, 40, 120, 60, 'Running', 'var(--ok)', 'ready?') + arrow(480, 70, 510, 70) +
    box(510, 40, 120, 60, 'Succeeded', 'var(--mut)', 'jobs only') +
    box(170, 140, 160, 60, 'ImagePullBackOff', 'var(--bad)', 'wrong tag / auth') + arrow(250, 100, 250, 140, '', 'var(--bad)') +
    box(360, 140, 170, 60, 'CrashLoopBackOff', 'var(--bad)', 'app keeps exiting') + arrow(420, 100, 420, 140, '', 'var(--bad)') +
    box(550, 140, 120, 60, 'OOMKilled', 'var(--bad)', 'over memory limit') + arrow(470, 100, 600, 140, '', 'var(--bad)')),

  reqLimits: svg(760, 230,
    `<rect x="60" y="40" width="640" height="50" rx="10" style="fill:var(--card2);stroke:var(--line)"/>` +
    `<rect x="60" y="40" width="200" height="50" rx="10" style="fill:var(--k8s);opacity:.85"/><rect x="60" y="40" width="420" height="50" rx="10" style="fill:none;stroke:var(--bad);stroke-width:3;stroke-dasharray:6 4"/>` +
    note(160, 70, 'request 1Gi', 'middle', '#fff', 13) + note(480, 112, 'limit 2Gi', 'middle', 'var(--bad)', 13) + note(380, 30, 'memory of one container', 'middle', 'var(--tx)', 13) +
    note(160, 112, 'reserved by the scheduler', 'middle') +
    note(60, 155, 'below request: always available', 'start', 'var(--ok)', 13) + note(60, 180, 'between request and limit: allowed if the node has room', 'start', 'var(--warn)', 13) +
    note(60, 205, 'above limit: memory → OOMKilled · CPU → throttled', 'start', 'var(--bad)', 13)),

  hpa: svg(760, 220,
    box(20, 70, 160, 70, 'metrics-server', 'var(--mut)', 'CPU of each pod') + arrow(180, 105, 260, 105) +
    box(260, 60, 220, 90, 'HPA', 'var(--acc)', 'target 70% · min 2 · max 10') + arrow(480, 105, 560, 105, 'replicas: 4') +
    box(560, 70, 180, 70, 'Deployment', 'var(--k8s)', 'scales pods') +
    note(380, 190, 'desired = ceil(replicas × current% / target%) = ceil(2 × 140 / 70) = 4', 'middle', 'var(--tx)', 13)),

  rbac: svg(760, 210,
    box(20, 70, 200, 70, 'ServiceAccount', 'var(--py)', 'dev:trainer (who)') + box(540, 70, 200, 70, 'Role', 'var(--acc)', 'get/list pods (what)') +
    box(280, 70, 200, 70, 'RoleBinding', 'var(--ml)', 'in namespace dev (where)') + arrow(280, 105, 220, 105) + arrow(480, 105, 540, 105) +
    note(380, 180, 'no binding = denied   ·   kubectl auth can-i list pods --as=system:serviceaccount:dev:trainer')),

  registry: svg(760, 230,
    box(20, 80, 160, 70, 'Training runs', 'var(--py)', 'logged in MLflow') + arrow(180, 115, 240, 115, 'register') +
    zone(240, 15, 300, 200, 'livestock-detector', 'var(--ml)') +
    box(260, 50, 120, 40, 'v6', 'var(--mut)') + box(260, 105, 120, 40, 'v7', 'var(--ok)') + box(260, 160, 120, 40, 'v8', 'var(--warn)') +
    chip(400, 113, 120, '@champion', 'var(--ok)') + chip(400, 168, 120, '@challenger', 'var(--warn)') +
    arrow(540, 125, 600, 125) + box(600, 90, 150, 70, 'Serving', 'var(--k8s)', 'loads @champion')),

  kfpDag: svg(760, 230,
    box(20, 85, 140, 60, 'download', 'var(--py)', 'pod') +
    box(230, 25, 150, 60, 'train_a', 'var(--ml)', 'pod + GPU') + box(230, 145, 150, 60, 'train_b', 'var(--ml)', 'pod + GPU') +
    box(450, 85, 140, 60, 'compare', 'var(--k8s)', 'pod') + box(640, 85, 110, 60, 'register', 'var(--ok)') +
    arrow(160, 115, 230, 55) + arrow(160, 115, 230, 175) + arrow(380, 55, 450, 105) + arrow(380, 175, 450, 125) + arrow(590, 115, 640, 115) +
    note(305, 222, 'train_a and train_b run in parallel')),

  dvcFlow: svg(760, 220,
    box(20, 70, 160, 70, 'data/raw (10 GB)', 'var(--py)') + arrow(180, 105, 250, 105, 'dvc add') +
    box(250, 20, 220, 60, 'data/raw.dvc', 'var(--k8s)', 'hash pointer → Git') + box(250, 130, 220, 60, '.dvc/cache', 'var(--mut)', 'local copy') +
    arrow(470, 50, 560, 50, 'git push') + arrow(470, 160, 560, 160, 'dvc push') +
    box(560, 20, 180, 60, 'GitHub', 'var(--ok)', 'tiny file') + box(560, 130, 180, 60, 'S3 / MinIO', 'var(--ml)', 'the real data')),

  relation: svg(760, 220,
    box(20, 70, 200, 80, 'mysql-k8s', 'var(--ml)', 'provides: mysql_client') + box(540, 70, 200, 80, 'mlflow-server', 'var(--ml)', 'requires: mysql_client') +
    zone(270, 50, 220, 120, 'relation data bag', 'var(--warn)') +
    note(380, 100, 'host: mysql-k8s-0', 'middle', 'var(--tx)', 13) + note(380, 122, 'user: mlflow_7', 'middle', 'var(--tx)', 13) + note(380, 144, 'password: ••••••', 'middle', 'var(--tx)', 13) +
    arrow(220, 110, 270, 110, 'writes') + arrow(490, 110, 540, 110, 'reads') +
    note(380, 205, 'juju integrate mlflow-server mysql-k8s')),

  pebble: svg(760, 240,
    zone(20, 10, 720, 220, 'Pod (one unit)', 'var(--k8s)') +
    zone(45, 45, 300, 165, 'charm container', 'var(--acc)') + box(65, 85, 260, 60, 'your charm.py', 'var(--ml)', 'events → reconcile') +
    zone(415, 45, 300, 165, 'workload container', 'var(--py)') + box(435, 75, 260, 50, 'Pebble', 'var(--warn)', 'like systemd') + box(435, 145, 260, 50, 'uvicorn app:app', 'var(--ok)', 'your service') +
    arrow(325, 115, 435, 100, 'add_layer + replan') + arrow(565, 125, 565, 145)),

  star: svg(760, 170,
    box(20, 40, 170, 80, 'Situation', 'var(--py)', 'context') + box(205, 40, 170, 80, 'Task', 'var(--k8s)', 'your responsibility') +
    box(390, 40, 170, 80, 'Action', 'var(--ml)', 'what YOU did') + box(575, 40, 170, 80, 'Result', 'var(--ok)', 'numbers + links') +
    arrow(190, 80, 205, 80) + arrow(375, 80, 390, 80) + arrow(560, 80, 575, 80) +
    note(380, 155, 'Collect facts with STAR, then write the final answer yourself'))
});
