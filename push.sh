#!/usr/bin/env bash
#
# One-time: turn this folder into github.com/eknatha/eknathareddy-portfolio
#
#   bash push.sh
#
# After this, publishing is just: write a note, commit, push.

set -euo pipefail
REPO="eknatha/eknathareddy-portfolio"

for cmd in git node npm; do
  command -v "$cmd" >/dev/null || { echo "✗ $cmd not found"; exit 1; }
done
[ "$(node -p 'process.versions.node.split(".")[0]')" -ge 18 ] \
  || { echo "✗ Node 18+ required, found $(node -v)"; exit 1; }
git config user.email >/dev/null 2>&1 || git config --global user.email >/dev/null 2>&1 || {
  echo "✗ git has no identity configured. Run:"
  echo "    git config --global user.name  \"Eknatha Reddy Puli\""
  echo "    git config --global user.email \"you@example.com\""
  exit 1
}

echo "→ Installing build dependencies"
npm ci --no-audit --no-fund

echo "→ First build"
npm run build

echo "→ Committing"
git init -q
git add -A
git commit -qm "init: personal site for eknathareddy.com"
git branch -M main

if command -v gh >/dev/null; then
  echo "→ Creating $REPO"
  gh repo create "$REPO" --public --source=. --remote=origin --push
else
  cat <<'MANUAL'

  gh CLI not found. Create the repo at https://github.com/new
    name: eknathareddy-portfolio  ·  public  ·  no README, no .gitignore

  Then:
    git remote add origin git@github.com:eknatha/eknathareddy-portfolio.git
    git push -u origin main
MANUAL
  exit 0
fi

cat <<'DONE'

✓ Pushed. Three manual steps left:

  1. Settings → Pages → Source → GitHub Actions
     (not "Deploy from a branch" — the build won't run otherwise)
  2. Profile → Settings → Pages → Verified domains → eknathareddy.com
     then Settings → Pages → Custom domain → eknathareddy.com
  3. DNS: four A records on the apex, one CNAME on www — DEPLOY.md §3

Then write your first note:
  node notes/new.mjs case-study "Terraform module rewrite"
DONE
