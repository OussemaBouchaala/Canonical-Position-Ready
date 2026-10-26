// ===== Extra track for Canonical's second role: "Python Engineer" (general track, https://canonical.com/careers/5143074)
// It covers what that role asks for on top of the shared core: maintainable, performant Python, concurrency,
// REST & gRPC, Debian/Ubuntu packaging, and a first look at Go (and Rust). Lessons, steps, diagrams and flashcards live here.

const JOB2 = {
  title: 'Python Engineer',
  url: 'https://canonical.com/careers/5143074',
  reqs: [
    { id: 'py', label: 'Thoroughly designed, modern, maintainable Python', tracks: ['python', 'pyeng'] },
    { id: 'perf', label: 'Detail orientation with a focus on performance', tracks: ['pyeng'] },
    { id: 'linux', label: 'Experience with Linux (Debian or Ubuntu preferred)', tracks: ['linux'] },
    { id: 'containers', label: 'Container technologies: LXD, Docker, Kubernetes', tracks: ['containers', 'k8s1'] },
    { id: 'quality', label: 'Deep quality and test engineering', tracks: ['python'] },
    { id: 'api', label: 'REST and gRPC APIs · SQL and NoSQL stores', tracks: ['pyeng'] },
    { id: 'pkg', label: 'Debian/Ubuntu packaging · build systems and toolchains', tracks: ['pyeng', 'linux'] },
    { id: 'lang', label: 'Additional languages: Go or Rust, C or C++', tracks: ['pyeng'] },
    { id: 'app', label: 'Academic record + communication + written answers in your own words', tracks: ['apply'] }
  ],
  // Starting point from your CV (C/C++, React/Angular, REST, PostgreSQL/MongoDB, Docker, GitHub Actions)
  base: { py: 50, perf: 15, linux: 30, containers: 35, quality: 20, api: 55, pkg: 5, lang: 35, app: 20 }
};

Object.assign(DIAGRAMS, {
  concurrency: svg(780, 270,
    zone(10, 10, 245, 250, 'Threads', 'var(--k8s)') + zone(267, 10, 245, 250, 'Processes', 'var(--ml)') + zone(524, 10, 245, 250, 'asyncio', 'var(--ok)') +
    box(30, 45, 205, 44, 'one process, one GIL', 'var(--k8s)') + chip(30, 105, 95, 'T1 runs', 'var(--k8s)') + chip(140, 105, 95, 'T2 waits', 'var(--mut)') +
    note(132, 160, 'only one thread runs Python', 'middle') + note(132, 178, 'bytecode at a time') + note(132, 220, '✅ I/O-bound (HTTP, disk)', 'middle', 'var(--tx)') +
    box(287, 45, 95, 44, 'P1 + GIL', 'var(--ml)') + box(397, 45, 95, 44, 'P2 + GIL', 'var(--ml)') + note(390, 125, 'each process has its own', 'middle') + note(390, 143, 'interpreter: true parallelism') +
    note(390, 178, 'cost: memory + pickling data') + note(390, 220, '✅ CPU-bound (resize, math)', 'middle', 'var(--tx)') +
    box(544, 45, 205, 44, 'one thread, event loop', 'var(--ok)') + note(646, 125, 'tasks pause at every await', 'middle') + note(646, 143, 'and let others run') +
    note(646, 178, 'thousands of open connections') + note(646, 220, '✅ many slow network calls', 'middle', 'var(--tx)')),

  grpcFlow: svg(780, 250,
    box(290, 10, 200, 50, 'detect.proto', 'var(--acc)', 'the contract') + arrow(390, 60, 390, 90, 'protoc') +
    box(250, 90, 280, 44, 'generated stubs: Python, Go, C++…', 'var(--mut)') +
    arrow(320, 134, 150, 170) + arrow(460, 134, 630, 170) +
    box(20, 170, 260, 60, 'Client (Python)', 'var(--py)', 'stub.Detect(request)') + box(500, 170, 260, 60, 'Server (Go or Python)', 'var(--k8s)', 'implements Detect()') +
    arrow(280, 190, 500, 190, 'HTTP/2 · binary protobuf') + arrow(500, 215, 280, 215, 'typed response or stream')),

  debFlow: svg(780, 240,
    box(10, 20, 150, 60, 'your project', 'var(--py)', 'pyproject.toml') + arrow(160, 50, 200, 50) +
    box(200, 20, 170, 60, 'debian/', 'var(--acc)', 'control · rules · changelog') + arrow(370, 50, 410, 50, 'debuild') +
    box(410, 20, 150, 60, 'mytool_1.0_all.deb', 'var(--k8s)') + arrow(560, 50, 600, 50) + box(600, 20, 170, 60, 'Launchpad PPA', 'var(--ok)', 'apt install mytool') +
    box(200, 140, 170, 60, 'snap/snapcraft.yaml', 'var(--acc)', 'plugin: python') + arrow(160, 70, 200, 160) + arrow(370, 170, 410, 170, 'snapcraft') +
    box(410, 140, 150, 60, 'mytool_1.0.snap', 'var(--k8s)') + arrow(560, 170, 600, 170) + box(600, 140, 170, 60, 'Snap Store', 'var(--ok)', 'snap install mytool') +
    note(390, 228, 'Same code, two Ubuntu-native ways to ship it'))
});

