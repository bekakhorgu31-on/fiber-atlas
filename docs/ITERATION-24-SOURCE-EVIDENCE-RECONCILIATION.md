# Iteration 24 — Source Evidence Reconciliation

Source SHA-256: `caae4badc9c8c30be0a5fa3ef26352c3e534a9de7c66e830ef470466bb34a6fa`. Raw artifact: `migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz`.

## Complete evidence accounting

- Shapes: **7,349** (2,640 top-level; 4,709 grouped/subshapes).
- Exact direct-text Shapes: **2,676**; Visio comments: **1**.
- Text equation: 2,677 = 61 structural + 58 meaningful annotation + 2,558 numeric/layout.
- Unexplained meaningful text: **0**.
- Property-bearing Shapes: **218**. Every Property Section, Row, Cell, value and formula is preserved in `property-evidence.json` and the raw artifact.
- Connect rows: **203**, valid **203**, dangling **0**.
- Raw XML package parts preserved verbatim: **40**.

## Company-label occurrences

No company-to-Fiber assignment is created. The current source contains 12 OpenNet, 6 Magti, 6 Silknet and 7 Skytel direct text occurrences, including Georgian and English labels.

| Shape | Exact text | Candidate | World rotation | Parent | World bounds |
|---:|---|---|---:|---|---|
| 17661 | Open net | OpenNet | -1.570796 | top level | 40.498,588.314 → 40.498,595.398 |
| 17662 | Open Net | OpenNet | -1.570796 | top level | 40.588,588.314 → 40.588,595.398 |
| 17663 | Open Net | OpenNet | -1.570796 | top level | 40.682,588.314 → 40.682,595.398 |
| 17664 | Open Net | OpenNet | -1.570796 | top level | 40.776,588.314 → 40.776,595.398 |
| 17665 | მაგთი | Magti | -1.570796 | top level | 40.865,588.314 → 40.865,595.398 |
| 17668 | მაგთი | Magti | -1.570796 | top level | 41.137,588.314 → 41.137,595.398 |
| 17670 | სილქნეტი | Silknet | -1.570796 | top level | 41.321,588.314 → 41.321,595.398 |
| 17671 | სილქნეტი | Silknet | -1.570796 | top level | 41.406,588.314 → 41.406,595.398 |
| 17672 | სქაიტელი | Skytel | -1.570796 | top level | 41.501,588.314 → 41.501,595.398 |
| 37550 | ოუფენ ნეტი | OpenNet | -1.570796 | top level | 83.285,450.016 → 83.285,455.495 |
| 37551 | ოუფენ ნეტი | OpenNet | -1.570796 | top level | 83.379,450.016 → 83.379,455.495 |
| 37552 | ოუფენ ნეტი | OpenNet | -1.570796 | top level | 83.465,450.016 → 83.465,455.495 |
| 37553 | ოუფენ ნეტი | OpenNet | -1.570796 | top level | 83.559,450.016 → 83.559,455.495 |
| 37554 | მაგთი | Magti | -1.570796 | top level | 83.648,450.016 → 83.648,455.495 |
| 37557 | მაგთი | Magti | -1.570796 | top level | 83.926,450.016 → 83.926,455.495 |
| 37559 | სილქნეტი | Silknet | -1.570796 | top level | 84.109,450.016 → 84.109,455.495 |
| 37560 | სილქნეტი | Silknet | -1.570796 | top level | 84.199,450.016 → 84.199,455.495 |
| 37561 | სქაიტელი | Skytel | -1.570796 | top level | 84.285,450.016 → 84.285,455.495 |
| 37584 | Skytel data | Skytel | -1.570796 | top level | 86.375,450.016 → 86.375,455.495 |
| 37585 | Skytel Data | Skytel | -1.570796 | top level | 86.469,450.016 → 86.469,455.495 |
| 38317 | Skytel Data | Skytel | -1.570796 | top level | 123.288,443.277 → 123.288,444.428 |
| 38318 | Skytel Data | Skytel | -1.570796 | top level | 123.197,443.277 → 123.197,444.428 |
| 38538 | ოუფენ ნეტი | OpenNet | 0.000000 | top level | 40.500,547.139 → 83.290,567.957 |
| 38539 | ოუფენ ნეტი | OpenNet | 0.000000 | top level | 40.591,547.139 → 83.381,567.957 |
| 38540 | ოუფენ ნეტი | OpenNet | 0.000000 | top level | 40.682,547.139 → 83.472,567.957 |
| 38541 | ოუფენ ნეტი | OpenNet | 0.000000 | top level | 40.773,547.139 → 83.563,567.957 |
| 38542 | მაგთი | Magti | 0.000000 | top level | 40.864,547.139 → 83.654,567.957 |
| 38545 | მაგთი | Magti | 0.000000 | top level | 41.138,547.139 → 83.928,567.957 |
| 38547 | სილქნეტი | Silknet | 0.000000 | top level | 41.324,547.139 → 84.114,567.957 |
| 38548 | სილქნეტი | Silknet | 0.000000 | top level | 41.410,547.140 → 84.200,567.958 |
| 38549 | სქაიტელი | Skytel | 0.000000 | top level | 41.503,547.139 → 84.292,567.957 |

