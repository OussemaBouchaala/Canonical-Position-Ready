// ===== Curriculum: mapped to "Python and Kubernetes Software Engineer – Data, Workflows, AI/ML & Analytics" (Canonical, req 594)
const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);

const JOB = {
  title: 'Python and Kubernetes Software Engineer – Data, Workflows, AI/ML & Analytics',
  url: 'https://canonical.com/careers/5703396',
  reqs: [
    { id: 'py', label: 'Professional/academic software delivery using Python', tracks: ['python'] },
    { id: 'k8s', label: 'Kubernetes (the form asks: "Describe your experience with Kubernetes")', tracks: ['containers', 'k8s1', 'k8s2'] },
    { id: 'linux', label: 'Experience with Linux (Debian or Ubuntu preferred)', tracks: ['linux'] },
    { id: 'mlops', label: 'MLOps: Kubeflow, MLflow, DVC, Feast, Airflow', tracks: ['mlops'] },
    { id: 'canon', label: 'Canonical stack: MicroK8s, Juju, charms, snaps', tracks: ['canonical'] },
    { id: 'dist', label: 'Distributed systems: observability, identity, tracing', tracks: ['k8s2'] },
    { id: 'oss', label: 'Experience working on an open source project', tracks: ['oss'] },
    { id: 'quality', label: 'Software quality and testing', tracks: ['python'] },
    { id: 'app', label: 'Academic evidence + written answers in your own words', tracks: ['apply'] }
  ]
};