TRACKS.splice(TRACKS.findIndex(t => t.id === 'apply'), 0,
{ id: 'pyeng', icon: '🛠️', title: 'Python Engineer: deeper Python', color: 'var(--py)', req: 'Second role "Python Engineer": maintainable, fast Python · gRPC · Ubuntu packaging · Go/Rust',
  intro: 'Canonical also hires a general "Python Engineer" for every team that writes Python. This track adds what that role asks for beyond the shared core: clean design, performance, concurrency, gRPC, Ubuntu packaging and a first look at Go.',
  lessons: [
  { id: 'e1', title: 'Pythonic design: the data model, dataclasses & protocols', xp: 80, min: 30,
    body: `<p>"Thoroughly designed, modern, maintainable Python" means code that reads like the standard library: small objects with clear jobs, types that tools can check, and behaviour that plugs into Python's own syntax.</p>
<ul><li><b>The data model</b>: implement <code>__len__</code>, <code>__iter__</code>, <code>__repr__</code> and your object works with <code>len()</code>, <code>for</code> loops and the debugger.</li>
<li><b>dataclasses</b>: value objects without boilerplate.</li>
<li><b>Protocols</b>: "anything with a <code>.predict()</code> method" as a type, without inheritance.</li>
<li><b>Composition over inheritance</b>: pass collaborators in, so tests can swap them.</li></ul>
<div class="analogy">🔌 <b>Analogy:</b> a Protocol is a socket shape. Any plug with the right pins fits, whatever brand made it.</div>`,
    videos: [{ l: 'Python data model (dunder methods)', q: 'python data model dunder methods explained' }, { l: 'typing.Protocol', q: 'python typing protocol structural subtyping' }],
    docs: [{ t: 'Data model', u: 'https://docs.python.org/3/reference/datamodel.html' }, { t: 'dataclasses', u: 'https://docs.python.org/3/library/dataclasses.html' }, { t: 'typing.Protocol', u: 'https://typing.python.org/en/latest/spec/protocol.html' }],
    quiz: [
      { q: 'You implement <code>__iter__</code> on your <code>Dataset</code> class. What do you get?', o: ['Faster attribute access', '<code>for item in dataset</code> works', 'Automatic type checking', 'A free <code>__len__</code>'], a: 1, e: '__iter__ makes the object iterable, so for-loops, list() and comprehensions work.' },
      { q: 'Why prefer a Protocol over a base class for "a model with predict()"?', o: ['Protocols run faster', 'Any class with the right method fits, no inheritance needed', 'Base classes are deprecated', 'Protocols validate inputs at runtime'], a: 1, e: 'Structural typing: mypy checks the shape, not the family tree.' },
      { q: '<code>@dataclass(frozen=True)</code> gives you…', o: ['a class whose fields can\'t be reassigned', 'a class stored on disk', 'a singleton', 'a class that can\'t have methods'], a: 0, e: 'Frozen = immutable value object; it also becomes hashable.' }],
    lab: { title: 'Refactor one module', steps: [{ t: 'Pick a module from your YOLO or ETL project and replace loose dicts with dataclasses', c: '' }, { t: 'Add a Protocol for the model or data source and type the functions that use it', c: '' }, { t: 'Run mypy in strict mode and fix what it finds', c: 'mypy --strict src/' }] } },

  { id: 'e2', title: 'Performance: measure first, then optimise', xp: 90, min: 35,
    body: `<p>The role asks for "conscientiousness and detail orientation, with a focus on performance". In practice that is a habit: <b>measure, find the hot spot, fix the algorithm, measure again</b>.</p>
<ul><li><b>Measure</b>: <code>timeit</code> for small snippets, <code>cProfile</code> for a whole program, <code>py-spy</code> for a live process.</li>
<li><b>Algorithm first</b>: a <code>set</code> lookup is O(1), a <code>list</code> lookup is O(n). That beats any micro-trick.</li>
<li><b>Then</b>: built-ins and comprehensions, generators for big data, <code>functools.cache</code>, NumPy vectorisation for numeric loops.</li></ul>
<div class="analogy">🚗 <b>Analogy:</b> don't tune the engine before checking the handbrake is off. Profiling finds the handbrake.</div>`,
    videos: [{ l: 'Profiling Python with cProfile', q: 'python cprofile snakeviz profiling tutorial' }, { l: 'Python performance tips', q: 'python performance optimization talk' }],
    docs: [{ t: 'The Python profilers', u: 'https://docs.python.org/3/library/profile.html' }, { t: 'py-spy', u: 'https://github.com/benfred/py-spy' }, { t: 'TimeComplexity', u: 'https://wiki.python.org/moin/TimeComplexity' }],
    quiz: [
      { q: 'Your script is slow. What do you do first?', o: ['Rewrite it in C', 'Profile it to find where time goes', 'Add caching everywhere', 'Switch to PyPy'], a: 1, e: 'Without measuring you optimise the wrong 90% of the code.' },
      { q: '<code>if x in big_list</code> inside a loop over 100k items is slow because…', o: ['lists are stored on disk', 'each lookup scans the list: O(n), so the loop is O(n²)', '"in" is deprecated', 'Python copies the list each time'], a: 1, e: 'Convert to a set once: lookups become O(1).' },
      { q: 'Reading a 20 GB log line by line without running out of RAM:', o: ['f.readlines()', 'iterate the file object (a generator)', 'json.load(f)', 'f.read().split()'], a: 1, e: 'for line in f streams one line at a time.' }],
    lab: { title: 'Profile something real', steps: [{ t: 'Profile your ETL or inference script and save the top 10 functions', c: 'python -m cProfile -s cumtime main.py | head -30' }, { t: 'Fix the biggest hot spot and measure the speed-up with timeit', c: 'python -m timeit -s "import mymod" "mymod.hot()"' }, { t: 'Write the before/after numbers in your README', c: '' }] } },

  { id: 'e3', title: 'Concurrency: threads, processes & asyncio', xp: 90, min: 35, diagram: 'concurrency',
    body: `<p>Python has three ways to do several things at once. Picking the right one is a classic interview question.</p>
<ul><li><b>Threads</b> share memory, but the <b>GIL</b> lets only one run Python code at a time. Great for waiting (network, disk).</li>
<li><b>Processes</b> each have their own interpreter: real parallel CPU work, at the cost of memory and copying data.</li>
<li><b>asyncio</b>: one thread, many tasks that pause at <code>await</code>. Best for thousands of slow network calls.</li></ul>
<p><code>concurrent.futures</code> gives threads and processes the same simple API. Python 3.13 added an experimental free-threaded build without the GIL; know that it exists, but assume the GIL in interviews unless told otherwise.</p>`,
    videos: [{ l: 'Threading vs multiprocessing vs asyncio', q: 'python threading vs multiprocessing vs asyncio explained' }, { l: 'The GIL explained', q: 'python GIL explained' }],
    docs: [{ t: 'concurrent.futures', u: 'https://docs.python.org/3/library/concurrent.futures.html' }, { t: 'asyncio', u: 'https://docs.python.org/3/library/asyncio.html' }],
    quiz: [
      { q: 'Resizing 10,000 images (pure CPU) as fast as possible:', o: ['ThreadPoolExecutor', 'ProcessPoolExecutor', 'asyncio.gather', 'a while loop'], a: 1, e: 'CPU-bound work needs separate processes to escape the GIL.' },
      { q: 'Calling 500 slow HTTP APIs:', o: ['ProcessPoolExecutor with 500 processes', 'asyncio (or a thread pool)', 'one call after another', 'os.fork() in a loop'], a: 1, e: 'I/O-bound: the work is waiting, so async or threads overlap the waits cheaply.' },
      { q: 'What does the GIL prevent?', o: ['Two threads running Python bytecode at the same moment', 'Two processes reading one file', 'Using more than one CPU in any way', 'Calling C libraries'], a: 0, e: 'NumPy and other C code can release the GIL; pure Python bytecode cannot run in parallel threads.' }],
    lab: { title: 'Race the three models', steps: [{ t: 'Download 50 URLs sequentially, then with ThreadPoolExecutor, then with asyncio + httpx; time each', c: 'pip install httpx' }, { t: 'Run a CPU-heavy function on 8 inputs with threads, then processes; compare', c: '' }, { t: 'Write one sentence per result explaining why', c: '' }] } },

  { id: 'e4', title: 'APIs: REST vs gRPC', xp: 80, min: 30, diagram: 'grpcFlow',
    body: `<p>You already ship REST APIs with FastAPI. Many Canonical services also speak <b>gRPC</b>: you describe the API once in a <code>.proto</code> file, generate typed client and server code for any language, and talk over HTTP/2 with compact binary messages.</p>
<ul><li><b>REST + JSON</b>: human-readable, works in any browser, great for public APIs.</li>
<li><b>gRPC + protobuf</b>: strict contract, smaller and faster messages, streaming both ways, ideal between services (e.g. a Go service and a Python service).</li></ul>
<div class="analogy">📄 <b>Analogy:</b> REST is writing a letter in plain language; gRPC is filling in an official form both sides printed from the same template.</div>`,
    videos: [{ l: 'gRPC in Python', q: 'grpc python tutorial protobuf' }, { l: 'REST vs gRPC', q: 'rest vs grpc explained' }],
    docs: [{ t: 'gRPC Python quick start', u: 'https://grpc.io/docs/languages/python/quickstart/' }, { t: 'Protocol Buffers', u: 'https://protobuf.dev/' }],
    quiz: [
      { q: 'Where is a gRPC API defined?', o: ['In an OpenAPI YAML generated at runtime', 'In a .proto file shared by client and server', 'In the server\'s README', 'In HTTP headers'], a: 1, e: 'The .proto contract generates code for every language.' },
      { q: 'gRPC runs on…', o: ['HTTP/1.0 with XML', 'HTTP/2 with binary protobuf messages', 'raw UDP', 'WebSockets with JSON'], a: 1, e: 'HTTP/2 enables multiplexing and streaming.' },
      { q: 'A browser-facing public API for third parties is usually…', o: ['REST/JSON', 'gRPC only', 'SOAP', 'raw TCP'], a: 0, e: 'REST is easiest for browsers and outside developers; gRPC shines between internal services.' }],
    lab: { title: 'Your first gRPC service', steps: [{ t: 'Install the tools and write detect.proto with one Detect RPC', c: 'pip install grpcio grpcio-tools' }, { t: 'Generate the Python stubs', c: 'python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. detect.proto' }, { t: 'Implement the server, call it from a client, then add a server-streaming RPC', c: '' }] } },

  { id: 'e5', title: 'Shipping Python on Ubuntu: .deb packages & snaps', xp: 90, min: 35, diagram: 'debFlow',
    body: `<p>Ubuntu is Canonical's product, so "experience with Debian/Ubuntu packaging" is a real plus. There are two native ways to ship your Python tool:</p>
<ul><li><b>.deb</b>: a <code>debian/</code> folder (<code>control</code>, <code>rules</code>, <code>changelog</code>, <code>copyright</code>) built with <code>debuild</code>; <code>dh-python</code> and <code>pybuild</code> do most of the work. Publish to a <b>Launchpad PPA</b>.</li>
<li><b>snap</b>: one <code>snapcraft.yaml</code> with <code>plugin: python</code>; bundles its dependencies, runs confined, updates itself. Publish to the Snap Store.</li></ul>
<p>Both start from a clean <code>pyproject.toml</code>, which you learned in Production Python.</p>`,
    videos: [{ l: 'Snapcraft for Python apps', q: 'snapcraft python snap tutorial' }, { l: 'Debian packaging basics', q: 'debian packaging tutorial debuild dh' }],
    docs: [{ t: 'Snapcraft Python plugin', u: 'https://documentation.ubuntu.com/snapcraft/stable/reference/plugins/python_plugin/' }, { t: 'Ubuntu packaging guide', u: 'https://canonical-ubuntu-packaging-guide.readthedocs-hosted.com/' }, { t: 'dh-python', u: 'https://wiki.debian.org/Python/Pybuild' }],
    quiz: [
      { q: 'Which file in <code>debian/</code> lists the package name and its dependencies?', o: ['rules', 'control', 'changelog', 'compat'], a: 1, e: 'debian/control holds Source/Package stanzas, Depends and the description.' },
      { q: 'A snap differs from a .deb mainly because it…', o: ['only runs on Debian', 'bundles its dependencies and runs confined', 'must be written in Go', 'needs Docker'], a: 1, e: 'Self-contained + strict confinement + automatic updates.' },
      { q: 'Where do you publish a .deb so others can apt install it?', o: ['PyPI', 'a Launchpad PPA', 'Docker Hub', 'the Snap Store'], a: 1, e: 'A Personal Package Archive on Launchpad.' }],
    lab: { title: 'Package your CLI', steps: [{ t: 'Make a tiny CLI with a [project.scripts] entry in pyproject.toml', c: '' }, { t: 'Write snap/snapcraft.yaml (base core24, plugin python) and build it', c: 'sudo snap install snapcraft --classic && snapcraft' }, { t: 'Install your snap locally and run it', c: 'sudo snap install ./mytool_*.snap --dangerous' }, { t: 'Bonus: build a .deb with dh-python and check it with lintian', c: 'sudo apt install devscripts dh-python && debuild -us -uc && lintian ../*.deb' }] } },

  { id: 'e6', title: 'Go (and a bit of Rust) for Python developers', xp: 80, min: 35,
    body: `<p>The role lists "additional languages, particularly Golang or Rust, C or C++". You already have C/C++. Go is worth a first look because much of Canonical's infrastructure is written in it: <b>Juju</b>, <b>LXD</b>, <b>snapd</b> and <b>Pebble</b>.</p>
<ul><li><b>Go</b>: static types, compiles to one binary, errors are return values, <b>goroutines</b> and <b>channels</b> make concurrency simple.</li>
<li><b>Rust</b>: memory safety without a garbage collector. Ubuntu is adopting Rust tools such as <code>sudo-rs</code> and the Rust coreutils.</li></ul>
<p>Goal for this lesson: read Go code comfortably and write a small tool, not become an expert.</p>`,
    videos: [{ l: 'Go for Python developers', q: 'golang for python developers' }, { l: 'Go in 100 seconds', q: 'go in 100 seconds fireship' }],
    docs: [{ t: 'A Tour of Go', u: 'https://go.dev/tour/' }, { t: 'Pebble (Go, by Canonical)', u: 'https://github.com/canonical/pebble' }, { t: 'The Rust Book', u: 'https://doc.rust-lang.org/book/' }],
    quiz: [
      { q: 'How does Go usually report errors?', o: ['Exceptions with try/except', 'As a second return value you must check', 'By printing to stderr', 'With error codes in globals'], a: 1, e: 'value, err := f(); if err != nil { … }' },
      { q: 'A goroutine is…', o: ['a Go package manager', 'a very lightweight concurrent function started with go f()', 'a type of channel', 'a compiled binary'], a: 1, e: 'Thousands of goroutines are cheap; channels pass data between them.' },
      { q: 'Which Canonical project is written in Go?', o: ['Charmed Kubeflow notebooks', 'Juju', 'MLflow', 'pytest'], a: 1, e: 'Juju, LXD, snapd and Pebble are all Go.' }],
    lab: { title: 'Hello, Go', steps: [{ t: 'Install Go and finish the first two sections of the Tour of Go', c: 'sudo snap install go --classic' }, { t: 'Write a Go CLI that downloads 10 URLs concurrently with goroutines', c: 'go mod init urlcheck && go run .' }, { t: 'Read 50 lines of Pebble\'s source and explain one function to Kube', c: '' }] } }
  ],
  boss: [
    { q: 'Best tool to see which functions use the most time in a running server?', o: ['print()', 'py-spy', 'pip', 'mypy'], a: 1, e: 'py-spy samples a live process without restarting it.' },
    { q: 'CPU-bound work in Python runs in parallel with…', o: ['threads', 'processes', 'asyncio', 'generators'], a: 1, e: 'Each process has its own GIL.' },
    { q: 'gRPC APIs are described in…', o: ['.proto files', 'OpenAPI YAML', 'Dockerfiles', 'snapcraft.yaml'], a: 0, e: 'Protocol Buffers definitions.' },
    { q: 'The snapcraft plugin that builds a Python app:', o: ['plugin: dump', 'plugin: python', 'plugin: make', 'plugin: go'], a: 1, e: 'It creates a venv and installs your project into the snap.' },
    { q: 'Structural typing ("anything with .predict()") is written with…', o: ['abc.ABC', 'typing.Protocol', 'dataclass', 'TypedDict'], a: 1, e: 'Protocol checks the shape, not inheritance.' }]
});

