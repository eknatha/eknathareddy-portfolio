#!/usr/bin/env node
/**
 * notes/new.mjs — scaffold this week's note
 *
 *   node notes/new.mjs case-study      "Terraform module rewrite"
 *   node notes/new.mjs troubleshooting "Pods stuck in Terminating"
 *   node notes/new.mjs postmortem      "Ingress outage, 41 minutes"
 *
 * Writes notes/posts/YYYY-MM-DD-slug.md with front matter and the
 * section skeleton for that format, marked draft:true so it doesn't
 * publish until you say so.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const POSTS = join(HERE, 'posts');

// Valid types come from the same config the build and the site use.
const CONFIG = JSON.parse(readFileSync(join(HERE, 'notes.config.json'), 'utf8'));
const TYPES = CONFIG.tabs.map((t) => t.type);

const SKELETONS = {
  'case-study': `## Context

What the system was, who depended on it, and what state it was in when you picked it up. Two or three sentences.

## Constraints I didn't choose

Budget, headcount, a change freeze, a vendor decision made before you arrived. This section is what separates a case study from a tutorial. Be specific.

## What I did

The approach, and the alternatives you rejected and why. Include the snippet that carries the idea, not the whole module.

## What it cost

Time, migration pain, a capability given up, on-call load during the transition. Naming the cost is what makes the win believable.

| Measure | Before | After |
|---|---|---|
|  |  |  |

## What I'd reverse today

One or two decisions you'd make differently, and what you know now that you didn't then. This is the section interviewers read to decide whether you can self-assess.
`,

  'troubleshooting': `## Symptom

What was observed, by whom, and what it looked like from the outside. Include the actual error if you can share it.

## What I checked

The hypotheses in the order you tried them.

## Wrong turns

The paths that looked right and weren't. Leave these in — they're the most useful part for anyone hitting the same thing.

## Actual cause

The real mechanism, explained so someone who has never seen this system can follow it.

## Fix

\`\`\`bash
# the command or config that resolved it
\`\`\`

## Prevention

What now catches this earlier — a specific alert, a check, a default changed.
`,

  'postmortem': `## Summary

Two sentences: what broke, for how long, and what the user-visible effect was.

## Impact

Duration, scope, who was affected, what degraded versus what failed outright.

## Timeline

| Time | Event |
|---|---|
| 09:14 | First alert fires. |
| 09:22 | Incident declared, comms opened. |
| 10:05 | Mitigation applied. |
| 10:41 | Service fully recovered. |

## Contributing factors

Blameless — describe the system condition, not the person. If you found only one factor, keep looking.

- 
- 

## What changed afterwards

Follow-ups that actually shipped. "We added monitoring" is weak; name the alert and the threshold.
`
};

SKELETONS['blog'] = `Open with the thing itself — no throat-clearing, no "in this post I will".

## Why it matters

One or two paragraphs. What changed your mind, or what you'd tell a colleague over coffee.

## What I'd watch next

Where you think this goes, and what would make you wrong.
`;

const [type, ...rest] = process.argv.slice(2);
const title = rest.join(' ').trim();

if (!TYPES.includes(type) || !title) {
  console.error(`Usage: node notes/new.mjs <${TYPES.join('|')}> "Title"`);
  process.exit(1);
}
// A category added to notes.config.json works immediately; it just gets
// a plain skeleton until someone writes a bespoke one here.
const GENERIC = `## Context

What this is about, and why it's worth writing down.

## Detail

The substance. Be specific — names of things, numbers, what you actually ran.

## What changed

What is different now, and what you'd tell someone hitting this next.
`;

const skeleton = SKELETONS[type] || GENERIC;
if (!SKELETONS[type]) {
  console.log(`No bespoke skeleton for "${type}" — using the generic one.`);
}

const slug = title.toLowerCase()
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const date = new Date().toISOString().slice(0, 10);
const path = join(POSTS, `${date}-${slug}.md`);

if (!existsSync(POSTS)) mkdirSync(POSTS, { recursive: true });
if (existsSync(path)) {
  console.error(`✗ ${path} already exists`);
  process.exit(1);
}

writeFileSync(path, `---
type: ${type}
title: "${title.replace(/"/g, '\\"')}"
dek: "One sentence. What the reader gets out of this."
date: ${date}
tags: []
draft: true
---

${skeleton}`);

console.log(`✓ ${path}

Write it, then set draft:false and push. The Action does the rest.

Before publishing: anonymise employers, and strip internal hostnames,
IPs, dashboard links, ticket IDs and customer names.`);
