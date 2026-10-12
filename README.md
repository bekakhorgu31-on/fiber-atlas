# Fiber Atlas — ცაგერი–ლენტეხის პილოტი

For immediate review, open the sibling `fiber-prototype.html` in a modern browser. It embeds its data, scripts and styles. The ZIP contains that HTML plus the editable `fiber-prototype/` source folder.

Iteration05 adds a controlled Visio evidence pipeline and corrects the legacy asset class to **Cable Segment / კაბელის მონაკვეთი**. It keeps canonical IDs and legacy routes, separates raw extraction from source-specific interpretation, and adds an engineer review workspace with explicit accept/correct/reject/unresolved outcomes. Start with [HANDOFF.md](HANDOFF.md) and [docs/VISIO-IMPORT.md](docs/VISIO-IMPORT.md).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173/ . Node22.12+ recommended; tested Node26.1.0/npm11.13.0. Stop with Ctrl+C.

```sh
npm test
npm run build
npm run preview
npm run export
```

`preview` serves the compiled build locally at http://127.0.0.1:4173/ . `export` rebuilds the sibling standalone HTML. This is a local read-only prototype.

Open **Visio იმპორტი** to inspect the actual source run, then search `C172/F29` in its candidate list. In the network, try `SC217 SC218` or `172-217-218-48`, expand provisional group3, openF29, then Trace. Compare strict and candidate modes. Use SC218 for the focused reversible ledger and SC216 for the three-segment stress case. Search `ODF50` to inspect the AP/panel ambiguity.

Six separate cable segments,240 fibers,20 provisional groups and54 unapproved network candidates are included. The import review contains101 candidates from the actual source file:20 segments,12 closures,6 AP records,2 aggregations,52 geometry connections and9 annotations. Manufacturer, actual tube numbering, tube/fiber physical colors and commercial assignments are unknown. Unknown never counts as available. No production database, persisted review, approved optical path or live service is supplied. The original Visio is unchanged.