FLASH.push(
  ['Dunder methods', '__len__, __iter__, __repr__, __eq__… let your objects work with Python syntax and built-ins.'],
  ['typing.Protocol', 'Structural type: any class with the right methods matches, no inheritance needed.'],
  ['cProfile vs py-spy', 'cProfile: run a program under the profiler. py-spy: sample an already-running process.'],
  ['set vs list lookup', 'x in set is O(1) on average; x in list is O(n).'],
  ['GIL', 'Global Interpreter Lock: one thread runs Python bytecode at a time per process.'],
  ['Threads vs processes vs asyncio', 'Threads: I/O waits. Processes: CPU work in parallel. asyncio: many concurrent network calls in one thread.'],
  ['gRPC', 'RPC framework: .proto contract → generated stubs, HTTP/2, binary protobuf, streaming.'],
  ['debian/control', 'Declares source and binary packages, dependencies and the description of a .deb.'],
  ['Launchpad PPA', 'Personal Package Archive: publish .debs so people can apt install them.'],
  ['Goroutine + channel', 'Go: cheap concurrent function (go f()) + typed pipe to pass values between them.']
);

BADGES.push({ id: 'pyeng', e: '🛠️', t: 'Python engineer', d: 'Finish the Python Engineer track', test: s => s.trackDone('pyeng') });

