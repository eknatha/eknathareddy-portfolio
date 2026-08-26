# eknathareddy.com — deploy runbook

Repo: **https://github.com/eknatha/eknathareddy-portfolio**
Files: `index.html` · `404.html` · `CNAME` · `robots.txt` · `package.json` · `.gitignore` · `notes/build.mjs` · `notes/new.mjs` · `.github/workflows/notes.yml`

`sitemap.xml` and `notes/index.json` are generated — don't hand-edit them.

---

## 1. Create the repo

Download every file into one folder, then:

```bash
bash setup.sh
```

It checks prerequisites, builds the directory structure, installs build deps, runs the first build, commits and pushes. With `gh` installed it creates the repo too; without it, it prints the two commands to run.

Doing it by hand instead:

```bash
mkdir -p eknathareddy-portfolio/{notes/posts,.github/workflows}
cd eknathareddy-portfolio

mv ../{index.html,404.html,CNAME,robots.txt,package.json,package-lock.json,README.md,DEPLOY.md,.gitignore} .
mv ../{build.mjs,new.mjs} notes/
mv ../notes.yml           .github/workflows/

npm ci && npm run build

git init && git add -A && git commit -m "init: personal site for eknathareddy.com"
git branch -M main
git remote add origin git@github.com:eknatha/eknathareddy-portfolio.git
git push -u origin main
```

## 2. Pages

`Settings → Pages`

| Field | Value |
|---|---|
| Source | Deploy from a branch |
| Branch | `main` / `(root)` |
| Custom domain | `eknathareddy.com` |
| Enforce HTTPS | tick **after** the cert issues (~15 min post-DNS) |

Verify the apex first at **profile → Settings → Pages → Verified domains**. Skip this and GitHub rejects the apex domain.

## 3. DNS on Cloudflare

Cloudflare works fine with GitHub Pages, but two of its defaults will break the site if you leave them alone. Both are called out below.

### 3.1 Zone active

`Overview` should show the zone as **Active**. If it says *Pending nameserver update*, change the nameservers at your registrar to the two Cloudflare gave you. Nothing below works until this is done — allow a few hours.

### 3.2 Delete what Cloudflare created

Cloudflare imports or invents records when a zone is added. Remove any A, AAAA or CNAME on `@` or `www` that isn't in the table below, and remove parking records. No wildcards.

### 3.3 Add the records — **proxy OFF**

Set every one of these to **DNS only** (grey cloud, not orange).

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `185.199.108.153` | DNS only |
| A | `@` | `185.199.109.153` | DNS only |
| A | `@` | `185.199.110.153` | DNS only |
| A | `@` | `185.199.111.153` | DNS only |
| CNAME | `www` | `eknatha.github.io` | DNS only |

IPv6 is optional — four AAAA records, also DNS only:

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

**Why the proxy must be off right now:** with the orange cloud on, Cloudflare answers on its own IPs and GitHub can't complete the ACME challenge, so no certificate is ever issued and `Enforce HTTPS` stays greyed out. Turn the proxy on later if you want it — step 3.6.

### 3.4 Verify the domain with GitHub

`github.com → your profile → Settings → Pages → Add a domain`. GitHub gives you a TXT record:

| Type | Name | Content |
|---|---|---|
| TXT | `_github-pages-challenge-eknatha` | (the token GitHub shows) |

Add it in Cloudflare, click Verify. Do this **before** setting the custom domain — it stops anyone else claiming the name later.

### 3.5 Point Pages at the domain

`Repo → Settings → Pages → Custom domain` → `eknathareddy.com` → Save.

The `CNAME` file in the repo already contains the domain, so this should populate itself. Then wait for *"Certificate issued"* — usually a few minutes, occasionally an hour — and tick **Enforce HTTPS**.

Check before moving on:

```bash
dig eknathareddy.com +short          # the four 185.199.x.x
dig www.eknathareddy.com +short      # eknatha.github.io
curl -sI https://eknathareddy.com | head -1
```

