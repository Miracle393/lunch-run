# Decision log

Every decision that shaped this project, with the reasoning and the options rejected.
The reasoning is the valuable part — a successor can only safely change a decision if
they know what it was protecting.

Format: what was decided, why, what was rejected, and how reversible it is.

---

### D1 — Build for one user, not self-service for colleagues
**Date:** 17 Sep 2026 · **Status:** active

The runner is the only user. Colleagues do not install, open or click anything.

**Why.** Self-service is the more impressive demo and the worse first product. It can
only succeed if every colleague changes behaviour, and it fails the moment three of
them do not. The single-user version cannot fail that way. Asked directly, the user
confirmed colleagues have smartphones but *"won't bother"* with a link — which settles
it.

**Rejected:** shared order link; WhatsApp bot (business API cost and approval,
unofficial libraries fragile and against ToS); SMS/USSD (needs a telecom aggregator
and paid shortcode).

**Reversible?** Yes, by design. Self-service can be added later writing into the same
order model — but only *alongside* manual entry, never replacing it.

---

### D2 — The chief secretary is a fixed interface
**Date:** 17 Sep 2026 · **Status:** active · **Do not change lightly**

She receives a plain text message and cash, exactly as she does today. The app
composes the message; the runner pastes it into the normal chat.

**Why.** She is outside the team, senior, and has no reason to adopt anything.
Requiring change from the one person with the least incentive to change is the most
common way projects like this die. Confirmed explicitly with the user: plain text,
always.

**Rejected:** a dashboard or link for her; a shared order screen.

**Reversible?** Only if she ever asks for something different. Never impose it.

---

### D3 — Money is settled at delivery, not at order time
**Date:** 17 Sep 2026 · **Status:** active

The message sent upfront carries the item list only. Prices and totals are handled
when the food arrives.

**Why.** This was the central discovery of the session. The stated problem — "I can't
compute the total because new items have unknown prices" — only exists if the total is
needed upfront. It is not; people pay on arrival. The app therefore never has to
invent a price it cannot know.

**Rejected:** estimating unknown prices and collecting a buffer — unnecessary
complexity and it would put the runner's own money at risk.

---

### D4 — The price book learns from delivery
**Date:** 17 Sep 2026 · **Status:** active

A new item is created with no price. The first time its real price is typed at
delivery, it is saved to the price book and is a known price from then on.

**Why.** Unknown prices cannot be eliminated, but the *same* item should never be
unknown twice. With ~weekly new items, the unknown set shrinks on its own and nobody
has to maintain a menu.

---

### D5 — Fairness is a visible record, not a memory
**Date:** 17 Sep 2026 · **Status:** active

The transport payer is chosen by rule: never-paid first, then longest-ago, random only
to break exact ties, with the most recent payers excluded. History and per-person
counts are on screen.

**Why.** "Random but not recently" enforced from memory cannot survive a dispute.
Making the history visible ends the argument before it starts. The transparency is the
feature; the randomness is almost incidental.

---

### D6 — The message is grouped by item, the app is grouped by person
**Date:** 17 Sep 2026 · **Status:** active

Logistics receives "Pilau x4, Chips kuku x3". The runner sees per-person lines.

**Why.** Two audiences need the same data shaped differently. Doing this translation
in the head, daily, is exactly the kind of work software should absorb.

---

### D7 — Vanilla PWA: no framework, no dependencies, no build step
**Date:** 17 Sep 2026 · **Status:** active · **Do not change lightly**

**Why.** The author leaves at the end of the internship. A successor with basic web
skills must be able to open the files and understand them. A build step or dependency
tree is a maintenance burden handed to someone who did not choose it. It also happens
to make offline support trivial and hosting free.

**Rejected:** Google Sheets + Apps Script (fastest to build, but looks like a
spreadsheet rather than a product, weaker as a portfolio piece); native mobile app
(slowest, install friction, hardest to maintain alone).

---

### D8 — Data lives in localStorage on one device
**Date:** 17 Sep 2026 · **Status:** active, but expected to be revisited

**Why.** No backend means no hosting cost, no accounts, no privacy questions about
colleagues' data, and true offline operation. The trade is real: no sync, and data is
lost if site data is cleared or the phone changes. Mitigated by manual JSON export in
Setup.

**Revisit when:** a second person needs to run the lunch round, or the history becomes
valuable enough that losing it would hurt.

---

### D9 — Mobile money deferred
**Date:** 17 Sep 2026 · **Status:** deferred, not rejected

Paying into a wallet would remove cash entirely and solve the runner's personal
financial exposure at the root. Deferred because it needs a merchant account, carries
real consequences for bugs, and the secretary still expects cash — so v1 would be
converting between forms of money, not removing a step.

---

### Currency and formatting
Tanzanian Shilling (TZS), whole numbers with thousands separators (`5,000 TZS`).
Transport fee is a fixed daily amount, configurable in Setup.
