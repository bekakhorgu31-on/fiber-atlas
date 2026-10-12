# Iteration 18 UX Simplification Review

Date: 2026-09-28  
Scope: Route Workspace and Context Inspector presentation  
Data baseline: unchanged Iteration 17 Fiber Lineage projection

## Result

Iteration 18 changes how the existing network is presented. It does not add topology, promote uncertain evidence or modify any Fiber Lineage. The right Inspector now leads with the operational answer and puts source/model fields behind consistent collapsed detail.

The default reading order is:

1. what the selected object is;
2. where it comes from and where it goes;
3. the next useful action;
4. `დამატებითი ინფორმაცია`;
5. `წყარო და ტექნიკური დეტალები`.

Empty branches, annotations and remap sections are omitted. The simpler Manager presentation is enabled by default and uses the same data and primary content as the normal view.

## Terminology

Internal proposed-group identifiers are no longer rendered as Tube identities. Confirmed construction reads, for example, `ტუბი 3 · მწვანე · F25–F36`. When construction is not established, the UI reads `ჟილები F01–F12` and `ტუბის ფერი/ნომერი დაუდგენელია`, or the route ribbon reads `48F · ტუბები დაუდგენელია`.

The core Fiber labels are now Georgian:

| Previous label | Current label |
|---|---|
| Origin | საიდან მოდის |
| Current local identity | აქ |
| Destination | სად მიდის |
| Journey | სრული გზა |

Normal uncertainty is expressed as `გაგრძელება დაუდგენელია`, `Visio-დან ზუსტად ვერ განისაზღვრა` or `სავარაუდო გაგრძელება`. Engineering status names and internal IDs remain available only in deeper technical detail where needed.

## Inspector behavior

### Cable Segment

C172 now begins with `C172 · 48F`, `SC217 ↔ SC218`, upstream context, the local span and the three meaningful destination ranges:

- F01–F28 → C174 / Lentekhi direction;
- F29–F40 → C173 / AP51;
- F41–F48 → continuation unknown.

Construction follows immediately with four clickable confirmed Tube rows. Source label, route position, mapping counts and the PhysicalCable ID are collapsed. The simple physical-cable statement explains that the physical cable ends at SC218 while Fibers continue through other cables.

### Closure

SC218 now shows incoming C172 from SC217, main C174 toward SC219, the C173/AP51 branch and three Fiber-range transition summaries before any hardware metadata. Exact remap rows expand only on request. Ordinary transit closures such as SC221 show the short C177 → SC221 → C178 context and state that the Fibers continue unchanged when the projection supports it. Model, mounting, coordinates, treatment, counts and connection rows remain under `ქუროს დეტალები`.

### Tube and Fiber group

Confirmed Tube detail begins with Tube number/color and its local Fiber range, followed by destination ranges and clickable Fibers. Proposed groups are titled by Fiber range and explicitly state that Tube number/color are unknown. No fake Tube number is shown.

### Fiber

Fiber detail keeps the strongest Iteration 17 pattern but simplifies its language and rows. Consecutive unchanged legs are grouped. Changes at SC206 and SC218 stand out with number, Tube and Fiber-color transitions. The prototype disclaimer appears once in the Route Workspace header instead of on every Fiber card.

### AP, Aggregation and Port

AP51 leads with incoming SC218 → C173 context, 24 Ports, Port3 in-use status and a compact Port grid. OTDR remains one small annotation. AGG5 leads with its ODF capacity and four destination ranges; selecting a range exposes Ports. Selecting Port175 or AP51 Port3 shows the Fiber relationship first and provides a direct action to the complete journey.

## Preserved data

The iteration retains:

- all 68 Fiber Lineages;
- the C172/F01 and C172/F31 golden journeys;
- AP51 Fiber-to-Port mappings and Port3 in-use state;
- OpenNet usage on applicable lineages;
- the C173/F03 OTDR annotation;
- confirmed Tube/Fiber colors and unknown construction states;
- all CableContinuation, PhysicalCable, source provenance and verification records;
- the Lentekhi identity conflict and other real uncertainty.

No Laravel/PostgreSQL work, new Visio import, topology edge or data-model rule was added.

## Browser acceptance

The production preview was exercised at 1440×900 for:

- C172 Segment;
- SC218 Closure;
- SC221 ordinary transit Closure;
- C172 Tube3;
- C172/F31 complete journey;
- AP51 → Port3;
- AGG5 range → Port175.

The 390×844 mobile check confirmed no document or Inspector horizontal overflow, collapsed detail by default and a readable complete Fiber journey. The standalone HTML was opened through `file://`, had one embedded script, zero linked styles, no overflow and the same simplified F31 journey. Browser logs contained no errors or warnings. Machine-readable results are in `docs/iteration18-browser-qa.json`; reviewed screenshots are `docs/iteration18-c172-desktop.png` and `docs/iteration18-f31-mobile.png`.

## Verification

- 451 automated tests pass with zero failures.
- TypeScript project compilation passes.
- Vite production build passes. The existing large embedded-bundle advisory remains expected for the one-file offline deliverable.
- `fiber-prototype.html` was regenerated from the passing build.

The prototype remains an interpretation of real Visio source data and is not a field verification.