### 3.6 Only after HTTPS works: turning the proxy on

Optional. The orange cloud buys you Cloudflare's CDN and analytics. It also causes the single most common failure with Pages — an infinite redirect loop — if SSL is misconfigured.

If you enable it:

- `SSL/TLS → Overview` must be **Full (strict)**. **Flexible is what causes `ERR_TOO_MANY_REDIRECTS`** — Cloudflare talks HTTP to GitHub, GitHub redirects to HTTPS, round and round.
- `SSL/TLS → Edge Certificates → Always Use HTTPS`: on.
- `Speed → Optimization → Rocket Loader`: **off**. It reorders script execution, and this page's JS depends on running in order.
- Auto Minify (if your dashboard still has it): off. Nothing here needs minifying and it occasionally mangles inline JS.

**Cache rule for the notes index.** Cloudflare will happily cache `notes/index.json` and your new posts won't appear. Add a rule under `Caching → Cache Rules`:

```
When: URI Path equals /notes/index.json
Then: Bypass cache
```

Or purge the cache after each publish. The bypass rule is less to remember.

### 3.7 If something is wrong

| Symptom | Cause |
|---|---|
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS mode is Flexible. Set Full (strict). |
| Enforce HTTPS greyed out | Proxy is on before the cert was issued. Grey-cloud the records, wait, retry. |
| GitHub 404 page | Custom domain not set, or Pages source isn't GitHub Actions. |
| New note doesn't appear | Cloudflare cached `index.json`. Purge, then add the bypass rule. |
| Domain verification fails | TXT record name must be exactly `_github-pages-challenge-eknatha`. |

## 4. Before you publish

- **Résumé PDF.** Add `eknatha-reddy-puli-resume.pdf` to the repo root. Until it exists the Download button removes itself on load rather than sending a recruiter to a 404 — so the page is never broken, just missing a button.
- **`og.png` is included.** 1200×630, generated to match the site. Link previews in Slack, WhatsApp and LinkedIn will render properly.
- **Contact is LinkedIn only.** No email anywhere — not in markup, not in JSON-LD, not behind a `mailto:`.
- **Availability badge is public.** `const AVAILABILITY` — worth a thought while you're still at IBM.
- **`highlights` are mostly empty.** Six of seven roles. Now that every role is expanded by default, this is visible on first scroll.

## 5. Design notes

Palette is petrol black, warm ivory and aged brass — deliberately not the terminal-green of the labs, because recruiters read this one. Display type is system grotesque set tight; the thesis line is the only serif on the page; all data and labels are mono.

The signature element is the service-history bar: five segments weighted by tenure, current employer lit in brass, keyboard-navigable.

Motion is one orchestrated load (staggered bar reveal) plus scroll-fade on sections. Both respect `prefers-reduced-motion`.

`Cmd/Ctrl+P` inverts the whole page to black-on-white and drops the nav, buttons and timeline bar — it prints as a clean one-pager.

Zero dependencies. No fonts fetched, no analytics, no build step.

## 6. Service history — adding experience detail

**Every role is expanded on load.** Recruiters scroll, they don't click — so company names, dates, titles and summaries are all visible without interaction. Each row is still collapsible if the reader wants something out of the way.

`const TRACK` in `index.html`, oldest first (the page reverses it for display):

```js
{
  org: "IBM",                    // required
  abbr: "IBM",                   // required
  from: 2023, to: 2026,          // required
  current: true,                 // optional

  dates: "Nov 2010 – Aug 2011",  // optional — exact span, overrides from/to
  role: "Senior Staff Software Engineer",
  focus: "Platform Engineering · Cloud Infrastructure · SRE",
  location: "Bengaluru",
  summary: "Two or three sentences on the remit.",
  arc: ["Joined AT&T", "…spun into Xandr", "…acquired by Microsoft"],
  highlights: ["Concrete, with a number in it."],
  stack: ["Kubernetes", "Terraform"]
}
```

