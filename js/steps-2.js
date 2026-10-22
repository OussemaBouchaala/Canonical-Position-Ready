// ===== Interactive lesson steps, part 2: Kubernetes core + production

STEPS.k1 = [
  { t: 'concept', h: 'Imperative vs declarative', html: `<p><b>Imperative</b>: "start a container, then another, then if one dies start a new one…". You describe <i>steps</i>.</p>
<p><b>Declarative</b>: "there should be 3 copies of cvapi:0.3". You describe the <i>result</i> and the system figures out the steps, now and forever.</p>
<div class="analogy">🚕 <b>Analogy:</b> giving a taxi driver turn-by-turn directions vs just saying the address. With the address, the driver handles roadworks and detours by themselves.</div>` },
  { t: 'concept', h: 'The reconciliation loop', d: 'reconcile', html: `<p>Every Kubernetes controller runs the same loop forever:</p>
<ol><li><b>Observe</b> the actual state (2 pods running).</li><li><b>Compare</b> with the desired state (3 pods).</li><li><b>Act</b> to close the gap (create 1 pod).</li></ol>
<p>Nobody "runs" a deployment. You store a wish in etcd, and controllers keep making it true. Juju charms, Kubeflow operators and the Deployment controller all work this way.</p>` },
  { t: 'example', h: 'Talk to the API server like kubectl does', code: `kubectl get nodes -v=6 2>&1 | grep GET
kubectl get --raw /api/v1/namespaces/default/pods | head -c 120`, out: `GET https://127.0.0.1:16443/api/v1/nodes?limit=500 200 OK in 12 milliseconds
{"kind":"PodList","apiVersion":"v1","metadata":{"resourceVersion":"48211"},"items":[]}`, note: 'kubectl is just an HTTP client. Every object (pod, deployment, service) is a JSON document behind a REST URL on the API server.' },
  { t: 'predict', q: 'The scheduler process crashes for 5 minutes. Pods that were already running: what happens to them?', a: 'They keep running. The scheduler only decides where NEW pods go. Running pods are managed by the kubelet on each node. New pods created during the outage stay Pending until the scheduler is back.' },
  { t: 'check', q: 'Which component is the only one that reads and writes etcd directly?', o: ['kube-apiserver', 'kubelet', 'kube-scheduler', 'kubectl'], a: 0, e: 'Everything else talks to the API server, which validates requests and stores them in etcd.' },
  { t: 'check', q: 'You declare replicas: 3 and someone deletes one pod by hand. Who notices and fixes it?', o: ['The ReplicaSet controller (in controller-manager)', 'etcd', 'The kubelet on the dead pod\'s node', 'Nobody until you re-apply'], a: 0, e: 'The ReplicaSet controller sees 2 ≠ 3 and creates a pod; the scheduler then picks a node for it.' },
  { t: 'key', items: ['Declare what you want; controllers make it true continuously.', 'API server = front door; etcd = memory; scheduler = placement; kubelet = runs containers on each node.', 'Observe → compare → act: the loop behind Kubernetes, operators and Juju charms.'] },
  { t: 'mistake', items: [['Thinking kubectl apply "runs" something', 'It only stores the desired state. Controllers do the work afterwards, asynchronously.'], ['Fixing pods by hand in production', 'Change the declaration (YAML) instead; manual fixes get reconciled away.']] }
];

