# Student Dashboard

AI-powered academic organizer built with Flask, SQLite, and Anthropic Claude.

## Setup

1. Create a virtual environment and install dependencies:

```bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

2. Create a `.env` file with your Anthropic API key:

```
ANTHROPIC_API_KEY=your_api_key_here
```

3. Run the app:

```bash
python app.py
```

Open http://localhost:5000

## Pushing to GitHub

This repository was committed locally. To push to your GitHub repo, either:

- Use HTTPS with a Personal Access Token (recommended):

```bash
git remote add origin https://github.com/anjanasuresh1407-hash/student_dashboard.git
# when prompted for username use your GitHub username; for password paste your PAT
git push -u origin main
```

- Or set up SSH keys and push via SSH:

```bash
# generate key if needed
ssh-keygen -t ed25519 -C "your_email@example.com"
# add the public key to GitHub -> Settings -> SSH and GPG keys
git remote set-url origin git@github.com:anjanasuresh1407-hash/student_dashboard.git
git push -u origin main
```

If you want, I can guide you through configuring SSH keys or creating a PAT.
