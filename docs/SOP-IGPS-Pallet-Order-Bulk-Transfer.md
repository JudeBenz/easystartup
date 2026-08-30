# SOP: Order iGPS Pallets & Record Bulk Transfers

**Document ID:** SOP-LOG-IGPS-001  
**Category:** Logistics / Inventory  
**Applies to:** Any company that rents pooled plastic pallets from iGPS and must keep an accurate pallet balance  
**Owner roles:** Shipping / Receiving, Inventory Control, Purchasing (approvals)  
**Systems:** iGPS Customer Portal (`portal.igps.net`), your WMS / ERP / inventory ledger  
**Related contacts:** iGPS support — 800-884-0225 · switch@igps.net · igps.net

---

## 1. Purpose

Standardize how any site:

1. Orders empty iGPS pallets for upcoming shipments  
2. Receives and accepts those pallets  
3. Records every inbound and outbound **bulk transfer** in company inventory records  
4. Requests pickup of empty pallets when the on-site stack exceeds hold limits  

This keeps pallet counts, iGPS billing, and shipment documentation aligned.

## 2. Scope

- Inbound orders and receipts from iGPS  
- Outbound product shipments that leave on iGPS pallets  
- Empty-pallet returns / pickups to iGPS  
- Does **not** cover buying or repairing owned (non-pooled) pallets  

## 3. Definitions

| Term | Meaning |
| --- | --- |
| **Bulk transfer** | Inventory move of many identical units (here: pallets) between locations or partners in one posting |
| **iGPS** | Pallet pooling provider; pallets are rented, not owned |
| **BOL** | Bill of lading / delivery ticket for the pallet truck |
| **Empty hold limit** | Max empty iGPS pallets your site may keep before requesting pickup |

## 4. Prerequisites

- Active iGPS account and portal login for your company  
- Known delivery **site / location code** for this facility  
- Access to post inventory transfers in your WMS/ERP (or paper ledger if that is your control)  
- Dock PPE available: safety shoes, high-visibility vest, gloves  
- Standing reorder rules / approval threshold defined by Purchasing  

## 5. Procedure

### 5.1 Confirm need

1. Count empty iGPS pallets on hand at this site.  
2. Compare to the next shipping plan (loads × pallets per load).  
3. Calculate order quantity = need − on-hand (round up only if your site policy allows a small buffer).  
4. Capture: quantity, site/location, requested delivery date, on-site contact, any special requirements (e.g. food-grade).  
5. If quantity exceeds your company’s standing reorder threshold, get Purchasing (or designated approver) sign-off **before** ordering.

### 5.2 Place the iGPS order

1. Sign in at **https://portal.igps.net**.  
2. Create an order for the correct delivery location.  
3. Enter quantity, requested date, and contact.  
4. Submit and **save the iGPS confirmation / order number**.  
5. If the portal is unavailable: call **800-884-0225**, place the order by phone, and email the confirmation to your logistics distribution list.

**Critical:** Do not treat a verbal request as complete. No confirmation number → receiving and billing cannot be reconciled.

### 5.3 Receive the delivery

1. Match BOL / delivery ticket to the iGPS order number and ordered quantity.  
2. Count pallets unloaded.  
3. Reject damaged or wrong-type pallets; note shortages on the ticket **before the driver leaves**.  
4. Photograph the load if your site’s claims policy requires it.  
5. Sign only for the **accepted** quantity.

### 5.4 Record the inbound bulk transfer

Post in your WMS / ERP / inventory ledger:

| Field | Value |
| --- | --- |
| From | iGPS (vendor / pool) |
| To | Receiving location or dock bin for this site |
| Quantity | Accepted count only |
| Reference | iGPS order number + BOL number |
| Date | Receipt date |
| Operator | Name of person posting |

File or attach the signed delivery ticket per your document-retention rules.

### 5.5 Issue pallets on outbound shipments

When product ships on iGPS pallets:

1. Confirm pallet count on the load matches the ASN / packing list.  
2. Post an **outbound bulk transfer**:  
   - From = staging / dock  
   - To = customer, carrier destination, or “in transit” (per your convention)  
   - Quantity = pallets on the load  
   - Reference = shipment / ASN / trailer number  
3. If your iGPS account requires ending the rental on ship-out, scan RFID or barcode and notify iGPS per your account setup.

### 5.6 Request pickup of empties

1. When empty iGPS pallets exceed your site’s hold limit, request pickup in the iGPS portal (or via igps.net contact form / 800-884-0225).  
2. On pickup, post an outbound empty transfer:  
   - From = empty stack location  
   - To = iGPS  
   - Quantity = empties released  
   - Reference = pickup confirmation  
3. Keep the stack area clear and segregated so the carrier can load quickly.

## 6. Roles & responsibilities

| Role | Responsibility |
| --- | --- |
| Dock / Receiving | Count, inspect, sign BOL, stage empties |
| Inventory Control | Post bulk transfers same day as the physical move |
| Purchasing / Logistics | Portal access, approvals above threshold, dispute claims with iGPS |
| Site supervisor | Hold-limit policy, exception approval, audit spot-checks |

## 7. Records to retain

- iGPS order confirmations  
- Signed BOLs / delivery tickets  
- Bulk transfer journal entries (inbound, outbound product, empty returns)  
- Pickup confirmations and claim photos (if any)  

Retention: follow your company’s inventory and AP document policy (typical: match to invoice cycle + audit window).

## 8. Exceptions

| Situation | Action |
| --- | --- |
| Over/short vs BOL | Note on ticket; post **accepted** qty only; open claim with iGPS the same day |
| Portal outage | Phone order + email confirmation; flag “manual order” in your transfer reference |
| Damaged on arrival | Quarantine, photo, do not put into shippable stock |
| Unknown location code | Stop — confirm with Logistics before ordering |

## 9. Knowledge check (for training)

**Q:** What must you record when posting an inbound bulk transfer from iGPS?  
**A:** Accepted quantity, iGPS order + BOL references, location, date, and operator.

## 10. Quick reference checklist

- [ ] Need confirmed vs shipping plan  
- [ ] Approval obtained if over threshold  
- [ ] Order placed; confirmation number saved  
- [ ] Delivery counted; BOL matched; damages/shorts noted  
- [ ] Inbound bulk transfer posted (accepted qty only)  
- [ ] Outbound shipment transfers posted with shipment references  
- [ ] Empty pickup requested when over hold limit; empty transfer posted  

---

## How to adopt this SOP at your company

1. Replace “your WMS/ERP” with the real system name and screen path.  
2. Fill in: site location codes, reorder threshold, empty hold limit, distribution email list.  
3. Assign the Owner role and publish in your procedure library (or train from this document).  
4. Recertify shipping/receiving staff whenever portal steps or transfer account codes change.