STEPS.k2 = [
  { t: 'concept', h: 'Labels and selectors: how objects find each other', d: 'labels', html: `<p>Labels are key/value tags on objects: <code>app: cvapi</code>, <code>tier: api</code>. A <b>selector</b> is a query: "all pods where app = cvapi".</p>
<p>Kubernetes objects are loosely connected <i>only</i> through these queries. A Deployment owns pods whose labels match its selector; a Service sends traffic to pods matching its selector.</p>` },
  { t: 'example', h: 'Query pods by label', code: `kubectl get pods --show-labels
kubectl get pods -l app=cvapi
kubectl label pod cvapi-7d9f-x2k app=debug --overwrite
kubectl get pods -l app=cvapi`, out: `NAME             READY  STATUS   LABELS
cvapi-7d9f-x2k   1/1    Running  app=cvapi,pod-template-hash=7d9f
cvapi-7d9f-q8m   1/1    Running  app=cvapi,pod-template-hash=7d9f
...
NAME             READY  STATUS
cvapi-7d9f-q8m   1/1    Running
cvapi-7d9f-z1c   0/1    ContainerCreating`, note: 'Relabel a pod and the ReplicaSet no longer counts it, so it creates a replacement. The relabeled pod keeps running, orphaned: a neat trick to debug a live pod without traffic.' },
  { t: 'concept', h: 'Deployment → ReplicaSet → Pods', d: 'objects', html: `<p>You almost never create pods directly. The chain is:</p>
<ul><li><b>Deployment</b>: the pod template + how many + how to update.</li><li><b>ReplicaSet</b>: one per template version; keeps exactly N pods alive.</li><li><b>Pods</b>: the running containers.</li></ul>
<p>Change the image and the Deployment creates a <i>new</i> ReplicaSet, then shifts pods from old to new. That is a rolling update.</p>` },
  { t: 'predict', q: 'Deployment selector is <code>app: cvapi</code> but the template labels say <code>app: cv-api</code>. What does <code>kubectl apply</code> do?', a: 'It is rejected: "selector does not match template labels". The API server validates this because such a Deployment could never find its own pods. Typos in labels are the #1 beginner bug.' },
  { t: 'check', q: 'You need a pod that runs once, per node, for log collection. A Deployment is wrong here. What is the right object?', o: ['DaemonSet', 'ReplicaSet', 'Service', 'ConfigMap'], a: 0, e: 'A DaemonSet runs one pod on every (matching) node: log agents, GPU drivers, node exporters.' },
  { t: 'key', items: ['Labels tag objects; selectors query them. They are the glue of Kubernetes.', 'Deployment manages ReplicaSets, which manage Pods.', 'Pods are cattle: disposable and replaceable, never hand-edited.'] },
  { t: 'mistake', items: [['Creating bare Pods in production', 'Use a Deployment (or StatefulSet/Job) so something recreates them.'], ['Changing a Deployment\'s selector later', 'Selectors are immutable; choose stable labels like app: name from day one.']] }
];

STEPS.k3 = [
  { t: 'concept', h: 'Why pods need a Service', html: `<p>Every recreated pod gets a new IP. If the frontend called <code>10.1.0.7</code> directly, it would break at the next rollout.</p>
<p>A Service gives one <b>stable</b> virtual IP and DNS name, and spreads requests over whatever pods currently match its selector and are Ready.</p>` },
  { t: 'concept', h: 'Service DNS names', d: 'dns', html: `<p>CoreDNS gives every Service a name:</p>
<ul><li><code>cvapi</code>: from a pod in the same namespace.</li><li><code>cvapi.dev</code>: from another namespace.</li><li><code>cvapi.dev.svc.cluster.local</code>: the fully qualified name.</li></ul>` },
  { t: 'example', h: 'Call a Service from inside the cluster', code: `kubectl run tmp --rm -it --image=curlimages/curl -n dev -- sh
curl -s cvapi/health
curl -s cvapi.dev.svc.cluster.local/health
nslookup cvapi`, out: `{"ok":true}
{"ok":true}
Name:    cvapi.dev.svc.cluster.local
Address: 10.152.183.94`, note: 'The Address is the Service\'s ClusterIP, not a pod IP. kube-proxy translates it to a healthy pod.' },
  { t: 'predict', q: 'You scale cvapi from 3 to 0 replicas. What does <code>curl cvapi/health</code> do now?', a: 'It fails (connection refused or timeout). The Service and its DNS name still exist, but its endpoints list is empty, so there is nowhere to send traffic. kubectl get endpoints cvapi shows <none>.' },
  { t: 'check', q: 'MLflow runs in namespace "mlflow", your API in "dev". Which URL works from the API?', o: ['http://mlflow.mlflow:5000', 'http://localhost:5000', 'http://mlflow-pod:5000', 'http://10.1.0.5:5000 (the pod IP)'], a: 0, e: 'service.namespace resolves across namespaces. Pod IPs change; localhost is the API pod itself.' },
  { t: 'key', items: ['Services give stable IP + DNS and load-balance to Ready pods matching the selector.', 'Same namespace: just the service name. Other namespace: name.namespace.', 'ClusterIP for internal traffic; NodePort/LoadBalancer/Ingress to reach it from outside.'] },
  { t: 'mistake', items: [['Hard-coding pod IPs', 'Always call the Service name.'], ['Mixing up port and targetPort', 'port = what clients call on the Service; targetPort = where the container listens.']] }
];

