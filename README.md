# eknathareddy.com

Personal site for [Eknatha Reddy Puli](https://eknathareddy.com) — Senior Staff Engineer, Platform & Site Reliability Engineering.

Hand-written HTML. No framework, no analytics, no fonts fetched at runtime. The only build step renders Markdown notes into pages; the site itself ships zero runtime dependencies.

## Structure

```
eknathareddy-portfolio/
├── index.html                         the site — markup, styles and behaviour in one file
├── 404.html                           custom not-found page
├── eknatha-reddy-puli-resume.pdf      web résumé behind the "Download résumé" button
├── og.png                             1200×630 link-preview image
├── CNAME                              eknathareddy.com
├── robots.txt
├── sitemap.xml                        ← generated
├── status.json                        ← generated, read by the site-health panel
│
├── notes/
│   ├── notes.config.json              categories, labels, heading, intro copy
│   ├── posts/                         ← YOU WRITE HERE. Markdown, one file per note
│   │   └── 2026-08-26-kubernetes-architecture-from-an-operators-chair.md
│   ├── assets/                        SVG diagrams, included with {{svg:name}}
│   │   └── kubernetes-architecture.svg
│   ├── build.mjs                      renders posts → pages, index, sitemap, status
│   ├── new.mjs                        scaffolds a new note
│   ├── index.json                     ← generated
│   └── *.html                         ← generated, one page per published note
│
├── .github/workflows/notes.yml        runs the build on every push to main
├── package.json                       build-time deps only (marked, gray-matter)
├── package-lock.json                  required by `npm ci` in the workflow
├── DEPLOY.md                          hosting, DNS and the editing guide
└── .gitignore
```

Never hand-edit the generated files. The workflow regenerates them on every push and commits the result.

## How publishing works

GitHub Pages serves the `main` branch as-is (**Settings → Pages → Deploy from a branch → `main` / root**).

On every push to `main`, `.github/workflows/notes.yml` runs `npm run build` and commits any generated changes back to `main`. Pages then redeploys. This means you can publish entirely from the GitHub website: upload or edit a Markdown file in `notes/posts/`, commit, and the page appears about a minute later.

## Publishing a note

```bash
node notes/new.mjs case-study "Terraform module rewrite"
#   → notes/posts/2026-09-07-terraform-module-rewrite.md   (draft: true)

# write it, then set draft: false
git add -A && git commit -m "notes: terraform module rewrite" && git push
```

`type` in the front matter picks the tab: `troubleshooting`, `til`, `case-study`, `postmortem` or `blog`. Categories live in `notes/notes.config.json`; adding one is a config change only.

Diagrams: put an SVG in `notes/assets/` and write `{{svg:file-name}}` on its own line. It is inlined, so it follows the page's colour mode.

## Commands

| Command | Does |
|---|---|
| `node notes/new.mjs <type> "Title"` | scaffold a note with the right section skeleton |
| `npm run build` | render notes; rebuild `notes/index.json`, `sitemap.xml`, `status.json` and the notes block in `index.html` |
| `npm run serve` | preview at `localhost:8080` |

## Setup

See [DEPLOY.md](DEPLOY.md) for DNS, Pages settings and how to edit each part of the page.