STEPS.e1 = [
  { t: 'concept', h: 'The data model: plug into Python\'s syntax', html: `<p>When Python runs <code>len(x)</code> it calls <code>x.__len__()</code>. <code>for i in x</code> calls <code>x.__iter__()</code>. Implement these "dunder" methods and your class behaves like a built-in.</p>` },
  { t: 'example', h: 'A dataset that works with len() and for-loops', code: `class Frames:
    def __init__(self, paths: list[str]):
        self._paths = paths

    def __len__(self) -> int:
        return len(self._paths)

    def __iter__(self):
        return iter(self._paths)

    def __repr__(self) -> str:
        return f"Frames({len(self)} frames)"

f = Frames(["a.jpg", "b.jpg"])
print(len(f), list(f), f)`, out: `2 ['a.jpg', 'b.jpg'] Frames(2 frames)`, note: '__repr__ is what you see in the debugger and in logs. Always write one.' },
  { t: 'predict', q: 'You add <code>__getitem__(self, i)</code> returning <code>self._paths[i]</code>. What does <code>f[0:1]</code> return?', a: 'A list with the first path, <code>[\'a.jpg\']</code>: the slice object is passed straight to the list, so slicing works for free.' },
  { t: 'concept', h: 'Protocols: types by shape', html: `<p>A <code>Protocol</code> says "anything with these methods". Your YOLO model, a fake model in tests and a future ONNX model all fit without sharing a base class.</p>` },
  { t: 'example', h: 'Swap models without inheritance', code: `from dataclasses import dataclass
from typing import Protocol

@dataclass(frozen=True)
class Box:
    label: str
    score: float

class Detector(Protocol):
    def predict(self, image: bytes) -> list[Box]: ...

class FakeDetector:                      # no inheritance
    def predict(self, image: bytes) -> list[Box]:
        return [Box("cow", 0.9)]

def count(detector: Detector, image: bytes) -> int:
    return len(detector.predict(image))

print(count(FakeDetector(), b""))`, out: `1`, note: 'mypy accepts FakeDetector because it has the right shape. This is how you test code without a GPU.' },
  { t: 'check', q: 'Why pass the detector into <code>count()</code> instead of creating it inside?', o: ['Tests can pass a fake one: composition and dependency injection', 'It runs faster', 'Python requires it', 'To avoid using dataclasses'], a: 0, e: 'Passing collaborators in keeps code testable and flexible.' },
  { t: 'key', items: ['Dunder methods make your objects work with len(), for, ==, print().', 'dataclass(frozen=True) = clean immutable value objects.', 'Protocol = "anything with this method"; great for testing.', 'Pass collaborators in instead of creating them inside.'] },
  { t: 'mistake', items: [['Deep inheritance trees (BaseModel → YoloBase → YoloV8Base…)', 'Small classes composed together, typed with Protocols.'], ['Passing dicts like {"label": …, "score": …} everywhere', 'A dataclass: typos become errors, editors autocomplete.']] }
];

