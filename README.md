# Canonical Academy

Personal learning platform for the Canonical role **Python and Kubernetes Software Engineer – Data, Workflows, AI/ML & Analytics**.

## Start
On Ubuntu (or any Linux), run `./start.sh` from this folder (needs Python 3, already on Ubuntu). It opens http://localhost:8768.
On Windows, double-click **`start.bat`** instead.

Labs assume you work on a native Ubuntu machine (24.04 recommended): Docker, MicroK8s, Juju and snaps install directly, no WSL or VM needed.

Your data stays on your PC, in this folder:
- `progress.json`: all progress (XP, lessons, quizzes, labs, missions, flashcards, badges)
- `backups/progress-YYYY-MM-DD.json`: one backup per day, kept 21 days
- `activity_log.csv`: XP history (open it in LibreOffice Calc)
- `config.json`: AI tutor provider, keys and models (only the local server reads it; it is never served to the browser)

The plan start date is set in Settings; the roadmap shows dates for each week and whether you are ahead or behind.
Opening `index.html` directly still works, but then progress lives only in the browser and the AI tutor is off.

Progress from this browser and `progress.json` are merged, so nothing you completed is lost. **Reset progress** saves a copy in `backups/` first.

## What's inside
- **Roadmap**: 10 tracks, 38 lessons, a boss battle per track, planned day by day from your time budget (Settings → Learning: time per day and study days per week). Labs count their real time (deploying Kubeflow ~3 h, the charm tutorial ~5 h) and 10 minutes a day go to flashcards; at 1 hour a day, 6 days a week, it takes about 23 weeks (19 without the Python Engineer track)
- **Two roles**: the main target, Python and Kubernetes Software Engineer – Data, Workflows, AI/ML & Analytics, plus the general Python Engineer role. The extra 🛠️ Python Engineer track covers design, performance, concurrency, gRPC, Ubuntu packaging and Go; Job match shows your fit for both
- **Lessons**: concept + analogy + diagram, videos & official docs, quiz, YAML puzzles, real-machine labs
- **Step-by-step Learn tab**: each lesson is split into short steps (big picture, concepts with diagrams, real examples to copy and run, "predict the output", quick checks, common mistakes, key takeaways, explain it back). Continue unlocks after you answer; ← → keys move between steps; 🤖 Ask Kube on any step. Prefer one long page? Switch in Settings.
- **Videos play inside the lesson** (Watch & read tab): the app searches YouTube for each topic and only shows videos that allow embedding. Pick another from the thumbnails, or paste your own link. Results are cached in `videos_cache.json`.
- **K8s Simulator**: 3-node fake MicroK8s cluster; real kubectl syntax; live view of pods dying/healing; missions
- **Run labs from the app** (Ubuntu/Linux, off by default): Settings → Labs → "Run lab commands from the app" adds ▶ Run to lab steps and examples plus a small terminal under each lab. Commands run as you in `~/canonical-labs/<lesson>`, stream their output into the page, can be stopped, and stop on their own after 30 minutes. Steps that need `sudo` or a keyboard are marked "run this one in your terminal". Labs that work in one of your own projects (pytest, typing, CI, Dockerfile, compose, metrics…) start with a **Before you start** checklist: pick the project folder (the app lists the git and Python projects it finds in your home folder), put it on a `lab-<lesson>` branch, create and install its `.venv`, and add what the lab needs (tests folder, Dockerfile, GitHub remote). Each item is checked from the folder's files, and from then on ▶ Run and the lab terminal run inside that project with its `.venv` active
- **Flashcards**: spaced repetition (Leitner)
- **Job match**: requirement-by-requirement progress
- **XP, levels, streaks, badges, daily goal**
- **Profile** (click your name): level, daily goal ring, accuracy, activity heatmap, daily XP chart, per-track progress, recent lessons, your saved notes
- **Settings**: name, avatar, daily goal, theme (dark/light/system), accent colour, text size, confetti, lesson mode, plan start date, AI tutor, export/import, reset
- **AI tutor "Kube"** (🤖 bottom right): click ⚙️ to pick a provider, paste its key, choose a model (**Load models** lists what your key can use) and **Test** it.
  - Free: Google Gemini (key from https://aistudio.google.com/apikey), Groq (https://console.groq.com/keys), OpenRouter `:free` models (https://openrouter.ai/keys), Ollama on your PC (no key).
  - Paid: Anthropic Claude (https://console.anthropic.com/settings/keys).
  - Keys are saved in `config.json` and sent only to the provider you chose.

The tutor will not write your Canonical application answers: their form disqualifies AI-generated content.
