# Iteration 25 — Port Interpretation Audit

## AP53 and AP54

Certified source labels establish:

| AP | Branch Segment | Source label | Label Shape |
|---|---|---|---|
| AP53 | C182 | `182-225-53-24` | 37907 |
| AP54 | C183 | `183-225-54-24` | 38438 |

Each AP retains 24 source-aligned PortTopologyBindings. The continuation brief's expected C182/C183 swap conflicts with the certified file and is therefore not applied.

## SC225 Port-side topology

- C181/F01–F04 reach AP54 through C183/F01–F04.
- C181/F13–F16 reach AP53 through C182/F01–F04.
- C181/F05–F12 and F17–F24 do not receive invented Port bindings.
- C181/F06 is AP-side by owner confirmation, but the exact AP and Port remain unresolved.
- Twelve C182↔C183 local transitions remain because each has a real connector Shape with world geometry.

## Status independence

Green source Port graphics mean observed occupied/in use. White graphics mean observed unused only. Neither status establishes commercial availability. Tsageri and Lentekhi aggregation occupancy stays unknown where no distinct filled Port graphic exists. `AGG-LENTEKHI` remains the neutral endpoint identity while the heading/property number conflict persists.

Machine-readable evidence is in `src/data/iteration25-port-interpretation.json`, `iteration25-sc225-routing.json`, and `iteration25-unresolved-evidence.json`.
