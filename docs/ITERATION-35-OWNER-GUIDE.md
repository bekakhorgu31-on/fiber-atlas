# Iteration 35 — places and Fiber journeys

2026-10-11. Both deliveries are implemented locally: place/journey/evidence and typed Port-binding corrections. An observation still leaves the graph unchanged; a typed correction changes it only after validation and a separate owner Apply action.

Refresh the running Fiber Atlas app after the update. **ქსელი** now opens the place finder. Enter an AP/SC number, place name or Cable label; choose the source when numbers repeat. Select a place to see its nearby physical connections. A Cable opens its Fibers; a Port with a known binding opens its optical journey. **ყველა ადგილი** returns to the finder. The full inventory and **ქსელის სრული მიმოხილვა** remain available.

The journey shows its answer first. An unknown continuation is a knowledge gap, not a confirmed cut or termination. Expand an intermediate-stop count to see the full known chain. The optional step-by-step control follows known connections once; it does not show live signal movement. Inspecting a stop keeps the same journey; **ამ ადგილის გახსნა** changes the place being explored. Physical connection diagrams and selected optical paths are labelled separately.

Acceptance walkthrough:

1. Find **AP16 · Tsveri** in Shida and identify its neighboring Cable to SC25017.
2. Select **Port13**. Identify AP17/Port13 and SC25017 without opening the source. Repeat with Port14 or Port24; they must use their own Fibers.
3. Select **Port1**. The known path reaches SC25017; the next optical connection is unknown. It must not borrow Port13's destination.
4. Find **AP18**, choose **Port1**, then open its source issue. The Port is known; the exact Fiber binding is not. The crop highlights Port12158, stroke12110 and the other end. Review orange is a viewer annotation, not a documented Fiber color.
5. Use zoom/pan or **მთელი ჩატვირთული ადგილი** to inspect nearby numbers. An older snapshot may explicitly lack rejection metadata; it must not silently use a newer run's diagnosis.
6. Sign in as a reviewer and choose **დაკვირვების ჩაწერა**. Describe what you can establish from the source and save. Reload to see the actor/history. This leaves the topology unchanged.
7. Use **ობიექტის რუკაზე ნახვა** to reopen the same canonical Port. Browser Back returns to the issue. Refresh and Back/Forward should retain source/place/selection.
8. On the preserved reference, open **SC219 ↔ SC220 · 48F / F32**. Its local color is black; the journey reaches AP52 and Lentekhi through SC219/C175, with no SC218/AP51 optical step. Opening the AP52 endpoint preserves that journey.

Number matching alone does not establish a connection. The later owner confirmation below specifically establishes AP18’s bank rule. Dismissing an issue or saving free-text old/new values does not repair connectivity. The exact connection builder, validated impact preview and separate owner Apply action are now available for an active Port-binding case. Source numbering, colors and duplicate-identity proposals remain unapplied. Confirmed full-bank binding Remap is supported below.

Worker automation passed desktop/mobile checks. Please record which of these tasks a first-time user can complete without help; comprehension acceptance is still pending.

## Correct an exact Port connection

1. Open the active Port-binding issue and sign in as a reviewer. Under **ზუსტი კავშირის შესწორება**, check the selected Port and source. Choose its incident Cable and exact Fiber; neither target is selected automatically.
2. Select the evidence basis, identify Shape IDs from that exact source/page and explain the connection. Save the draft. This changes no network facts.
3. Choose **ვალიდაცია და გავლენის შედარება**. Compare before/after paths in both directions and **სხვა გავლენები**; use the pages to inspect all affected records. Validation can refuse inconsistent, occupied, non-incident or stale choices.
4. After inspecting the comparison, check the acknowledgment and press **შესწორების ქსელში გამოყენება**. This separate action activates a new revision. Reload the case to see its accepted connection and retained history; use **ობიექტის რუკაზე ნახვა** to open the same Port journey. Unknown onward connections remain unknown.
5. To reverse it, open the applied-correction history and choose **წინა მიბმის აღდგენის მონახაზი**. Give a reason, validate the reversal and explicitly Apply. History is preserved; it is not deleted.

The owner has now confirmed AP18’s shifted bank: F1→Port1 through F24→Port24. This is ready for a reviewed Remap; it is not active until the owner Applies. If the drawing does not establish the other endpoint and no owner-confirmed mapping is available, leave an observation and keep the issue open. Source numbering/color/duplicate edits remain proposal-only.

## When you reprocess a source

Reprocessing compares fresh interpretation with earlier human corrections. If they disagree, Add is blocked. Open **შესწორებების გავლენის შედარება** and inspect every changed path/fact. You may leave the candidate staged while investigating, or explicitly accept the new source result with a reason and retain the old decision as history. That acceptance does not update the active graph; **ქსელში დამატება** is still a separate action. A stale comparison must be refreshed. Corrections are never automatically replayed onto changed evidence.

The worker tested Port7→F13 in a known isolated fixture, including desktop/mobile activation and reversal. This is test evidence, not an instruction to apply a number formula to your real network.

## Remap a shifted AP bank

1. Sign in as a reviewer, find **AP18 · Kvemo Shakshaketi** and open **Remap · AP პორტები ↔ კაბელის ჟილები** under the AP’s Ports. It is also available as **Remap · მთელი AP ბანკი** in a Port-binding review.
2. Choose **SC25020 ↔ AP18 · 24F** (alias `25-128-25020-18-24`). Check the table: Port1 changes from unknown to F1, Port2 from F1 to F2, through Port24 from F23 to F24.
3. Confirm that this selected bank follows the 1→1 rule, select owner confirmation and record the reason/evidence. **Remap მონახაზის შენახვა** saves a draft only.
4. Validate, inspect the mapping table and expandable complete path/fact impacts, then acknowledge and separately **Apply**. All 24 connections move together; the existing Port2/F1 binding does not block the correction. Reload and select Port1 or Port24 to inspect its own journey.
5. Applied history offers a draft to restore the whole previous bank. Validate and Apply that reversal; later edits to any member invalidate a stale group reversal.

Use this button for another AP only after confirming that particular bank’s rule. It refuses incomplete/duplicate numbering, unequal Cable capacity, mixed-Cable banks and source/transition conflicts. It preserves source labels, colors, geometry and occupancy. A known intentional connection such as Port7→F13 must remain intentional. A shift signal is a prompt to inspect evidence, not automatic authorization to remap every AP. The worker has not Applied AP18 on your server.

## After Apply: finding the corrected issue

The owner’s AP18 Remap is now active: all 24 Port numbers match their Cable Fiber numbers. Refresh the app; there is no need to repeat Remap. **Needs Review** defaults to **Open**. The corrected Port1 issue is closed, so it leaves that pending list. Select **Reviewed** or **All** to inspect its retained history: the row says the connection was corrected, and details show **Port1 ↔ F1** with the original source behind a disclosure. A validated draft without Apply still leaves the connection unchanged; an explicit reversal can reopen the original unresolved issue.