STEPS.k4 = [
  { t: 'concept', h: 'A rolling update, frame by frame', d: 'rollout', html: `<p><code>maxSurge</code>: how many extra pods may exist during the update. <code>maxUnavailable</code>: how many may be missing. With 1 and 0, Kubernetes adds one new pod, waits until it is <b>Ready</b>, removes one old pod, and repeats.</p>
<p>The key word is Ready: rollouts are only as safe as your readiness probe.</p>` },
  { t: 'concept', h: 'Readiness vs liveness vs startup probes', d: 'probes', html: `<ul><li><b>startupProbe</b>: "has the app finished starting?" Gives slow ML models time before the other probes begin.</li><li><b>readinessProbe</b>: "can I receive traffic right now?" Failing removes the pod from the Service, without restarting it.</li><li><b>livenessProbe</b>: "am I stuck?" Failing restarts the container.</li></ul>` },
  { t: 'example', h: 'Probes for a model that loads in ~40 s', code: `containers:
- name: api
  image: ghcr.io/you/cvapi:0.2.0
  startupProbe:
    httpGet: { path: /health, port: 8000 }
    failureThreshold: 30     # 30 × 2s = up to 60s to start
    periodSeconds: 2
  readinessProbe:
    httpGet: { path: /ready, port: 8000 }
    periodSeconds: 5
  livenessProbe:
    httpGet: { path: /health, port: 8000 }
    periodSeconds: 10`, out: `$ kubectl get pods -w
cvapi-6c4b-p2x   0/1   Running   0   10s
cvapi-6c4b-p2x   1/1   Running   0   43s   ← Ready only after the model loaded` },
  { t: 'predict', q: 'You deploy image <code>cvapi:0.3.0</code> that crashes on start. With maxUnavailable: 0, how many old pods are removed?', a: 'None. The first new pod never becomes Ready, so Kubernetes never removes an old one. Users keep being served by 0.2.0 while kubectl rollout status hangs. Then you run kubectl rollout undo.' },
  { t: 'check', q: 'A pod\'s /health works but it is overloaded and slow. You want it to stop getting traffic for a moment, not restart. Which probe should fail?', o: ['readinessProbe', 'livenessProbe', 'startupProbe', 'None, scale down'], a: 0, e: 'Readiness failure removes it from Service endpoints; liveness failure would restart it and lose the loaded model.' },
  { t: 'key', items: ['Rolling updates replace pods gradually; Ready gates each step.', 'startup = slow boot, readiness = traffic on/off, liveness = restart if stuck.', 'rollout undo is instant because the old ReplicaSet is kept.'] },
  { t: 'mistake', items: [['Liveness probe pointing at a slow endpoint', 'Keep /health cheap; heavy checks belong in readiness.'], ['No probes on ML services', 'Without readiness, traffic hits pods whose model isn\'t loaded yet: errors on every deploy.']] }
];

