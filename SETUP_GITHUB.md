# GitHub + Netlify Setup Guide
Follow these steps ONCE. After that, updates go live automatically.

---

## STEP 1 — Create a GitHub Repository

1. Open https://github.com/new in your browser
2. Sign in with helloayaan@outlook.com
3. Fill in:
   - Repository name: `lovebird-genetic-calculator`
   - Description: `KinBird Aviary genetics calculator`
   - Set to: **Public**
   - Do NOT check "Add README" (we already have one)
4. Click **Create repository**
5. GitHub will show an empty repo page — keep this tab open

---

## STEP 2 — Upload your files to GitHub

On the empty repo page:
1. Click **"uploading an existing file"** link (in the middle of the page)
2. Drag these files from your KinBird/LovebirdApp folder into the upload box:
   - `index.html`
   - `netlify.toml`
   - `README.md`
   - `.gitignore`
3. Scroll down, type commit message: `Initial commit`
4. Click **Commit changes**

Your code is now on GitHub at:
`https://github.com/hanshohan35/lovebird-genetic-calculator`

---

## STEP 3 — Connect Netlify to GitHub

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Click **GitHub**
4. Authorize Netlify to access your GitHub (click Authorize)
5. Search for and select: `lovebird-genetic-calculator`
6. Settings:
   - Branch: `main`
   - Build command: (leave empty)
   - Publish directory: `.`  ← type a single dot
7. Click **Deploy site**

---

## STEP 4 — Rename your Netlify site (optional)

1. In Netlify → Site configuration → Site details
2. Click **Change site name**
3. Type: `kinbird-genetics`
4. Your URL becomes: https://kinbird-genetics.netlify.app

---

## HOW UPDATES WORK (after setup)

When Claude makes a change to index.html:
1. Open https://github.com/hanshohan35/lovebird-genetic-calculator
2. Click on `index.html`
3. Click the **pencil icon** (Edit)
4. Select all text (Ctrl+A), paste the new code Claude gives you
5. Click **Commit changes**
6. Netlify auto-deploys in ~30 seconds ✓

OR — install GitHub Desktop app for even easier updates (drag and drop).

---

## IMPORTANT — Never share your GitHub password
Use a Personal Access Token if asked for a password in terminal.
Go to: GitHub → Settings → Developer Settings → Personal Access Tokens
