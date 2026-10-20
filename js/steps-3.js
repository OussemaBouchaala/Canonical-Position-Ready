// ===== Interactive lesson steps, part 3: MLOps, Canonical stack, open source, application

STEPS.m1 = [
  { t: 'concept', h: 'Why a notebook is not a product', html: `<p>A model in a notebook answers "can this work?". Production asks more: can someone <b>rebuild</b> it from scratch, <b>compare</b> it with last month\'s model, <b>deploy</b> it safely, and <b>notice</b> when it gets worse?</p>
<p>MLOps is the set of habits and tools that make those answers "yes".</p>` },
  { t: 'concept', h: 'The loop, not the line', d: 'mlops', html: `<p>Data → features → training → tracking → registry → serving → <b>monitoring</b>, and monitoring feeds back into new data and retraining. The feedback arrow is what turns a project into an operated system.</p>` },
  { t: 'example', h: 'Your livestock project mapped to tools', code: `raw drone images ──► DVC (versioned dataset v3)
tiles + labels    ──► KFP step "prepare" (container)
YOLO training     ──► KFP step "train" on 1 GPU, logs to MLflow
best.pt + mAP50   ──► MLflow registry: livestock-detector v7 @champion
FastAPI service   ──► KServe / your Deployment loads @champion
drift on new farm ──► alert → new data → pipeline re-run`, note: 'This is the exact story to tell in the interview, with your numbers.' },
  { t: 'predict', q: 'Six months later, a farmer reports worse detections. With only a notebook and best.pt on your laptop, what can\'t you answer?', a: 'Which data and parameters produced that model, whether the data changed since, and how the current model compares with earlier ones. Without versioned data (DVC), tracked runs (MLflow) and a pipeline (KFP), you can\'t reproduce or compare.' },
  { t: 'check', q: 'Which part of the loop catches "the model got worse on new farms"?', o: ['Monitoring (drift/quality metrics on live data)', 'The training step', 'The Dockerfile', 'The model registry'], a: 0, e: 'Only monitoring of live inputs/outputs reveals degradation after deployment.' },
  { t: 'key', items: ['MLOps = reproducible data, tracked experiments, automated pipelines, versioned models, monitored serving.', 'Kubeflow (pipelines, Katib, KServe, notebooks) + MLflow are Canonical\'s supported stack.', 'The feedback loop (monitor → retrain) is the "Ops" part.'] },
  { t: 'mistake', items: [['"Our model is in Git LFS, that\'s MLOps"', 'Versioning the artifact is one piece; you also need data versions, run tracking and a repeatable pipeline.']] }
];

STEPS.m2 = [
  { t: 'concept', h: 'Runs, experiments, artifacts', html: `<ul><li><b>Experiment</b>: a folder for one problem ("livestock-yolo").</li><li><b>Run</b>: one training execution with its <b>params</b> (inputs: imgsz, epochs), <b>metrics</b> (outputs: mAP50, loss per epoch) and <b>artifacts</b> (files: weights, plots).</li></ul>
<p>The MLflow UI then lets you sort 50 runs by mAP50 and open the exact parameters of the best one.</p>` },
  { t: 'example', h: 'Log metrics per epoch', code: `import mlflow
mlflow.set_experiment("livestock-yolo")
with mlflow.start_run(run_name="p2-head-1280"):
    mlflow.log_params({"imgsz": 1280, "epochs": 3})
    for epoch, m in enumerate([0.41, 0.55, 0.61]):
        mlflow.log_metric("mAP50", m, step=epoch)
    mlflow.log_artifact("runs/detect/train/weights/best.pt")`, out: `$ mlflow ui --port 5000
# Run "p2-head-1280": params imgsz=1280, epochs=3 · mAP50 0.61 (chart over 3 steps) · artifact best.pt` },
  { t: 'concept', h: 'The model registry and aliases', d: 'registry', html: `<p>Registering a model gives it a name and numbered <b>versions</b>. An <b>alias</b> such as <code>@champion</code> is a movable pointer to one version.</p>
<p>Serving code loads <code>models:/livestock-detector@champion</code>. To promote v8, move the alias. No redeploy, no code change, and moving it back is an instant rollback.</p>` },
  { t: 'predict', q: 'v8 is @champion and causes errors. What is the fastest safe fix?', a: 'Move @champion back to v7 (one API call or a click in the UI). Serving picks up v7 on its next load. This is the model equivalent of kubectl rollout undo.' },
  { t: 'check', q: 'Which belongs in log_params rather than log_metric?', o: ['Learning rate you chose', 'Validation loss', 'mAP50 per epoch', 'Inference latency'], a: 0, e: 'Params are inputs you set before training; metrics are measured results, often over steps.' },
  { t: 'key', items: ['Params = inputs, metrics = measured outputs over steps, artifacts = files.', 'Registry = named, versioned models; aliases (@champion) decouple serving from versions.', 'Charmed MLflow deploys the tracking server + database + object storage with Juju.'] },
  { t: 'mistake', items: [['Logging only the final metric', 'Log per epoch with step= so you can see overfitting curves.'], ['Hard-coding a model version in serving code', 'Load by alias so promotions don\'t need code changes.']] }
];