STEPS.k5 = [
  { t: 'concept', h: 'Config outside the image', html: `<p>The same image should run in dev and prod. What differs (thresholds, URLs, passwords) is injected at runtime:</p>
<ul><li><b>ConfigMap</b>: non-secret settings, as env vars or files.</li><li><b>Secret</b>: passwords and tokens, same mechanics, stricter access rules.</li></ul>
<p>The <a href="https://12factor.net/config" target="_blank" rel="noopener">twelve-factor</a> rule: config lives in the environment, not in code.</p>` },
  { t: 'example', h: 'Mount a ConfigMap as a file and see updates', code: `kubectl create configmap cvapi-cfg --from-literal=threshold=0.4
# in the pod spec:
#   volumeMounts: [{ name: cfg, mountPath: /etc/cvapi }]
#   volumes: [{ name: cfg, configMap: { name: cvapi-cfg } }]
kubectl exec deploy/cvapi -- cat /etc/cvapi/threshold
kubectl create configmap cvapi-cfg --from-literal=threshold=0.6 -o yaml --dry-run=client | kubectl apply -f -
sleep 60; kubectl exec deploy/cvapi -- cat /etc/cvapi/threshold`, out: `0.4
0.6`, note: 'Mounted files update by themselves (after up to a minute). Env vars do NOT: they are read once when the container starts, so a restart is needed.' },
  { t: 'concept', h: 'Storage: PVC asks, PV provides', d: 'config', html: `<p>A <b>PersistentVolumeClaim</b> is a request ("10Gi, ReadWriteOnce"). A <b>StorageClass</b> creates a matching <b>PersistentVolume</b> (on MicroK8s: a folder on the node via hostpath-storage; in the cloud: a disk).</p>
<p>The pod only mentions the claim, so the same YAML works on your laptop and on AWS.</p>` },
  { t: 'predict', q: 'You run <code>echo cGFzc3dvcmQ= | base64 -d</code> on a value copied from <code>kubectl get secret -o yaml</code>. What do you get, and what does it teach you?', a: 'You get "password". Secrets are base64-encoded, not encrypted. Protect them with RBAC (who can read secrets), encryption at rest, or an external secret store.' },
  { t: 'check', q: 'You changed a ConfigMap used via envFrom. The app still uses the old value. Why?', o: ['Env vars are read only when the container starts', 'ConfigMaps are cached for 24 hours', 'You must also change the Secret', 'envFrom only works with Secrets'], a: 0, e: 'Restart the pods (kubectl rollout restart deployment/cvapi) or mount the ConfigMap as a file.' },
  { t: 'key', items: ['One image, many environments: inject config with ConfigMaps and Secrets.', 'Mounted ConfigMaps update live; env vars need a restart.', 'PVC = request for storage, PV = the actual disk, StorageClass = who creates it.', 'Namespaces group resources; each Juju model is one.'] },
  { t: 'mistake', items: [['Committing Secret YAML to git', 'Create secrets from the CLI/CI or use sealed/external secrets.'], ['Model weights in a ConfigMap', 'ConfigMaps are limited to 1 MiB. Use a PVC or object storage.']] }
];

