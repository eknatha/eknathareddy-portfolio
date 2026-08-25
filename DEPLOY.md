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

## 3. DNS

Four **A** records on the apex `eknathareddy.com`:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

Four **AAAA** records (optional, IPv6):

```
2606:50c0:8000::153
2606:50c0:8001::153
2606:50c0:8002::153
2606:50c0:8003::153
```

One **CNAME**: `www` → `eknatha.github.io`

Delete the registrar's parking/default A record. No wildcard records.

```bash
dig eknathareddy.com +noall +answer -t A
dig www.eknathareddy.com +noall +answer -t CNAME
```

## 4. Before you publish

- **Career years.** `const TRACK = [...]` at the bottom of `index.html` is the only data you maintain. The five year ranges are my guesses — fix them.
- **Contact is LinkedIn only.** No address appears anywhere — not in the markup, not in the JSON-LD, not behind a `mailto:`. If you later want a lower-friction route, add an alias on your own domain (`hello@eknathareddy.com`) forwarded to your inbox, rather than publishing a personal address.
- **Résumé PDF.** Drop `eknatha-reddy-puli-resume.pdf` in the repo root — the hero button already points at it.
- **Availability pill.** `<span class="live">` in the header. Delete it if you don't want IBM colleagues seeing "Open to roles".
- **GitHub handle.** Hardcoded as `github.com/eknatha`. Swap to `eknathareddyp` if that's the account you want surfaced.
- **`og.png`.** Referenced for link previews but not included — add a 1200×630 image or delete the `og:image` meta tag.

## 5. Design notes

Palette is petrol black, warm ivory and aged brass — deliberately not the terminal-green of the labs, because recruiters read this one. Display type is system grotesque set tight; the thesis line is the only serif on the page; all data and labels are mono.

The signature element is the service-history bar: five segments weighted by tenure, current employer lit in brass, keyboard-navigable.

Motion is one orchestrated load (staggered bar reveal) plus scroll-fade on sections. Both respect `prefers-reduced-motion`.

`Cmd/Ctrl+P` inverts the whole page to black-on-white and drops the nav, buttons and timeline bar — it prints as a clean one-pager.

Zero dependencies. No fonts fetched, no analytics, no build step.

## 6. Service history — adding experience detail

An accordion, newest first. Each role is a horizontal row — dates, title and employer, and a marker — that expands on click. The current role opens by default; several can be open at once.

`const TRACK` in `index.html` stays **oldest first** (so breaks in service compute correctly); the page reverses it for display.

```js
{
  org: "IBM",                    // required
  abbr: "IBM",                   // required
  from: 2023, to: 2026,          // required — years
  current: true,                 // optional — "present" instead of the end year

  dates: "Feb 2010 – Nov 2010",  // optional — exact span, overrides from/to in the row
  role: "Senior Staff Software Engineer",
  focus: "Platform Engineering · Cloud Infrastructure · SRE",
  location: "Bengaluru",
  summary: "Two or three sentences on the remit.",
  arc: [                         // optional — org changes during your tenure
    "Joined AT&T",
    "AT&T spun its advertising business into Xandr",
    "Xandr acquired by Microsoft"
  ],
  highlights: ["Concrete, with a number in it."],
  stack: ["Kubernetes", "Terraform"]
}
```

Only the first four fields are required. Omit anything else and that part is left out — an entry with just a summary still renders cleanly.

A gap of **more than a year** between one role's `to` and the next role's `from` renders as a "break in service" row. A few months between jobs isn't flagged.

Printing expands every role and hides the markers.

**The `highlights` arrays are mostly empty on purpose.** They're the strongest thing on the page and they need real numbers from work you did. Two or three per role: what changed, by how much, measured how. The Sterlite entry shows the shape.

### Toolchain

Seven rows in `index.html`, under the "What I run" section. The **Databases** row currently reads MySQL · PostgreSQL · Oracle · Redis — that's a starting set, not a claim I can stand behind. Trim it to what you'd be comfortable being questioned on for twenty minutes.

### Mobile

The accordion header is a three-cell grid. On phones it uses named areas — dates and the expand marker on the first line, role and employer on the second — because with three children in a two-column grid the marker was being pushed onto its own row. Fixed.

Also handled: anchored sections clear the fixed rail (`scroll-margin-top`), the header stack strip wraps below 400px, `overflow-x` is clipped so the decorative glows can't cause sideways scroll, tap highlights use the brass tint, and a 520px breakpoint tightens section rhythm, buttons and tabs.

Worth a real-device check before you publish — emulators miss things.

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

## 7. What's not on the page

The EknathaLabs section is removed, along with the footer link and the `sameAs` entry in the JSON-LD. Nothing on the site references the labs now.

Worth putting back once you have a case study or two published — a portfolio of built things reads well next to written analysis, and weakly on its own. When you do, add it back as a section and link each lab's footer to here so the authority flows both ways.

LinkedIn is `linkedin.com/in/eknathareddypuli` in all three places it appears: the contact links, the JSON-LD `sameAs`, and nowhere else.

### `404.html`

GitHub Pages serves its own branded 404 otherwise, which breaks the illusion on a custom domain. This one matches the site — same palette, same grid backdrop, and it echoes the path that was requested (rendered with `textContent`, so a crafted URL can't inject markup). It sets `noindex` and stays out of `sitemap.xml`.

Pages picks it up automatically from the repo root. No configuration.

---

## 8. Notes — the content pipeline

**`index.html` contains no notes content.** Not the entries, not the tab labels, not the section heading, not the intro copy. All of it is generated. The homepage configures exactly one thing:

```js
const NOTES_SOURCE = "/notes/index.json";
```

### The pipeline

```
notes/notes.config.json   categories, labels, heading, intro copy
notes/posts/*.md          the writing
         ↓  notes/build.mjs — runs in the Action on every push
notes/index.json          the payload the homepage renders
notes/<slug>.html         one page per published note
sitemap.xml               regenerated
```

### Once, at setup

`Settings → Pages → Source → **GitHub Actions**`. Without it the build never runs.

### Every week

```bash
node notes/new.mjs case-study "Terraform module rewrite"
# → notes/posts/2026-09-07-terraform-module-rewrite.md, draft:true,
#   pre-filled with the section skeleton for that format

# write it, flip draft:false

git add -A && git commit -m "notes: terraform module rewrite" && git push
```

Push is publish. About 40 seconds.

### Front matter

```yaml
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
