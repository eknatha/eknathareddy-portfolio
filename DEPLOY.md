# eknathareddy.com — deploy runbook

Repo: **https://github.com/eknatha/eknathareddy-portfolio**

Generated files — `sitemap.xml`, `status.json`, `notes/index.json`, `notes/*.html` and the notes block inside `index.html` — are rebuilt by the workflow on every push. Don't hand-edit them.

---

## 1. Getting the code

```bash
git clone git@github.com:eknatha/eknathareddy-portfolio.git
cd eknathareddy-portfolio
npm ci
npm run build && npm run serve      # http://localhost:8080
```

Everything can also be done from the GitHub website (**Add file → Upload files** or the pencil icon). The workflow runs the build for you after each commit.

## 2. Pages and Actions

`Settings → Pages`

| Field | Value |
|---|---|
| Source | Deploy from a branch |
| Branch | `main` / `(root)` |
| Custom domain | `eknathareddy.com` |
| Enforce HTTPS | tick **after** the cert issues (~15 min post-DNS) |

`Settings → Actions → General → Workflow permissions` should allow **Read and write**. The workflow asks for `contents: write` so it can commit the generated files; if its push step fails with a 403, this setting is the cause.

Each push to `main` produces two Pages deploys: yours, then the workflow's `build: regenerate …` commit about 30 seconds later. That is expected.

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

## 4. Before you publish

- **Résumé PDF.** `eknatha-reddy-puli-resume.pdf` is the web version: phone number and email removed, LinkedIn, GitHub and the site kept. When the résumé changes, export a new PDF and replace the file under the same name. If the file is missing, the Download button removes itself rather than linking to a 404.
- **`og.png`** is 1200×630 and matches the site. Regenerate it if your title changes.
- **Contact is LinkedIn only.** No email anywhere — not in markup, not in JSON-LD, not behind a `mailto:`.
- **Availability badge is public.** `const AVAILABILITY` — worth a thought while you're still at IBM.
- **Notes placeholders.** The Kubernetes note is `draft: true` until its "Your production note" prompts are replaced with real, anonymised incidents.

## 5. Editing the page

Every colour reads from a CSS custom property. There are three colour modes — Paper (`light`), Night (`dark`) and Blueprint (`blueprint`) — each one token block on `:root[data-theme="…"]`. A first visit follows the OS setting; an explicit choice is saved in `localStorage` as `ekr:theme`. The 404 page and every note page read the same key, so the whole site stays in the chosen mode. A small inline script in `<head>` applies the mode before first paint, so there is no flash.

The hero portrait is embedded in `index.html` as a data URI, so there is no image file to keep in sync. It is hidden when the page is printed; `Cmd/Ctrl+P` prints the page as a clean black-on-white résumé.

### 5.1 Service history

**Every role is expanded on load.** Recruiters scroll, they don't click — so company names, dates, titles and summaries are all visible without interaction. Each row is still collapsible if the reader wants something out of the way.

`const TRACK` in `index.html`, oldest first (the page reverses it for display):

```js
{
  org: "IBM",                    // required
  abbr: "IBM",                   // required
  from: 2023, to: 2026,          // required
  current: true,                 // optional

  dates: "Nov 2010 – Aug 2011",  // optional — exact span, overrides from/to
  role: "Senior Staff Engineer",
  focus: "Platform & Hybrid Cloud",
  location: "Bengaluru",
  summary: "Two or three sentences on the remit.",
  arc: ["Joined AT&T", "…spun into Xandr", "…acquired by Microsoft"],
  highlights: ["Concrete, with a number in it."],
  stack: ["Kubernetes", "Terraform"]
}
```

A gap of more than a year between roles renders as a "break in service" row.

Keep `TRACK` in step with the résumé PDF: same titles, same dates, same numbers. Recruiters read both, and a mismatch reads as carelessness.

### 5.2 Availability badge

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

### 5.3 Certifications

`const CERTS` in `index.html`. The section hides itself and drops its nav link if the list is emptied.

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

### 5.4 Terminal