const TRACKS = [
// ───────────────────────── 1. LINUX
{ id: 'linux', icon: '🐧', title: 'Ubuntu & Linux Foundations', color: 'var(--os)', req: 'Experience with Linux (Debian or Ubuntu preferred)',
  intro: 'Kubernetes is "Linux processes, orchestrated". If Linux feels natural, Kubernetes stops feeling like magic.',
  lessons: [
  { id: 'l1', title: 'How Linux is layered (and why containers exist)', xp: 60, min: 20, diagram: 'linuxStack',
    body: `<p>A Linux system is layers: the <b>kernel</b> manages hardware, memory and processes; <b>user space</b> (shell, systemd, apt) sits on top; your apps sit on top of that.</p>
<div class="analogy">🏢 <b>Analogy:</b> the kernel is the building manager. Every process is a tenant who must ask the manager for space (memory), electricity (CPU) and doors (files, network).</div>
<p>Two kernel features matter enormously for this job:</p>
<ul><li><b>Namespaces</b>: give a process its own private view (own PID 1, own network, own filesystem root).</li>
<li><b>cgroups</b>: limit how much CPU/RAM a group of processes may use.</li></ul>
<div class="callout job">🎯 <b>For Canonical:</b> a container is just a normal Linux process in namespaces + cgroups. Say this in an interview and you will sound like you understand the stack "from kernel to application layer", which is literally in the job description.</div>`,
    videos: [{ l: 'Linux namespaces & cgroups explained', q: 'linux namespaces cgroups explained containers from scratch' }, { l: 'Ubuntu Server crash course', q: 'ubuntu server tutorial beginners' }],
    docs: [{ t: 'Ubuntu Server docs', u: 'https://ubuntu.com/server/docs' }],
    quiz: [
      { q: 'What makes a container isolated from other processes?', o: ['A hypervisor', 'Kernel namespaces + cgroups', 'A separate kernel per container', 'The Docker daemon encrypting memory'], a: 1, e: 'Containers share the host kernel; namespaces isolate the view, cgroups limit resources.' },
      { q: 'Which layer talks directly to hardware?', o: ['bash', 'systemd', 'The kernel', 'apt'], a: 2, e: 'Only the kernel touches hardware; everything else goes through system calls.' }],
    lab: { title: 'Get Ubuntu on Windows (WSL2)', steps: [
      { t: 'Open PowerShell as admin and install WSL with Ubuntu', c: 'wsl --install -d Ubuntu-24.04' },
      { t: 'Reboot, open "Ubuntu", create your user, then update', c: 'sudo apt update && sudo apt upgrade -y' },
      { t: 'See namespaces of your shell process', c: 'ls -l /proc/$$/ns' },
      { t: 'See the cgroup your shell lives in', c: 'cat /proc/$$/cgroup' }] } },
  { id: 'l2', title: 'Shell survival kit: files, permissions, processes', xp: 70, min: 30,
    body: `<p>You will spend your days in a terminal. Learn these cold:</p>
<pre>pwd · ls -la · cd · cp/mv/rm -r · mkdir -p · cat/less · grep -rn "x" .
chmod 755 f · chown user:group f · sudo
ps aux · top/htop · kill -9 PID · df -h · free -h · du -sh *
curl -s http://localhost:8000/health · ss -tlnp  (who listens on which port)
journalctl -u myservice -f  (follow service logs)</pre>
<p><b>Permissions</b> <code>rwxr-xr--</code> = owner can read/write/execute, group read/execute, others read. In numbers: r=4 w=2 x=1 → 754.</p>
<div class="analogy">🔑 Pipes <code>|</code> are conveyor belts: <code>ps aux | grep python | wc -l</code> = list processes → keep the python ones → count them.</div>
<div class="callout tip">💡 Debugging in Kubernetes is the same skills inside a pod: <code>kubectl exec -it pod -- bash</code> then <code>ps</code>, <code>curl</code>, <code>cat</code>, <code>env</code>.</div>`,
    videos: [{ l: 'Linux command line full course', q: 'linux command line full course freecodecamp' }],
    docs: [{ t: 'Ubuntu command line for beginners', u: 'https://ubuntu.com/tutorials/command-line-for-beginners' }],
    quiz: [
      { q: 'chmod 640 file gives…', o: ['owner rw, group r, others nothing', 'owner rwx, group rw, others nothing', 'everyone read', 'owner r, group rw'], a: 0, e: '6=rw, 4=r, 0=none.' },
      { q: 'Which command shows which process listens on port 8000?', o: ['ls -p', 'ss -tlnp', 'df -h', 'chmod'], a: 1, e: 'ss -tlnp: TCP, listening, numeric, with process.' },
      { q: 'How do you follow logs of a systemd service named api?', o: ['tail api', 'journalctl -u api -f', 'systemctl logs api', 'cat /var/api'], a: 1, e: 'journalctl -u <unit> -f streams logs.' }],
    lab: { title: 'Terminal drills', steps: [
      { t: 'Create a project tree in one command', c: 'mkdir -p ~/lab/{src,tests,data} && tree ~/lab || ls -R ~/lab' },
      { t: 'Find every "import" line in a Python project', c: 'grep -rn "^import" ~/lab --include=*.py' },
      { t: 'Run a Python web server in background and find it', c: 'python3 -m http.server 8000 & ss -tlnp | grep 8000' },
      { t: 'Kill it', c: 'kill %1' }] } },
  { id: 'l3', title: 'systemd, apt and snaps (the Ubuntu way)', xp: 70, min: 30,
    body: `<p><b>apt</b> installs Debian packages (<code>.deb</code>) from Ubuntu archives. <b>snap</b> is Canonical's universal package: self-contained, auto-updating, confined. MicroK8s, Juju and LXD are all distributed as snaps, so you <i>must</i> be fluent.</p>
<pre>sudo apt install -y git jq        # .deb packages
snap find microk8s ; sudo snap install microk8s --classic
snap list ; snap info juju ; sudo snap refresh
# channels: latest/stable, 1.31/stable, edge…  →  --channel=1.31/stable</pre>
<p><b>systemd</b> runs services. A unit file turns your Python API into a real service:</p>
<pre>[Unit]
Description=My FastAPI
[Service]
ExecStart=/usr/bin/python3 -m uvicorn app:app --port 8000
Restart=always
[Install]
WantedBy=multi-user.target</pre>
<div class="analogy">🔁 <code>Restart=always</code> is a tiny version of Kubernetes self-healing: if the process dies, restart it. Kubernetes does that across many machines.</div>`,
    videos: [{ l: 'Snaps explained', q: 'what are snap packages ubuntu snapcraft explained' }, { l: 'systemd services tutorial', q: 'systemd service unit file tutorial' }],
    docs: [{ t: 'Snap documentation', u: 'https://snapcraft.io/docs' }, { t: 'Create your first snap', u: 'https://ubuntu.com/tutorials/create-your-first-snap' }],
    quiz: [
      { q: 'How is MicroK8s distributed?', o: ['apt .deb', 'pip package', 'snap', 'Docker image only'], a: 2, e: 'sudo snap install microk8s --classic' },
      { q: 'What does --classic mean for a snap?', o: ['Installs the older, long-term-support release', 'Less strict confinement (full system access)', 'Runs the app inside a desktop GUI sandbox', 'Uses the classic Debian package (.deb) format'], a: 1, e: 'Classic snaps run without strict sandboxing, needed for tools like microk8s/juju CLIs.' },
      { q: 'Restart=always in a systemd unit…', o: ['reboots the machine if the process crashes', 'restarts the process if it exits', 'restarts the process once every hour', 'is ignored unless the unit is enabled'], a: 1, e: 'systemd supervises and restarts it.' }],
    lab: { title: 'Make your CV API a systemd service', steps: [
      { t: 'Write a tiny FastAPI app.py with /health', c: 'pip install fastapi uvicorn' },
      { t: 'Create /etc/systemd/system/cvapi.service (content above)', c: 'sudo nano /etc/systemd/system/cvapi.service' },
      { t: 'Start & enable it', c: 'sudo systemctl daemon-reload && sudo systemctl enable --now cvapi' },
      { t: 'Kill the process and watch systemd bring it back', c: 'sudo pkill -f uvicorn; sleep 2; systemctl status cvapi' }] } }
  ],
  boss: [
    { q: 'A container on Ubuntu uses…', o: ['its own kernel', 'the host kernel', 'a VM kernel', 'no kernel'], a: 1, e: 'Shared host kernel.' },
    { q: 'Install the Juju CLI on Ubuntu:', o: ['pip install juju', 'sudo snap install juju', 'apt install juju-cli', 'docker run juju'], a: 1, e: 'Juju ships as a snap.' },
    { q: 'Which limits RAM of a process group?', o: ['namespaces', 'cgroups', 'chmod', 'apt'], a: 1, e: 'cgroups = resource limits.' },
    { q: 'Numeric permission for rwxr-x---', o: ['750', '755', '640', '770'], a: 0, e: '7,5,0' }]
},
// ───────────────────────── 2. PYTHON
{ id: 'python', icon: '🐍', title: 'Production Python', color: 'var(--py)', req: 'Professional/academic software delivery using Python · software quality & testing',
  intro: 'You already write Python. This track turns "it works on my laptop" into code Canonical would merge: tested, typed, packaged, linted.',
  lessons: [
  { id: 'p1', title: 'Project structure, packaging & virtual envs', xp: 60, min: 25,
    body: `<p>Canonical repos look like this. Copy the shape:</p>
<pre>my-tool/
├── pyproject.toml      # metadata, deps, tool config (ruff, pytest)
├── src/my_tool/__init__.py
├── src/my_tool/core.py
├── tests/test_core.py
├── tox.ini             # Canonical charms use tox heavily
└── README.md</pre>
<pre>python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"      # editable install
# or the modern way:  uv venv && uv pip install -e ".[dev]"</pre>
<div class="callout job">🎯 Charm repos at github.com/canonical use <code>tox -e lint</code>, <code>tox -e unit</code>, <code>tox -e integration</code>. Open one and read its tox.ini; you will recognise this pattern on day one.</div>`,
    videos: [{ l: 'pyproject.toml & packaging', q: 'python packaging pyproject.toml tutorial' }],
    docs: [{ t: 'Python Packaging Guide', u: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/' }, { t: 'tox docs', u: 'https://tox.wiki/' }],
    quiz: [
      { q: 'Why "src/" layout?', o: ['Python imports modules faster from a src/ folder', 'Tests run against the installed package, not random local files', 'pip refuses to build packages without src/', 'It keeps the wheel smaller by excluding tests'], a: 1, e: 'It prevents accidentally importing un-installed code.' },
      { q: 'pip install -e . means', o: ['encrypted: the package is stored signed on disk', 'editable: changes in source apply immediately', 'exclude: installs without its dependencies', 'export: writes the package to a wheel file'], a: 1, e: 'Editable/development install.' }],
    lab: { title: 'Restructure one of your projects', steps: [
      { t: 'Pick your clinical-trial ETL or YOLO inference code; create src/ layout + pyproject.toml', c: '' },
      { t: 'Add ruff for lint/format', c: 'pip install ruff && ruff check . && ruff format .' },
      { t: 'Add a tox.ini with lint and unit envs', c: '' }] } },
  { id: 'p2', title: 'Testing with pytest (unit, mocks, coverage)', xp: 80, min: 35,
    body: `<p>"Passionate about software quality and testing" is in the job. Tests are your proof.</p>
<pre>def iou(a, b): ...

# tests/test_metrics.py
import pytest
from my_tool.metrics import iou

@pytest.mark.parametrize("a,b,exp", [
    ((0,0,10,10), (0,0,10,10), 1.0),
    ((0,0,10,10), (20,20,30,30), 0.0),
])
def test_iou(a, b, exp):
    assert iou(a, b) == pytest.approx(exp)

def test_model_loader(monkeypatch):
    monkeypatch.setattr("my_tool.io.download", lambda url: b"fake")
    ...</pre>
<pre>pytest -q --cov=my_tool --cov-report=term-missing</pre>
<div class="analogy">🧪 Unit test = checking one Lego brick. Integration test = checking the castle stands up. Charms have both: unit tests with <code>ops.testing</code>, integration tests deploying to a real MicroK8s.</div>`,
    videos: [{ l: 'pytest full tutorial', q: 'pytest tutorial fixtures parametrize mock' }],
    docs: [{ t: 'pytest docs', u: 'https://docs.pytest.org/' }],
    quiz: [
      { q: 'parametrize is used to…', o: ['run one test with many inputs', 'run the same tests in parallel', 'skip a test on some platforms', 'replace network calls with mocks'], a: 0, e: 'One test function, many cases.' },
      { q: 'A test that calls a real external API is…', o: ['the ideal unit test: most realistic', 'flaky; mock it in unit tests', 'required for proper test coverage', 'fine as long as it runs fast'], a: 1, e: 'Mock I/O in unit tests; keep real calls for integration tests.' }],
    lab: { title: 'Get to 80% coverage on one module', steps: [
      { t: 'Write 5 parametrized tests for a pure function in your project', c: '' },
      { t: 'Mock one I/O call with monkeypatch', c: '' },
      { t: 'Run coverage and screenshot it for your README', c: 'pytest --cov --cov-report=term-missing' }] } },
  { id: 'p3', title: 'Typing, async & clean APIs (FastAPI)', xp: 70, min: 30,
    body: `<p>Modern idiomatic Python = type hints + dataclasses/pydantic + clear errors.</p>
<pre>from dataclasses import dataclass
@dataclass(frozen=True)
class Detection:
    label: str
    score: float
    box: tuple[int, int, int, int]

def filter_dets(dets: list[Detection], min_score: float = .5) -> list[Detection]:
    return [d for d in dets if d.score >= min_score]</pre>
<p>Check with <code>mypy src/</code> or <code>pyright</code>. For services, FastAPI gives you validation + OpenAPI for free. Add <code>/health</code> and <code>/ready</code> endpoints: Kubernetes probes will call them later.</p>`,
    videos: [{ l: 'Python type hints', q: 'python type hints mypy tutorial' }, { l: 'FastAPI course', q: 'fastapi full course' }],
    docs: [{ t: 'FastAPI', u: 'https://fastapi.tiangolo.com/' }],
    quiz: [
      { q: 'Why add a /ready endpoint?', o: ['So search engines can index the API', 'So Kubernetes knows when to send traffic', 'So the app can log each startup step', 'So clients can check their auth token'], a: 1, e: 'readinessProbe hits it; until it passes, the pod gets no traffic.' }],
    lab: { title: 'Type-check your project', steps: [{ t: 'Add type hints to 3 core functions and run mypy', c: 'pip install mypy && mypy src' }, { t: 'Add /health and /ready to your inference API', c: '' }] } },
  { id: 'p4', title: 'Git & CI with GitHub Actions', xp: 60, min: 25,
    body: `<p>Every Canonical repo runs CI on each PR. Yours should too.</p>
<pre># .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install tox
      - run: tox -e lint,unit</pre>
<p>Good commits: small, one idea each, message in imperative (<code>Fix IoU for empty boxes</code>). Learn <code>git rebase -i</code>, <code>git commit --amend</code>, resolving conflicts.</p>`,
    videos: [{ l: 'GitHub Actions tutorial', q: 'github actions tutorial python ci' }],
    docs: [{ t: 'GitHub Actions for Python', u: 'https://docs.github.com/en/actions/use-cases-and-examples/building-and-testing/building-and-testing-python' }],
    quiz: [{ q: 'A good commit message:', o: ['"Update files in src and tests"', '"Fix IoU for empty boxes"', '"final final v2 (really final)"', '"WIP: misc fixes and changes"'], a: 1, e: 'Imperative, specific.' }],
    lab: { title: 'Green CI badge', steps: [{ t: 'Add ci.yml to your flagship repo', c: '' }, { t: 'Add the CI badge to README', c: '' }] } }
  ],
  boss: [
    { q: 'Canonical charm repos typically run tests with…', o: ['make', 'tox', 'npm', 'gradle'], a: 1, e: 'tox envs: lint / unit / integration.' },
    { q: 'Best place for tool config (ruff, pytest)?', o: ['setup.py', 'pyproject.toml', 'requirements.txt', '.env'], a: 1, e: 'pyproject.toml.' },
    { q: 'monkeypatch is for…', o: ['replacing things during a test', 'speeding up slow Python code', 'type checking a module at runtime', 'patching security bugs in pip'], a: 0, e: 'Temporarily patch attributes.' }]
},
// ───────────────────────── 3. CONTAINERS
{ id: 'containers', icon: '📦', title: 'Containers (Docker → OCI)', color: 'var(--k8s)', req: 'Experience with container technologies (Docker, LXD, Kubernetes)',
  intro: 'Kubernetes runs containers. Before orchestrating them, master building small, secure, reproducible images.',
  lessons: [
  { id: 'c1', title: 'Containers vs VMs, images vs containers', xp: 50, min: 20, diagram: 'vmVsContainer',
    body: `<p>A <b>VM</b> virtualises hardware and boots a full OS. A <b>container</b> is a process sharing the host kernel, so it starts in milliseconds and weighs megabytes.</p>
<div class="analogy">🍰 <b>Image</b> = recipe + frozen cake layers (read-only). <b>Container</b> = a slice you're eating right now (running, with a thin writable layer on top). Many containers from one image.</div>
<p>Canonical also builds <b>LXD</b> (system containers + VMs) and <b>Rocks</b> (OCI images built with Rockcraft on Ubuntu). Same concepts.</p>`,
    videos: [{ l: 'Docker in 100 seconds / crash course', q: 'docker crash course beginners' }],
    docs: [{ t: 'Docker get started', u: 'https://docs.docker.com/get-started/' }, { t: 'Rockcraft', u: 'https://documentation.ubuntu.com/rockcraft/' }],
    quiz: [
      { q: 'Image vs container:', o: ['they are the same thing with two names', 'image is template, container is running instance', 'container is template, image is running instance', 'image runs the app, container stores its data'], a: 1, e: 'Template vs instance.' },
      { q: 'Why do containers start faster than VMs?', o: ['they use a smaller, faster CPU', 'no OS boot, just a process', 'their code is compiled ahead of time', 'images are always stored on SSD'], a: 1, e: 'They reuse the running host kernel.' }],
    lab: { title: 'First containers', steps: [
      { t: 'Install Docker in WSL Ubuntu (or Docker Desktop with WSL backend)', c: 'curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER' },
      { t: 'Run nginx and open it', c: 'docker run -d -p 8080:80 --name web nginx && curl localhost:8080' },
      { t: 'Look inside it', c: 'docker exec -it web bash -c "ps aux; cat /etc/os-release"' }] } },
  { id: 'c2', title: 'Writing great Dockerfiles for ML services', xp: 80, min: 35, diagram: 'dockerFlow',
    body: `<pre>FROM python:3.12-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt   # cached layer!
COPY src/ ./src
RUN useradd -m appuser
USER appuser                                          # never root
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]</pre>
<ul><li><b>Layer order matters</b>: copy requirements before code, so code edits don't reinstall torch.</li>
<li><b>Multi-stage</b> builds: compile in one stage, copy only artifacts to a slim final stage.</li>
<li><b>.dockerignore</b>: exclude datasets, .git, .venv, model checkpoints you mount instead.</li>
<li>Tag with versions (<code>cvapi:0.3.1</code>), never rely on <code>latest</code> in K8s.</li></ul>`,
    videos: [{ l: 'Dockerfile best practices', q: 'dockerfile best practices multi stage python' }],
    docs: [{ t: 'Dockerfile best practices', u: 'https://docs.docker.com/build/building/best-practices/' }],
    quiz: [
      { q: 'Why COPY requirements.txt before the source code?', o: ['Docker copies files alphabetically, so order is required', 'Layer caching: deps rebuild only when requirements change', 'Security: requirements must be scanned before source', 'Smaller image: the source layer compresses better'], a: 1, e: 'Docker caches unchanged layers.' },
      { q: 'Running as root in a container is…', o: ['fine; containers are fully isolated', 'a security risk; add USER', 'required to bind to any port', 'faster, since there are no permission checks'], a: 1, e: 'Use a non-root user.' }],
    lab: { title: 'Containerise your YOLO/FastAPI inference API', steps: [
      { t: 'Write the Dockerfile above for your service', c: '' },
      { t: 'Build and check image size', c: 'docker build -t cvapi:0.1.0 . && docker images cvapi' },
      { t: 'Run it and hit /health', c: 'docker run -p 8000:8000 cvapi:0.1.0' },
      { t: 'Push to GitHub Container Registry', c: 'docker tag cvapi:0.1.0 ghcr.io/<you>/cvapi:0.1.0 && docker push ghcr.io/<you>/cvapi:0.1.0' }] } },
  { id: 'c3', title: 'Volumes, networks & docker compose', xp: 60, min: 25,
    body: `<p>Containers are disposable; data must live outside them.</p>
<pre>services:
  api:
    image: cvapi:0.1.0
    ports: ["8000:8000"]
    environment: { MLFLOW_TRACKING_URI: http://mlflow:5000 }
    depends_on: [mlflow]
  mlflow:
    image: ghcr.io/mlflow/mlflow
    command: mlflow server --host 0.0.0.0
    volumes: ["mlruns:/mlruns"]
volumes: { mlruns: {} }</pre>
<p>Services reach each other by name (<code>http://mlflow:5000</code>) thanks to the compose network's DNS. Kubernetes Services do the same thing at cluster scale.</p>`,
    videos: [{ l: 'Docker compose tutorial', q: 'docker compose tutorial' }],
    docs: [{ t: 'Compose docs', u: 'https://docs.docker.com/compose/' }],
    quiz: [{ q: 'How does api reach mlflow in compose?', o: ['localhost:5000', 'http://mlflow:5000', 'public IP', 'it cannot'], a: 1, e: 'Service name DNS.' }],
    lab: { title: 'API + MLflow with compose', steps: [{ t: 'Write the compose file and docker compose up', c: 'docker compose up -d && docker compose ps' }] } }
  ],
  boss: [
    { q: 'Best tag to deploy to Kubernetes:', o: ['cvapi:latest', 'cvapi:0.3.1', 'cvapi:dev', 'cvapi:stable'], a: 1, e: 'Immutable versioned tags.' },
    { q: 'Data that must survive container restarts goes in…', o: ['the image', 'a volume', '/tmp', 'env vars'], a: 1, e: 'Volumes.' },
    { q: 'Canonical tool to build Ubuntu-based OCI images:', o: ['Snapcraft', 'Rockcraft', 'Charmcraft', 'Packer'], a: 1, e: 'Rockcraft builds "rocks".' }]
},
// ───────────────────────── 4. K8S CORE
{ id: 'k8s1', icon: '☸️', title: 'Kubernetes Core (zero → confident)', color: 'var(--k8s)', req: 'Kubernetes: the #1 gap on your CV', sim: true,
  intro: 'The biggest gap on your CV. We go slowly, with the simulator in every lesson: read a concept, then type the commands and watch the cluster react.',
  lessons: [
  { id: 'k1', title: 'Why Kubernetes? The declarative mindset', xp: 80, min: 25, diagram: 'k8sArch', mission: 'first',
    body: `<p>Docker runs containers on <b>one</b> machine. In production you have many machines, containers crash, traffic spikes, nodes die. Kubernetes is a system where you <b>declare the desired state</b> ("3 copies of cvapi:0.3, reachable on port 80") and controllers work 24/7 to make reality match.</p>
<div class="analogy">🌡️ <b>Thermostat analogy:</b> you don't say "heat for 10 minutes". You say "I want 21°C". The thermostat keeps checking and correcting. Kubernetes controllers are thermostats for your apps. This loop is called <b>reconciliation</b>.</div>
<h3>The pieces (see diagram)</h3>
<ul><li><b>kube-apiserver</b>: the single front door. kubectl, controllers and kubelets all talk to it.</li>
<li><b>etcd</b>: database storing the desired state.</li>
<li><b>scheduler</b>: decides which node a new pod goes to.</li>
<li><b>controller-manager</b>: the thermostat loops.</li>
<li><b>kubelet</b> (on each node): actually starts containers via containerd.</li></ul>
<div class="callout job">🎯 Juju charms are <i>also</i> reconciliation loops (operators). Understanding this one idea connects Kubernetes, operators, Juju and Charmed Kubeflow.</div>`,
    videos: [{ l: 'TechWorld with Nana: Kubernetes full course', q: 'techworld with nana kubernetes tutorial for beginners full course' }, { l: 'Kubernetes explained in 15 minutes', q: 'kubernetes explained 15 minutes architecture' }],
    docs: [{ t: 'Kubernetes concepts: overview', u: 'https://kubernetes.io/docs/concepts/overview/' }, { t: 'Kubernetes components', u: 'https://kubernetes.io/docs/concepts/overview/components/' }],
    quiz: [
      { q: 'Kubernetes is primarily…', o: ['imperative: you give step-by-step commands', 'declarative: you describe desired state', 'a container runtime', 'a cloud provider'], a: 1, e: 'Desired state + reconciliation.' },
      { q: 'Where is the desired state stored?', o: ['kubelet', 'etcd', 'the container', 'Docker Hub'], a: 1, e: 'etcd behind the API server.' },
      { q: 'Which component picks the node for a new pod?', o: ['kubelet', 'kube-proxy', 'kube-scheduler', 'controller-manager'], a: 2, e: 'The scheduler.' },
      { q: 'kubectl talks to…', o: ['each node directly', 'etcd directly', 'the kube-apiserver', 'Docker'], a: 2, e: 'Everything goes through the API server.' }],
    lab: { title: 'Install MicroK8s for real', steps: [
      { t: 'In WSL Ubuntu (systemd enabled) or Multipass VM, install MicroK8s', c: 'sudo snap install microk8s --classic --channel=1.31/stable' },
      { t: 'Add yourself to the group and wait until ready', c: 'sudo usermod -aG microk8s $USER && newgrp microk8s && microk8s status --wait-ready' },
      { t: 'Alias kubectl', c: "echo \"alias kubectl='microk8s kubectl'\" >> ~/.bashrc && source ~/.bashrc" },
      { t: 'See your cluster', c: 'kubectl get nodes -o wide && kubectl get pods -A' }] } },
  { id: 'k2', title: 'Pods, Deployments & ReplicaSets', xp: 100, min: 35, diagram: 'objects', mission: 'deploy',
    body: `<p><b>Pod</b> = smallest unit: one (or a few tightly coupled) containers sharing an IP and volumes. Pods are <b>mortal</b>: you never create them by hand in production.</p>
<p><b>Deployment</b> = "keep N pods of this template alive, and update them safely". It creates a <b>ReplicaSet</b> which creates pods.</p>
<pre>apiVersion: apps/v1
kind: Deployment
metadata:
  name: cvapi
spec:
  replicas: 3
  selector:
    matchLabels: { app: cvapi }      # which pods do I own?
  template:                          # pod blueprint
    metadata:
      labels: { app: cvapi }         # must match selector
    spec:
      containers:
      - name: api
        image: ghcr.io/you/cvapi:0.1.0
        ports: [{ containerPort: 8000 }]</pre>
<div class="analogy">🐑 <b>Pets vs cattle:</b> pods are cattle with numbers (cvapi-7d9f-x2k), not pets with names. One dies → a replacement appears. Never fall in love with a pod.</div>
<div class="callout tip">💡 <b>Labels</b> are the glue of Kubernetes. Deployments find their pods by label, Services find pods by label. 80% of beginner bugs = label mismatch.</div>
<p>Now go to the <b>Simulator tab</b>: create a deployment, delete a pod and watch it come back.</p>`,
    videos: [{ l: 'Pods vs Deployments vs ReplicaSets', q: 'kubernetes pods deployments replicasets explained' }],
    docs: [{ t: 'Deployments', u: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/' }, { t: 'Labels & selectors', u: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/' }],
    quiz: [
      { q: 'You delete a pod managed by a Deployment with replicas: 3. What happens?', o: ['It is gone until you re-apply the YAML', 'The ReplicaSet creates a replacement', 'The whole Deployment is deleted too', 'The node restarts all its containers'], a: 1, e: 'Self-healing: actual (2) ≠ desired (3).' },
      { q: 'selector.matchLabels must match…', o: ['the container image name', 'template.metadata.labels', 'the namespace of the Deployment', 'the hostname label of the node'], a: 1, e: 'Otherwise the API rejects the Deployment.' },
      { q: 'Smallest deployable unit in Kubernetes?', o: ['Container', 'Pod', 'Node', 'Deployment'], a: 1, e: 'Pod.' }],
    yaml: { title: 'Fix the Deployment', tpl: 'apiVersion: [[apps/v1]]\nkind: [[Deployment]]\nmetadata:\n  name: cvapi\nspec:\n  [[replicas]]: 3\n  selector:\n    matchLabels:\n      app: [[cvapi]]\n  template:\n    metadata:\n      labels:\n        app: cvapi\n    spec:\n      [[containers]]:\n      - name: api\n        image: ghcr.io/you/cvapi:0.1.0' },
    lab: { title: 'Real cluster: deploy & self-heal', steps: [
      { t: 'Create a deployment', c: 'kubectl create deployment web --image=nginx:1.27 --replicas=3' },
      { t: 'Watch pods (keep this open in a 2nd terminal)', c: 'kubectl get pods -w' },
      { t: 'Delete one pod, watch it come back', c: 'kubectl delete pod $(kubectl get pods -l app=web -o name | head -1)' },
      { t: 'Export the YAML Kubernetes generated and study it', c: 'kubectl get deploy web -o yaml > web.yaml' }] } },
  { id: 'k3', title: 'Services: stable networking', xp: 100, min: 30, diagram: 'service', mission: 'expose',
    body: `<p>Pods get new IPs every time they are recreated. A <b>Service</b> gives a stable virtual IP + DNS name and load-balances to all pods matching its <b>selector</b>.</p>
<pre>apiVersion: v1
kind: Service
metadata: { name: cvapi }
spec:
  selector: { app: cvapi }    # ← labels again!
  ports:
  - port: 80                  # what clients call
    targetPort: 8000          # container port
  type: ClusterIP             # default: internal only</pre>
<table class="matrix"><tr><th>Type</th><th>Reachable from</th><th>Use</th></tr>
<tr><td>ClusterIP</td><td>inside cluster</td><td>service-to-service (api → mlflow)</td></tr>
<tr><td>NodePort</td><td>nodeIP:30000-32767</td><td>quick testing</td></tr>
<tr><td>LoadBalancer</td><td>external IP (cloud / MetalLB)</td><td>production entrypoint</td></tr></table>
<p>Inside the cluster, DNS name is <code>cvapi.&lt;namespace&gt;.svc.cluster.local</code>, or just <code>cvapi</code> from the same namespace.</p>
<div class="analogy">📞 A Service is a company switchboard number. Employees (pods) come and go, the number stays the same.</div>`,
    videos: [{ l: 'Kubernetes Services explained', q: 'kubernetes services clusterip nodeport loadbalancer explained' }],
    docs: [{ t: 'Service', u: 'https://kubernetes.io/docs/concepts/services-networking/service/' }],
    quiz: [
      { q: 'How does a Service know which pods to send traffic to?', o: ['By pod name', 'By label selector', 'By IP list you write', 'By image'], a: 1, e: 'Selector → endpoints.' },
      { q: 'Default Service type?', o: ['NodePort', 'LoadBalancer', 'ClusterIP', 'Ingress'], a: 2, e: 'ClusterIP.' },
      { q: 'port vs targetPort:', o: ['the same value, written two ways for compatibility', 'port = service port clients use; targetPort = container port', 'port = container port; targetPort = service port clients use', 'targetPort is the external port opened on every node'], a: 1, e: 'Service :80 → container :8000.' }],
    yaml: { title: 'Wire the Service', tpl: 'apiVersion: v1\nkind: [[Service]]\nmetadata:\n  name: cvapi\nspec:\n  [[selector]]:\n    app: cvapi\n  ports:\n  - port: 80\n    [[targetPort]]: 8000\n  type: [[ClusterIP]]' },
    lab: { title: 'Expose and call it', steps: [
      { t: 'Expose the deployment', c: 'kubectl expose deployment web --port=80 --type=ClusterIP' },
      { t: 'Call it from a temporary pod', c: 'kubectl run tmp --rm -it --image=busybox -- wget -qO- http://web' },
      { t: 'See the endpoints (pod IPs behind the service)', c: 'kubectl get endpoints web' },
      { t: 'Port-forward to your laptop', c: 'kubectl port-forward svc/web 8080:80' }] } },
  { id: 'k4', title: 'Scaling, rolling updates & rollbacks', xp: 100, min: 30, diagram: 'rollout', mission: 'rollout',
    body: `<pre>kubectl scale deployment cvapi --replicas=5
kubectl set image deployment/cvapi api=ghcr.io/you/cvapi:0.2.0
kubectl rollout status deployment/cvapi
kubectl rollout history deployment/cvapi
kubectl rollout undo deployment/cvapi        # 🚑 back to 0.1.0</pre>
<p>A rolling update creates a <i>new</i> ReplicaSet and shifts pods over gradually. The old ReplicaSet is kept (scaled to 0), which is why <code>undo</code> is instant.</p>
<p><b>Probes</b> make rollouts safe:</p>
<pre>readinessProbe:   # "can I receive traffic?"
  httpGet: { path: /ready, port: 8000 }
livenessProbe:    # "am I stuck? restart me"
  httpGet: { path: /health, port: 8000 }
  initialDelaySeconds: 20   # ML models load slowly!</pre>
<div class="callout tip">💡 ML gotcha: a YOLO model takes seconds to load. Without a readinessProbe, traffic hits a pod that isn't ready → errors during every deploy.</div>`,
    videos: [{ l: 'Rolling updates & rollbacks', q: 'kubernetes rolling update rollback tutorial' }, { l: 'Liveness vs readiness probes', q: 'kubernetes liveness readiness probes explained' }],
    docs: [{ t: 'Probes', u: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' }],
    quiz: [
      { q: 'Pod is running but model still loading. Which probe should fail?', o: ['liveness', 'readiness', 'startup of node', 'none'], a: 1, e: 'Not ready → no traffic, but no restart.' },
      { q: 'Why is rollout undo fast?', o: ['images are cached on every node', 'the old ReplicaSet still exists', 'etcd restores a nightly backup', 'kubectl keeps the old YAML locally'], a: 1, e: 'It just scales the old RS back up.' }],
    lab: { title: 'Roll forward, roll back', steps: [
      { t: 'Update the image', c: 'kubectl set image deployment/web nginx=nginx:1.27-alpine' },
      { t: 'Watch it', c: 'kubectl rollout status deployment/web' },
      { t: 'Break it on purpose (bad tag) and watch pods fail', c: 'kubectl set image deployment/web nginx=nginx:doesnotexist && kubectl get pods' },
      { t: 'Roll back', c: 'kubectl rollout undo deployment/web' }] } },
  { id: 'k5', title: 'ConfigMaps, Secrets, Volumes & Namespaces', xp: 100, min: 35, diagram: 'config', mission: 'config',
    body: `<p>Never bake config into images. Inject it:</p>
<pre>kubectl create configmap cvapi-cfg --from-literal=CONF_THRESHOLD=0.4
kubectl create secret generic mlflow-cred --from-literal=PASSWORD=s3cr3t</pre>
<pre>containers:
- name: api
  envFrom:
  - configMapRef: { name: cvapi-cfg }
  - secretRef:    { name: mlflow-cred }
  volumeMounts:
  - { name: models, mountPath: /models }
volumes:
- name: models
  persistentVolumeClaim: { claimName: models-pvc }</pre>
<p><b>PersistentVolumeClaim</b>: "I need 10Gi of disk". The storage class (MicroK8s: <code>microk8s enable hostpath-storage</code>) provides a PersistentVolume.</p>
<p><b>Namespaces</b> = folders for resources (<code>kubeflow</code>, <code>dev</code>, <code>prod</code>). In Juju, each model is a namespace.</p>
<div class="callout">⚠️ Secrets are only base64-encoded, not encrypted by default. Anyone with read access can decode them.</div>`,
    videos: [{ l: 'ConfigMap & Secret', q: 'kubernetes configmap secret tutorial' }, { l: 'Persistent volumes', q: 'kubernetes persistent volumes pvc explained' }],
    docs: [{ t: 'ConfigMaps', u: 'https://kubernetes.io/docs/concepts/configuration/configmap/' }, { t: 'Persistent Volumes', u: 'https://kubernetes.io/docs/concepts/storage/persistent-volumes/' }],
    quiz: [
      { q: 'Kubernetes Secrets are by default…', o: ['AES encrypted', 'base64 encoded', 'hashed', 'stored outside the cluster'], a: 1, e: 'Base64 is encoding, not encryption.' },
      { q: 'Your model weights (2GB) should be…', o: ['baked into the container image', 'in a ConfigMap mounted as a file', 'on a PersistentVolume or object storage', 'in a Secret, since weights are private'], a: 2, e: 'ConfigMaps max ~1MB; use PVC or S3/MinIO.' },
      { q: 'In Juju on Kubernetes, a model maps to…', o: ['a pod', 'a namespace', 'a node', 'a container'], a: 1, e: 'One model = one namespace.' }],
    lab: { title: 'Config-driven API', steps: [
      { t: 'Make CONF_THRESHOLD in your API read from env', c: '' },
      { t: 'Create the configmap and reference it', c: 'kubectl create configmap cvapi-cfg --from-literal=CONF_THRESHOLD=0.4' },
      { t: 'Enable storage and create a PVC', c: 'microk8s enable hostpath-storage' },
      { t: 'Create a namespace and deploy there', c: 'kubectl create ns dev && kubectl -n dev get all' }] } },
  { id: 'k6', title: 'Debugging like a pro', xp: 100, min: 30, mission: 'debug',
    body: `<p>The interview killer question: "a pod is not working, what do you do?" Answer with this ladder:</p>
<pre>kubectl get pods                       # STATUS column tells the story
kubectl describe pod &lt;p&gt;               # Events at the bottom!
kubectl logs &lt;p&gt; [-c container] [--previous]
kubectl exec -it &lt;p&gt; -- sh             # look inside
kubectl get events --sort-by=.lastTimestamp
kubectl get endpoints &lt;svc&gt;            # empty = selector mismatch</pre>
<table class="matrix"><tr><th>Status</th><th>Usual cause</th></tr>
<tr><td>ImagePullBackOff</td><td>wrong image/tag, private registry without imagePullSecret</td></tr>
<tr><td>CrashLoopBackOff</td><td>app exits: read <code>logs --previous</code></td></tr>
<tr><td>Pending</td><td>no node has enough CPU/RAM/GPU; PVC not bound</td></tr>
<tr><td>OOMKilled</td><td>memory limit too low (common for ML!)</td></tr>
<tr><td>Running but no traffic</td><td>Service selector ≠ pod labels, or readiness failing</td></tr></table>`,
    videos: [{ l: 'Kubernetes troubleshooting', q: 'kubernetes troubleshooting crashloopbackoff imagepullbackoff' }],
    docs: [{ t: 'Debug pods', u: 'https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/' }],
    quiz: [
      { q: 'Pod in CrashLoopBackOff. First command?', o: ['kubectl delete ns <namespace>', 'kubectl logs <pod> --previous', 'kubectl scale deploy --replicas=0', 'sudo reboot the node'], a: 1, e: 'See why the previous container died.' },
      { q: 'Service returns nothing; endpoints list is empty. Cause?', o: ['cluster DNS (CoreDNS) is down', 'selector does not match pod labels', 'too many replicas behind the service', 'etcd has run out of disk space'], a: 1, e: 'No matching pods → no endpoints.' },
      { q: 'Pod Pending forever with "Insufficient nvidia.com/gpu"', o: ['the image name is wrong', 'no node has a free GPU', 'the readiness probe fails', 'a mounted secret is missing'], a: 1, e: 'Scheduler can\'t place it.' }],
    lab: { title: 'Break & fix', steps: [
      { t: 'Deploy an image that crashes', c: 'kubectl create deployment crash --image=busybox -- sh -c "echo boom; exit 1"' },
      { t: 'Diagnose it with describe + logs --previous', c: 'kubectl describe pod -l app=crash; kubectl logs -l app=crash --previous' },
      { t: 'Clean up', c: 'kubectl delete deployment crash' }] } }
  ],
  boss: [
    { q: 'Desired replicas 3, a node dies taking 1 pod. Result?', o: ['2 pods remain until the node comes back', 'scheduler places a new pod on another node', 'the Deployment is deleted with the node', 'the whole cluster stops scheduling pods'], a: 1, e: 'Reconciliation.' },
    { q: 'kubectl expose deployment web --port=80 creates…', o: ['Ingress', 'Service', 'Pod', 'ConfigMap'], a: 1, e: 'A Service.' },
    { q: 'OOMKilled means…', o: ['the image could not be pulled', 'container exceeded memory limit', 'the liveness probe kept failing', 'the node ran out of disk space'], a: 1, e: 'Raise limits or reduce memory.' },
    { q: 'Which object owns the pods directly?', o: ['Deployment', 'ReplicaSet', 'Service', 'Namespace'], a: 1, e: 'Deployment → ReplicaSet → Pods.' },
    { q: 'Where do you look first in describe output?', o: ['Labels at the top', 'Events at the bottom', 'the apiVersion field', 'the Annotations section'], a: 1, e: 'Events tell you what happened.' }]
},
// ───────────────────────── 5. K8S ADVANCED
{ id: 'k8s2', icon: '🚀', title: 'Kubernetes in Production', color: 'var(--k8s)', req: 'Distributed systems: observability, identity, tracing · Helm · GPUs',
  intro: 'What separates a tutorial-follower from an engineer: Ingress, Helm, RBAC, resources & GPUs, observability, and operators.',
  lessons: [
  { id: 'a1', title: 'Ingress & exposing HTTP services', xp: 80, min: 25, diagram: 'ingress',
    body: `<p>One entrypoint, many services, routed by host/path:</p>
<pre>apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: main }
spec:
  rules:
  - host: cv.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend: { service: { name: cvapi, port: { number: 80 } } }</pre>
<pre>microk8s enable ingress      # nginx ingress controller</pre>
<p>An Ingress object does nothing alone; an <b>Ingress controller</b> (nginx, traefik) reads it and configures the proxy. Same pattern again: a controller reconciling an object.</p>`,
    videos: [{ l: 'Ingress explained', q: 'kubernetes ingress explained nginx ingress controller' }],
    docs: [{ t: 'Ingress', u: 'https://kubernetes.io/docs/concepts/services-networking/ingress/' }],
    quiz: [{ q: 'You create an Ingress but nothing routes. Likely?', o: ['no ingress controller installed', 'too many pods behind the Service', 'a wrong label on the namespace', 'etcd rejected the Ingress object'], a: 0, e: 'Enable one: microk8s enable ingress.' }],
    lab: { title: 'Route /api to your service', steps: [{ t: 'Enable ingress and apply the manifest', c: 'microk8s enable ingress && kubectl apply -f ingress.yaml' }, { t: 'Add cv.local to hosts and curl', c: 'curl http://cv.local/api/health' }] } },
  { id: 'a2', title: 'Helm: packaging Kubernetes apps', xp: 100, min: 35, diagram: 'helm',
    body: `<p>Copy-pasting YAML for dev/staging/prod doesn't scale. <b>Helm</b> = templates + values.</p>
<pre>helm create cvapi        # scaffolds a chart
cvapi/
  Chart.yaml
  values.yaml           # replicaCount: 2, image.tag: 0.1.0
  templates/deployment.yaml   # replicas: {{ .Values.replicaCount }}

helm install cv ./cvapi --set image.tag=0.2.0
helm upgrade cv ./cvapi -f values-prod.yaml
helm rollback cv 1
helm template ./cvapi   # render YAML without installing (great for learning)</pre>
<div class="callout job">🎯 Canonical's own answer to "packaging + day-2 operations" is <b>charms</b> (next tracks). Know Helm well, then be able to say: "Helm handles install-time templating; charms also handle day-2: config changes, relations, upgrades, backups." That shows product understanding.</div>`,
    videos: [{ l: 'Helm tutorial', q: 'helm chart tutorial beginners' }],
    docs: [{ t: 'Helm docs', u: 'https://helm.sh/docs/' }],
    quiz: [
      { q: 'helm template does…', o: ['installs the chart into the cluster', 'renders the YAML locally', 'deletes the release\'s resources', 'uploads the chart to a registry'], a: 1, e: 'Rendering only.' },
      { q: 'Where do environment differences go?', o: ['separate charts', 'values files', 'image', 'etcd'], a: 1, e: 'values-dev.yaml, values-prod.yaml.' }],
    lab: { title: 'Helm chart for your CV API', steps: [{ t: 'helm create and adapt to your image + probes', c: 'sudo snap install helm --classic && helm create cvapi' }, { t: 'Install with 2 replicas, upgrade to 4', c: 'helm install cv ./cvapi && helm upgrade cv ./cvapi --set replicaCount=4' }] } },
  { id: 'a3', title: 'Resources, autoscaling & GPUs for ML', xp: 100, min: 30,
    body: `<pre>resources:
  requests: { cpu: "500m", memory: "1Gi" }   # scheduler reserves this
  limits:   { cpu: "2",    memory: "2Gi", nvidia.com/gpu: 1 }</pre>
<ul><li><b>requests</b> = used for scheduling (guaranteed). <b>limits</b> = hard cap (memory over limit → OOMKilled).</li>
<li><b>HPA</b>: <code>kubectl autoscale deployment cvapi --min=2 --max=10 --cpu-percent=70</code> (needs metrics-server: <code>microk8s enable metrics-server</code>).</li>
<li><b>GPUs</b>: <code>microk8s enable gpu</code> (NVIDIA operator); pods request <code>nvidia.com/gpu: 1</code>.</li>
<li><b>Jobs / CronJobs</b>: run-to-completion work: batch inference, nightly retraining.</li></ul>
<div class="callout job">🎯 The Kubeflow team targets "GPU-accelerated bare-metal". Explaining requests vs limits and GPU scheduling, using your YOLO training experience, is a strong interview moment.</div>`,
    videos: [{ l: 'Requests & limits', q: 'kubernetes requests limits explained' }, { l: 'GPUs in Kubernetes', q: 'kubernetes gpu nvidia operator tutorial' }],
    docs: [{ t: 'Resource management', u: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' }, { t: 'Jobs', u: 'https://kubernetes.io/docs/concepts/workloads/controllers/job/' }],
    quiz: [
      { q: 'Scheduler uses ___ to place pods', o: ['limits', 'requests', 'labels only', 'image size'], a: 1, e: 'Requests.' },
      { q: 'Nightly retraining should be a…', o: ['Deployment', 'CronJob', 'Service', 'DaemonSet'], a: 1, e: 'CronJob creates Jobs on a schedule.' }],
    lab: { title: 'Autoscale', steps: [{ t: 'Enable metrics-server, add requests, create HPA', c: 'microk8s enable metrics-server && kubectl autoscale deployment web --min=2 --max=6 --cpu-percent=50' }, { t: 'Generate load and watch', c: 'kubectl get hpa -w' }] } },
  { id: 'a4', title: 'RBAC & identity', xp: 80, min: 25,
    body: `<p>Who can do what? <b>ServiceAccount</b> (identity of a pod) + <b>Role</b> (allowed verbs on resources) + <b>RoleBinding</b> (glue).</p>
<pre>kind: Role
metadata: { name: pod-reader, namespace: dev }
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get","list","watch"]
---
kind: RoleBinding
subjects: [{ kind: ServiceAccount, name: trainer, namespace: dev }]
roleRef: { kind: Role, name: pod-reader, apiGroup: rbac.authorization.k8s.io }</pre>
<pre>kubectl auth can-i list pods --as=system:serviceaccount:dev:trainer -n dev</pre>
<p>Kubeflow uses this heavily (each user profile = namespace + RBAC), plus Dex/OIDC for login: the "identity" in the job description.</p>`,
    videos: [{ l: 'RBAC explained', q: 'kubernetes rbac explained serviceaccount role rolebinding' }],
    docs: [{ t: 'RBAC', u: 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/' }],
    quiz: [{ q: 'Role is namespaced; cluster-wide equivalent is…', o: ['GlobalRole', 'ClusterRole', 'AdminRole', 'NodeRole'], a: 1, e: 'ClusterRole + ClusterRoleBinding.' }],
    lab: { title: 'Least privilege', steps: [{ t: 'Create SA, Role, RoleBinding and test with auth can-i', c: '' }] } },
  { id: 'a5', title: 'Observability: metrics, logs, traces', xp: 100, min: 30, diagram: 'observability',
    body: `<p>"Master distributed systems concepts such as observability, identity, tracing" is a direct quote from the job.</p>
<ul><li><b>Metrics</b> (Prometheus): numbers over time: latency p95, requests/s, GPU util.</li>
<li><b>Logs</b> (Loki): what happened, as text; log JSON with request ids.</li>
<li><b>Traces</b> (OpenTelemetry → Tempo): the path of one request across services.</li></ul>
<pre>from prometheus_client import Counter, Histogram, make_asgi_app
INFER = Histogram("inference_seconds", "Model latency")
app.mount("/metrics", make_asgi_app())
@app.post("/predict")
def predict(img):
    with INFER.time():
        return model(img)</pre>
<div class="callout job">🎯 Canonical ships this as <b>COS (Canonical Observability Stack)</b>: Prometheus, Loki, Grafana, Tempo deployed with Juju. Charms integrate with it via relations.</div>`,
    videos: [{ l: 'Prometheus + Grafana on Kubernetes', q: 'prometheus grafana kubernetes tutorial' }, { l: 'OpenTelemetry intro', q: 'opentelemetry tracing explained python' }],
    docs: [{ t: 'Canonical Observability Stack', u: 'https://canonical.com/observability' }, { t: 'prometheus_client', u: 'https://prometheus.github.io/client_python/' }],
    quiz: [
      { q: '"Which service made this request slow?" needs…', o: ['metrics', 'logs', 'traces', 'configmaps'], a: 2, e: 'Distributed tracing.' },
      { q: 'Canonical deploys its observability stack with…', o: ['Helm only', 'Juju (COS)', 'Ansible', 'Terraform only'], a: 1, e: 'COS / COS Lite via Juju.' }],
    lab: { title: 'Instrument your API', steps: [{ t: 'Add /metrics with a latency Histogram', c: 'pip install prometheus-client' }, { t: 'Enable MicroK8s observability addon and open Grafana', c: 'microk8s enable observability' }] } },
  { id: 'a6', title: 'Operators & CRDs (the bridge to Juju)', xp: 100, min: 30,
    body: `<p>Kubernetes can be extended with <b>CustomResourceDefinitions</b>: new object kinds like <code>Notebook</code>, <code>InferenceService</code>, <code>Profile</code> (all used by Kubeflow). An <b>operator</b> is a controller that reconciles those custom objects: it encodes human ops knowledge in code.</p>
<pre>kubectl get crd | grep kubeflow
kubectl get notebooks -A</pre>
<div class="analogy">🧑‍🔧 An operator is an SRE who never sleeps: "if the DB primary dies, promote a replica, update the config, notify".</div>
<p>Juju charms are operators too, written in Python with the <code>ops</code> library, and they can manage things <i>outside</i> Kubernetes (VMs, bare metal) and integrate with each other.</p>`,
    videos: [{ l: 'Kubernetes operators explained', q: 'kubernetes operators explained crd' }],
    docs: [{ t: 'Operator pattern', u: 'https://kubernetes.io/docs/concepts/extend-kubernetes/operator/' }],
    quiz: [{ q: 'An operator is…', o: ['a sysadmin job title in a K8s team', 'a controller reconciling custom resources', 'a Helm chart with extra hooks', 'a special node type that runs add-ons'], a: 1, e: 'Controller + CRDs + domain knowledge.' }],
    lab: { title: 'Explore a CRD', steps: [{ t: 'List CRDs on your cluster and describe one', c: 'kubectl get crd && kubectl explain <crd-kind>' }] } }
  ],
  boss: [
    { q: 'Memory limit exceeded →', o: ['throttled', 'OOMKilled', 'evicted to another region', 'nothing'], a: 1, e: 'Memory is not compressible.' },
    { q: 'Request latency p95 lives in…', o: ['logs', 'metrics', 'secrets', 'etcd'], a: 1, e: 'Prometheus histogram.' },
    { q: 'Kubeflow Notebook kind is a…', o: ['built-in', 'CRD', 'Helm value', 'Juju model'], a: 1, e: 'Custom resource.' },
    { q: 'helm rollback cv 1 →', o: ['deletes release cv', 'reverts to revision 1', 'renders revision 1 locally', 'upgrades to chart v1'], a: 1, e: 'Revision history.' }]
},
// ───────────────────────── 6. MLOPS
{ id: 'mlops', icon: '🧠', title: 'MLOps Stack: Kubeflow, MLflow, DVC, Feast, Airflow', color: 'var(--ml)', req: 'Kubeflow, MLFlow, DVC, Feast · Airflow/Temporal · data pipelines',
  intro: 'Your strongest area: you already train YOLO models and use DVC. Now industrialise it on Kubernetes.',
  lessons: [
  { id: 'm1', title: 'The MLOps lifecycle', xp: 60, min: 20, diagram: 'mlops',
    body: `<p>MLOps = DevOps for models: reproducible data, tracked experiments, automated pipelines, versioned models, monitored serving.</p>
<table class="matrix"><tr><th>Need</th><th>Tool (Canonical-supported)</th></tr>
<tr><td>Version data</td><td>DVC</td></tr><tr><td>Reuse features online/offline</td><td>Feast</td></tr>
<tr><td>Run multi-step training on K8s</td><td>Kubeflow Pipelines</td></tr><tr><td>Track runs, params, metrics, models</td><td>MLflow</td></tr>
<tr><td>Hyperparameter tuning</td><td>Katib (Kubeflow)</td></tr><tr><td>Serve models</td><td>KServe</td></tr>
<tr><td>General workflow orchestration</td><td>Airflow / Temporal</td></tr></table>
<div class="callout job">🎯 Your story: "In my livestock project I did X with DVC; I rebuilt it as a Kubeflow pipeline with MLflow tracking on MicroK8s." That's exactly the product the team ships.</div>`,
    videos: [{ l: 'MLOps explained', q: 'mlops explained lifecycle' }],
    docs: [{ t: 'Canonical MLOps', u: 'https://canonical.com/mlops' }],
    quiz: [{ q: 'Hyperparameter tuning in Kubeflow:', o: ['KServe', 'Katib', 'Feast', 'Dex'], a: 1, e: 'Katib.' }, { q: 'Serving models in Kubeflow:', o: ['KServe', 'Katib', 'DVC', 'Argo'], a: 0, e: 'KServe.' }],
    lab: { title: 'Map your project', steps: [{ t: 'Draw your livestock pipeline and label which tool owns each step', c: '' }] } },
  { id: 'm2', title: 'MLflow: tracking & model registry', xp: 90, min: 30,
    body: `<pre>import mlflow
mlflow.set_tracking_uri("http://mlflow:5000")
mlflow.set_experiment("livestock-yolo")
with mlflow.start_run():
    mlflow.log_params({"imgsz": 1280, "p2_head": True, "sahi": True})
    results = model.train(...)
    mlflow.log_metric("mAP50", results.box.map50)
    mlflow.log_artifact("runs/detect/train/weights/best.pt")
    mlflow.register_model(f"runs:/{run.info.run_id}/model", "livestock-detector")</pre>
<p>Registry stages/aliases: <code>@champion</code>, <code>@challenger</code>. Your serving code loads <code>models:/livestock-detector@champion</code>, so promotions need no code change.</p>`,
    videos: [{ l: 'MLflow tutorial', q: 'mlflow tutorial tracking model registry' }],
    docs: [{ t: 'Charmed MLflow docs', u: 'https://documentation.ubuntu.com/charmed-mlflow/en/latest/' }, { t: 'MLflow docs', u: 'https://mlflow.org/docs/latest/' }],
    quiz: [{ q: 'Why register models with aliases?', o: ['MLflow trains faster with aliased runs', 'serving loads "@champion" without code changes', 'aliases compress the stored model files', 'PyTorch needs an alias to load weights'], a: 1, e: 'Decouple deploy from code.' }],
    lab: { title: 'Track a real YOLO run', steps: [{ t: 'Run MLflow locally (compose from the containers track)', c: '' }, { t: 'Log params/metrics/weights of one training', c: '' }, { t: 'Compare 2 runs in the UI (P2 head vs not)', c: '' }] } },
  { id: 'm3', title: 'Kubeflow Pipelines (KFP v2)', xp: 120, min: 40,
    body: `<p>Each step = a containerised component; the pipeline = a DAG Kubeflow runs as pods.</p>
<pre>from kfp import dsl, compiler

@dsl.component(base_image="python:3.12", packages_to_install=["pandas"])
def prepare(out_data: dsl.Output[dsl.Dataset]):
    ...

@dsl.component(base_image="ghcr.io/you/yolo-train:0.1")
def train(data: dsl.Input[dsl.Dataset], epochs: int) -> float:
    ...; return map50

@dsl.pipeline(name="livestock")
def pipe(epochs: int = 50):
    d = prepare()
    t = train(data=d.outputs["out_data"], epochs=epochs)
    t.set_accelerator_type("nvidia.com/gpu").set_accelerator_limit(1)

compiler.Compiler().compile(pipe, "pipe.yaml")</pre>
<p>Upload <code>pipe.yaml</code> in the Kubeflow UI or with the KFP client, run it, inspect each step's logs and artifacts.</p>`,
    videos: [{ l: 'Kubeflow Pipelines tutorial', q: 'kubeflow pipelines v2 tutorial' }, { l: 'Charmed Kubeflow demo', q: 'charmed kubeflow canonical demo' }],
    docs: [{ t: 'Charmed Kubeflow docs', u: 'https://documentation.ubuntu.com/charmed-kubeflow' }, { t: 'KFP docs', u: 'https://www.kubeflow.org/docs/components/pipelines/' }],
    quiz: [{ q: 'Each pipeline component runs as…', o: ['a Python thread', 'a pod/container', 'a separate VM', 'a cron job'], a: 1, e: 'Containerised steps on K8s.' }, { q: 'How do you give a step a GPU?', o: ['set_accelerator_limit', 'setting env GPU=1', 'impossible in KFP', 'a Helm chart value'], a: 0, e: 'KFP v2 accelerator API.' }],
    lab: { title: 'Flagship project: your pipeline', steps: [
      { t: 'Deploy Charmed Kubeflow on MicroK8s (needs ~16GB RAM; else use a cloud VM)', c: 'see documentation.ubuntu.com/charmed-kubeflow → Get started' },
      { t: 'Write prepare → train → evaluate components', c: '' },
      { t: 'Log to MLflow from the train step', c: '' },
      { t: 'Publish repo with diagram + README: this is your CV line', c: '' }] } },
  { id: 'm4', title: 'DVC, Feast & workflow orchestrators', xp: 80, min: 30,
    body: `<pre>dvc init && dvc add data/raw
dvc remote add -d s3 s3://bucket/dvc
dvc push            # data to S3/MinIO, .dvc pointer to git
dvc repro           # rerun pipeline stages that changed (dvc.yaml)</pre>
<p><b>Feast</b>: define features once, serve them offline (training) and online (low-latency inference), so there's no training/serving skew.</p>
<p><b>Airflow</b> (DAGs in Python, schedule-oriented) vs <b>Temporal</b> (durable code workflows) vs <b>KFP</b> (ML on K8s). Know when each fits.</p>`,
    videos: [{ l: 'DVC tutorial', q: 'dvc data version control tutorial' }, { l: 'Feast feature store intro', q: 'feast feature store tutorial' }, { l: 'Airflow intro', q: 'apache airflow tutorial beginners' }],
    docs: [{ t: 'DVC', u: 'https://dvc.org/doc' }, { t: 'Feast', u: 'https://docs.feast.dev/' }],
    quiz: [{ q: 'Feast mainly solves…', o: ['GPU scheduling for training jobs', 'training/serving skew of features', 'logging and tracing of pipelines', 'auth between ML microservices'], a: 1, e: 'Same feature definitions offline & online.' }, { q: 'dvc push uploads…', o: ['your code to GitHub', 'data to remote storage', 'the Docker image to GHCR', 'the model to the MLflow registry'], a: 1, e: 'Data/artifacts to remote.' }],
    lab: { title: 'DVC + MinIO on K8s', steps: [{ t: 'Deploy MinIO on MicroK8s and use it as DVC remote', c: 'microk8s enable minio' }] } }
  ],
  boss: [
    { q: 'Canonical packages Kubeflow as…', o: ['an official Helm chart', 'Charmed Kubeflow (Juju bundle)', 'a prebuilt Ubuntu VM image', 'a pip package (kubeflow)'], a: 1, e: 'Charmed Kubeflow bundle.' },
    { q: 'Experiment tracking:', o: ['Feast', 'MLflow', 'KServe', 'Dex'], a: 1, e: 'MLflow.' },
    { q: 'DAG of containerised ML steps on K8s:', o: ['KFP', 'DVC', 'Feast', 'Prometheus'], a: 0, e: 'Kubeflow Pipelines.' }]
},
// ───────────────────────── 7. CANONICAL
{ id: 'canonical', icon: '🟠', title: 'The Canonical Stack: MicroK8s, Juju, Charms', color: 'var(--acc)', req: 'Charmed Kubeflow = Python operators orchestrated by Juju',
  intro: 'This is what you would actually build every day. Few candidates prepare this; you will.',
  lessons: [
  { id: 'j1', title: 'Juju: models, applications, integrations', xp: 100, min: 35, diagram: 'juju',
    body: `<pre>sudo snap install juju
juju bootstrap microk8s uk8s           # controller on your MicroK8s
juju add-model mlflow                  # = namespace
juju deploy mlflow-server
juju deploy mysql-k8s --trust
juju integrate mlflow-server mysql-k8s # they exchange credentials!
juju status --watch 2s
juju config mlflow-server             # day-2 config
juju deploy kubeflow --trust --channel=1.9/stable   # whole bundle</pre>
<div class="analogy">🧩 Charms are Lego bricks with smart studs: plug MLflow into MySQL and they negotiate the DB user/password by themselves. With Helm you'd wire secrets by hand.</div>`,
    videos: [{ l: 'Juju introduction', q: 'juju charms canonical introduction' }],
    docs: [{ t: 'Juju tutorial', u: 'https://documentation.ubuntu.com/juju/3.6/tutorial/' }, { t: 'Charmhub', u: 'https://charmhub.io/' }],
    quiz: [{ q: 'juju integrate A B does…', o: ['merges the source code of both charms into one charm', 'creates a relation so charms exchange data (e.g. DB creds)', 'deploys B as a sidecar container inside A\'s pod', 'removes A and replaces it with B in the model'], a: 1, e: 'Relations/integrations.' }, { q: 'A Juju model on K8s is…', o: ['a single pod', 'a namespace', 'a CRD object', 'a worker node'], a: 1, e: 'Namespace.' }],
    lab: { title: 'Deploy MLflow with Juju', steps: [{ t: 'Bootstrap Juju on MicroK8s', c: 'juju bootstrap microk8s uk8s' }, { t: 'Deploy & integrate mlflow-server + mysql-k8s', c: '' }, { t: 'kubectl get pods -n mlflow: see what Juju created', c: '' }] } },
  { id: 'j2', title: 'Write your first charm with ops', xp: 150, min: 60, diagram: 'charmEvents',
    body: `<pre>import ops

class CvApiCharm(ops.CharmBase):
    def __init__(self, framework):
        super().__init__(framework)
        framework.observe(self.on["api"].pebble_ready, self._reconcile)
        framework.observe(self.on.config_changed, self._reconcile)

    def _reconcile(self, event):
        container = self.unit.get_container("api")
        if not container.can_connect():
            event.defer(); return
        layer = {"services": {"api": {
            "override": "replace", "startup": "enabled",
            "command": "uvicorn app:app --host 0.0.0.0 --port 8000",
            "environment": {"CONF_THRESHOLD": str(self.config["threshold"])}}}}
        container.add_layer("api", layer, combine=True)
        container.replan()
        self.unit.status = ops.ActiveStatus()

if __name__ == "__main__":
    ops.main(CvApiCharm)</pre>
<p>Files: <code>charmcraft.yaml</code> (metadata, containers, config options), <code>src/charm.py</code>, <code>tests/unit</code> (with <code>ops.testing</code>), <code>tests/integration</code> (pytest-operator / jubilant).</p>
<pre>charmcraft init --profile kubernetes
charmcraft pack
juju deploy ./cvapi_amd64.charm --resource api-image=ghcr.io/you/cvapi:0.1.0</pre>`,
    videos: [{ l: 'Write a Kubernetes charm', q: 'write your first kubernetes charm ops canonical' }],
    docs: [{ t: 'Ops tutorial: zero to hero', u: 'https://documentation.ubuntu.com/ops/latest/tutorial/from-zero-to-hero-write-your-first-kubernetes-charm/' }, { t: 'Charmcraft', u: 'https://documentation.ubuntu.com/charmcraft/' }],
    quiz: [
      { q: 'Pebble is…', o: ['a small embedded database that stores charm state', 'the process manager inside workload containers that charms control', 'a CLI tool for building and publishing snaps', 'Canonical\'s CI system that tests charms on PRs'], a: 1, e: 'Charms talk to Pebble to start/stop services.' },
      { q: 'If the container is not reachable yet, a handler should…', o: ['crash', 'event.defer()', 'delete pod', 'sleep forever'], a: 1, e: 'Defer and retry later.' },
      { q: 'Charm unit tests use…', o: ['ops.testing (Scenario)', 'selenium (browser)', 'locust (load tests)', 'jest (JavaScript)'], a: 0, e: 'ops.testing.' }],
    lab: { title: 'Charm your CV API (killer portfolio piece)', steps: [{ t: 'Follow the official zero-to-hero tutorial end to end', c: '' }, { t: 'Adapt it to your own cvapi image with a threshold config option', c: '' }, { t: 'Add 3 unit tests with ops.testing', c: '' }, { t: 'Publish the repo and mention it in your cover letter', c: '' }] } },
  { id: 'j3', title: 'Charmed Kubeflow architecture & the team\'s work', xp: 80, min: 25,
    body: `<p>Charmed Kubeflow is a <b>bundle</b> of ~30 charms (kfp-api, katib-controller, kserve-controller, istio, dex-auth, oidc-gatekeeper, jupyter-ui...) integrated by Juju. Work you might do:</p>
<ul><li>Upgrade a charm to a new upstream Kubeflow release; fix breaking changes.</li><li>Add an integration (e.g. MLflow ↔ Kubeflow, or COS for metrics).</li>
<li>Rocks: rebuild upstream images on Ubuntu with Rockcraft for security.</li><li>Write integration tests deploying the bundle on MicroK8s / EKS / AKS in CI.</li><li>Fix GitHub issues reported by users.</li></ul>
<div class="callout job">🎯 Before applying: open <a href="https://github.com/canonical/bundle-kubeflow" target="_blank">canonical/bundle-kubeflow</a> and a charm repo like <code>kfp-operators</code>; read 5 recent PRs. In interview: "I saw you're working on X." 🔥</div>`,
    videos: [{ l: 'Charmed Kubeflow overview', q: 'charmed kubeflow overview canonical' }],
    docs: [{ t: 'bundle-kubeflow on GitHub', u: 'https://github.com/canonical/bundle-kubeflow' }, { t: 'Charmed Kubeflow docs', u: 'https://documentation.ubuntu.com/charmed-kubeflow' }],
    quiz: [{ q: 'A Juju bundle is…', o: ['a tarball of container images for offline install', 'a set of charms + their integrations deployed together', 'a Helm chart converted into Juju format', 'a Kubernetes namespace with its quotas'], a: 1, e: 'Bundle.' }],
    lab: { title: 'Repo reconnaissance', steps: [{ t: 'Read 5 recent merged PRs in canonical Kubeflow repos; note 3 things you learned', c: '' }] } }
  ],
  boss: [
    { q: 'Charms are written in…', o: ['Go (controller)', 'Python (ops)', 'Bash scripts', 'YAML only'], a: 1, e: 'Python ops framework.' },
    { q: 'Pack a charm:', o: ['snapcraft', 'charmcraft pack', 'helm package', 'docker build'], a: 1, e: 'charmcraft pack.' },
    { q: 'juju deploy mysql-k8s --trust — --trust gives…', o: ['access to a GPU on the node', 'cluster permissions the charm needs', 'a free commercial license', 'TLS certificates for the app'], a: 1, e: 'Extra K8s RBAC for the charm.' }]
},
// ───────────────────────── 8. OSS
{ id: 'oss', icon: '🌍', title: 'Open Source Contributor', color: 'var(--ok)', req: 'Experience working on an open source project · interact in public with upstream',
  intro: 'Canonical works "in the fishbowl". A merged PR is worth more than any certificate.',
  lessons: [
  { id: 'o1', title: 'Your first upstream PR', xp: 120, min: 60, diagram: 'gitflow',
    body: `<ol><li>Pick a repo you use: <code>canonical/kfp-operators</code>, <code>canonical/mlflow-operator</code>, Ultralytics, SAHI, supervision.</li>
<li>Filter issues: <code>label:"good first issue"</code> or docs/test gaps.</li>
<li>Comment: "I'd like to work on this; my plan is …". Wait for a maintainer.</li>
<li>Fork → branch → small focused change + test → run their tox/CI locally.</li>
<li>PR description: what, why, how tested. Link the issue. Respond to reviews politely and fast.</li></ol>
<pre>git clone git@github.com:you/kfp-operators && cd kfp-operators
git checkout -b fix/typo-readme
tox -e lint,unit
git commit -s -m "docs: fix kfp-api config description"   # -s = DCO sign-off
gh pr create --fill</pre>
<div class="callout tip">💡 Canonical repos often require signing the Canonical CLA. Do it before your first PR.</div>`,
    videos: [{ l: 'First open source contribution', q: 'how to make your first open source contribution github pull request' }],
    docs: [{ t: 'Canonical CLA', u: 'https://ubuntu.com/legal/contributors' }, { t: 'GitHub good first issues', u: 'https://github.com/canonical' }],
    quiz: [{ q: 'Best first contribution:', o: ['rewrite the architecture you dislike', 'small, focused fix with test or docs', 'a 5000-line refactor of core code', 'a PR that changes the license'], a: 1, e: 'Small and reviewable.' }],
    lab: { title: '3 PRs', steps: [{ t: 'PR #1 (docs/typo)', c: '' }, { t: 'PR #2 (test or small bug)', c: '' }, { t: 'PR #3 (a Canonical charm repo)', c: '' }] } }
  ],
  boss: [{ q: 'Before coding an issue you should…', o: ['open a big PR straight away to save time', 'comment your plan and get a maintainer\'s ok', 'email the project\'s CEO about it', 'fork silently and ship it in your own repo'], a: 1, e: 'Avoid duplicate work.' }]
},
// ───────────────────────── 9. APPLY
{ id: 'apply', icon: '🎯', title: 'Application & Interview Mastery', color: 'var(--warn)', req: 'Academic record evidence · own-words answers · written interview',
  intro: 'Canonical\'s process is long: application questions, a written interview, a psychometric test, then technical and HR rounds. Prepare each one.',
  lessons: [
  { id: 'x1', title: 'Evidence pack & the application questions', xp: 80, min: 40,
    body: `<p>The form asks for high-school maths & native-language rankings (with justification), degree result with grading system, and two essays: <b>Kubernetes experience</b> and <b>Python + data/MLOps experience</b>.</p>
<ul><li>Collect: Baccalauréat score + mention, national/regional rank if any, prep-cycle (cycle préparatoire) rank, INSAT admission, current average /20 with the scale explained.</li>
<li>For each essay, prepare <b>bullet facts only</b> (projects, numbers, links). Then write the final text <b>yourself</b>.</li></ul>
<div class="callout">⚠️ The form states that using AI-generated content will disqualify the application. The AI tutor in this platform will quiz you and explain concepts. It will <b>not</b> write your application answers, and you shouldn't ask it to.</div>`,
    videos: [{ l: 'Canonical hiring process', q: 'canonical hiring process written interview experience' }],
    docs: [{ t: 'Canonical hiring process', u: 'https://canonical.com/careers/hiring-process' }, { t: 'The role', u: 'https://canonical.com/careers/5703396' }],
    quiz: [{ q: 'Who should write your application answers?', o: ['ChatGPT, then edit it a bit', 'You, in your own words', 'A friend who works there', 'Copied from good blogs'], a: 1, e: 'AI or plagiarism disqualifies you.' }],
    lab: { title: 'Evidence pack', steps: [{ t: 'Gather transcripts/rankings into one folder', c: '' }, { t: 'Write bullet facts for the Kubernetes essay (after finishing K8s tracks)', c: '' }, { t: 'Write bullet facts for the Python/MLOps essay', c: '' }] } },
  { id: 'x2', title: 'Technical interview drills', xp: 100, min: 45,
    body: `<p>Practise explaining out loud (use the AI tutor's <b>Mock interview</b> button):</p>
<ul><li>"Walk me through what happens when you run <code>kubectl apply -f deploy.yaml</code>."</li>
<li>"A pod is in CrashLoopBackOff. Debug it."</li><li>"Difference between a Helm chart and a Juju charm?"</li>
<li>"How would you make YOLO training reproducible and deployable on Kubernetes?"</li>
<li>"What happens, at the Linux level, when a container starts?"</li><li>Python: generators, decorators, GIL, asyncio, testing strategy.</li></ul>`,
    videos: [{ l: 'Kubernetes interview questions', q: 'kubernetes interview questions answers' }],
    docs: [],
    quiz: [{ q: 'kubectl apply → first component to receive the request?', o: ['kubelet', 'kube-apiserver', 'kube-scheduler', 'etcd'], a: 1, e: 'API server validates and stores in etcd; then controllers & scheduler react.' }],
    lab: { title: 'Mock interviews', steps: [{ t: '3 mock interviews with the AI tutor (one per day)', c: '' }, { t: 'Record yourself answering "kubectl apply" in 2 minutes', c: '' }] } }
  ],
  boss: [{ q: 'Order after kubectl apply of a Deployment:', o: ['kubelet → etcd → API server → scheduler creates pods', 'API server → etcd → controllers create RS/pods → scheduler → kubelet', 'scheduler → API server → kubelet → controllers create RS', 'etcd → kubectl → controllers → kubelet → API server'], a: 1, e: 'That\'s the full flow.' }]
}
];

// Flashcards (spaced repetition)
const FLASH = [
  ['Pod', 'Smallest deployable unit: one or more containers sharing network (IP) and volumes.'],
  ['Deployment', 'Declares desired pod template + replicas; manages ReplicaSets for rolling updates/rollback.'],
  ['ReplicaSet', 'Ensures N identical pods are running.'],
  ['Service', 'Stable virtual IP + DNS name that load-balances to pods matched by a label selector.'],
  ['ClusterIP vs NodePort vs LoadBalancer', 'Internal only / exposed on every node port 30000-32767 / external IP via cloud or MetalLB.'],
  ['Ingress', 'HTTP(S) routing rules by host/path to Services; needs an Ingress controller.'],
  ['ConfigMap vs Secret', 'Non-secret config vs sensitive data (base64, not encrypted by default).'],
  ['PVC', 'A request for storage ("10Gi RWO") bound to a PersistentVolume.'],
  ['Namespace', 'Logical partition of cluster resources; a Juju model on K8s = a namespace.'],
  ['etcd', 'Consistent key-value store holding the cluster\'s desired state.'],
  ['kubelet', 'Agent on each node that starts/monitors pods via the container runtime.'],
  ['Reconciliation loop', 'Controller repeatedly compares desired vs actual state and acts to converge.'],
  ['readinessProbe', 'Decides if a pod receives traffic. Failing = removed from Service endpoints, not restarted.'],
  ['livenessProbe', 'Decides if a container is stuck. Failing = container restarted.'],
  ['requests vs limits', 'Requests: reserved, used by scheduler. Limits: hard cap (memory over → OOMKilled).'],
  ['HPA', 'HorizontalPodAutoscaler: scales replicas based on metrics like CPU.'],
  ['CRD', 'CustomResourceDefinition: adds new object kinds to the Kubernetes API.'],
  ['Operator', 'Controller encoding operational knowledge to manage an app via custom resources.'],
  ['Helm chart', 'Templated Kubernetes manifests + values; releases with upgrade/rollback.'],
  ['Juju charm', 'Python operator (ops library) that deploys AND operates an app day-2, with integrations.'],
  ['juju integrate', 'Creates a relation between two charms so they exchange data (e.g., DB credentials).'],
  ['Pebble', 'Lightweight process manager in workload containers; charms control services through it.'],
  ['charmcraft', 'Tool to init, build (pack) and publish charms.'],
  ['MicroK8s', 'Canonical\'s lightweight, snap-installed, conformant Kubernetes with addons.'],
  ['Charmed Kubeflow', 'Canonical\'s Kubeflow distribution: ~30 charms deployed as a Juju bundle.'],
  ['MLflow', 'Experiment tracking, model registry and packaging.'],
  ['Kubeflow Pipelines', 'DAGs of containerised ML steps running as pods on Kubernetes.'],
  ['KServe', 'Kubernetes model serving (InferenceService CRD), autoscaling incl. scale-to-zero.'],
  ['Katib', 'Kubeflow hyperparameter tuning / AutoML.'],
  ['Feast', 'Feature store: consistent features offline (training) and online (serving).'],
  ['DVC', 'Git for data: versions datasets/models, stores them in remote storage, reproducible stages.'],
  ['namespaces + cgroups', 'Kernel features behind containers: isolation of view + resource limits.'],
  ['snap --classic', 'Snap installed without strict confinement (needed by microk8s, juju CLIs).'],
  ['Rockcraft', 'Builds OCI images ("rocks") on Ubuntu bases.'],
  ['COS', 'Canonical Observability Stack: Prometheus, Loki, Grafana, Tempo via Juju.'],
  ['ImagePullBackOff', 'Image can\'t be pulled: wrong name/tag or missing registry credentials.'],
  ['CrashLoopBackOff', 'Container keeps exiting; check logs --previous.']
];

const BADGES = [
  { id: 'first', e: '👣', t: 'First steps', d: 'Complete a lesson', test: s => s.doneCount >= 1 },
  { id: 'linux', e: '🐧', t: 'Penguin', d: 'Finish Linux track', test: s => s.trackDone('linux') },
  { id: 'py', e: '🐍', t: 'Pythonista', d: 'Finish Python track', test: s => s.trackDone('python') },
  { id: 'box', e: '📦', t: 'Containerised', d: 'Finish Containers track', test: s => s.trackDone('containers') },
  { id: 'helm', e: '☸️', t: 'Helmsman', d: 'Finish Kubernetes Core', test: s => s.trackDone('k8s1') },
  { id: 'prod', e: '🚀', t: 'Production ready', d: 'Finish K8s in Production', test: s => s.trackDone('k8s2') },
  { id: 'ml', e: '🧠', t: 'MLOps engineer', d: 'Finish MLOps track', test: s => s.trackDone('mlops') },
  { id: 'charm', e: '🟠', t: 'Charmer', d: 'Finish Canonical stack', test: s => s.trackDone('canonical') },
  { id: 'oss', e: '🌍', t: 'Upstream', d: 'Finish Open Source track', test: s => s.trackDone('oss') },
  { id: 'sim5', e: '🎮', t: 'Cluster operator', d: 'Complete 5 simulator missions', test: s => s.missions >= 5 },
  { id: 'heal', e: '❤️‍🩹', t: 'Self-healer', d: 'Watch a pod resurrect', test: s => s.flags.healed },
  { id: 'boss', e: '👑', t: 'Boss slayer', d: 'Beat 3 boss battles', test: s => s.bosses >= 3 },
  { id: 'flash', e: '🃏', t: 'Memory palace', d: 'Review 50 flashcards', test: s => s.flashReviews >= 50 },
  { id: 'streak', e: '🔥', t: 'On fire', d: '7-day streak', test: s => s.streak >= 7 },
  { id: 'tutor', e: '🤖', t: 'Curious mind', d: 'Ask the AI tutor 10 questions', test: s => s.tutorQs >= 10 },
  { id: 'ready', e: '🏆', t: 'Canonical-ready', d: 'Job match ≥ 90%', test: s => s.match >= 90 }
];

// Simulator missions
const MISSIONS = {
  first: { t: 'Meet your cluster', goals: [
    { d: 'List nodes: kubectl get nodes', k: 'cmd:get nodes' },
    { d: 'List pods in all namespaces: kubectl get pods -A', k: 'cmd:get pods -A' }] },
  deploy: { t: 'Deploy & self-heal', goals: [
    { d: 'Create deployment "web" with image nginx and 3 replicas', k: 'deploy:web:3' },
    { d: 'Delete one of its pods (kubectl delete pod web-…)', k: 'flag:healed' },
    { d: 'Scale web to 5 replicas', k: 'deploy:web:5' }] },
  expose: { t: 'Give it an address', goals: [
    { d: 'Create deployment "cvapi" (any image)', k: 'exists:deploy:cvapi' },
    { d: 'Expose cvapi on port 80 (kubectl expose deployment cvapi --port=80)', k: 'exists:svc:cvapi' },
    { d: 'Check endpoints: kubectl get endpoints cvapi', k: 'cmd:get endpoints' }] },
  rollout: { t: 'Ship v2, then undo', goals: [
    { d: 'Have a deployment "web"', k: 'exists:deploy:web' },
    { d: 'Update image: kubectl set image deployment/web nginx=nginx:1.27', k: 'flag:rolled' },
    { d: 'Roll back: kubectl rollout undo deployment/web', k: 'flag:undo' }] },
  config: { t: 'Configure without rebuilding', goals: [
    { d: 'Create namespace dev', k: 'exists:ns:dev' },
    { d: 'Create configmap cvapi-cfg (kubectl create configmap cvapi-cfg --from-literal=K=V)', k: 'exists:cm:cvapi-cfg' },
    { d: 'Apply a Deployment YAML from the editor (kubectl apply -f editor)', k: 'flag:applied' }] },
  debug: { t: 'Fix the broken app', setup: 'broken', goals: [
    { d: 'Find the failing pod: kubectl get pods', k: 'cmd:get pods' },
    { d: 'Describe it to read the Events', k: 'cmd:describe pod' },
    { d: 'Fix the image: kubectl set image deployment/shop shop=nginx:1.27', k: 'fixed:shop' }] }
};