STEPS.k6 = [
  { t: 'concept', h: 'Read the pod lifecycle', d: 'podLife', html: `<p>Most problems are visible in which phase a pod is stuck:</p>
<ul><li><b>Pending</b>: not scheduled yet (no room, no GPU, PVC not bound).</li><li><b>ContainerCreating</b>: pulling the image or mounting volumes.</li><li><b>Running</b> but 0/1 Ready: readiness failing.</li><li><b>CrashLoopBackOff</b>: it starts, exits, and Kubernetes waits longer between retries.</li></ul>` },
  { t: 'example', h: 'A real debugging session', code: `kubectl get pods
kubectl describe pod shop-6f8d-abc | tail -5
kubectl logs shop-6f8d-abc --previous`, out: `NAME            READY  STATUS             RESTARTS
shop-6f8d-abc   0/1    CrashLoopBackOff   4
Events:
  Warning  BackOff  kubelet  Back-off restarting failed container
Traceback (most recent call last):
  File "/app/main.py", line 3, in <module>
    DB_URL = os.environ["DB_URL"]
KeyError: 'DB_URL'`, note: 'describe told us it keeps crashing; logs --previous (the crashed run) told us why: a missing env var. Fix the Deployment, not the pod.' },
  { t: 'predict', q: 'A pod is <code>Pending</code> and describe says <code>0/3 nodes are available: 3 Insufficient memory</code>. Your container requests 8Gi. Each node has 4Gi free. Will the pod ever start on its own?', a: 'Not unless memory frees up or a bigger node joins. The scheduler places pods by requests: none of the nodes can reserve 8Gi. Lower the request, add capacity, or free other workloads.' },
  { t: 'check', q: 'Pod status: <code>ImagePullBackOff</code>, image <code>ghcr.io/you/cvapi:0.3</code>. What do you check first?', o: ['The tag exists and the registry needs no missing imagePullSecret', 'Container logs', 'The Service selector', 'CPU limits'], a: 0, e: 'The container never started, so there are no logs. It is either a wrong name/tag or missing registry credentials.' },
  { t: 'check', q: 'Pods are Running and Ready but the Service returns nothing. What next?', o: ['kubectl get endpoints <svc>: compare selector with pod labels', 'Delete the pods', 'Restart the API server', 'Increase replicas'], a: 0, e: 'Empty endpoints = the selector matches no Ready pod, almost always a label typo.' },
  { t: 'key', items: ['get pods → describe (Events!) → logs (--previous) → exec → get events → get endpoints.', 'Pending = scheduling; ImagePullBackOff = image/registry; CrashLoopBackOff = the app exits; OOMKilled = memory limit.', 'Fix the source (Deployment, Service) rather than patching pods.'] },
  { t: 'mistake', items: [['Reading logs of the new container after a crash', 'Use --previous to see the run that crashed.'], ['Deleting pods hoping it fixes things', 'If the template is broken, the replacement will break the same way.']] }
];

STEPS.a1 = [
  { t: 'concept', h: 'One door for many services', d: 'ingress', html: `<p>Without Ingress, each public service needs its own LoadBalancer IP. With Ingress, one entrypoint routes by <b>host</b> (<code>api.cv.local</code>) or <b>path</b> (<code>/api</code>, <code>/ui</code>) to different Services, and can terminate TLS.</p>
<div class="analogy">🏨 <b>Analogy:</b> a hotel reception. One entrance; the receptionist sends you to room 101 or 202 depending on your booking.</div>` },
  { t: 'example', h: 'Route two paths and test with curl', code: `microk8s enable ingress
kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: main }
spec:
  rules:
  - host: cv.local
    http:
      paths:
      - { path: /api, pathType: Prefix, backend: { service: { name: cvapi, port: { number: 80 } } } }
      - { path: /,    pathType: Prefix, backend: { service: { name: ui,    port: { number: 80 } } } }
EOF
curl -s -H 'Host: cv.local' http://127.0.0.1/api/health`, out: `{"ok":true}` },
  { t: 'predict', q: 'You request <code>http://127.0.0.1/api/health</code> without the Host header. What happens?', a: 'You get a 404 from the ingress controller\'s default backend. The rule only matches host cv.local. Add the header, add cv.local to /etc/hosts, or write a rule without a host.' },
  { t: 'check', q: 'Which piece actually receives the HTTP traffic?', o: ['The ingress controller pods (e.g. nginx)', 'The Ingress object', 'etcd', 'The kubelet'], a: 0, e: 'The Ingress object is only configuration. The controller watches it and configures its proxy.' },
  { t: 'key', items: ['Ingress = HTTP routing rules (host/path) + optional TLS.', 'It needs an ingress controller running in the cluster.', 'Ingress → Service → Pods.'] },
  { t: 'mistake', items: [['Creating an Ingress on a cluster without a controller', 'microk8s enable ingress (or install one) first.'], ['Wrong pathType', 'Prefix matches /api/anything; Exact matches only /api.']] }
];