STEPS.m3 = [
  { t: 'concept', h: 'A pipeline is a graph of containers', d: 'kfpDag', html: `<p>Each <b>component</b> is a Python function that KFP packages into a container. Outputs of one become inputs of the next, and that dependency graph (a DAG) decides what runs in parallel and in which order.</p>
<p>Every step runs as its own pod, so each can have its own image, CPU/GPU and memory.</p>` },
  { t: 'example', h: 'Pass data between steps', code: `from kfp import dsl

@dsl.component(base_image="python:3.12")
def make_numbers(n: int) -> list:
    return list(range(n))

@dsl.component(base_image="python:3.12")
def total(xs: list) -> int:
    return sum(xs)

@dsl.pipeline(name="tiny")
def tiny(n: int = 5):
    nums = make_numbers(n=n)
    total(xs=nums.output)`, out: `Run "tiny" (n=5)
  make_numbers  ✔  output: [0, 1, 2, 3, 4]
  total         ✔  output: 10`, note: 'Small values are passed as parameters; large files (datasets, models) as Artifacts, which KFP stores in object storage (MinIO in Charmed Kubeflow).' },
  { t: 'predict', q: 'Your pipeline has steps download → (train_a, train_b) → compare. How long does it take if download=2 min, each train=10 min, compare=1 min?', a: 'About 13 minutes, not 23. train_a and train_b don\'t depend on each other, so KFP runs them in parallel pods after download, then compare.' },
  { t: 'concept', h: 'Caching: don\'t redo finished work', html: `<p>KFP caches a step when its component and inputs are identical to a previous successful run. Change only the training epochs, and the download/prepare steps are skipped instantly.</p>` },
  { t: 'check', q: 'A component imports pandas but fails with ModuleNotFoundError in the cluster, though it works locally. Fix?', o: ['Add packages_to_install=["pandas"] or use an image that has it', 'Install pandas on your laptop', 'Run the pipeline again', 'Give it a GPU'], a: 0, e: 'Each component runs in its own container; your laptop\'s environment doesn\'t exist there.' },
  { t: 'key', items: ['Component = containerised function; pipeline = DAG of components.', 'Independent steps run in parallel; artifacts flow through object storage.', 'Caching skips unchanged steps; GPUs are requested per step.'] },
  { t: 'mistake', items: [['Putting the whole training script in one giant component', 'Split prepare/train/evaluate so steps can be cached, retried and inspected separately.']] }
];

