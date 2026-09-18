# Problem brief — the daily office lunch run

*Written before any code, to make sure the right problem got solved.*

## The task as it exists today

At 12:15 one person walks desk to desk asking what everyone wants for lunch, writes
the orders on paper, retypes them into a text message to the chief secretary of the
building, who passes them to logistics. When the food arrives, that same person
checks every item came, works out what everyone owes, picks somebody to cover the
transport fee, collects cash from ten to twenty people, and hands the total over.

Every day. From memory and a sheet of paper.

## Who is involved

| Actor | Stake | Design consequence |
|---|---|---|
| **The runner** (primary user) | Does the work, carries the risk | Standing up, one hand, 15-minute window. Big tap targets, no typing where a tap will do |
| **Colleagues** | Want food, nothing else | Near-zero tolerance for friction. Assume they adopt **nothing** |
| **Chief secretary** | Receives order and cash | Outside the team, senior, no reason to change. **Treat as a fixed interface** |
| **Logistics / vendor** | Sets the prices | Unreachable by software. Prices arrive with the food, not before |

## The four problems underneath

**1. Collection.** Twenty minutes of walking, and ten people interrupted. Real, but
the least broken part — and the round has social value worth keeping.

**2. Price uncertainty.** New items have no known price until they are delivered.
No software can invent one. But software can make sure the *same* item is never
unknown twice.

**3. Cash reconciliation, and who carries the risk.** The runner personally floats
the gap between what was collected and what was owed. This was the least-mentioned
problem and the most serious one: an unbanked petty-cash float run daily from memory.

**4. Fairness.** "Random, but not recently" is a rule enforced by one person's memory.
The first time somebody disputes it, there is no record to point at. A social problem
wearing a technical disguise.

## The decision that made this easy

Money is settled **when the food arrives**, not when the order is placed. So the
secretary never needed a total upfront — she needed the item list. Unknown prices
stop being a blocker and become a data-entry moment at delivery.

This collapsed the hardest-looking requirement into a non-issue. Worth stating
plainly: understanding *when* the information was needed mattered more than any
feature.

## Options considered

| Option | Good | Bad | Verdict |
|---|---|---|---|
| **Private digital notebook (one user)** | No adoption cost, works offline, ships in days | Runner still walks the office | **Chosen** |
| Self-service order link | Removes the round and the transcription | Dies if 3 people ignore it; needs data on their phones | Later, behind the same data model |
| WhatsApp bot | Best adoption in theory | Business API approval and cost; unofficial libraries are fragile and against ToS | Rejected — disproportionate |
| SMS / USSD | Works on any phone | Telecom aggregator and paid shortcode | Rejected — not feasible |
| Mobile money | Kills cash, the root of problem 3 | Real money, real consequences, merchant account; secretary still wants cash | Not a first version |

## Why single-user was chosen over self-service

Self-service is the more impressive demo and the worse first product. It can only
succeed if every colleague changes their behaviour, and it fails the moment three of
them do not. The single-user version cannot fail that way, because nobody else has to
do anything differently. Once it is trusted in real use, self-service can be switched
on and write into the same order — the people who use it save time, the people who
ignore it get added by hand exactly as today.

Ship the version that cannot fail on adoption. Earn the second version.

## What success looks like

- The 12:15 round takes less time and nothing gets forgotten
- The message to the secretary is never retyped and never wrong
- The amount to collect is known and correct at delivery, every time
- The runner never covers a shortfall out of pocket again
- Nobody argues about the transport fee, because the history is on screen