STEPS.a2 = [
  { t: 'concept', h: 'Templates + values = YAML', d: 'helm', html: `<p>A Helm <b>chart</b> is a folder of YAML templates with placeholders like <code>{{ .Values.replicaCount }}</code>. <b>values.yaml</b> holds the defaults; each environment overrides a few of them.</p>
<p>A <b>release</b> is one installed copy of a chart, with numbered revisions you can roll back to.</p>` },
  { t: 'example', h: 'See exactly what Helm will apply', code: `helm create cvapi
helm template demo ./cvapi --set replicaCount=3 --set image.tag=0.2.0 | grep -E "replicas|image:"`, out: `  replicas: 3
          image: "nginx:0.2.0"`, note: 'helm template renders locally, without touching the cluster. Great for learning and for reviewing changes in a PR.' },
  { t: 'example', h: 'Upgrade and roll back a release', code: `helm install cv ./cvapi
helm upgrade cv ./cvapi --set image.tag=0.3.0
helm history cv
helm rollback cv 1`, out: `REVISION  STATUS      DESCRIPTION
1         superseded  Install complete
2         deployed    Upgrade complete
Rollback was a success! Happy Helming!` },
  { t: 'predict', q: 'values.yaml says <code>replicaCount: 2</code>, values-prod.yaml says <code>replicaCount: 5</code>, and you run <code>helm upgrade cv ./cvapi -f values-prod.yaml --set replicaCount=3</code>. How many replicas?', a: '3. Priority goes defaults < -f files (in order) < --set. The last and most specific wins.' },
  { t: 'check', q: 'What does Helm NOT do that a Juju charm does?', o: ['React to events after install (config changes, relations, upgrades logic)', 'Template YAML', 'Roll back a release', 'Install several resources at once'], a: 0, e: 'Helm renders and applies YAML at install/upgrade time. A charm is a running operator handling day-2 operations.' },
  { t: 'key', items: ['Chart = templates; values = parameters; release = installed instance with revisions.', 'helm template to preview, helm upgrade/rollback to change.', 'Value priority: defaults < -f files < --set.'] },
  { t: 'mistake', items: [['Copying the whole chart per environment', 'Keep one chart and a small values file per environment.'], ['Editing resources with kubectl after helm install', 'The next helm upgrade overwrites them; change the chart/values instead.']] }
];

STEPS.a3 = [
  { t: 'concept', h: 'Requests vs limits', d: 'reqLimits', html: `<p><b>requests</b>: what the scheduler <i>reserves</i> for the pod on a node. <b>limits</b>: the hard cap the kernel (cgroups) enforces.</p>
<ul><li>CPU over the limit → the container is <b>throttled</b> (slower).</li><li>Memory over the limit → the container is <b>OOMKilled</b>.</li></ul>
<p><code>500m</code> CPU = half a core. <code>1Gi</code> = 1024 MiB.</p>` },
  { t: 'example', h: 'Spot an OOMKill', code: `kubectl get pod trainer-0
kubectl describe pod trainer-0 | grep -A3 "Last State"`, out: `NAME        READY  STATUS    RESTARTS
trainer-0   0/1    OOMKilled 3
    Last State:  Terminated
      Reason:    OOMKilled
      Exit Code: 137`, note: 'Exit code 137 = 128 + 9 (SIGKILL). Raise limits.memory or reduce batch size.' },
  { t: 'concept', h: 'Horizontal Pod Autoscaler', d: 'hpa', html: `<p>The HPA is another control loop: every 15 s it reads metrics (CPU %, or custom ones like requests/s) and adjusts <code>replicas</code> between <code>min</code> and <code>max</code> to reach a target.</p>
<p>CPU % is measured against <b>requests</b>, so an HPA without requests can\'t work.</p>` },
  { t: 'predict', q: 'Target CPU is 70%. 2 pods run at 140% of their requests on average. Roughly how many replicas will the HPA want?', a: '4. desired = ceil(current replicas × current / target) = ceil(2 × 140 / 70) = 4.' },
  { t: 'check', q: 'A pod requests <code>nvidia.com/gpu: 1</code>. No node has a free GPU. Status?', o: ['Pending', 'Running on CPU instead', 'CrashLoopBackOff', 'OOMKilled'], a: 0, e: 'GPUs are scheduled like any resource; with none free the pod waits in Pending.' },
  { t: 'key', items: ['requests = scheduling reservation; limits = enforced cap.', 'CPU over limit = throttled; memory over limit = OOMKilled (exit 137).', 'HPA scales replicas from metrics; needs requests and metrics-server.', 'Jobs/CronJobs for batch work like nightly retraining.'] },
  { t: 'mistake', items: [['No requests at all', 'The scheduler packs pods blindly and HPA can\'t compute utilisation.'], ['memory limit = request for spiky ML loads without headroom', 'Profile real peak memory first (e.g. first epoch) and add margin.']] }
];