STEPS.e2 = [
  { t: 'concept', h: 'Measure, don\'t guess', html: `<p>Programs usually spend most of their time in a few lines. A profiler tells you which. Optimising anything else is wasted effort and makes code harder to read.</p>` },
  { t: 'example', h: 'cProfile on a whole script', code: `python -m cProfile -s cumtime etl.py | head -12`, out: `   ncalls  tottime  cumtime  filename:lineno(function)
        1    0.010   14.210  etl.py:1(<module>)
        1    0.020   14.100  etl.py:30(run)
    20000   13.800   13.950  etl.py:12(is_known_patient)
    20000    0.090    0.090  etl.py:20(normalise)`, note: 'One function takes 98% of the time. That is the only thing worth touching.' },
  { t: 'example', h: 'The fix: pick the right data structure', code: `known = load_ids()            # list of 50,000 ids

# before: O(n) scan per row → O(n²) overall
def is_known_patient(pid):
    return pid in known

# after: convert once, O(1) per lookup
known_set = set(known)
def is_known_patient(pid):
    return pid in known_set`, out: `before: 13.8 s   after: 0.02 s`, note: 'An algorithm change beats any micro-optimisation.' },
  { t: 'predict', q: 'You run <code>python -m timeit "sum([i*i for i in range(10**6)])"</code> and then the same with <code>(i*i for i in …)</code> (a generator). Which uses less memory?', a: 'The generator: it produces one number at a time instead of building a list of a million numbers first. Speed is similar; memory is far lower.' },
  { t: 'concept', h: 'The usual toolbox, in order', html: `<ol><li>Better algorithm or data structure (set, dict, heapq, bisect).</li><li>Built-ins and comprehensions (they run in C).</li><li>Avoid repeated work: <code>functools.cache</code>, hoist work out of loops.</li><li>NumPy for numeric arrays: one vectorised call instead of a Python loop.</li><li>Only then: processes, Cython, Rust extensions.</li></ol>` },
  { t: 'check', q: 'Profiling shows 80% of time in <code>json.loads</code> of the same config file, called 10,000 times. Best fix?', o: ['Load it once and reuse the result', 'Use threads', 'Rewrite json.loads', 'Add more RAM'], a: 0, e: 'Remove the repeated work first; caching the parsed config makes the cost disappear.' },
  { t: 'key', items: ['Profile first: cProfile for scripts, py-spy for live processes, timeit for snippets.', 'Algorithms and data structures give the big wins.', 'Generators keep memory flat on big data.', 'Write down before/after numbers: that is your interview story.'] },
  { t: 'mistake', items: [['Optimising code that the profiler never shows', 'Fix the top line of the profile, then profile again.'], ['Timing once with time.time()', 'Use timeit: it repeats the run and avoids noise.']] }
];