STEPS.m4 = [
  { t: 'concept', h: 'DVC: Git for data, without putting data in Git', d: 'dvcFlow', html: `<p><code>dvc add data/raw</code> moves the data to a cache and writes a tiny <code>data/raw.dvc</code> file with its hash. You commit the small file to Git and <code>dvc push</code> the real data to S3/MinIO.</p>
<p>Checking out an old commit + <code>dvc pull</code> brings back the exact dataset of that day.</p>` },
  { t: 'example', h: 'Go back to last month\'s dataset', code: `git log --oneline -- data/raw.dvc
git checkout 3f1a2b9 -- data/raw.dvc
dvc pull data/raw
dvc status`, out: `9c0d1e2 Add farm B images
3f1a2b9 Initial 2,400 annotated tiles
Data and pipelines are up to date.` },
  { t: 'concept', h: 'Feast and orchestrators', html: `<p><b>Feast</b> keeps feature definitions in one place and serves the same values for training (offline store) and for live predictions (online store). This prevents <b>training/serving skew</b>: the model seeing different feature logic in production than in training.</p>
<p><b>Airflow</b>: time-scheduled DAGs ("every night at 2am"). <b>Temporal</b>: long-running, durable code workflows. <b>KFP</b>: ML pipelines on Kubernetes with artifacts and caching.</p>` },
  { t: 'predict', q: 'In training, "avg_weight_7d" was computed with pandas over 7 days. In production, a developer recomputes it in SQL over the last 7 rows. What goes wrong?', a: 'Training/serving skew: 7 rows is not 7 days, so the live feature differs from what the model learned. Accuracy silently drops. Defining the feature once (Feast) avoids this.' },
  { t: 'check', q: 'You need to retrain every Sunday and also run an ad-hoc GPU pipeline. Reasonable combination?', o: ['A scheduler (Airflow or a recurring KFP run) triggering a KFP pipeline', 'Only cron on your laptop', 'Only DVC', 'Feast'], a: 0, e: 'KFP runs the ML steps on Kubernetes; scheduling can come from KFP recurring runs or an orchestrator like Airflow.' },
  { t: 'key', items: ['DVC versions data by hash; Git stores the pointer, remote storage stores the data.', 'Feast = one definition of features for training and serving.', 'Pick orchestrators by need: Airflow (schedules), Temporal (durable workflows), KFP (ML on K8s).'] },
  { t: 'mistake', items: [['git add on a 10 GB dataset', 'Use dvc add and dvc push; commit only the .dvc file.']] }
];

STEPS.j1 = [
  { t: 'concept', h: 'Juju vocabulary in one minute', d: 'juju', html: `<ul><li><b>Controller</b>: Juju\'s brain, installed once per cloud (here: your MicroK8s).</li><li><b>Model</b>: a workspace; on Kubernetes, a namespace.</li><li><b>Application</b>: a deployed charm (mlflow-server), with one or more <b>units</b> (pods).</li><li><b>Integration</b> (relation): a typed connection between applications, e.g. mysql ↔ mlflow.</li></ul>` },
  { t: 'concept', h: 'What an integration really does', d: 'relation', html: `<p>Each charm declares interfaces it <i>provides</i> or <i>requires</i> (<code>mysql_client</code>, <code>prometheus_scrape</code>…). <code>juju integrate</code> opens a shared data bag between them: MySQL writes host, user and password; MLflow reads them and reconfigures itself.</p>
<p>No secrets copied by hand, no ordering problems: whichever side is ready second just reacts.</p>` },
  { t: 'example', h: 'Read juju status like an operator', code: `juju status`, out: `Model   Controller  Cloud/Region        Version
mlflow  uk8s        microk8s/localhost  3.6.4

App            Version  Status   Scale  Charm          Channel
mlflow-server  2.15     active       1  mlflow-server  2.15/stable
mysql-k8s      8.0.39   waiting      1  mysql-k8s      8.0/stable

Unit              Workload  Agent  Message
mlflow-server/0*  active    idle
mysql-k8s/0*      waiting   executing  initialising cluster`, note: 'Workload status is set by the charm code (self.unit.status). "waiting" with a message = the charm is telling you what it is doing.' },
  { t: 'predict', q: 'You run <code>juju config mlflow-server port=5001</code>. Which event does the charm receive?', a: 'config-changed. The charm\'s handler reconciles: it rewrites the Pebble layer with the new port and replans the service. Day-2 operations are just events + reconcile.' },
  { t: 'check', q: 'You want MLflow metrics in Prometheus from COS. In Juju, you…', o: ['juju integrate mlflow-server prometheus (via a scrape interface)', 'Edit prometheus.yml by hand', 'Add a Kubernetes Service', 'Rebuild the MLflow image'], a: 0, e: 'Observability is wired through integrations; the charms exchange scrape targets automatically.' },
  { t: 'key', items: ['Controller → models → applications → units.', 'Integrations connect apps through typed interfaces and shared data.', 'juju config triggers config-changed; charms reconcile.', 'juju status shows workload status set by the charm.'] },
  { t: 'mistake', items: [['Patching charm-managed pods with kubectl', 'Use juju config/integrate; the charm will undo manual edits.']] }
];

