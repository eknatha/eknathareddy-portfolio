# eknathareddy.com

Personal site for [Eknatha Reddy Puli](https://eknathareddy.com) — Senior Staff Engineer, Platform Engineering & SRE.

Hand-written HTML. No framework, no analytics, no fonts fetched at runtime. The one build step renders Markdown notes into pages; the site itself ships zero dependencies.

## Structure

```
eknathareddy-portfolio/
├── index.html                  the site — markup, styles and behaviour in one file
├── 404.html                    custom not-found page
├── CNAME                       eknathareddy.com
├── robots.txt
├── sitemap.xml                 ← generated, don't edit
│
├── notes/
│   ├── notes.config.json       categories, labels, heading, intro copy
│   ├── posts/                  ← YOU WRITE HERE. Markdown, one file per note
│   │   └── 2026-09-07-terraform-module-rewrite.md
│   ├── build.mjs               renders posts → pages + index + sitemap
│   ├── new.mjs                 scaffolds a new note
│   ├── index.json              ← generated, read by index.html
│   └── *.html                  ← generated, one page per published note
│
├── .github/workflows/
│   └── notes.yml               build + deploy on every push to main
│
├── push.sh                     one-time repo bootstrap
├── package.json                build-time deps only (marked, gray-matter)
├── package-lock.json           required by `npm ci` in the workflow
├── DEPLOY.md                   DNS, Pages, the full runbook
└── .gitignore
```

Generated files are committed so the repo is self-consistent, but the workflow regenerates them on every push — never hand-edit `sitemap.xml`, `notes/index.json` or `notes/*.html`.

## Publishing a note

```bash
node notes/new.mjs case-study "Terraform module rewrite"
#   → notes/posts/2026-09-07-terraform-module-rewrite.md   (draft:true)

# write it, then set draft:false

git add -A && git commit -m "notes: terraform module rewrite" && git push
```

Push is publish. The Action renders, rebuilds the index and sitemap, and deploys — about 40 seconds.

`type` in the front matter routes the note to its tab: `case-study`, `troubleshooting` or `postmortem`.

`index.html` holds no notes content — entries, tab labels, heading and copy are all generated into `notes/index.json`. Adding a category is a `notes.config.json` change and nothing else.

## Commands

| Command | Does |
|---|---|
| `node notes/new.mjs <type> "Title"` | scaffold a note with the right section skeleton |
| `npm run build` | render notes, rebuild `index.json` and `sitemap.xml` |
| `npm run serve` | preview at `localhost:8080` (`fetch` needs http, not `file://`) |

## What gets published

The workflow copies only `index.html`, `404.html`, `CNAME`, `robots.txt`, `sitemap.xml`, `notes/index.json` and `notes/*.html` into the deploy artifact. `node_modules`, the Markdown sources, and the build scripts stay in the repo and off the web.

## Setup

See [DEPLOY.md](DEPLOY.md) for DNS records and the Pages source setting.
