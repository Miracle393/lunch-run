# Handover

For whoever takes over the lunch run — and this app — after the original author's
internship ends.

You do not need to have met them, and you do not need to read the code to start.

---

## 1. Taking over the app in five minutes

The app runs entirely in a browser. There is no server, no account, no password, no
monthly cost, and nothing that expires.

```bash
npx serve .          # or: python -m http.server 8000
```

Open the address on your phone (same Wi-Fi), then **Add to Home Screen**. It now works
like an app, including with no internet.

**Important:** the previous person's data lives on *their* phone, not in these files.
Ask them to use **Setup → Export backup** before they leave, and keep that JSON file.
You will start with an empty roster and an empty price book — adding people takes two
minutes, and the price book refills itself as you confirm prices at delivery.

## 2. The daily loop

| Tab | When | What you do |
|---|---|---|
| **Order** | 12:15 | Tap a person, tap what they want. No price? Add it anyway — it shows `price?` |
| **Send** | 12:30 | Tap **Copy message**, paste it into the normal chat to the secretary |
| **Arrive** | on delivery | Tick off each item that came. Type any missing price — once |
| **Money** | after | Each person's amount, mark who has paid, and the exact total to hand over |
| **Fair** | after | Tap **Pick fairly** to choose who covers transport |
| **Setup** | rarely | People, prices, transport fee, backup |

## 3. The four rules this app is built on

If you change the code, protect these. Each one is there for a reason that cost
somebody something to learn.

1. **The chief secretary must never have to change anything.** She gets a plain text
   message and cash, as always. The app writes the message; you paste it. Never build
   something that needs her to open, install or learn anything.
2. **Colleagues adopt nothing.** You are the only user. If you ever add self-service
   ordering, it must be *in addition to* typing orders yourself — never instead of it.
   Some people will never click a link, and the system has to keep working for them.
3. **No dependencies, no build step.** Plain HTML, CSS and JavaScript on purpose, so
   that you — and the person after you — can open a file and understand it.
4. **Money is settled at delivery.** Do not try to compute an exact total before the
   food arrives. The prices genuinely do not exist yet.

## 4. Where to read more

| File | What it tells you |
|---|---|
| `docs/progress.md` | What has been done, session by session, and what is next |
| `docs/decisions.md` | Why each choice was made, and what was rejected |
| `docs/problem-brief.md` | The original problem, before any code existed |
| `README.md` | Short user-facing summary |

Read `docs/decisions.md` before changing anything structural. It exists so you can
tell the difference between a decision that was deliberate and one that was accidental.

## 5. Understanding the code

One file holds the logic: `app.js`, around 400 lines, in plain JavaScript.

- **State** — one object, saved to `localStorage` under `lunchrun.v1`: `settings`,
  `people`, `items` (the price book), `rounds` (one per day).
- **A round** is one day's order: lines of `{person, item, delivered, actualPrice}`,
  plus who pays transport and who has paid.
- **Views** — one function per tab (`viewOrder`, `viewSend`, …), each returning HTML.
  `render()` redraws everything after any change. Simple and a little wasteful, which
  is the right trade at this size.
- **Fairness** — `pickPayer()`: never-paid first, then longest-ago, random only to
  break exact ties.
- **Price learning** — in the `change` handler: a price typed at delivery is written to
  the line *and* to the price book, which is why unknown prices get rarer.

If you change any file, bump `CACHE` in `sw.js` — otherwise phones keep serving the
old cached version.

## 6. Ideas worth building next

In rough order of value:

- **Quantities** — ordering two of the same item currently creates two lines
- **Absent people** — someone orders, then leaves before the food arrives
- **Self-service ordering** — a link colleagues can use, with manual entry kept intact
- **Sync or backup to the cloud** — so data survives losing a phone
- **Mobile money** — the real fix for cash, but needs a merchant account and care

## 7. If something breaks

Everything is local, so the blast radius is small. **Setup → Export backup** first,
always. If the app misbehaves badly, the data can be inspected in the browser's
developer tools under Application → Local Storage. Worst case, **Setup → Erase
everything** returns it to a clean state — but export first.