A gap of more than a year between roles renders as a "break in service" row.

**The `highlights` arrays are still mostly empty.** Now that everything is expanded, that emptiness is visible on first scroll rather than hidden behind a click. Two or three per role: what changed, by how much, measured how.

## 6a. Availability badge

`const AVAILABILITY` near the bottom of `index.html`:

```js
const AVAILABILITY = {
  state: "open",                  // open | exploring | curious | closed
  label: "Open to opportunities"
};
```

Other phrasings, all supported:

```js
{ state: "exploring", label: "Exploring Q4 2026" }
{ state: "curious",   label: "Not actively looking, always curious" }
{ state: "closed",    label: "" }     // removes the badge entirely
```

`closed` deletes the element rather than hiding it. Worth remembering that this is public while you're still at IBM.

## 6b. Certifications

`const CERTS` in `index.html`. Five entries are filled in. The section hides itself and drops its nav link if the list is emptied.

```js
{
  abbr:   "RHCSA",                                 // required
  name:   "Red Hat Certified System Administrator",// required
  issuer: "Red Hat",
  status: "active",      // active | progress | planned | expired
  meta:   "Issued 2025",
  url:    "https://.../verify/..."                 // adds a Verify → button
}
```

Status drives the dot: green active, brass in progress, hollow expired.

Two things worth doing before this goes live. Add `url` wherever the issuer gives public verification — Red Hat and Oracle both do, and an unverifiable credential is worth less than a verifiable one. And add `meta` dates to RHCSA, Solaris and Nokia; a certification with no date invites the question of how old it is, and Solaris 10 in particular will read as long-lapsed unless you say otherwise.

## 6c. Terminal

A working shell in the page, between Toolchain and Certifications. Every command reads live from the page's own data — `TRACK`, `CERTS`, `AVAILABILITY`, the toolchain markup, the notes tabs — so it can never drift from what's above it.

| Command | Source |
|---|---|
| `whoami` | current role from `TRACK`, years from the spec sheet, availability badge |
| `history` | all roles, with real date spans |
| `ps aux` | current role's `stack`, plus what you're learning |
| `cat skills.txt` | scraped from the toolchain section |
| `cat certs.txt` | `CERTS` |
| `uptime` | years and role count |
| `ping linkedin` / `ping github` | opens the link |
| `ls`, `notes`, `date`, `help`, `clear`, `sudo`, `exit` | — |

Arrow keys walk history, Tab completes, aliases cover `ps aux`, `man`, `who`, `cls`. Tap chips sit under the terminal because typing on a phone is miserable. Output is written with `textContent`, so a pasted `<img onerror>` renders as text.

Adding a command is one entry in `CMDS`.

**Two deliberate choices.** `uptime` doesn't claim "0 major outages" — that's unverifiable, and an interviewer would rightly ask how you'd know. It says instead that no uptime percentage is shown because nothing measures it, which is a better answer than a number. And `whoami` reads the years figure from your operating-numbers row rather than deriving it from the 2010 start date, which would have said 16 and contradicted the 14+ above it.

The terminal is hidden in print.

## 7. What's not on the page

The EknathaLabs section is removed, along with the footer link and the `sameAs` entry in the JSON-LD. Nothing on the site references the labs now.

Worth putting back once you have a case study or two published — a portfolio of built things reads well next to written analysis, and weakly on its own. When you do, add it back as a section and link each lab's footer to here so the authority flows both ways.

LinkedIn is `linkedin.com/in/eknathareddypuli` in all three places it appears: the contact links, the JSON-LD `sameAs`, and nowhere else.

### `404.html`

