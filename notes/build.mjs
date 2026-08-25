#!/usr/bin/env node
/**
 * notes/build.mjs — eknathareddy.com
 *
 * Reads every Markdown file in notes/posts/ and produces:
 *   notes/<slug>.html   one styled page per note
 *   notes/index.json    the list index.html reads
 *   sitemap.xml         regenerated with the published notes
 *
 * Run locally:   node notes/build.mjs
 * In CI:         .github/workflows/notes.yml runs it on every push
 *
 * Nothing here ships to the browser. The site itself stays
 * dependency-free — marked and gray-matter only run at build time.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import matter from 'gray-matter';
import { marked } from 'marked';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const POSTS = join(HERE, 'posts');
const SITE = 'https://eknathareddy.com';

// Tabs, labels and copy live in notes.config.json — the homepage holds none
// of it. Add a tab there and it appears on the site with no HTML edit.
const CONFIG = JSON.parse(readFileSync(join(HERE, 'notes.config.json'), 'utf8'));

const TYPES = Object.fromEntries(
  CONFIG.tabs.map((t) => [t.type, { tab: t.id, kicker: t.kicker || t.label }])
);

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fail = (msg) => { console.error('✗ ' + msg); process.exitCode = 1; };

// ── collect ──────────────────────────────────────────────────────────
if (!existsSync(POSTS)) { mkdirSync(POSTS, { recursive: true }); }

const files = readdirSync(POSTS).filter((f) => f.endsWith('.md')).sort();
const published = [];
let drafts = 0;

for (const file of files) {
  const raw = readFileSync(join(POSTS, file), 'utf8');
  const { data: fm, content } = matter(raw);

  // ── validate up front; a bad note should fail the build, not ship broken ──
  if (!fm.title) { fail(`${file}: missing "title"`); continue; }
  if (!fm.date)  { fail(`${file}: missing "date"`); continue; }
  if (!TYPES[fm.type]) {
    fail(`${file}: "type" must be one of ${Object.keys(TYPES).join(', ')}`);
    continue;
  }

  // YAML turns an unquoted 2026-09-07 into a Date object; normalise either form.
  const date = fm.date instanceof Date
    ? fm.date.toISOString().slice(0, 10)
    : String(fm.date).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    fail(`${file}: "date" must be YYYY-MM-DD, got "${fm.date}"`);
    continue;
  }

  if (fm.draft) { drafts++; console.log(`· draft  ${file}`); continue; }

  const slug = fm.slug || file.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
  const words = content.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 220));
  const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
  const displayDate = new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });

  const note = {
    type: fm.type,
    tab: TYPES[fm.type].tab,
    kicker: TYPES[fm.type].kicker,
    slug,
    title: String(fm.title),
    dek: String(fm.dek || ''),
    date,
    displayDate,
    tags,
    readingTime: `${mins} min read`,
    url: `/notes/${slug}.html`,
    html: marked.parse(content)
  };

  writeFileSync(join(HERE, `${slug}.html`), page(note));
  published.push(note);
  console.log(`✓ ${note.url}`);
}

published.sort((a, b) => b.date.localeCompare(a.date));

// ── index.json — the complete payload the homepage renders ───────────
// Tab copy plus items, so index.html contains no content of its own.
const payload = {
  generated: new Date().toISOString(),
  heading: CONFIG.heading || 'Notes',
  blurb: CONFIG.blurb || '',
  hideUntilPublished: CONFIG.hideUntilPublished === true,
  total: published.length,
  tabs: CONFIG.tabs.map((t) => ({
    id: t.id,
    label: t.label,
    intro: t.intro || '',
    empty: t.empty || 'Nothing published here yet.',
    items: published
      .filter((n) => n.tab === t.id)
      .map(({ title, dek, date, displayDate, tags, url, readingTime }) =>
        ({ title, dek, date, displayDate, tags, url, readingTime }))
  }))
};

writeFileSync(join(HERE, 'index.json'), JSON.stringify(payload, null, 2) + '\n');

// ── status.json — what the health panel reads ────────────────────────
// Everything here is measured, not asserted. If git isn't available the
// field is omitted rather than guessed at.
function git(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return ''; }
}

const commit = (process.env.GITHUB_SHA || git('git rev-parse HEAD')).slice(0, 7);
const deployLog = git('git log -n 40 --pretty=format:%cI')
  .split('\n').filter(Boolean);

const status = {
  builtAt: new Date().toISOString(),
  commit: commit || null,
  branch: process.env.GITHUB_REF_NAME || git('git rev-parse --abbrev-ref HEAD') || null,
  runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
  notes: { published: published.length, drafts },
  pages: 1 + published.length,
  runtimeDependencies: 0,
  deploys: deployLog                       // ISO timestamps, newest first
};

writeFileSync(join(ROOT, 'status.json'), JSON.stringify(status, null, 2) + '\n');
console.log(`· status.json (commit ${commit || 'unknown'}, ${deployLog.length} deploys logged)`);

// ── sitemap ──────────────────────────────────────────────────────────
writeFileSync(join(ROOT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
${published.map((n) =>
  `  <url><loc>${SITE}${n.url}</loc><lastmod>${n.date}</lastmod><priority>0.8</priority></url>`
).join('\n')}
</urlset>
`);

// ── drop orphaned pages whose Markdown was deleted or renamed ────────
const keep = new Set(published.map((n) => `${n.slug}.html`));
for (const f of readdirSync(HERE)) {
  if (f.endsWith('.html') && f !== '_template.html' && !keep.has(f)) {
    rmSync(join(HERE, f));
    console.log(`− removed stale ${f}`);
  }
}

console.log('');
for (const t of payload.tabs) {
  console.log(`  ${String(t.items.length).padStart(3)}  ${t.label}`);
}
console.log(`\n${published.length} published, ${drafts} draft${drafts === 1 ? '' : 's'}`);

// ── page shell ───────────────────────────────────────────────────────
function page(n) {
  const tagLine = n.tags.length ? `<span>${esc(n.tags.join(' · '))}</span>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(n.title)} — Eknatha Reddy Puli</title>
<meta name="description" content="${esc(n.dek)}">
<link rel="canonical" href="${SITE}${n.url}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(n.title)}">
<meta property="og:description" content="${esc(n.dek)}">
<meta property="og:url" content="${SITE}${n.url}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#0A1013">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230A1013'/><path d='M9 9h14M9 16h11M9 23h14' stroke='%23C8A56A' stroke-width='2.4' stroke-linecap='round'/></svg>">
<style>
:root{--void:#0A1013;--deep:#0E161A;--line:#1D2C33;--line-2:#294049;--ivory:#EDE8DE;--ivory-2:#C3C7C4;--dim:#7E8F94;--brass:#C8A56A;--sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;--mono:ui-monospace,"SF Mono","JetBrains Mono","Cascadia Mono",Menlo,Consolas,monospace;--pad:clamp(22px,5.5vw,84px);--rule:1px solid var(--line)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--void);color:var(--ivory);font-family:var(--sans);line-height:1.62;-webkit-font-smoothing:antialiased}
::selection{background:var(--brass);color:var(--void)}
a{color:var(--brass)}
:focus-visible{outline:2px solid var(--brass);outline-offset:4px;border-radius:2px}
.wrap{max-width:720px;margin:0 auto;padding:0 var(--pad)}
.back{display:inline-flex;align-items:center;gap:9px;margin-top:44px;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);text-decoration:none;transition:color .2s ease}
.back:hover{color:var(--brass)}
header.art{padding:42px 0 34px;border-bottom:var(--rule)}
.kicker{font-family:var(--mono);font-size:10.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--brass);margin:0}
h1{margin:22px 0 0;font-size:clamp(32px,5.6vw,52px);font-weight:700;letter-spacing:-.038em;line-height:1.06}
.dek{margin:20px 0 0;font-family:var(--serif);font-size:clamp(18px,2.4vw,23px);line-height:1.5;color:var(--ivory-2)}
.meta{display:flex;flex-wrap:wrap;gap:20px;margin-top:28px;font-family:var(--mono);font-size:11.5px;letter-spacing:.08em;color:var(--dim)}
article{padding:14px 0 60px;font-size:17.5px}
article h2{margin:52px 0 0;font-size:clamp(21px,3vw,27px);font-weight:700;letter-spacing:-.028em;line-height:1.2}
article h3{margin:36px 0 0;font-size:18px;font-weight:650;letter-spacing:-.018em;color:var(--ivory-2)}
article p{margin:18px 0 0;color:var(--ivory-2)}
article ul,article ol{margin:18px 0 0;padding-left:22px;color:var(--ivory-2)}
article li{margin:8px 0}
article strong{color:var(--ivory);font-weight:650}
article hr{margin:44px 0 0;border:0;border-top:var(--rule)}
article img{max-width:100%;height:auto;margin:28px 0 0;border:var(--rule);border-radius:3px}
blockquote{margin:34px 0 0;padding:20px 26px;border-left:2px solid var(--brass);background:var(--deep);color:var(--ivory-2);font-family:var(--serif);font-size:19px;line-height:1.5}
blockquote p:first-child{margin:0}
pre{margin:26px 0 0;padding:20px 22px;overflow-x:auto;background:var(--deep);border:var(--rule);border-radius:3px;font-family:var(--mono);font-size:13px;line-height:1.62;color:var(--ivory-2)}
code{font-family:var(--mono);font-size:.9em;color:var(--brass)}
pre code{color:inherit;font-size:inherit}
table{width:100%;border-collapse:collapse;margin:28px 0 0;font-size:15px}
th,td{text-align:left;padding:12px 14px;border-bottom:var(--rule);color:var(--ivory-2)}
th{font-family:var(--mono);font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--brass);font-weight:600}
footer.art{border-top:var(--rule);padding:34px 0 60px;font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
footer.art a{color:var(--dim);text-decoration:none}
footer.art a:hover{color:var(--brass)}
@media print{:root{--void:#fff;--deep:#fff;--line:#c9c9c9;--ivory:#000;--ivory-2:#222;--dim:#555;--brass:#6b5220}body{background:#fff;color:#000;font-size:11pt}.back{display:none}pre{background:#f6f6f6}}
</style>
</head>
<body>
<div class="wrap"><a class="back" href="/#notes">&larr; All notes</a></div>
<header class="art wrap">
  <p class="kicker">${esc(n.kicker)}</p>
  <h1>${esc(n.title)}</h1>
  ${n.dek ? `<p class="dek">${esc(n.dek)}</p>` : ''}
  <div class="meta"><span>${esc(n.displayDate)}</span><span>${esc(n.readingTime)}</span>${tagLine}</div>
</header>
<article class="wrap">
${n.html}
</article>
<footer class="art wrap">
  <a href="/#notes">All notes</a> &nbsp;·&nbsp; <a href="/">eknathareddy.com</a> &nbsp;·&nbsp; &copy; ${new Date().getFullYear()} Eknatha Reddy Puli
</footer>
<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: n.title,
  description: n.dek,
  datePublished: n.date,
  url: SITE + n.url,
  keywords: n.tags.join(', '),
  author: { '@type': 'Person', name: 'Eknatha Reddy Puli', url: SITE + '/' }
}, null, 2)}
</script>
</body>
</html>
`;
}
