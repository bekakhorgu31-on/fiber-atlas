# Iteration 34 — what the 606 review cases mean

Date: 2026-10-10. Analysis only; no application or database changes.

The owner reports that the Shida proposal is now **added to the network**, with 176 Segments, 9,356 Fibers, 1,759 transitions and 766 Port bindings. The analysis below uses the matching local Iteration 33 proposal, semantic output, full source audit and original `შიდა ქართლი 2026.vsdx`. It does not independently verify the live database revision or any subsequent review decisions.

Source SHA-256: `e417131f1ddcf1db571e90685880c41bdb1aa972f4291044798036d0b1274060`.

The [machine-readable inventory](iteration34-review-inventory.json) enumerates all 606 unique case IDs, affected objects, source Shapes, AP groups, conflicts and original-source spot checks. Its provenance includes hashes of the three local input artifacts. It is an audit fixture, not a production data source.

## Exact count reconciliation

| Existing category | Cases | What remains unknown |
| --- | ---: | --- |
| `fiber_port_binding_ambiguous` | 506 | A printed Port exists, but the interpreter has no accepted exact Fiber binding. The current category name does not prove competing candidates. |
| `source_bank_association` | 89 | The Cable label/endpoints/capacity are known, but its complete physical Fiber-bank association is not proven. |
| `source_conflict` | 8 | The same logical Fiber has different source fills at its two endpoint banks. |
| `source_port_numbering` | 2 | Two AP banks have irregular printed Port numbers; their 48 raw Port records are preserved outside canonical Ports. |
| `source_representation_ambiguous` | 1 | Two identical full Cable labels have unresolved physical identity. |
| **Total** | **606** | **Includes the eight conflicts; not 614.** |

These are review cases, not 606 proven physical network faults. Nor is 606 a complete count of everything needed to digitize the drawing.

## Why the owner cannot inspect them properly

- `OwnerImportPanel.tsx` prints `proposal.reviewItems` and `conflicts` as plain text. Its source-record button opens import candidates and raw Shape JSON, not a semantic issue list.
- `ReviewView` in `NetworkViews.tsx` lists `data.issues`. The Shida proposal contains **zero** entries in that collection, while its **606** cases live in `sourceReviewCases`.
- `DatabaseReviewPanel.tsx` exposes case questions in one select control, followed by a decision form. It does not explain the selected case, affected object, alternatives, impact or source geometry. Many questions are identical.
- All 606 generated cases have empty `candidates` and `bounds`. The underlying semantic/source artifacts often contain useful geometry and candidate associations, but those are not supplied as actionable case details. All 506 unknown canonical Ports have an empty accepted `bindings` list; it does not retain a per-Port rejection reason.
- `App.tsx` unnecessarily blocks the review screen on deferred lineage/sheet details even though `sourceReviewCases` is already part of the operational payload.
- Import counts are frozen proposal totals; the session badge subtracts review decisions and adds certain pending import sources. These are different scopes. Older unsupported attempts can still affect the badge after a newer attempt succeeds unless supersession is accounted for.

The immediate defect is a mismatch between the records being counted and the records being presented, compounded by missing diagnostic detail.

## Patterns that make review manageable

### 506 Port cases form 23 AP groups

**504 cases are 21 complete banks of 24 Ports**: AP11, AP12, AP15, AP19, AP20, AP21, AP22, AP23, AP24, AP26, AP29, AP30, AP31, AP32, AP35, AP36, AP38, AP40, AP44, AP45 and AP51. The remaining two are **AP18 / Port1** and **AP37 / Port14**. Names, canonical node IDs and child case IDs are in the inventory.

This is a strong reason to investigate shared bank/Cable association failures before asking the owner to resolve 506 records manually. It does not establish that every case has the same cause. The Port audit currently skips candidates with no unique bank label, non-unique docking, missing marker numbering or mismatched node geometry without preserving those rejected alternatives per Port. Add these diagnostics, then distinguish parser limitation, ambiguous source, no drawn connection, and a documented intentional absence. Do not infer “free” or “unused” from missing bindings.

All 1,272 canonical printed Ports, including the 766 with exact bindings, have source State `თავისუფალი`. That raw field therefore cannot independently establish physical occupancy or service use.