STEPS.a4 = [
  { t: 'concept', h: 'Who, what, where', d: 'rbac', html: `<p>RBAC answers "can <b>this identity</b> do <b>this verb</b> on <b>this resource</b> in <b>this namespace</b>?"</p>
<ul><li><b>Subject</b>: a user, group or ServiceAccount (the identity of a pod).</li><li><b>Role</b> / ClusterRole: a list of allowed verbs on resources.</li><li><b>RoleBinding</b> / ClusterRoleBinding: gives a role to subjects.</li></ul>
<p>Everything is denied unless a binding allows it.</p>` },
  { t: 'example', h: 'Test permissions before you hit them', code: `kubectl create serviceaccount trainer -n dev
kubectl auth can-i list pods -n dev --as=system:serviceaccount:dev:trainer
kubectl create role pod-reader -n dev --verb=get,list,watch --resource=pods
kubectl create rolebinding trainer-reads -n dev --role=pod-reader --serviceaccount=dev:trainer
kubectl auth can-i list pods -n dev --as=system:serviceaccount:dev:trainer
kubectl auth can-i delete pods -n dev --as=system:serviceaccount:dev:trainer`, out: `no
yes
no` },
  { t: 'predict', q: 'The trainer pod now needs to read pods in namespace "prod" too. Does the existing RoleBinding in "dev" allow it?', a: 'No. Role and RoleBinding are namespaced. Create the Role + RoleBinding in prod too, or use a ClusterRole bound with a RoleBinding in each namespace that needs it.' },
  { t: 'check', q: 'Your charm needs to create resources cluster-wide. Which Juju flag grants the extra permissions?', o: ['--trust', '--force', '--classic', '--admin'], a: 0, e: 'juju deploy … --trust lets the charm\'s ServiceAccount get the cluster permissions it declares.' },
  { t: 'key', items: ['RBAC = subject + role (verbs on resources) + binding.', 'Default deny; grant the least needed.', 'kubectl auth can-i … --as=… to test.', 'Kubeflow: one profile = one namespace with RBAC, users log in through Dex/OIDC.'] },
  { t: 'mistake', items: [['Binding cluster-admin to make an error go away', 'Find the exact verb/resource in the error and grant only that.'], ['Using the default ServiceAccount for everything', 'Give each workload its own ServiceAccount.']] }
];

