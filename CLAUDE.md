# Lunch Run — project context

> This file is read automatically at the start of every Claude Code session in this
> folder. **If you are a new session: read `docs/progress.md` first** — it says exactly
> where the last session stopped and what comes next.

## What this is

A phone-first offline web app (PWA) for the person who collects the office lunch
order every day at an internship. It replaces a paper list, mental arithmetic, a
retyped text message, and an argument about who pays the transport fee.

Built to outlive its author: the intern who needs it will leave, and somebody else
must be able to run, understand and extend it. That is a hard requirement, not a
nice-to-have.

## Status

v1 code complete, syntax-checked, **not yet tested in a browser or in real use.**

## Start here

| File | What it holds |
|---|---|
| `docs/progress.md` | **Session journal — read this first.** Where we stopped, what is next |
| `docs/decisions.md` | Every decision and why, including options rejected |
| `docs/problem-brief.md` | The original problem analysis, actors, pain points |
| `docs/handover.md` | For whoever inherits this project |
| `README.md` | User-facing: what it does, how to run and deploy |

## Stack — and the rules that protect it

Vanilla HTML + CSS + JavaScript. **No framework, no dependencies, no build step.**
Data lives in `localStorage` on one device.

These are deliberate and should not be casually changed:

1. **Zero dependencies, zero build.** Anyone can open the files and understand them.
   A successor with basic web skills must be able to maintain this. Adding npm
   packages or a bundler breaks that promise.
2. **Offline-first.** The app must open and work with no signal. Anything that
   requires network at load time is wrong.
3. **The chief secretary is a fixed interface.** She receives a plain text message
   and cash, exactly as before. Never design something that requires her to adopt,
   install, open or learn anything.
4. **Colleagues adopt nothing.** The runner is the only user. Self-service ordering
   may be added later, but only *in addition to* manual entry, never replacing it.

## File map

```
index.html              app shell + tab bar
app.js                  all logic: state, rounds, fairness, message, rendering
styles.css              mobile-first, light + dark
sw.js                   service worker, cache-first (bump CACHE when files change)
manifest.webmanifest    PWA install metadata
icon.svg                app icon
docs/                   brief, decisions, progress journal, handover
```

## Running it

```bash
npx serve .          # or: python -m http.server 8000
```

Must be served over http (not opened as a `file://`) for offline mode and
home-screen install to work.

## House rules for sessions

- **Before ending a session, append an entry to `docs/progress.md`** — what changed,
  what was decided, and what the next session should pick up. The user shuts the PC
  down between sessions and relies on that file to resume.
- Record any real decision in `docs/decisions.md`, including what was rejected and
  why. The reasoning is the valuable part, not the conclusion.
- Currency is Tanzanian Shilling (TZS), whole numbers with thousands separators.
- Money is settled **at delivery**, never at order time. Much of the design follows
  from this.
