# Iteration 19 — AP Port Flow Review

Reviewed 2026-09-28 against `Tsageri-Lentekhi 2025.vsdx`, page `ცაგერი-ლენტეხი` (page ID 4), source SHA-256 `51a8477566c9d392a23bed239f37549759215a936388a98c71c6585b07c6b36a`.

## Result

`APPortFlow` now records each of the 24 numbered positions at AP41, AP50, AP51, AP52, AP53 and AP54. The rule is `tsageri-lentekhi-ap-port-flow/1`. Each record separates network role, physical usage, administrative allocation and commercial availability. It retains incoming Segment/Fiber/Tube/color, optional outgoing direction, lineage links and source shapes. AP internal continuation remains `unknown`; no splice, patch or jumper operation is inferred.

The repeated AP interpretation requires all of these structural matches: a typed AP symbol with 24 positions, a `cable-closure-AP-24` label, two agreeing 24-position marker banks, and horizontal alignment with numbered AP positions. AP51 usage coloring is not generalized. Only AP51 Port3 remains `in_use`; AP51's other white positions remain `unused` with availability unknown. AP41 and AP50/AP52/AP53/AP54 usage remains unknown.

## AP audit

| AP | Place | Arriving path | Port interpretation | Usage evidence | Continuation/end state | Source shapes |
|---|---|---|---|---|---|---|
| AP41 | ჩხუტელი | AGG5 · ცაგერი / SC205 → C149 → AP41 | F01–F24 align to Port1–24. Owner groups: 1–16 ingress; 16–22 return; 23–24 local end. | Unknown on every Port | Owner-described return/local meaning; exact internal operation unknown | 12432, 14250, 14251, 13910 |
| AP50 | რცხმელეთი | AGG5 · ცაგერი / SC216 → C170 → AP50 | F01–F24 align to Port1–24 | Unknown on every Port | Source does not establish internal continuation or final service state | 33591, 33699, 33752, 33700 |
| AP51 | ყვედრეში | AGG5 · ცაგერი / SC218 → C173 → AP51 | Existing F01–F24 to Port1–24 projection preserved; each Port links to one Fiber Lineage | Port3 in use; other positions unused in this AP representation; availability unknown | Fiber Lineages terminate at the AP Port; internal operation unknown | 34263, 34371, 34424, 34372 plus existing per-position evidence |
| AP52 | ხოფური | AGG5 · ცაგერი / SC219 → C175 → AP52 | F01–F24 align to Port1–24 | Unknown on every Port | Source does not establish internal continuation or final service state | 35041, 35121, 35174, 35122 |
| AP53 | წანაში | AGG5 · ცაგერი / SC225 → C182 → AP53 | F01–F24 align to Port1–24 | Unknown on every Port | Source does not establish internal continuation or final service state | 37759, 37907, 37908, 37855 |
| AP54 | ხელედი | AGG5 · ცაგერი / SC225 → C183 → AP54 | F01–F24 align to Port1–24 | Unknown on every Port | Source does not establish internal continuation or final service state | 38310, 38438, 38439, 38386 |

## AP41 reconciliation

The latest owner explanation is represented directly:

- Ports 1–16: `ingress` / `შემოდის`;
- Ports 16–22: `return` / `ბრუნდება მარშრუტზე`;
- Ports 23–24: `local_termination` / `აქ მთავრდება`.

Port16 deliberately belongs to both the ingress and return groups. Its primary compact display role is `transit`, while its complete role list retains `ingress`, `return` and `transit`. The earlier owner statement “Ports3–22 backfeed toward Ambrolauri” remains in profile provenance and the older `AccessPointPortRange`; it is shown only in technical detail. The prototype does not silently choose a different range boundary.

## Lineage relationship

AP51 Ports retain their existing exact Fiber Lineage links and Port3 OTDR note. The generic lineage helper also treats an AP as a valid intermediate node when a future evidence-backed lineage enters and leaves that AP. Current AP41 return meaning does not create a new Lineage or alter the established 68 Lineages because the exact internal Fiber continuation is not known.

## Workspace behavior

Every AP Inspector now leads with origin, direction groups and a responsive 24-Port grid. Each cell shows Port number, local Fiber identity, role text and a physical Fiber-color swatch. Physical use is a separate visual status; the green in-use indicator is not the green physical Fiber swatch. Port selection preserves the URL and shows role, usage, incoming direction, Tube/Fiber colors, outgoing direction when known, and a full-journey action when a Lineage exists. Branch cards show AP name, 24 Ports and a compact range/role summary.

## Remaining gaps

- AP41's exact ingress-to-return internal Fiber operation and exact outgoing Segment/Fiber remain unknown.
- AP50/AP52/AP53/AP54 physical usage, allocation, commercial availability, internal continuation and service state remain unknown.
- AP51 white `unused` positions are not commercially free or available.
- The AP symbols do not establish a separate internal ODF/panel hierarchy.

## Lentekhi aggregation

The route now ends at the neutral canonical entity `AGG-LENTEKHI`, displayed as `ლენტეხის აგრეგაცია`. **Destination is known; numeric legacy identifier is conflicting.** The heading claim `6` and property claim `5` remain separate provenance fields. Neither numeric value is selected as the canonical identifier. C184 and eligible Fiber Lineages reach this known endpoint.

