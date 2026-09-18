# Progress journal

Running record of how this project was built, session by session. The newest entry
is at the top. Written so that work can stop at any moment — end of day, PC shutdown,
end of the internship — and resume without losing the thread.

---

## ▶ Next session starts here

**State:** v1 code is written and syntax-checked. It has **never been opened in a
browser.** Nothing has been tested with real people or real orders.

**Do these in order:**

1. **Run it and click every tab.** `npx serve .` then open the address on the phone.
   Expect small bugs — this is first-run code.
2. **Add the real office roster** in Setup, and a few known items with prices.
3. **Dry-run one full loop** with fake orders: Order → Send → Arrive → Money → Fair.
   Check the copied message reads the way the secretary expects it.
4. **Use it for one real lunch run** before changing anything. Real use will reveal
   more than any amount of planning.
5. Then decide what v2 needs, based on what actually hurt.

**Known gaps, already understood:**
- No way to mark an item as *not delivered but still charged* vs *refunded*
- No handling for someone who orders then leaves before the food arrives
- No quantity control (ordering two of the same item adds two separate lines)
- Data lives on one device only; backup is manual via Setup → Export

---

## Session 01 — 17 September 2026

**Goal:** Understand the manual process, choose an approach, build a first version.

### What happened

Started from an empty folder and a description of the daily task: at 12:15 walk desk
to desk collecting lunch orders, write them on paper, text them to the chief
secretary of the building, check the food on arrival, pick someone to cover
transport, collect cash from everyone, hand it over.

Spent the first part of the session on understanding rather than building. That paid
off — see the reframing below.

### The key reframing

The problem was described as "I cannot know the total because some new items have no
known price until delivery." Asking *when* the total is actually needed revealed that
money is settled **when the food arrives**, not when the order is placed. The
secretary only needs the item list upfront.

So the hardest-looking requirement dissolved. The app sends items early and handles
money later, when prices are real. Understanding the timing mattered more than any
feature.

A second reframing: the runner is personally exposed to any shortfall between cash
collected and the real bill. That risk was never mentioned but is the most serious
part of the task, and it drove the design of the Money tab.

### Decisions made

Recorded in full in `docs/decisions.md` (D1–D9). The headline ones:

- Build for **one user** (the runner), not self-service for colleagues — it cannot
  fail on adoption, which is how tools like this usually die
- The **secretary never changes anything** — the app writes her text message
- **Vanilla PWA, no dependencies, no build** — so a successor can maintain it
- The **price book learns** prices confirmed at delivery, so unknowns shrink weekly
- **Fairness becomes a visible record**, not one person's memory

### Built

Complete v1: `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`,
`icon.svg`. Six tabs covering the full daily loop — Order, Send, Arrive, Money, Fair,
Setup. Offline-capable, installable to a phone home screen, all data in
`localStorage`.

Also wrote `docs/problem-brief.md` (the analysis), `docs/decisions.md`, this journal,
`docs/handover.md`, `README.md`, and `CLAUDE.md` so future sessions resume cleanly.

### Verified

`node --check` passes on `app.js` and `sw.js`; the manifest parses as valid JSON.
**That is all that has been verified** — no browser test, no real use.

---

## Template for future entries

```
## Session NN — DD Month YYYY

**Goal:** what this session set out to do

### What happened
### Decisions made        (also add them to docs/decisions.md)
### Built / changed
### Verified              (be honest: what was actually tested, what was not)
### Next                  (update the "Next session starts here" block at the top)
```
