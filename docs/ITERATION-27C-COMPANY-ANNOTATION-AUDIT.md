# Iteration 27C — Company and annotation audit

**Occurrence accounting: PASS. Company assignment and annotation-scope gates: FAIL.**

## Company occurrences

All 24 labels are individually retained below. Current extraction finds no direct Connect rows for these labels; nearest marker geometry is context only and is not treated as company ownership or Fiber usage.

| Shape | Label | Orientation | Source disposition |
|---:|---|---:|---|
| 17536 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17537 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17661 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17662 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17663 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17664 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17665 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17668 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17670 | სილქნეტი (Silknet) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17671 | სილქნეტი (Silknet) | -1.571 rad | occurrence accounted; assignment unresolved |
| 17672 | სქაიტელი (Skytel) | -1.571 rad | occurrence accounted; assignment unresolved |
| 29210 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 29211 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33804 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33805 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33806 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33807 | ოუფენ ნეტი (OpenNet (Georgian label)) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33808 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33811 | მაგთი (Magti) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33813 | სილქნეტი (Silknet) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33814 | სილქნეტი (Silknet) | -1.571 rad | occurrence accounted; assignment unresolved |
| 33815 | სილქნეტი (Silknet) | -1.571 rad | occurrence accounted; assignment unresolved |
| 40999 | მაგთი (Magti) | 0.000 rad | occurrence accounted; assignment unresolved |
| 41000 | მაგთი (Magti) | 0.000 rad | occurrence accounted; assignment unresolved |

Counts: Magti 10; OpenNet (Georgian label) 8; Silknet 5; Skytel 1. No occurrence is omitted, and no usage or ownership has been inferred from proximity.

## Meaningful annotation occurrences

The source extraction accounts for 3,569 nonempty text Shapes in deterministic lexical buckets. The following operational text occurrences are individually listed; their raw text is preserved (whitespace normalized in this table).

| Shape | Raw text | Current semantic status |
|---:|---|---|
| 12433 | ჩხუტელი | occurrence accounted; route/scope/status not promoted without evidence |
| 14985 | გაიჭრას #11 #12 მოდული | occurrence accounted; route/scope/status not promoted without evidence |
| 17667 | OTDR | occurrence accounted; route/scope/status not promoted without evidence |
| 23801 | ორბელი | occurrence accounted; route/scope/status not promoted without evidence |
| 24070 | ლაჯანა | occurrence accounted; route/scope/status not promoted without evidence |
| 25399 | გაგულეჩი | occurrence accounted; route/scope/status not promoted without evidence |
| 26768 | ლაილაში | occurrence accounted; route/scope/status not promoted without evidence |
| 27182 | სურმუში | occurrence accounted; route/scope/status not promoted without evidence |
| 28523 | აჭარა | occurrence accounted; route/scope/status not promoted without evidence |
| 28663 | ალპანა | occurrence accounted; route/scope/status not promoted without evidence |
| 30980 | ტვიში | occurrence accounted; route/scope/status not promoted without evidence |
| 33340 | გაიჭრას #8 მოდული | occurrence accounted; route/scope/status not promoted without evidence |
| 33349 | გაიჭრას #4 მოდული | occurrence accounted; route/scope/status not promoted without evidence |
| 33691 | გადასვლა ქურო N162-ში ამბროლაურის მიმართულება | occurrence accounted; route/scope/status not promoted without evidence |
| 33810 | OTDR | occurrence accounted; route/scope/status not promoted without evidence |
| 40991 | ლენტეხი-ხელედის მიმართულება | occurrence accounted; route/scope/status not promoted without evidence |
| 41051 | ODF-ში არეულია I და II თარო 1-12 ნარინჯისფერია, 13-24 ლურჯი | occurrence accounted; route/scope/status not promoted without evidence |

The three cut/module notes (Shapes 14985, 33340, 33349) are retained individually; source text alone does not establish completed versus planned work. OTDR notes and the ODF shelf-order note are preserved as technical/layout annotations. The Lentekhi–Kheledi and Ambrolauri direction text is preserved as direction context only; neither creates a Fiber edge or external boundary by itself.

## Exact semantic blockers

- Company: 24 occurrences have not been reconciled to a logical assignment, Port/Fiber range, or ownership/usage semantics; no direct Connect attachment exists in the extracted evidence. Owner confirmation or an authoritative company-use schedule is needed for assignments not encoded in the drawing.
- Cut/module status: 3 notes lack a source status/date/legend that distinguishes completed from planned cuts. Owner confirmation is needed only for those three statuses.
- Route/place scope: 9 place/other text occurrences and two direction texts are inventoried, but drawing scope is not deterministically tied to a single Cable/branch in the current decoded source. The source drawing or owner must identify the intended route scope before creating external boundaries.