STEPS.j2 = [
  { t: 'concept', h: 'Events in, reconcile out', d: 'charmEvents', html: `<p>Juju sends your charm <b>events</b>: install, config-changed, pebble-ready, relation-changed, upgrade-charm… The modern pattern is to send most of them to one <code>_reconcile()</code> method that computes the desired state from scratch.</p>
<p>That makes the charm robust: it doesn\'t matter in which order events arrive.</p>` },
  { t: 'concept', h: 'Pebble: the service manager in the workload container', d: 'pebble', html: `<p>On Kubernetes, your charm runs in a sidecar container next to the workload container. In the workload container, <b>Pebble</b> plays the role systemd plays on Ubuntu: it starts, stops and checks services.</p>
<p>The charm talks to Pebble: "here is my layer (command, env), replan". Pebble restarts the app if the config changed.</p>` },
  { t: 'example', h: 'Unit-test a charm without a cluster', code: `from ops import testing
from charm import CvApiCharm

def test_threshold_reaches_the_service():
    ctx = testing.Context(CvApiCharm)
    container = testing.Container("api", can_connect=True)
    state = testing.State(containers={container}, config={"threshold": 0.7})
    out = ctx.run(ctx.on.config_changed(), state)
    layer = out.get_container("api").plan.services["api"]
    assert layer.environment["CONF_THRESHOLD"] == "0.7"
    assert out.unit_status == testing.ActiveStatus()`, out: `$ tox -e unit
tests/unit/test_charm.py::test_threshold_reaches_the_service PASSED` },
  { t: 'predict', q: 'config-changed arrives before the workload container is ready (can_connect is False). If your handler just returns, what is the risk?', a: 'The new config is never applied if no other event comes. Either event.defer() (Juju re-delivers it later) or, better, also reconcile on pebble-ready so the latest config is applied once the container connects.' },
  { t: 'check', q: 'Where does a charm declare its config options and workload containers?', o: ['charmcraft.yaml', 'tox.ini', 'Dockerfile', 'values.yaml'], a: 0, e: 'charmcraft.yaml holds metadata, containers, resources, config options and relations.' },
  { t: 'key', items: ['Observe events, funnel them to one idempotent reconcile.', 'Pebble manages the workload process; the charm sends it layers.', 'Set unit status so juju status explains what is happening.', 'ops.testing unit tests run in milliseconds; integration tests deploy to MicroK8s.'] },
  { t: 'mistake', items: [['Different logic in every handler', 'One reconcile from current config + relations avoids order bugs.'], ['Forgetting can_connect()', 'Always check the container is reachable before talking to Pebble.']] }
];