### 89 Cable associations are the highest-value interpreter investigation

These Segments contain **4,748 logical Fibers**. This is their inventory size, not the number of paths an improvement will necessarily repair.

The earlier label-proximity stage calls 54 of these `candidate_proximity_only` and 35 `drawn_links_corroborate_bank_pair`; none passed the later complete, node-owned physical association rule. The intermediate phrase “corroborate” must not be shown as an accepted mapping.

The source audit separately retains **2,627 local drawn links** that cannot enter the optical graph: 2,198 lack an accepted Cable association on one bank; 429 lack it on both. Bank-association improvements could recover many links, but their actual impact must be measured after validation. These links are not 2,627 additional review cases or independent end-to-end routes.

Five drawn physical bank pairs have no matching label under the current endpoint/capacity rule: endpoint-token pairs `25016–25017`, `20–25024`, `23–25039`, `25118–25119`, and `25124–253138`. Preserve those literal tokens; a suspected typo is not permission to normalize or merge them. The audit retains the banks and 24/24/24/59/59 associated strokes respectively. These are concrete starting points for examining why real drawn evidence fails association.

### Eight conflicts share one Cable and one fill comparison

All concern source label **`25-206-25075-25081-96`**, between SC25075 and SC25081: **F10, F22, F34, F46, F58, F70, F82 and F94**. Each compares `#7030a0` with `#cc99ff`, two purple shades. The repeating twelve-Fiber spacing is an observation, not a rule for changing the data.

The original XML directly confirms these two fills for the F10 markers, Shapes `34469` and `35418`; all eight pairs are enumerated from the semantic artifact. Present a single expandable group with all eight child cases and side-by-side evidence. Investigate whether the drawing uses equivalent shades or distinct meanings before proposing any color normalization. The conflict alone is not proof of broken continuity.

### Two numbering issues are visible in the original source

- **AP43 · Noste:** the extracted bank is `1…23, 1`; Shape `46525` and the final Shape `46548` both contain `1` in the original XML. Port24 is absent from the printed number set.
- **AP47 · Prezeti:** the extracted bank is `1…8, 0, 10…24`; Shape `67897` contains `0` in the original XML. Port9 is absent from the printed number set.

Replacing the repeated `1` with `24`, or `0` with `9`, is a plausible correction to present to the owner with the drawing. It is not yet an authorized or applied correction. Preserve literal source values and all 48 raw records. A numbering correction alone does not prove Fiber bindings.

### One duplicate-label case represents two occurrences

Shapes `27117` and `29315` both contain **`25-178-25060-25061-48`**, confirmed directly in the original XML. They occupy different drawing positions and have different nearby bank evidence. Whether they depict one physical Segment twice or require a source correction remains unresolved. Do not silently deduplicate them or create two physical Cables from identical text alone.

## Work outside the 606-case total

The audit also retains 47 unowned Fiber banks, 579 unclassified annotations, unresolved aggregation Ports, Tube/ring meaning, endpoint identities and operational notes. Some overlap the existing cases; some have no dedicated review case. An annotation is not automatically an error. Keep a separate digitization coverage ledger, with links from a root cause to every affected record, rather than adding overlapping counts together.

**9,260 partial selected-Fiber paths are affected outputs, not 9,260 separate defects.** A path may have several unknowns, and several paths may depend on one missing association. “All extracted Shapes retained” and “all accepted transitions covered” do not mean the entire Visio network is correctly understood.

## Recommended order

1. Make the existing 606 cases reachable and understandable without changing topology.
2. Preserve rejection reasons and group the 89 association cases, 23 AP groups and remaining source ledgers by shared evidence. Prioritize improvements by distinct affected objects and validated route impact.
3. Present small, concrete owner decisions for the two numbering banks, duplicate identity and grouped shade conflict. Keep observations separate from corrections applied to a network revision.
4. Improve the interpreter using verified source evidence, compare a new proposal with the current revision, and let the owner apply it. Repeat the same process for remaining symbols, annotations and new source families.

Implementation requirements and acceptance checks: [Iteration 34 worker specification](ITERATION-34-REVIEW-INBOX-AND-DIGITIZATION.md).
