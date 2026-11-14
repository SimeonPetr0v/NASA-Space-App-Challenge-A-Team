# Flight surgeon view (Earth ↔ Mars link) — plan

Status: **committed feature** (decided 2026-11-14). Runs fully in the browser — no backend, no database. Owner: one Logic dev + one Design dev. Estimate: 4–6 h.

## Idea
A second screen shows the **Earth side**: the flight surgeon (NASA physician at Mission Control) receiving the astronaut's health reports. Reports and replies travel at the speed of light, so far from Earth they arrive late. This makes the **D — Distance from Earth** hazard visible and shows why the app must guide the astronaut immediately instead of waiting for a doctor.

## One-way signal delay by mission mode
| Mode | One-way delay | Round trip |
|---|---|---|
| ISS / LEO | ~0 s (show "live") | seconds |
| Lunar | ~1.3 s | ~3 s |
| Mars transit / surface | ~3–22 min (depends on orbital positions) | up to ~44 min |

Demo default for Mars: **14 min** one way, with a selectable value. *Science owner: cite a NASA source for the 3–22 min range.*

## Flow
1. Astronaut side: a reading is caution/danger, or the astronaut taps **"I feel unwell"** → the app shows guidance **immediately** (do now / re-check / escalate) and creates a **report**.
2. Report goes into an outbound queue with `sentAt` and `arrivesAt = sentAt + delay`.
3. Earth side: the report appears as **"In transit — arrives in 13:58"**, then lands in the flight surgeon inbox at `arrivesAt`.
4. Flight surgeon picks a reply (templates: rest, hydrate, re-measure in N h, start medication from kit, private medical conference) → reply travels back with the same delay.
5. Astronaut side shows **"Reply from Earth in 13:40"**, then the reply.

## Screens
- **Split view** (desktop, also the demo shot): Mars on the left, Earth on the right, a signal line between them with the packet moving along it.
- **Separate routes** on mobile: `/` astronaut, `/ground` flight surgeon.
- Earth side: inbox of reports (crew member, time sent, time received, worst status, key vitals, what the app already advised), reply templates, sent replies in transit.

## Demo controls
- **Time speed** (1× / 60× / 600×) so a 14-minute delay plays in seconds. When sped up, show a visible label **"Time ×60 — simulated"**; never present it as real time.
- Reset demo button; synthetic crew name only (no real astronauts, nobody under 18).

## Data contract (add to `src/engine/types.ts`)
```ts
type LinkMessage = {
  id: string
  direction: 'to-earth' | 'to-crew'
  kind: 'report' | 'reply'
  createdAt: string
  arrivesAt: string
  payload: { assessments?: Assessment[]; note?: string; replyTemplate?: string }
}
```
Store messages locally (IndexedDB via Dexie or localStorage). Both sides read the same store; "arrived" = `now(simulated) >= arrivesAt`.

## Optional later
Real two-device sync with Firebase (Firestore + anonymous auth; Spark plan does not pause). Only if everything else is done; the app must keep working if Firebase is unreachable.

## Acceptance checklist
- [ ] Guidance appears instantly on the astronaut side, independent of the delay
- [ ] Delay follows mission mode (ISS ≈ live, Moon ~1.3 s, Mars configurable 3–22 min)
- [ ] Countdown visible on both sides; sped-up time clearly labelled
- [ ] Reply travels back with the same delay
- [ ] Works offline and with no account
- [ ] Keyboard accessible; status uses colour + shape + word