STEPS.j3 = [
  { t: 'concept', h: 'A bundle is a whole system', html: `<p>Charmed Kubeflow is ~30 charms (pipelines API, UI, Katib, KServe, Istio, Dex, OIDC gatekeeper, notebooks…) plus their integrations, described in one <b>bundle</b>. <code>juju deploy kubeflow</code> deploys all of it and wires it together.</p>
<p>Each charm lives in its own repo (e.g. <code>canonical/kfp-operators</code>) with unit and integration tests.</p>` },
  { t: 'example', h: 'Read a charm repo in 10 minutes', code: `git clone https://github.com/canonical/kfp-operators && cd kfp-operators
ls charms/
cat charms/kfp-api/charmcraft.yaml | head -20
grep -n "def _on\\|observe" charms/kfp-api/src/charm.py | head
gh pr list --limit 5 --state merged`, note: 'Look for: which events are observed, which relations exist, how tests are organised (tox.ini), and what recent PRs changed. That is your interview material.' },
  { t: 'predict', q: 'Upstream Kubeflow releases 1.10 and renames an environment variable used by kfp-api. What breaks first if nobody updates the charm?', a: 'The charm still renders the old variable into the Pebble layer, so the new image ignores it and the service misbehaves. The team\'s work is exactly this: bump images, adapt the charm, and catch it with integration tests before users do.' },
  { t: 'check', q: 'Why do Canonical teams rebuild upstream images as "rocks"?', o: ['To ship them on an Ubuntu base with security maintenance', 'To make them Windows-compatible', 'Because Docker images can\'t run on Kubernetes', 'To remove all dependencies'], a: 0, e: 'Rocks (built with Rockcraft) give a consistent, patched Ubuntu base and a predictable security update path.' },
  { t: 'key', items: ['Charmed Kubeflow = a bundle of charms + integrations.', 'Daily work: upgrades to new upstream releases, integrations (MLflow, COS), rocks, CI integration tests, user issues.', 'Read real PRs before the interview and mention them.'] },
  { t: 'mistake', items: [['Only reading docs', 'Read code and merged PRs: that shows how the team actually works.']] }
];

STEPS.o1 = [
  { t: 'concept', h: 'The contribution journey', d: 'gitflow', html: `<p>Maintainers are busy. The PRs that get merged are <b>small</b>, <b>discussed first</b>, <b>tested</b>, and easy to review. A typo fix with a clear description is a real contribution and teaches you the repo\'s process (CLA, DCO sign-off, CI).</p>` },
  { t: 'example', h: 'A PR description reviewers love', code: `## What
Fix the default value shown for \`db-port\` in config docs (was 3307, code uses 3306).

## Why
Users copying the docs got connection errors (see #412).

## How tested
- tox -e lint,unit
- Deployed locally on MicroK8s 1.31, default config connects to mysql-k8s.

Closes #412`, note: 'What, why, how tested, linked issue. Under 10 lines, nothing for the reviewer to guess.' },
  { t: 'predict', q: 'A maintainer asks for changes and you disagree with one. What is the best reply?', a: 'Thank them, apply the changes you agree with, and explain your reasoning on the other one with a concrete example, asking whether they still prefer their approach. Then go with the maintainer\'s decision: it\'s their project.' },
  { t: 'check', q: 'CI on your PR fails on lint only. What do you do?', o: ['Run the same lint locally (tox -e lint), fix, push', 'Ask the maintainer to ignore it', 'Close and reopen the PR', 'Disable the lint rule in your PR'], a: 0, e: 'Reproduce locally with the repo\'s own commands; keep the PR green.' },
  { t: 'key', items: ['Start small: docs, tests, good-first-issue labels.', 'Comment your plan before coding bigger changes.', 'Run the repo\'s tox/CI locally; write what/why/how-tested.', 'Sign the CLA and use -s (DCO) where required.'] },
  { t: 'mistake', items: [['A first PR of 2,000 lines', 'Split it; small PRs get reviewed.'], ['Going silent after review', 'Reply quickly, even just "will fix tomorrow".']] }
];