STEPS.a5 = [
  { t: 'concept', h: 'Three signals, three questions', d: 'observability', html: `<ul><li><b>Metrics</b> answer "is something wrong, and how much?" (p95 latency jumped from 80 ms to 900 ms).</li><li><b>Logs</b> answer "what exactly happened?" (stack trace for request 4f2c).</li><li><b>Traces</b> answer "where did the time go?" (900 ms: 20 ms API, 850 ms waiting for MLflow).</li></ul>` },
  { t: 'example', h: 'Expose metrics and read them', code: `from fastapi import FastAPI
from prometheus_client import Histogram, make_asgi_app
app = FastAPI()
LAT = Histogram("inference_seconds", "Model latency", buckets=[.05, .1, .25, .5, 1, 2])
app.mount("/metrics", make_asgi_app())

@app.post("/predict")
def predict():
    with LAT.time():
        return {"label": "cow"}`, out: `$ curl -s localhost:8000/metrics | grep inference_seconds_bucket | head -3
inference_seconds_bucket{le="0.05"} 812.0
inference_seconds_bucket{le="0.1"} 990.0
inference_seconds_bucket{le="0.25"} 1003.0`, note: 'Prometheus scrapes this endpoint. In Grafana: histogram_quantile(0.95, rate(inference_seconds_bucket[5m])) draws your p95 latency.' },
  { t: 'predict', q: 'Average latency is 100 ms and looks fine, but users complain. Why look at p95/p99 instead?', a: 'Averages hide the slow tail. If 5% of requests take 3 s, the mean can still be ~100 ms while many users wait. Percentiles show what the slowest users experience.' },
  { t: 'check', q: 'Logs say "timeout" in the API, MLflow and the DB. You want to know which one caused it for one request. Use…', o: ['A distributed trace with a request id', 'More log lines', 'A CPU metric', 'kubectl top'], a: 0, e: 'A trace links spans of one request across services and shows where the time was spent.' },
  { t: 'key', items: ['Metrics = numbers over time; logs = events as text; traces = one request\'s path.', 'Expose /metrics (prometheus_client); log JSON with a request id; trace with OpenTelemetry.', 'Canonical\'s COS deploys Prometheus, Loki, Grafana and Tempo with Juju.'] },
  { t: 'mistake', items: [['Only watching averages', 'Alert on p95/p99 latency and error rate.'], ['print() for logging', 'Use the logging module with structured (JSON) output so Loki can filter fields.']] }
];

STEPS.a6 = [
  { t: 'concept', h: 'Teach Kubernetes a new word', html: `<p>A <b>CustomResourceDefinition</b> adds a new object type to the API, e.g. <code>kind: Notebook</code>. Now <code>kubectl get notebooks</code> works, and the object is stored in etcd like any other.</p>
<p>But a CRD alone does nothing. It is a form nobody reads yet.</p>` },
  { t: 'concept', h: 'The operator reads the form', d: 'reconcile', html: `<p>An <b>operator</b> is a controller for a custom resource. It watches <code>Notebook</code> objects and reconciles: creates a StatefulSet, a Service, a VirtualService, sets status… exactly like built-in controllers do for Deployments.</p>
<p>It encodes human operational knowledge (backups, upgrades, failover) as code.</p>` },
  { t: 'example', h: 'Explore Kubeflow\'s custom resources', code: `kubectl get crd | grep -E "kubeflow|serving"
kubectl explain notebook.spec | head -6
kubectl get notebooks -A`, out: `notebooks.kubeflow.org            2026-10-12T09:14:02Z
profiles.kubeflow.org             2026-10-12T09:14:03Z
inferenceservices.serving.kserve.io 2026-10-12T09:15:40Z
KIND:     Notebook
FIELD:    spec <Object>
NAMESPACE        NAME     AGE
kubeflow-user    eda      3d` },
  { t: 'predict', q: 'You delete the operator\'s Deployment but keep the CRD and a Notebook object. You then edit the Notebook\'s image. What happens?', a: 'The edit is stored in etcd, but nothing changes in the running pods: no controller is watching. Restart the operator and it reconciles the new spec.' },
  { t: 'check', q: 'How is a Juju charm different from a typical Kubernetes operator?', o: ['It is written with ops in Python and can manage machines and cross-app integrations, not only K8s objects', 'It can\'t run on Kubernetes', 'It has no reconciliation logic', 'It is a Helm chart'], a: 0, e: 'Charms are operators driven by Juju events, can target VMs/bare metal too, and integrate with each other through relations.' },
  { t: 'key', items: ['CRD = a new object type; operator = the controller that reconciles it.', 'Kubeflow is built from CRDs + operators (Notebook, Profile, InferenceService, PipelineRun…).', 'Juju charms are operators with integrations as a first-class feature.'] },
  { t: 'mistake', items: [['Thinking applying a CRD installs the software', 'You also need the operator (controller) running.']] }
];
