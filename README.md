# Lunch Run

A phone-first tool for the person who collects the office lunch order every day.

Replaces the paper list, the mental arithmetic, the retyped text message, and the
"who paid transport last time?" argument. Works with no internet. No accounts,
no install, no backend — all data lives on your phone.

## Why it is built this way

Three constraints shaped every decision:

1. **The chief secretary must not have to change anything.** She still receives a
   plain text message and cash, exactly as before. The app writes the message; you
   paste it. Nothing in this system can fail on her side, because nothing on her
   side changed.
2. **Colleagues adopt nothing.** You are the only user. There is no link for them
   to click, no app for them to install, nothing to ignore. That removes the single
   biggest reason tools like this die in week one.
3. **Money is settled at delivery, not at order time.** So the app never has to
   invent a price it cannot know. It sends the item list early and does the money
   later, when prices are real.

## The daily loop

| Tab | When | What it does |
|---|---|---|
| **Order** | 12:15 | Tap a person, tap an item. Unknown prices are allowed — marked `price?` |
| **Send** | 12:30 | Builds the message **grouped by item** (what logistics needs) and copies it |
| **Arrive** | on delivery | Tick off what actually came; type any missing price **once** |
| **Money** | after | Per-person amounts, who has paid, and the exact total to hand over |
| **Fair** | after | Picks the transport payer from a visible, defensible history |
| **Setup** | rarely | People, price book, transport fee, backup |

## The two ideas that matter

**The price book learns.** The first time an item is delivered you type its price.
From then on it is a known price, everywhere. The set of unknown items shrinks every
week on its own, without anybody maintaining a menu.

**Fairness is a record, not a memory.** The transport payer is chosen by rule —
never-paid first, then longest-ago, random only to break exact ties — with recent
payers excluded. The history is on screen, so the argument ends before it starts.

## Running it

Open `index.html` in a browser and it works. To get offline mode and home-screen
install, it must be served over http, not opened as a file:

```bash
npx serve .          # or:  python -m http.server 8000
```

Then open the address on your phone (same Wi-Fi) and use **Add to Home Screen**.

## Deploying

It is pure static files — no build step, no dependencies. Push the folder to
GitHub Pages, Netlify, or any static host and it works as-is.

## Data and backup

Everything is stored in your browser's `localStorage` on one device. It survives
closing the app and losing signal, but **not** clearing site data or changing phone.
Use **Setup → Export backup** now and then; it writes a JSON file you can keep.

## Not built yet (deliberately)

- Self-service ordering by the colleagues themselves — worth adding only once the
  single-user version has proven itself in real use
- Mobile money — removes cash entirely, but needs a merchant account and real
  consequences for bugs
- Multi-device sync — needs a backend; the offline-first design is the trade
