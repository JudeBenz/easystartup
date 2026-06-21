# EasyStartUp — Live Demo Script

**Duration:** ~60 seconds · **App:** http://localhost:3000 · **Persona:** Owner (Marcus Rodriguez)

---

## Setup
App is running on `main`. Seed is deterministic — always shows 2026-06-20 at 06:58 (shift starts 07:30). Do not reset the seed before the demo — the blocked beat is pre-seeded.

---

## Beat 1 — The morning question (10 s)

**Navigate to `/autopilot`**

> "It's 7am. Marcus walks in and opens the dashboard. One question: is the business open?"

Point to the amber banner:
- "Opening blocked — 0 of 4 routines complete, 2 blocked on PPE"
- StatStrip: `02 blocked` in amber

> "Two routines are stuck. Before anyone touches a machine, we know there's a problem."

---

## Beat 2 — The blocked checklist (15 s)

**Click "Continue →" on Welding Bay Setup → `/checklists/chk_welding/run`**

> "Derek started the welding bay setup this morning. Made it through 3 steps, then hit a wall."

Point to the blocked item:
- Navy banner: `■ PPE required · Inspect PPE and confirm welding certification`
- Items 1–3 checked; item 4 unchecked; "Mark complete" button greyed out

> "The system won't let him continue until a human confirms his certification is valid. But it's not."

---

## Beat 3 — The compliance trail (15 s)

**Navigate to `/people` — scroll to Certifications section**

> "The cert ledger tells us exactly why."

Point to Derek Foster's row highlighted in amber:
- `proc_welding_cert · Expired 2026-05-30`

> "His welding cert expired three weeks ago. The system caught it this morning before he touched the welder."

Also point to Sarah Chen's 2 expired certs (proc_loto, proc_cpr):
> "Sarah's also got two expired compliance certs — we'd have missed those without this."

---

## Beat 4 — The floor map (10 s)

**Navigate to `/twin`**

> "The spatial twin shows the same information as a floor map."

Point to Welding Bay zone (amber):
- Click the zone → spec panel opens: RS-WELD-001, 4 steps
- Step W04: `VERIFY welding certification on record (not expired) · HALT_AND_ALERT`

> "This is Stage 3 — the same procedure that runs today as a human checklist becomes a robot-readable spec automatically. No translation work required."

---

## Beat 5 — The punchline (10 s)

**Stay on twin or return to `/autopilot`**

> "Derek's cert gets renewed this afternoon. Marcus re-runs the checklist. The bay opens. The twin goes green."
>
> "That loop — knowledge captured, compliance tracked, operations unblocked — that's what EasyStartUp does. And every time a human runs a checklist, we're building the dataset that eventually lets a robot run it instead."

---

## Optional: Stage 1 proof (if asked)

**Navigate to `/procedures`**

Show the procedure list — CNC Pre-Op, Welding Setup, LOTO, etc.
Navigate to a procedure detail page and show the AI-generated steps and quiz.

> "These procedures feed the checklists, the cert ledger, and the robot spec. Write once, everything downstream follows."