Each record in `company-occurrences.json` also contains group ancestry and bounded nearest Fiber-marker, Cable-label and line-Shape evidence. `nearbyPortBank` remains null because proximity alone is not promoted to a Port relationship.

## Cable labels and marker grammar

All 20 four-part Cable labels retain exact text, Shape ID, world position/bounds, parsed tokens, grammar version and warnings. All 39 discovered marker banks contain 2,208 marker representations. The paired bank construction resolves 1,176 logical Fibers and 98 Tubes. Outer marker line/ring is interpreted as Tube color and inner fill as Fiber color only inside this validated repeated source grammar; color never creates connectivity.

## Ports

The fresh projection contains 384 Port evidence records: 144 AP graphics, 192 deduplicated Tsageri logical Ports represented by mirrored source banks, and 48 Lentekhi positions. It produces 192 deterministic AP/Lentekhi PortTopologyBindings. Green/white semantics are applied only to the identified AP Port-status graphics; commercial availability remains unknown.

## Package inventory

- `[Content_Types].xml` — xml, 3,683 bytes, SHA-256 `638f8aa8ed35cfdb59af5cc5196a05109ec210172b6f71e31cf2908a79e26e11`
- `_rels/.rels` — xml, 862 bytes, SHA-256 `bb83266c59508deeb50a20a034d55a296561a8b16c920f9192c8f03201e3648a`
- `docProps/app.xml` — xml, 1,955 bytes, SHA-256 `2e610de7e6325c2d1511e80c8edc9622e385d92b276ae9d274103be1580571a8`
- `docProps/core.xml` — xml, 792 bytes, SHA-256 `b5c93b76a460e546c86d4696a92e2e3fd49fd236f4619fca876b9b7bec447d2d`
- `docProps/custom.xml` — xml, 879 bytes, SHA-256 `4b0f042e3bf6105832dea549fcbe2857e2b23ceb90a6213eb6d34727b88f27f3`
- `docProps/thumbnail.emf` — binary, 20,416 bytes, SHA-256 `5771b463e9593cc60a8d77f7bd37d88e9a753426f8f54ce450718c0b598044ae`
- `visio/_rels/document.xml.rels` — xml, 758 bytes, SHA-256 `b5c4cb5a727984a832b3efce52af816011b4503e21461659bf940cc740346a23`
- `visio/comments.xml` — xml, 759 bytes, SHA-256 `78d6d255f5f0234c9735ad039ba35dbec91b4c341aeb179503308c939b558e3f`
- `visio/document.xml` — xml, 29,670 bytes, SHA-256 `0f8c9de3224336c6a95f6ce59221b9e96afe59f8459ab567791f9f63b563db5b`
- `visio/masters/_rels/masters.xml.rels` — xml, 2,691 bytes, SHA-256 `d7f5c3164ac6ccb12cf74a4d66b2aa229ac69d31772e0aa5f691b9ca07828152`
- `visio/masters/master1.xml` — xml, 361,734 bytes, SHA-256 `27d6a7d1db229c872184e35b02d9aa2d36efe6031b7ccb4cfe55816e5f18730a`
- `visio/masters/master10.xml` — xml, 30,030 bytes, SHA-256 `bb6fd009b315dbab03f6841cf3f92565a5b4018ace849440c3cd1590d2716184`
- `visio/masters/master11.xml` — xml, 335,312 bytes, SHA-256 `d5211815aa71819c3e18eac54123bfac5bebfdd22fe4b73dc9bca62031d7c911`
- `visio/masters/master12.xml` — xml, 60,393 bytes, SHA-256 `457b3c46a29be77ac24305e20b8c19413f32d1320697dc901e95271ccc288757`
- `visio/masters/master13.xml` — xml, 11,756 bytes, SHA-256 `238719a6e3562af1bd12a43793e2f727f519095c5d72fa9065a0e8d989986114`
- `visio/masters/master14.xml` — xml, 11,348 bytes, SHA-256 `0a22952d200c84160802fc4b51ae94a3d04c75edb9b10a9342f4cc8f72a5ccce`
- `visio/masters/master15.xml` — xml, 1,922 bytes, SHA-256 `7b9648852fc612d0792668a9b9956dd6b1d6196835fa3b374aaeb7165f6228fd`
- `visio/masters/master16.xml` — xml, 1,552 bytes, SHA-256 `928e6ad4810fbd8dbe82c9a7ecf763b64d1b409f086535c45e1dc79b42198002`
- `visio/masters/master17.xml` — xml, 13,154 bytes, SHA-256 `4625f2cb370b8b10d417cdc32c5537b05c84be9eb06443ff27583dca5f90da45`
- `visio/masters/master18.xml` — xml, 11,246 bytes, SHA-256 `2a9e1bbcbaa6a47a8576348a7e4b253a31e05e29652f44f11364a98e73720263`
- `visio/masters/master19.xml` — xml, 2,408 bytes, SHA-256 `3bf32770a9b4b19d06e970cfe1cc577c50b3f6a55319624f7811b1ab7cf42858`
- `visio/masters/master2.xml` — xml, 32,937 bytes, SHA-256 `5e6aeb1846429f3d94e522a19deee3387dd89c6c4227b46bccbb3ddc18fd6549`
- `visio/masters/master20.xml` — xml, 2,245 bytes, SHA-256 `15496e985616b6dba4244c10aeab8c40608f0186e2d2c27ed012ae2ce4ac9628`
- `visio/masters/master21.xml` — xml, 40,747 bytes, SHA-256 `59b0889707997cbfdcfabb8dec40a071ef1770620af6abfba6709cc9d17bcdfe`
- `visio/masters/master22.xml` — xml, 36,594 bytes, SHA-256 `aa7d5fc290eb49ca42b28b25f3ee320e3c2069f8f9d266d294a30d32e3f480fb`
- `visio/masters/master3.xml` — xml, 25,084 bytes, SHA-256 `8e6422e7696ed112d02ce1e28e87d7e66dcb9c9c9b263a36519bb10241aac8ba`
- `visio/masters/master4.xml` — xml, 11,048 bytes, SHA-256 `fac7473f5dad9fff67c444604bf28e1e11f107cd50922354a285ec2741d41f07`
- `visio/masters/master5.xml` — xml, 11,493 bytes, SHA-256 `485016eea44f071c3c94d94cc336211488c3ae688595b6c6e6d86ba1468073db`
- `visio/masters/master6.xml` — xml, 4,425 bytes, SHA-256 `1e8e47fdf7a96e30b2d12a8c6e5cd976e14135498a81b4f5e29c0b68e5083f13`
- `visio/masters/master7.xml` — xml, 267,707 bytes, SHA-256 `87eb8426a5f82b89379e9da92b039be498181d32ca907962bfc32725583377b2`
- `visio/masters/master8.xml` — xml, 215,295 bytes, SHA-256 `658112a5fb09f3b73191a0779773f648f0da3158ed81ab4d0adce9a90c90a549`
- `visio/masters/master9.xml` — xml, 276,938 bytes, SHA-256 `3df099eafa24f2e867de064b50ab12a0931a4cc78d63467e74c2590be6325a61`
- `visio/masters/masters.xml` — xml, 56,924 bytes, SHA-256 `46339f497d83e4872637a4be40b8395306e1603b13cc81050c93dbe5198b85ec`
- `visio/pages/_rels/page1.xml.rels` — xml, 660 bytes, SHA-256 `4509682a032e1ca27a8a39499f6125513ba035aa01c39ca2c673f2d216380de9`
- `visio/pages/_rels/pages.xml.rels` — xml, 267 bytes, SHA-256 `5ea921680b493c11639b02133cdf154f8300ac22ab8c2aadbb63fecea9e31bae`
- `visio/pages/page1.xml` — xml, 14,355,131 bytes, SHA-256 `f40c5c582c10e032a384e98ba48f03b503139599e189050c1240cadc438b952a`
- `visio/pages/pages.xml` — xml, 2,397 bytes, SHA-256 `68334b832ec29bae9db9330de525574aa8f82bc9c93f42a6a3c36aeec91647a7`
- `visio/solutions/_rels/solutions.xml.rels` — xml, 275 bytes, SHA-256 `bbf193730d9c0e8e1658634189334fac9459d7611791cbc81a40a54fd1b6096f`
- `visio/solutions/solution1.xml` — xml, 996 bytes, SHA-256 `0adb2dbd2f9525f6102c7a6ab7b5481c4bb746ef20abdb88edcee08a3d0b1857`
- `visio/solutions/solutions.xml` — xml, 288 bytes, SHA-256 `6e27f4d34f526b7b793ac3ad99c3db17b22fa57a6b8eda51d39ef2754ad48ea6`
- `visio/windows.xml` — xml, 847 bytes, SHA-256 `8116cef0d7ce1a7cdc4877c5ca0f76bc94f18c537095f6d32445cfb7ca1b31ff`

## Generated artifacts

- `migration/iteration24/tsageri-lentekhi.iteration24.raw.json.gz`
- `migration/iteration24/tsageri-lentekhi.iteration24-summary.json`
- `migration/iteration24/tsageri-lentekhi.iteration24-shapes.json`
- `migration/iteration24/package-inventory.json`
- `migration/iteration24/property-evidence.json`
- `migration/iteration24/company-occurrences.json`
- `migration/iteration24/text-reconciliation.json`
- `migration/iteration24/extraction-diff.json`
- `migration/iteration24/transition-diff.json`
- `migration/iteration24/importer-limitations.json`
- `migration/iteration24/source-hash-history.json`
- `migration/iteration24/certification.json`
- `src/data/iteration24-certification.json`
- `src/data/iteration24-shape-diagnostics.json`

# CERTIFIED FOR NEXT INTERPRETATION ITERATION