STEPS.e3 = [
  { t: 'concept', h: 'Two kinds of slow', d: 'concurrency', html: `<p><b>I/O-bound</b>: the program waits (network, disk, database). <b>CPU-bound</b>: the program computes (image resizing, maths). The right tool depends on which one you have.</p>` },
  { t: 'example', h: 'Threads for waiting', code: `from concurrent.futures import ThreadPoolExecutor
import urllib.request, time

urls = ["https://ubuntu.com"] * 20
def fetch(u): return len(urllib.request.urlopen(u).read())

t = time.perf_counter()
with ThreadPoolExecutor(max_workers=10) as pool:
    sizes = list(pool.map(fetch, urls))
print(f"{time.perf_counter() - t:.1f}s")`, out: `sequential: 8.4s   10 threads: 1.1s`, note: 'While one thread waits for the network, the GIL is released and another thread runs.' },
  { t: 'example', h: 'Processes for computing', code: `from concurrent.futures import ProcessPoolExecutor

def heavy(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == "__main__":
    with ProcessPoolExecutor() as pool:
        print(list(pool.map(heavy, [10**7] * 8)))`, out: `threads: 6.9s   processes (8 cores): 1.2s`, note: 'Same API, different executor. The if __name__ guard is required for processes on some platforms.' },
  { t: 'example', h: 'asyncio for many connections', code: `import asyncio, httpx

async def main():
    async with httpx.AsyncClient() as client:
        rs = await asyncio.gather(*(client.get("https://ubuntu.com") for _ in range(100)))
    print({r.status_code for r in rs})

asyncio.run(main())`, out: `{200}`, note: 'One thread, 100 requests in flight. Never call blocking functions (time.sleep, requests.get) inside async code.' },
  { t: 'check', q: 'An async endpoint calls <code>requests.get()</code> (a blocking library). What happens?', o: ['The whole event loop freezes while it waits', 'It becomes async automatically', 'Python raises an error', 'It runs in a new process'], a: 0, e: 'Use an async client (httpx) or asyncio.to_thread() for blocking calls.' },
  { t: 'predict', q: 'You use 8 threads to resize 1,000 images with pure-Python code on an 8-core laptop. Roughly how much faster than 1 thread?', a: 'About the same speed (maybe slower): the GIL lets only one thread run Python bytecode at a time. Use processes, or a library like Pillow/NumPy that releases the GIL.' },
  { t: 'key', items: ['I/O-bound → threads or asyncio. CPU-bound → processes.', 'concurrent.futures gives one API for threads and processes.', 'asyncio needs async libraries all the way down.', 'C libraries (NumPy, Pillow) can release the GIL.'] },
  { t: 'mistake', items: [['Using threads to speed up pure-Python maths', 'ProcessPoolExecutor, or vectorise with NumPy.'], ['time.sleep() inside async def', 'await asyncio.sleep(): sleep without blocking the loop.']] }
];