GitHub Pages serves its own branded 404 otherwise, which breaks the illusion on a custom domain. This one matches the site — same palette, same grid backdrop, and it echoes the path that was requested (rendered with `textContent`, so a crafted URL can't inject markup). It sets `noindex` and stays out of `sitemap.xml`.

Pages picks it up automatically from the repo root. No configuration.


### 7a. Theme

Dark by default, light available, toggled from the button in the header. It follows the OS preference on first visit, and an explicit choice is remembered in `localStorage`. A tiny inline script in `<head>` applies the theme before first paint so there's no flash of the wrong colours.

Every colour on the page reads from a CSS custom property, so the light theme is one token block — `:root[data-theme="light"]` — and nothing else needed a variant.

### 7b. Site health panel

A real dashboard, not a decorative one. `notes/build.mjs` writes `status.json` on every build:

```json
{
  "builtAt": "2026-08-25T13:41:05Z",
  "commit": "a1b2c3d",
  "branch": "main",
  "runner": "github-actions",
  "notes": { "published": 2, "drafts": 1 },
  "pages": 3,
  "runtimeDependencies": 0,
  "deploys": ["2026-08-25T...", "..."]
}
```

The panel renders last deploy time, commit, pages served, notes published, runtime dependencies, branch, builder — plus a twelve-week deploy-frequency sparkline built from `git log`.

**Page load time is measured in the visitor's browser** via the Navigation Timing API. It's their actual visit, not a stored figure.

Two deliberate omissions. There's no uptime percentage, because nothing is monitoring the site and a number nobody measured is a lie on a reliability engineer's portfolio. And there's no response-time chart, for the same reason. If you want real uptime, point a free monitor at the domain and add the figure — until then the panel only claims what it can prove.

The workflow checks out with `fetch-depth: 50` so the sparkline has history, and copies `status.json` into the deploy. Missing file, hidden section.


---

## 8. Notes — the content pipeline

**`index.html` contains no notes content.** Categories, labels, copy and every entry are generated. Publishing is: write Markdown, push.

### Publishing

```bash
node notes/new.mjs troubleshooting "Pods stuck in Terminating"
node notes/new.mjs til          "kubectl drain ignores DaemonSets"
node notes/new.mjs case-study   "Terraform module rewrite"
# also: postmortem, blog

# write it, then set draft:false
git add -A && git commit -m "notes: pods stuck in terminating" && git push
```

Push is publish. The Action renders the page, rebuilds the index, updates the sitemap and deploys — about 40 seconds. Entries sort newest-first by `date`, and each row shows a full stamp: **26 Aug 2026**.

### The payload is inlined, not fetched

`build.mjs` writes the whole notes payload into a `<script type="application/json" id="notesData">` block inside `index.html`. The homepage reads that directly.

This matters: the section renders with **no network request**, so it works offline, over `file://`, before deploy, behind a cache, and for crawlers that don't run `fetch`. `notes/index.json` is still written and still served as a fallback, but nothing depends on it.

If you ever see empty categories on the live site, the cause is a stale deploy — not the pipeline.

### Layout

A feed on the left, a **vertical category rail on the right**, sticky as you scroll. Each category shows its post count. Below 900px the rail becomes a horizontally scrolling pill row above the feed, with a collapse toggle that names the current category.

Keyboard: arrow keys move through the rail, Home and End jump to the ends. It's a real ARIA tablist with `aria-orientation="vertical"`.

### Adding or removing a category

One entry in `notes/notes.config.json` — `id`, `type`, `label`, `kicker`, `intro`, `empty`. The build picks it up, the rail renders it, and `new.mjs` scaffolds that type immediately using a generic skeleton until you write a bespoke one. No code change.

Order in the file is order on the page, and the first is selected by default — which is why Troubleshooting sits first.

### What the build guarantees

| Check | On failure |
|---|---|
| `title` and `date` present | build fails, nothing deploys |
| `date` is `YYYY-MM-DD` | build fails |
| `type` matches a configured category | build fails, listing valid types |
| Markdown deleted or renamed | its stale `.html` is removed |

### Local preview

```bash
npm run build && npm run serve      # localhost:8080
```

Because the payload is inlined, opening `index.html` directly also works now.

---
type: troubleshooting     # must match a type in notes.config.json
title: "Pods stuck in Terminating"
dek: "One sentence on what the reader gets."
date: 2026-09-07          # YYYY-MM-DD, drives ordering and the date stamp
tags: [Kubernetes]
draft: false
---
```

The build fails loudly on a missing title, a bad `type`, or a malformed date — in the Action, before anything deploys.


---
type: case-study        # must match a `type` in notes.config.json
title: "What a 60% drop in provisioning time actually cost"
dek: "The Terraform module rewrite, and two decisions I'd reverse."
date: 2026-09-07
tags: [Terraform, AWS]
draft: false
---
```

`draft: true` keeps a piece in the repo and off the site, so you can write across several sittings.

### Adding a category

Append a tab to `notes.config.json` — id, type, label, kicker, intro, empty. That's the whole change. The build picks it up, the homepage renders it, and `new.mjs` will scaffold that type immediately using a generic skeleton until you write a bespoke one. **No code edit, no homepage edit.** Verified with a fourth "Runbooks" category added by config alone.

### What the build guarantees

| Check | On failure |
|---|---|
| `title` and `date` present | build fails, nothing deploys |
| `date` is `YYYY-MM-DD` | build fails |
| `type` matches a configured tab | build fails, listing the valid types |
| Markdown source deleted or renamed | its stale `.html` is removed |

A malformed note breaks the Action, not the live site.

### Local preview

`fetch` can't read `file://`, so use a server:

```bash
npm run build && npm run serve      # localhost:8080
```

### If `index.json` is missing

The section and its nav link disappear silently. No error, no empty shell. `hideUntilPublished` in the config does the same thing once there are zero published notes.


---
type: case-study        # case-study | troubleshooting | postmortem
title: "What a 60% drop in provisioning time actually cost"
dek: "The Terraform module rewrite, and two decisions I'd reverse."
date: 2026-09-07
tags: [Terraform, AWS]
draft: false
---
```

`type` routes it to the right tab. `date` orders it, newest first. `draft: true` keeps it in the repo and off the site — write across several sittings, publish when it's done. Reading time is computed for you.

### What the build does

`notes/build.mjs` — Node with `marked` and `gray-matter`, both build-time only. Nothing ships to the browser; the site itself stays dependency-free.

| Input | Output |
|---|---|
| `notes/posts/*.md` | `notes/<slug>.html`, one styled page each |
| all published notes | `notes/index.json`, read by the homepage |
| all published notes | `sitemap.xml`, regenerated |
| deleted or renamed `.md` | its stale `.html` is removed |

It validates before it writes. A missing title, a bad `type`, a date that isn't `YYYY-MM-DD` — the build fails in Actions and nothing deploys. You get an email, the live site is untouched.

Verified end to end: scaffold → publish → build → `index.json` served → article page 200 → unpublish → stale page removed.

### Local preview

`fetch` doesn't work over `file://`, so open it through a server:

```bash
node notes/build.mjs
npm run serve          # http://localhost:8080
```

### Writing to the shape

The scaffolder pre-fills the section headings, and they're the reason a piece reads as senior rather than as a blog post:

| Format | Sections |
|---|---|
| Case study | Context → Constraints I didn't choose → What I did → What it cost → What I'd reverse |
| Troubleshooting | Symptom → What I checked → Wrong turns → Actual cause → Fix → Prevention |
| Postmortem | Summary → Impact → Timeline → Contributing factors → What changed |

**Constraints I didn't choose** is what separates a case study from a tutorial. **What I'd reverse today** is what an interviewer reads to decide whether you can self-assess. Don't cut either.

Before every push: anonymise employers, strip internal hostnames, IPs, dashboard links, ticket IDs and customer names.

### Empty tabs

`hideUntilPublished: false` in `index.html` shows the three tabs with an empty state under each. Set it to `true` if you'd rather visitors never see empty tabs.

---