A working shell in the page, between Toolchain and Certifications. Every command reads live from the page's own data — `TRACK`, `CERTS`, `AVAILABILITY`, the toolchain markup, the notes tabs — so it can never drift from what's above it.

| Command | Source |
|---|---|
| `whoami` | current role from `TRACK`, years from the spec sheet, availability badge |
| `history` | all roles, with real date spans |
| `ps aux` | current role's `stack`, plus a few fixed rows |
| `cat skills.txt` | scraped from the toolchain section |
| `cat certs.txt` | `CERTS` |
| `uptime` | years and role count |
| `ping linkedin` / `ping github` | opens the link |
| `ls`, `notes`, `date`, `help`, `clear`, `sudo`, `exit` | — |

Arrow keys walk history, Tab completes, aliases cover `ps aux`, `man`, `who`, `cls`. Tap chips sit under the terminal because typing on a phone is miserable. Output is written with `textContent`, so a pasted `<img onerror>` renders as text.

Adding a command is one entry in `CMDS`.

**Two deliberate choices.** `uptime` doesn't claim "0 major outages" — that's unverifiable, and an interviewer would rightly ask how you'd know. It says instead that no uptime percentage is shown because nothing measures it, which is a better answer than a number. And `whoami` reads the years figure from your operating-numbers row rather than deriving it from the 2010 start date, which would have said 16 and contradicted the 14+ above it.

The terminal is hidden in print.

### 5.5 Site health panel

`notes/build.mjs` writes `status.json` on every build: build time, commit, branch, builder, notes published and drafts, pages served, runtime dependencies, and the last 40 deploy timestamps (the workflow's own build commits are excluded). The panel shows these plus a twelve-week deploy sparkline. Page load time is measured live in the visitor's browser.

There is deliberately no uptime percentage: nothing monitors the site, and a number nobody measured is a lie on a reliability engineer's portfolio. If you want one, point a free uptime monitor at the domain and add the figure.

## 6. Notes — the content pipeline

### Writing

```bash
node notes/new.mjs troubleshooting "Pods stuck in Terminating"
# also: til, case-study, postmortem, blog
```

```yaml
---
type: case-study        # must match a type in notes.config.json
title: "Terraform module rewrite"
dek: "One sentence on what the reader gets."
date: 2026-09-07        # YYYY-MM-DD, drives ordering and the date stamp
tags: [Terraform, AWS]
draft: false            # true keeps it in the repo and off the site
---
```

Diagrams go in `notes/assets/name.svg` and are placed with `{{svg:name}}` on its own line. Use the site's CSS variables (`var(--panel)`, `var(--brass)` …) inside the SVG so it follows the colour mode.

The scaffolder pre-fills the section headings for each format:

| Format | Sections |
|---|---|
| Case study | Context → Constraints I didn't choose → What I did → What it cost → What I'd reverse |
| Troubleshooting | Symptom → What I checked → Wrong turns → Actual cause → Fix → Prevention |
| Postmortem | Summary → Impact → Timeline → Contributing factors → What changed |

Before every push: anonymise employers, strip internal hostnames, IPs, dashboard links, ticket IDs and customer names.

### What the build does

| Input | Output |
|---|---|
| `notes/posts/*.md` | `notes/<slug>.html`, one styled page each |
| all published notes | `notes/index.json`, and the same payload inlined into `index.html` |
| all published notes | `sitemap.xml` |
| every build | `status.json` |
| deleted or renamed `.md` | its stale `.html` is removed |

### What the build guarantees

| Check | On failure |
|---|---|
| `title` and `date` present | build fails, nothing is committed |
| `date` is `YYYY-MM-DD` | build fails |
| `type` matches a configured category | build fails, listing the valid types |
| `{{svg:name}}` file exists | build fails |

A malformed note breaks the workflow run, not the live site.

### Categories and empty tabs

Categories are the `tabs` array in `notes/notes.config.json`: order in the file is order on the page. Adding one is a config change only.

`hideUntilPublished: true` hides the whole Notes section, and its nav link, while nothing is published. Set it to `false` to show empty tabs instead.