STEPS.x1 = [
  { t: 'concept', h: 'Facts first, words later (yours)', html: `<p>Strong answers are built from <b>evidence</b>: what you did, with numbers and links. Collect facts in a list now; write the final sentences yourself at the end.</p>
<p>The form forbids AI-generated content, so the tutor here only helps you check facts and practise, never writes the text.</p>` },
  { t: 'concept', h: 'Turn a project into evidence', d: 'star', html: `<p>Use <b>STAR</b> to organise each fact: <b>Situation</b> (context), <b>Task</b> (your responsibility), <b>Action</b> (what you did, technically), <b>Result</b> (measured outcome).</p>` },
  { t: 'example', h: 'From vague to evidence (bullets, not final text)', code: `VAGUE:    "Worked with Kubernetes for ML."
EVIDENCE:
- S: livestock detection, 4K drone images, small objects
- T: make training reproducible and serve the model
- A: DVC dataset, KFP pipeline (prepare/train/eval), MLflow tracking,
     FastAPI + probes on MicroK8s, Helm chart, then a charm
- R: mAP50 0.42 → 0.61 (P2 head + SAHI), one-command retrain,
     repo + PR links`, note: 'These are notes for you. Your final answer must be written by you, in your own words.' },
  { t: 'check', q: 'Which bullet is the strongest evidence?', o: ['Added readiness probes; rollouts went from ~5% failed requests to 0', 'Familiar with Kubernetes', 'Passionate about MLOps', 'Watched a Kubernetes course'], a: 0, e: 'Specific action + measurable result. The others are claims without proof.' },
  { t: 'key', items: ['Collect facts, numbers and links per requirement.', 'Organise with STAR.', 'Write the final answers yourself.'] }
];

STEPS.x2 = [
  { t: 'concept', h: 'How to answer a technical question', html: `<ol><li><b>Restate</b> the question in one sentence.</li><li>Give the <b>big picture</b> first (the components involved).</li><li>Walk through it <b>step by step</b>.</li><li>Mention a <b>real example</b> from your projects.</li><li>Name a <b>trade-off or failure mode</b>.</li></ol>` },
  { t: 'example', h: 'Model answer: what happens on kubectl apply?', code: `1. kubectl reads deploy.yaml and sends it to the kube-apiserver (HTTPS).
2. API server authenticates me, checks RBAC, runs admission, stores the object in etcd.
3. The Deployment controller sees a new Deployment → creates a ReplicaSet.
4. The ReplicaSet controller sees 0/3 pods → creates 3 Pod objects (no node yet).
5. The scheduler assigns each pod to a node (requests, affinity, taints).
6. The kubelet on that node sees its pod → asks containerd to pull and start it.
7. Probes pass → pod Ready → its IP is added to the Service endpoints.
Trade-off: everything is asynchronous; "apply succeeded" only means stored.`, note: 'Practise saying this in under 90 seconds, then open the tutor\'s Mock interview.' },
  { t: 'predict', q: 'Interviewer: "Helm chart or Juju charm, which would you use?" What makes a good answer?', a: 'It depends, and say on what: Helm templates YAML for install/upgrade and is great for simple stateless apps; a charm is an operator that also handles day-2 (config changes, integrations, upgrades, backups) and can manage non-Kubernetes targets. For Charmed Kubeflow, integrations between many components are why charms fit.' },
  { t: 'check', q: 'You don\'t know an answer in the interview. Best move?', o: ['Say so, reason aloud from what you know, and say how you\'d find out', 'Invent something confident', 'Change the subject', 'Stay silent'], a: 0, e: 'Interviewers value honest reasoning and a plan to verify far more than bluffing.' },
  { t: 'key', items: ['Restate → big picture → steps → your example → trade-off.', 'Practise out loud and time yourself.', 'Use the tutor\'s Mock interview and ask it to grade you strictly.'] }
];
