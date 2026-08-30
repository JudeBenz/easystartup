# Order iGPS Pallets & Record Bulk Transfers

**SOP-LOG-IGPS-001** · Logistics / Inventory · Company-agnostic  
**Use this if:** your site rents pooled plastic pallets from iGPS and must keep pallet counts, billing, and shipments in sync.

| | |
| --- | --- |
| **Primary systems** | iGPS Portal (`portal.igps.net`) · your WMS / ERP / inventory ledger |
| **Who runs it** | Shipping / Receiving · Inventory Control · Purchasing (approvals) |
| **iGPS help** | 800-884-0225 · switch@igps.net · [igps.net](https://igps.net) |
| **Read time** | ~10 min full · ~2 min “At a glance” + checklist |

---

## At a glance

```text
  PLAN NEED ──► ORDER (portal) ──► RECEIVE & COUNT ──► POST INBOUND TRANSFER
                                                           │
                      ◄── PICK UP EMPTIES ◄── SHIP ON PALLETS / POST OUTBOUND
```

| Phase | You do | System of record | Must capture |
| --- | --- | --- | --- |
| **1. Plan** | Count on-hand vs shipping plan | Spreadsheet / plan board | Qty needed, date, site |
| **2. Order** | Place order in iGPS portal | iGPS confirmation # | Order #, qty, location |
| **3. Receive** | Unload, count, note damage/short | Signed BOL / delivery ticket | Accepted qty only |
| **4. Inbound transfer** | Post bulk move into inventory | WMS / ERP | From iGPS → your bin |
| **5. Outbound transfer** | Ship product; post pallets out | WMS / ERP + shipment docs | Load / ASN / trailer # |
| **6. Empty pickup** | Request pickup when over hold limit | iGPS + WMS / ERP | Pickup confirmation |

**Golden rule:** Every physical pallet move gets a same-day bulk transfer with references that tie back to iGPS and your shipment paperwork.

---

## Table of contents

1. [Why this matters](#1-why-this-matters)
2. [Site setup (fill once)](#2-site-setup-fill-once)
3. [Roles](#3-roles)
4. [How the pallet loop works](#4-how-the-pallet-loop-works)
5. [Definitions](#5-definitions)
6. [Procedure — detailed steps](#6-procedure--detailed-steps)
7. [Bulk transfer field guide](#7-bulk-transfer-field-guide)
8. [Worked examples](#8-worked-examples)
9. [Exceptions & decision guide](#9-exceptions--decision-guide)
10. [Records & retention](#10-records--retention)
11. [Printable checklists](#11-printable-checklists)
12. [FAQ](#12-faq)
13. [Training quiz](#13-training-quiz)
14. [Revision history](#14-revision-history)

---

## 1. Why this matters

iGPS pallets are **rented, not owned**. Your company is billed for time in your custody and for movements that iGPS cannot reconcile. If dock teams skip inventory postings, three things break:

| Gap | What goes wrong |
| --- | --- |
| No inbound transfer | Books show fewer pallets than the dock has → over-ordering, wasted space |
| No outbound transfer | Books show pallets you already shipped → phantom inventory, bad planning |
| No claim on short/damage | You pay for pallets you never usable-received |
| No empty pickup logged | Hold area overflows; iGPS invoices and your inventory disagree |

This SOP keeps **physical count = system count = what iGPS thinks you have**.

---

## 2. Site setup (fill once)

Copy this block into your local SOP copy or laminated dock card. Leave blanks until filled by Logistics / Inventory Control.

| Setting | Your value |
| --- | --- |
| Company / site name | _______________________________ |
| iGPS delivery location / site code | _______________________________ |
| Portal URL | `https://portal.igps.net` |
| Portal users (names) | _______________________________ |
| WMS / ERP system name | _______________________________ |
| Screen / transaction for bulk transfer | _______________________________ |
| Inbound “From” account / partner | iGPS (or: _______________) |
| Default receiving bin / location | _______________________________ |
| Empty stack location | _______________________________ |
| Standing reorder threshold (qty) | _______ pallets (above = need approval) |
| Empty hold limit | _______ pallets |
| Buffer policy (allowed over-order) | _______ pallets / none |
| Approval contact | _______________________________ |
| Logistics distribution email | _______________________________ |
| Claims / photos required? | Yes / No |
| RFID / barcode scan on ship-out required? | Yes / No |
| Document retention (months) | _______ |

---

## 3. Roles

| Role | Owns | Does not own |
| --- | --- | --- |
| **Dock / Receiving** | Count, inspect, sign BOL, stage empties, flag damage | Changing reorder thresholds |
| **Inventory Control** | Same-day bulk transfer postings; balance audits | Placing iGPS orders without dock need |
| **Purchasing / Logistics** | Portal access, approvals over threshold, claims with iGPS | Leaving unsigned BOLs “for later” |
| **Site supervisor** | Hold-limit policy, exception approval, spot audits | Day-to-day portal clicks (unless covering) |

**RACI (quick):**

| Activity | Dock | Inventory | Purchasing | Supervisor |
| --- | --- | --- | --- | --- |
| Confirm need / qty | C | R | C | A |
| Place iGPS order | I | C | R | A (if over threshold) |
| Receive & sign BOL | R | C | I | A (disputes) |
| Post inbound transfer | C | R | I | A |
| Post outbound / empty transfer | C | R | I | A |
| Open claim with iGPS | C | C | R | A |

*R = Responsible · A = Accountable · C = Consulted · I = Informed*

---

## 4. How the pallet loop works

Think of pallets as **assets on loan** that move through four states at your site:

```text
          ┌─────────────┐
          │  ON ORDER   │  (confirmation # exists; not yet counted)
          └──────┬──────┘
                 │ truck arrives
                 ▼
          ┌─────────────┐
          │  EMPTY ON   │  inbound bulk transfer posted
          │    HAND     │
          └──────┬──────┘
                 │ product loaded
                 ▼
          ┌─────────────┐
          │  LOADED /   │  outbound bulk transfer posted
          │  IN TRANSIT │
          └──────┬──────┘
                 │ (customer unloads; not your books)
                 │
    empties back at your DC (if return freight) OR
    empties accumulate from inbound customer returns
                 │
                 ▼
          ┌─────────────┐
          │ EMPTY STACK │  when over hold limit → request pickup
          │  (awaiting  │  outbound empty transfer → back to iGPS
          │   pickup)   │
          └─────────────┘
```

You only control the boxes that touch **your dock and your books**. Everything else is iGPS or the customer.

---

## 5. Definitions

| Term | Plain meaning |
| --- | --- |
| **iGPS** | Intelligent Global Pooling Systems — rents reusable plastic pallets with RFID / barcode IDs |
| **Pallet pooling** | Shared fleet: you rent what you need instead of buying and repairing wood |
| **Bulk transfer** | One inventory posting that moves many identical units (pallets) between locations or partners |
| **BOL / delivery ticket** | Paper or electronic proof of what the truck said it delivered |
| **Accepted quantity** | What you counted as usable after inspection — **this** is what you post |
| **Confirmation / order number** | iGPS reference that ties the portal order to the delivery and the invoice |
| **Empty hold limit** | Max empties your site may keep before requesting pickup |
| **Standing reorder threshold** | Max order qty that does not need special Purchasing approval |
| **ASN** | Advance ship notice — what you told the customer is coming |
| **RFID / GRAI** | Unique ID on each iGPS pallet; used for track-and-trace when your account requires scanning |

---

## 6. Procedure — detailed steps

### Step 0 — Safety before the dock

| Required PPE | When |
| --- | --- |
| Safety shoes | Always on the dock |
| High-visibility vest | Always when trucks are present |
| Gloves | Unloading, stacking, handling damaged boards |

Do not begin unload until the trailer is chocked / secured per your site’s dock safety rules.

---

### Step 1 — Confirm need

**Goal:** Order only what the next shipping window requires.

1. **Physical count** empty iGPS pallets at this site (usable only — quarantine damaged separately).
2. **Pull the shipping plan** for the horizon your site uses (often next 3–7 days).
3. **Estimate need:**  
   `Need ≈ (planned loads × pallets per load) + any staging buffer allowed by policy`
4. **Order qty:**  
   `Order qty = Need − On-hand`  
   Round up only if Site setup allows a buffer; otherwise order exact.
5. **Write down the order packet:**
   - Quantity  
   - Site / location code  
   - Requested delivery date (and time window if your account uses one)  
   - On-site contact name + phone  
   - Special notes (food-grade, dock hours, appointment required)
6. **Approval gate:** if Order qty **>** standing reorder threshold → stop and get Purchasing / designated approver sign-off **before** opening the portal.

**Tips**

- Count the stack the same way every time (e.g. rows × height) so two people get the same number.
- Do not include wood or non-iGPS plastic in the iGPS on-hand count.
- If the shipping plan is soft, order for the **firm** portion only and note the risk to Planning.

**Common mistake:** Ordering “a full truck” by habit. That burns hold space and rental days.

---

### Step 2 — Place the order in the iGPS portal

**Goal:** Get a confirmation number before anyone expects a truck.

1. Open **https://portal.igps.net** and sign in with company credentials.
2. Select the correct **delivery location / site code** (never a sister site by accident).
3. Create a new order:
   - Quantity  
   - Requested date  
   - Contact on site  
   - Notes (dock hours, appointment #, special handling)
4. Submit.
5. **Save the confirmation / order number** in your order log (shared sheet, WMS PO comment, or email to the logistics distribution list).
6. Calendar the expected delivery so Receiving is staffed.

**If the portal is down**

1. Call **800-884-0225**.
2. Place the order by phone; ask the agent to email confirmation.
3. Forward that email to your logistics distribution list.
4. In later inventory references, prefix with `MANUAL-` so AP knows this was not portal-native.

> **Critical**  
> A verbal “yeah we’ll send some” is **not** an order.  
> No confirmation number → you cannot reconcile receiving or invoices. Do not schedule labor against a rumor.

---

### Step 3 — Receive the delivery

**Goal:** Accept only what is correct and usable; document the rest while the driver is still there.

1. Ask for the **BOL / delivery ticket** and find the **iGPS order / confirmation number**.
2. Confirm it matches **your** open order (site, qty, date).
3. Unload and **count** every pallet into the receiving area.
4. Inspect for:
   - Cracked / broken decks or stringers  
   - Missing RFID / barcode labels if your process needs them  
   - Wrong pallet type / size  
   - Contamination (oil, chemicals, pests) for food / hygiene sites
5. On the BOL, **before the driver leaves**:
   - Write **accepted qty**  
   - Note **short** qty and reason  
   - Note **rejected** qty and reason  
   - Sign and print name / time
6. Take photos if Site setup requires claims evidence (full trailer, damaged units close-up, BOL).
7. Move accepted pallets to the empty-on-hand / staging location. Quarantine rejects separately and label them.

**Sign only for accepted quantity.** Signing the full BOL qty when you are short is how you pay for ghosts.

---

### Step 4 — Record the inbound bulk transfer

**Goal:** Books match the dock the same day the truck left.

Post in your WMS / ERP / inventory ledger (see [field guide](#7-bulk-transfer-field-guide)):

| Field | Enter |
| --- | --- |
| Transfer type | Inbound / receipt from vendor-pool |
| From | iGPS (vendor / pool partner) |
| To | Your receiving bin / dock location |
| Item / SKU | iGPS pallet (or your internal pallet item code) |
| Quantity | **Accepted** count only |
| Reference 1 | iGPS order / confirmation # |
| Reference 2 | BOL / delivery ticket # |
| Date | Receipt date (not “when I got to the desk”) |
| Operator | Your name / user ID |
| Notes | Shorts, rejects, `MANUAL-` if phone order |

Attach or file the signed BOL per [records](#10-records--retention).

**Same-day rule:** If the truck arrives on Monday, the transfer is posted Monday — not “when AP asks.”

---

### Step 5 — Issue pallets on outbound shipments

**Goal:** When product leaves on iGPS pallets, inventory and shipment docs agree.

1. Build the load per pick / pack instructions.
2. Confirm **pallet count on the trailer** matches ASN / packing list / bill of lading for the customer shipment.
3. Post an **outbound bulk transfer** (see field guide):
   - From = staging / dock  
   - To = customer, carrier destination, or “in transit” (use your company’s convention — pick one and stay consistent)  
   - Quantity = pallets on **this** load  
   - Reference = shipment # / ASN / trailer # / PRO #
4. If Site setup says RFID / barcode scan is required on ship-out, scan each pallet (or the load method iGPS gave you) and complete any “notify iGPS” step in the portal.
5. Keep a copy of the outbound BOL with the transfer reference.

**Why scan?** Scanning ends or advances the rental event in iGPS’s track-and-trace. Skipping it can leave rental days running on your account after the freight left.

---

### Step 6 — Request pickup of empties

**Goal:** Do not become a free warehouse for iGPS empties.

1. Watch the empty stack against your **empty hold limit**.
2. When at or over the limit (or on your weekly cadence, whichever comes first):
   - Request pickup in the iGPS portal, **or**  
   - Use [igps.net contact / pallet pickup](https://igps.net/contact-us/request-pallet-pickup/), **or**  
   - Call 800-884-0225
3. Stage empties in a clear, segregated lane so the carrier can load without hunting.
4. On pickup day, count what actually leaves.
5. Post an **outbound empty bulk transfer**:
   - From = empty stack location  
   - To = iGPS  
   - Quantity = empties released  
   - Reference = pickup confirmation #
6. If the carrier takes fewer than staged, adjust the transfer to actual and leave the remainder in the stack count.

---

## 7. Bulk transfer field guide

Use one of these three transfer patterns. Do not invent a fourth without Inventory Control.

### A. Inbound from iGPS (empties arriving)

```text
FROM:  iGPS (vendor/pool)
TO:    [Receiving bin / dock]
QTY:   accepted usable pallets
REF:   iGPS order # + BOL #
```

### B. Outbound with product (pallets leaving on a customer load)

```text
FROM:  [Staging / dock]
TO:    [Customer / carrier / In-Transit — pick your convention]
QTY:   pallets on this shipment
REF:   shipment # / ASN / trailer #
```

### C. Outbound empty return (pickup to iGPS)

```text
FROM:  [Empty stack location]
TO:    iGPS
QTY:   empties actually loaded
REF:   pickup confirmation #
```

### Reference string recipe (recommended)

Make references searchable for AP and audits:

```text
IGPS|{order or pickup #}|BOL|{bol #}|SHIP|{shipment # if any}
```

Example: `IGPS|458821|BOL|99102|SHIP|n/a`

---

## 8. Worked examples

### Example 1 — Simple inbound

| Fact | Value |
| --- | --- |
| On-hand before truck | 40 |
| Ordered | 120 |
| BOL says | 120 |
| Counted usable | 118 |
| Rejected cracked | 2 |

**Actions**

1. Note on BOL: accepted 118, rejected 2 (cracked). Photos of rejects.  
2. Post inbound transfer qty **118** (not 120).  
3. Purchasing opens claim for 2 with iGPS same day.  
4. New on-hand = 40 + 118 = **158**.

### Example 2 — Outbound product load

| Fact | Value |
| --- | --- |
| Customer order | 24 pallets of finished goods |
| Staged | 24 iGPS pallets loaded |
| Trailer / ASN | T-7741 / ASN-33019 |

**Actions**

1. Confirm 24 on trailer.  
2. Post outbound transfer qty **24**, ref `IGPS|n/a|BOL|cust-BOL|SHIP|ASN-33019`.  
3. Scan RFID if required.  
4. On-hand empties drop by 24 (or “loaded” location rises then clears — per your bin design).

### Example 3 — Empty pickup

| Fact | Value |
| --- | --- |
| Hold limit | 80 |
| Stack before pickup | 95 |
| Carrier loads | 90 |
| Left behind | 5 |

**Actions**

1. Pickup confirmation saved.  
2. Post empty return qty **90** (actual), not 95.  
3. Stack remaining = **5**.

---

## 9. Exceptions & decision guide

```text
Something wrong?
│
├─ Qty on BOL ≠ count?
│     ├─ Short → note BOL, post accepted, claim same day
│     └─ Over → do not accept extras unless Logistics authorizes; else refuse / return on truck
│
├─ Damaged / wrong type / contaminated?
│     └─ Quarantine, photo, do not put in shippable stock, claim same day
│
├─ Portal down?
│     └─ Phone order + email confirm + MANUAL- flag on later transfers
│
├─ Unknown / wrong location code?
│     └─ STOP. Confirm with Logistics. Wrong site = lost truck + wrong invoice
│
├─ Driver wants signature for full qty but you are short?
│     └─ Do not sign full qty. Sign accepted only. Escalate to supervisor if driver refuses
│
└─ Invoice from iGPS ≠ your transfers?
      └─ AP + Purchasing reconcile using confirmation #s and BOLs within the dispute window
```

| Situation | Do this | Do **not** do this |
| --- | --- | --- |
| Over / short vs BOL | Note ticket; post accepted; claim same day | “Fix it later” with no note |
| Portal outage | Phone + email + `MANUAL-` flag | Wait days with no order and no trail |
| Damaged on arrival | Quarantine + photo + claim | Mix rejects into the good stack |
| Unknown location code | Stop; confirm with Logistics | Guess a sister-site code |
| Driver pressure | Supervisor + accepted-only signature | Sign full qty to “keep the dock moving” |
| After-hours delivery | Follow after-hours receiving SOP; still count & photo | Drop-and-go with no count |

---

## 10. Records & retention

| Record | Who files | Keep at least |
| --- | --- | --- |
| iGPS order confirmations | Purchasing / Logistics | Invoice cycle + audit window* |
| Signed BOLs / delivery tickets | Receiving | Same |
| Bulk transfer journal / system entries | Inventory Control | Same |
| Pickup confirmations | Logistics | Same |
| Claim photos & emails | Purchasing | Until claim closed + audit window |

\*Fill months in [Site setup](#2-site-setup-fill-once). If blank, default to **your AP match period + 12 months**, or longer if regulated (food, pharma, defense).

**Audit spot-check (monthly, supervisor):** pick 5 transfers → match confirmation # → BOL → system qty → physical sense-check of the stack.

---

## 11. Printable checklists

### A. Order & receive (one cycle)

- [ ] On-hand counted (usable only)  
- [ ] Shipping plan reviewed; order qty calculated  
- [ ] Approval obtained if over threshold  
- [ ] Correct site / location code selected  
- [ ] Order placed; **confirmation # saved** and emailed to logistics list  
- [ ] Delivery matched to confirmation #  
- [ ] Count completed; damage / short noted **before driver left**  
- [ ] Photos taken if required  
- [ ] BOL signed for **accepted** qty only  
- [ ] Inbound bulk transfer posted same day  
- [ ] Rejects quarantined / claim opened if needed  

### B. Every outbound load on iGPS pallets

- [ ] Pallet count matches ASN / pack list  
- [ ] Outbound bulk transfer posted with shipment / trailer ref  
- [ ] RFID / barcode scan completed if required  
- [ ] Outbound paperwork filed with transfer ref  

### C. Empty pickup

- [ ] Stack ≥ hold limit (or weekly cadence due)  
- [ ] Pickup requested; confirmation saved  
- [ ] Lane staged and clear  
- [ ] Actual loaded qty counted  
- [ ] Empty return transfer posted for **actual** qty  

### D. End-of-week health check (Inventory Control)

- [ ] Open iGPS orders without receipts aged out or escalated  
- [ ] Transfers exist for every BOL this week  
- [ ] Empty stack ≤ hold limit or pickup already booked  
- [ ] Claims older than 5 business days have an owner  

---

## 12. FAQ

**Do we own these pallets?**  
No. They are pooled / rented. Treat them like returnable assets under your care.

**Can we use wood and iGPS in the same count?**  
No. Separate item codes and stacks. This SOP is only for iGPS.

**What if we receive a delivery with no open order?**  
Do not put into stock. Hold on the dock, call Logistics / iGPS, and only post a transfer after the confirmation is created or the load is refused.

**Who talks to iGPS about invoices?**  
Purchasing / Logistics, using your confirmation numbers and signed BOLs — not the forklift operator guessing on the phone.

**How fast must transfers be posted?**  
Same calendar day as the physical move whenever the site is open. Next business morning only if after-hours delivery and your after-hours SOP explicitly allows it — still with photos and a signed ticket.

**What is a “bulk transfer” vs a normal move?**  
Same idea as a location transfer, but you move a quantity of identical pallet units in one posting instead of scanning each finished-goods case. You are transferring the **pallet asset**, not the product on it (product has its own shipment docs).

---

## 13. Training quiz

Use for onboarding or annual refresh. Answer key at the bottom (fold over when printing).

1. What is the golden rule of this SOP?  
2. You ordered 100, BOL says 100, you count 97 good and 3 cracked. What qty do you post inbound?  
3. Name the three bulk transfer patterns (A/B/C).  
4. Portal is down. What three things must you still do?  
5. Driver asks you to sign for 100 though you are short 3. What do you do?  
6. When do you request empty pickup?  
7. Which reference fields belong on an inbound transfer?  
8. True or false: iGPS automatically updates your WMS.  

<details>
<summary><strong>Answer key</strong></summary>

1. Every physical pallet move gets a same-day bulk transfer with references tying to iGPS and shipment paperwork.  
2. **97** (accepted only); claim the 3.  
3. A inbound from iGPS · B outbound with product · C outbound empty return to iGPS.  
4. Phone order, get email confirmation, flag `MANUAL-` / notify logistics list.  
5. Sign **accepted only**; escalate if driver refuses; never sign full short qty.  
6. When empty stack ≥ hold limit (or on your defined cadence).  
7. Accepted qty, iGPS order/confirmation #, BOL #, location, date, operator.  
8. **False** — your WMS/ERP is your source of truth; you must post transfers.

</details>

---

## 14. Revision history

| Version | Date | Author | Notes |
| --- | --- | --- | --- |
| 1.0 | 2026-08-30 | — | Initial company-agnostic SOP (order, receive, bulk transfers, empties) |

When you customize Site setup, bump the version and note what changed (threshold, hold limit, scan requirement, system screens).

---

## Adoption checklist (management)

1. Fill [Site setup](#2-site-setup-fill-once).  
2. Replace “WMS / ERP” with real system name and screenshot the transfer screen into your local appendix if helpful.  
3. Assign RACI names (not just roles).  
4. Laminate [At a glance](#at-a-glance) + [checklists](#11-printable-checklists) for the dock.  
5. Train Dock + Inventory on Steps 1–6; score the [quiz](#13-training-quiz).  
6. Run one supervised cycle end-to-end before unsupervised use.  
7. Schedule the monthly audit spot-check.  
8. Recertify when portal steps, location codes, or transfer accounts change.
