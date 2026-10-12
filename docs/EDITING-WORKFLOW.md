# Future editing UX — design only

No edit, save, approval, database, or audit service is implemented in this prototype. Viewing a candidate never changes its verification state.

## Proposed interaction

An explicit “შეცვლის შეთავაზება” action opens a focused form from the existing record, preserving the surrounding cable or closure. Show the previous and proposed values plus evidence. Save a draft first; an authorized reviewer approves a versioned change. The server transaction updates the canonical record, and the ledger/trace are derived again. Do not maintain separate diagram copies.

| Task | Minimal inputs | Review / validation |
| --- | --- | --- |
| Add cable | ID, typed endpoints, fiber count, physical owner or explicit unknown, type, notes | Unique canonical ID; both endpoints exist; positive supported capacity; generate numbered fibers in one transaction. Manufacturer/module scheme remains optional and explicit. |
| Add/edit closure | ID, location and coordinate CRS, role, mounting, model, notes | Preserve raw coordinates; validate CRS/axes; refuse removal of a connected endpoint without a reviewed replacement. |
| Connect fibers | Closure, cable A/fiber, cable B/fiber or port, operation, tray if known, source | Both ends at same location; valid fiber/port ranges; no self-connection; reject occupied ends/conflicting approved edges. A branching device needs an explicit device model. Straight geometry never supplies operation automatically. |
| Assign rights | Fiber, organization, category, dates, agreement evidence | Physical cable owner stays separate; review overlapping terms; retain unknown versus confirmed none. |
| Assign service | Service ID, provider, customer, fiber assignment, dates and evidence | Provider/customer do not imply owner/holder; multiple assignments require explicit sharing semantics. |
| Approve | Reviewer, evidence, verification method/date, change summary | Show impact on traces and conflicting ends; reject stale record version; log actor, timestamp, before/after, reason and source. |

Reservation, usage, availability, condition and topology are independent. Availability must be evaluated against current reservations, rights and services; no edge or no service row is not proof of availability. The current helper is deliberately conservative and is not a production commercial-policy engine.

A proposed future workflow is not authorization to change live inventory or physical fiber infrastructure.