STEPS.e4 = [
  { t: 'concept', h: 'Contract first', d: 'grpcFlow', html: `<p>With gRPC you write the API as a <code>.proto</code> file. A compiler turns it into typed code for each language, so a Go server and a Python client can't disagree about field names or types.</p>` },
  { t: 'example', h: 'The contract', code: `syntax = "proto3";
package detect;

message DetectRequest { bytes image = 1; float min_score = 2; }
message Box { string label = 1; float score = 2; }
message DetectReply { repeated Box boxes = 1; }

service Detector {
  rpc Detect (DetectRequest) returns (DetectReply);
  rpc DetectStream (stream DetectRequest) returns (stream DetectReply);
}`, note: 'The numbers are field tags on the wire. Never reuse a tag after removing a field: that keeps old clients compatible.' },
  { t: 'example', h: 'Python server and client', code: `# server.py
import grpc
from concurrent import futures
import detect_pb2, detect_pb2_grpc

class Detector(detect_pb2_grpc.DetectorServicer):
    def Detect(self, req, ctx):
        return detect_pb2.DetectReply(boxes=[detect_pb2.Box(label="cow", score=0.93)])

server = grpc.server(futures.ThreadPoolExecutor(4))
detect_pb2_grpc.add_DetectorServicer_to_server(Detector(), server)
server.add_insecure_port("[::]:50051"); server.start(); server.wait_for_termination()

# client.py
with grpc.insecure_channel("localhost:50051") as ch:
    stub = detect_pb2_grpc.DetectorStub(ch)
    print(stub.Detect(detect_pb2.DetectRequest(image=b"...")))`, out: `boxes {
  label: "cow"
  score: 0.93
}` },
  { t: 'check', q: 'You must stream video frames to a detector and get results back continuously. Which fits best?', o: ['Bidirectional streaming gRPC', 'One REST POST per frame with JSON base64 images', 'Email', 'A cron job'], a: 0, e: 'gRPC streams keep one HTTP/2 connection open both ways with compact binary messages.' },
  { t: 'predict', q: 'You remove field <code>min_score = 2</code> and later add <code>string model = 2</code>. Old clients still send min_score. What goes wrong?', a: 'The server reads their float bytes as the new "model" string field: corrupted or failing requests. Reserve removed tags (<code>reserved 2;</code>) and use a new number.' },
  { t: 'key', items: ['.proto = single source of truth; code is generated.', 'HTTP/2 + binary protobuf: small, fast, streaming.', 'REST for public/browser APIs, gRPC between services.', 'Never reuse field numbers.'] },
  { t: 'mistake', items: [['Hand-editing generated *_pb2.py files', 'Change the .proto and regenerate.'], ['Exposing gRPC directly to browsers', 'Use REST (or gRPC-Web via a proxy) for browser clients.']] }
];

