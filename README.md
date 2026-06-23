# Student Dashboard

AI-powered academic organizer built with Flask, SQLite, and Anthropic Claude.

# Student Dashboard

An AI-powered academic organizer built with Flask, SQLite, and Anthropic Claude. Consolidates your tasks, exams, and study sessions into one place — with Claude generating a prioritized action plan based on your deadlines.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Python + Flask | Lightweight, minimal boilerplate, easy to run locally |
| Database | SQLite + Flask-SQLAlchemy | Zero configuration, single file, perfect for a single-user local app |
| Templates | Jinja2 | Ships with Flask, no extra build step needed |
| AI | Anthropic Claude (`claude-sonnet-4-6`) | Best-in-class reasoning for deadline prioritization |
| Styling | Vanilla CSS | No build pipeline required; keeps setup simple |
| JS | Vanilla JavaScript | Only two interactions needed — no framework justified |

---

## Setup and running locally

### 1. Clone the repo

```bash
git clone https://github.com/anjanasuresh1407-hash/student_dashboard.git
cd student_dashboard
```

### 2. Create and activate a virtual environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS / Linux**
```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```


### 5. Run the app

```bash
python app.py
```

Open http://localhost:5000 in your browser.

> On first run the database is created automatically and seeded with sample tasks, exams, and study sessions so the dashboard is not empty.

---

## Pushing to GitHub

**Option A — HTTPS with a Personal Access Token (recommended)**

```bash
git remote add origin https://github.com/anjanasuresh1407-hash/student_dashboard.git
git push -u origin main
# when prompted: username = your GitHub username, password = your PAT (not your account password)
```

Generate a PAT at GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic). Give it `repo` scope.

**Option B — SSH**

```bash
# Generate a key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy the public key and add it to GitHub → Settings → SSH and GPG keys
cat ~/.ssh/id_ed25519.pub

# Update the remote and push
git remote set-url origin git@github.com:anjanasuresh1407-hash/student_dashboard.git
git push -u origin main
```

---

## Features

| Section | What it does |
|---|---|
| Notifications | Flags tasks due within 3 days and exams within 5 days |
| Upcoming Tasks | Add tasks with title, deadline, and priority; mark complete or delete |
| Exam Schedule | Add exams with subject and date; shows days remaining with color coding |
| AI Priority List | Sends your pending tasks and exams to Claude and returns a ranked action plan |
| Study Planner | Add study sessions by date and subject; toggle completed/pending per entry |

---

## What was skipped and why

**User authentication** — this is a single-user local tool. Adding login would require Flask-Login, password hashing, and session management, which significantly increases setup complexity for no benefit when running on your own machine.

**A frontend framework (React, Vue)** — the interactive surface is small: one fetch call for AI results and flash message dismissal. Shipping a build pipeline for that would be overkill.

**A production database (PostgreSQL, MySQL)** — SQLite is sufficient for one user and requires zero server setup. Migrating to PostgreSQL later only requires changing `SQLALCHEMY_DATABASE_URI`.

**Flask-WTF / CSRF protection** — omitted to keep the form code minimal. If this app is ever exposed to the internet rather than run locally, CSRF protection should be added.

**Celery / background jobs** — the AI priority call is made synchronously on button click. For a multi-user app with slow API responses a task queue would be needed, but for local single-user use the slight delay is acceptable.

**Alembic migrations** — the schema is created fresh with `db.create_all()`. If you change a model you will need to delete `dashboard.db` and let it recreate, which loses existing data. Migration support can be added with Flask-Migrate if the schema stabilizes.

---

## Known rough edges

- **Deleting `dashboard.db` wipes all data.** There is no export or backup feature. If you change a model column, you must delete the file and re-seed.
- **The AI priority button is a manual action.** It does not auto-refresh; you click it each time you want a new ranking.
- **Datetime input format is browser-dependent.** The `datetime-local` field renders differently across browsers (Chrome vs Firefox vs Safari). If a deadline fails to save, check that the format sent is `YYYY-MM-DDTHH:MM`.
- **No pagination.** If you accumulate hundreds of tasks or study entries the table will grow long. The quick fix is adding `.limit(50)` to the queries in `app.py`.
- **Claude API rate limits.** If you hit the free-tier rate limit, the AI priority section falls back to a deadline-sorted list automatically.
- **Windows path separator in venv activation.** Use `venv\Scripts\activate` on Windows (backslash), not the forward-slash form shown in some tutorials.

---

## Project structure

```
student_dashboard/
├── app.py            # Flask routes and app config
├── models.py         # SQLAlchemy models (Task, Exam, StudyPlan)
├── ai_engine.py      # Claude API integration
├── requirements.txt
├── .env              # API key — not committed to git
├── templates/
│   ├── base.html
│   ├── dashboard.html
│   ├── tasks.html
│   ├── exams.html
│   └── planner.html
└── static/
    ├── style.css
    └── main.js
```

---

## License

MIT