STEPS.e5 = [
  { t: 'concept', h: 'Two Ubuntu-native packages', d: 'debFlow', html: `<p>A <b>.deb</b> integrates with the system: it uses the shared Python and libraries from the archive. A <b>snap</b> carries its own dependencies and runs confined. Canonical maintains both ecosystems.</p>` },
  { t: 'example', h: 'A minimal snapcraft.yaml for a Python CLI', code: `name: framecount
base: core24
version: '0.1.0'
summary: Count frames in a video folder
description: Small CLI packaged as a snap.
grade: stable
confinement: strict

parts:
  framecount:
    plugin: python
    source: .

apps:
  framecount:
    command: bin/framecount
    plugs: [home]`, out: `$ snapcraft
Packed framecount_0.1.0_amd64.snap
$ sudo snap install ./framecount_0.1.0_amd64.snap --dangerous
$ framecount ~/videos
42 frames`, note: '--dangerous means "not signed by the store", fine for local testing. plugs: [home] lets the confined app read your home folder.' },
  { t: 'example', h: 'The heart of a .deb: debian/control', code: `Source: framecount
Section: utils
Priority: optional
Maintainer: Oussema Bouchaala <you@example.com>
Build-Depends: debhelper-compat (= 13), dh-python, python3-all, pybuild-plugin-pyproject
Standards-Version: 4.7.0

Package: framecount
Architecture: all
Depends: \${python3:Depends}, \${misc:Depends}
Description: count frames in a video folder
 Small CLI written in Python.`, note: 'debian/rules can be three lines: %: then dh $@ --with python3 --buildsystem=pybuild.' },
  { t: 'check', q: 'Your snap can\'t read files in <code>/home</code>. Most likely cause?', o: ['Strict confinement without the home plug', 'Python is missing', 'The .deb is broken', 'Snaps can never read files'], a: 0, e: 'Confined snaps only get access through interfaces (plugs) such as home or removable-media.' },
  { t: 'predict', q: 'Why does <code>Depends</code> use <code>${python3:Depends}</code> instead of listing packages by hand?', a: 'dh-python fills it in at build time from your project\'s real imports and Python version, so dependencies stay correct automatically.' },
  { t: 'key', items: ['.deb: debian/control + rules + changelog, built with debuild, published via a Launchpad PPA.', 'snap: snapcraft.yaml, plugin python, strict confinement + plugs, published to the Snap Store.', 'Both start from a clean pyproject.toml.', 'lintian checks .debs for policy mistakes.'] },
  { t: 'mistake', items: [['pip install inside debian/rules', 'Depend on python3-* packages from the archive; dh-python does the rest.'], ['Using confinement: classic to "make it work"', 'Find the right plug (home, network…). Classic needs a store review.']] }
];

STEPS.e6 = [
  { t: 'concept', h: 'Go in one sentence', html: `<p>Go is a small, statically typed, compiled language with built-in concurrency. It feels like "typed Python that compiles to one binary". Juju, LXD, snapd and Pebble are written in it.</p>` },
  { t: 'example', h: 'Errors are values', code: `package main

import (
	"fmt"
	"os"
)

func main() {
	data, err := os.ReadFile("config.yaml")
	if err != nil {
		fmt.Println("cannot read config:", err)
		os.Exit(1)
	}
	fmt.Println(len(data), "bytes")
}`, out: `$ go run .
cannot read config: open config.yaml: no such file or directory`, note: 'No exceptions: every call that can fail returns an error you check right away.' },
  { t: 'example', h: 'Goroutines and channels', code: `func main() {
	urls := []string{"https://ubuntu.com", "https://juju.is", "https://snapcraft.io"}
	results := make(chan string)
	for _, u := range urls {
		go func(u string) {               // start a goroutine
			resp, err := http.Get(u)
			if err != nil { results <- u + " error"; return }
			results <- fmt.Sprint(u, " ", resp.StatusCode)
		}(u)
	}
	for range urls {
		fmt.Println(<-results)            // receive from the channel
	}
}`, out: `https://juju.is 200
https://ubuntu.com 200
https://snapcraft.io 200`, note: 'Order varies: whichever goroutine finishes first sends first. Compare with your ThreadPoolExecutor version.' },
  { t: 'check', q: 'In Python you\'d write <code>try: f() except IOError:</code>. The Go equivalent is…', o: ['v, err := f(); if err != nil { … }', 'try { f() } catch', 'f() or die', 'panic(f())'], a: 0, e: 'panic exists, but it is for truly unrecoverable bugs, not normal errors.' },
  { t: 'predict', q: 'A Go program compiles to a single static binary. Why is that handy for a tool like Pebble running inside every container?', a: 'No interpreter or dependencies to install: copy one file into the image and it runs. Small, fast to start and hard to break.' },
  { t: 'concept', h: 'Where Rust fits', html: `<p>Rust gives C-level speed with memory safety checked at compile time. Ubuntu has started shipping Rust replacements for core tools (<code>sudo-rs</code>, Rust coreutils), and Python can call Rust through <b>PyO3</b> extensions. One weekend with The Rust Book is enough to mention it honestly.</p>` },
  { t: 'key', items: ['Go: static types, one binary, errors as values, goroutines + channels.', 'Canonical\'s Go projects: Juju, LXD, snapd, Pebble.', 'Rust: memory safety without GC; Ubuntu is adopting Rust tools.', 'Aim to read and write small programs, then mention it with a link to code.'] },
  { t: 'mistake', items: [['Ignoring err with _', 'Handle or return every error; linters will flag it.'], ['Claiming "fluent in Go" after a tutorial', 'Say what you built: "a concurrent URL checker in Go (link)".']] }
];
