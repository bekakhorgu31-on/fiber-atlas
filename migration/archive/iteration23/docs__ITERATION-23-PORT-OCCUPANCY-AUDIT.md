# Iteration 23 — Port Occupancy Audit

Owner-confirmed source convention: a filled green Port graphic means **occupied / in use**; a filled white Port graphic means **unused**. Unused does not mean available. Other colors and transparent/non-Port representations remain unknown. Fiber physical color is not consulted.

Counts: **14 occupied**, **127 unused**, **243 unknown** across **384 logical Ports**.

Tsageri’s 192 ports are deduplicated from internal and boundary representations and retain both source shape IDs. Those representations do not provide a standalone filled Port graphic, so all 192 statuses remain unknown. Lentekhi’s 48 positions likewise have no standalone filled Port graphic.

| Owner | Port | Raw fill | Effective fill | Pattern | Usage | Availability | Local Fiber | Tube/color | Fiber color | Role | Maximum known journey endpoints | Company | Source shape IDs |
|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| AP41 | 1 | #92d050 | #92d050 | 1 | in_use | unknown | C149/F01 | T1 / blue | blue | ingress | AGG5 ↔ AP41 | — | 12484 |
| AP41 | 2 | #92d050 | #92d050 | 1 | in_use | unknown | C149/F02 | T1 / blue | orange | ingress | AGG5 ↔ AP41 | — | 12485 |
| AP41 | 3 | #92d050 | #92d050 | 1 | in_use | unknown | C149/F03 | T1 / blue | green | ingress | AGG5 ↔ AP41 | — | 12486 |
| AP41 | 4 | #ffffff | #ffffff | 1 | unused | unknown | C149/F04 | T1 / blue | brown | ingress | AGG5 ↔ AP41 | — | 12487 |
| AP41 | 5 | #ffffff | #ffffff | 1 | unused | unknown | C149/F05 | T1 / blue | slate | ingress | AGG5 ↔ AP41 | — | 12488 |
| AP41 | 6 | #ffffff | #ffffff | 1 | unused | unknown | C149/F06 | T1 / blue | white | ingress | AGG5 ↔ AP41 | — | 12489 |
| AP41 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C149/F07 | T1 / blue | red | ingress | AGG5 ↔ AP41 | — | 12490 |
| AP41 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C149/F08 | T1 / blue | black | ingress | AGG5 ↔ AP41 | — | 12491 |
| AP41 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C149/F09 | T1 / blue | yellow | ingress | AGG5 ↔ AP41 | — | 12492 |
| AP41 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C149/F10 | T1 / blue | violet | ingress | AGG5 ↔ AP41 | — | 12493 |
| AP41 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C149/F11 | T1 / blue | rose | ingress | AGG5 ↔ AP41 | — | 12494 |
| AP41 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C149/F12 | T1 / blue | aqua | ingress | AGG5 ↔ AP41 | — | 12495 |
| AP41 | 13 | #ffffff | #ffffff | 1 | unused | unknown | C149/F13 | T2 / orange | blue | ingress | AGG5 ↔ AP41 | — | 12496 |
| AP41 | 14 | #ffffff | #ffffff | 1 | unused | unknown | C149/F14 | T2 / orange | orange | ingress | AGG5 ↔ AP41 | — | 12497 |
| AP41 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C149/F15 | T2 / orange | green | ingress | AGG5 ↔ AP41 | — | 13900 |
| AP41 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C149/F16 | T2 / orange | brown | transit | AGG5 ↔ AP41 | — | 13901 |
| AP41 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C149/F17 | T2 / orange | slate | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13902 |
| AP41 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C149/F18 | T2 / orange | white | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13903 |
| AP41 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C149/F19 | T2 / orange | red | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13904 |
| AP41 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C149/F20 | T2 / orange | black | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13905 |
| AP41 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C149/F21 | T2 / orange | yellow | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13906 |
| AP41 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C149/F22 | T2 / orange | violet | return | AP41 ↔ SC207 external boundary stop/unresolved | — | 13907 |
| AP41 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C149/F23 | T2 / orange | rose | local termination | AP41 ↔ SC205 stop/unresolved | — | 13908 |
| AP41 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C149/F24 | T2 / orange | aqua | local termination | AP41 ↔ SC205 stop/unresolved | — | 13909 |
| AP50 | 1 | #92d050 | #92d050 | 1 | in_use | unknown | C170/F01 | T1 / blue | blue | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33643 |
| AP50 | 2 | #ffffff | #ffffff | 1 | unused | unknown | C170/F02 | T1 / blue | orange | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33644 |
| AP50 | 3 | #92d050 | #92d050 | 1 | in_use | unknown | C170/F03 | T1 / blue | green | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33645 |
| AP50 | 4 | #ffffff | #ffffff | 1 | unused | unknown | C170/F04 | T1 / blue | brown | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33646 |
| AP50 | 5 | #ffffff | #ffffff | 1 | unused | unknown | C170/F05 | T1 / blue | slate | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33647 |
| AP50 | 6 | #ffffff | #ffffff | 1 | unused | unknown | C170/F06 | T1 / blue | white | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33648 |
| AP50 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C170/F07 | T1 / blue | red | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33649 |
| AP50 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C170/F08 | T1 / blue | black | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33650 |
| AP50 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C170/F09 | T1 / blue | yellow | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33651 |
| AP50 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C170/F10 | T1 / blue | violet | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33652 |
| AP50 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C170/F11 | T1 / blue | rose | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33653 |
| AP50 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C170/F12 | T1 / blue | aqua | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33654 |
| AP50 | 13 | #ffffff | #ffffff | 1 | unused | unknown | C170/F13 | T2 / orange | blue | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33655 |
| AP50 | 14 | #ffffff | #ffffff | 1 | unused | unknown | C170/F14 | T2 / orange | orange | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33656 |
| AP50 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C170/F15 | T2 / orange | green | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33657 |
| AP50 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C170/F16 | T2 / orange | brown | ingress; internal pairing unresolved | AGG5 ↔ AP50 | — | 33658 |
| AP50 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C170/F17 | T2 / orange | slate | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33659 |
| AP50 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C170/F18 | T2 / orange | white | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33660 |
| AP50 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C170/F19 | T2 / orange | red | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33661 |
| AP50 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C170/F20 | T2 / orange | black | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33662 |
| AP50 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C170/F21 | T2 / orange | yellow | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33663 |
| AP50 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C170/F22 | T2 / orange | violet | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33664 |
| AP50 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C170/F23 | T2 / orange | rose | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33665 |
| AP50 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C170/F24 | T2 / orange | aqua | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 33666 |
| AP51 | 1 | #ffffff | #ffffff | 1 | unused | unknown | C173/F01 | T1 / blue | blue | ingress; internal pairing unresolved | AGG5 ↔ AP51 | — | 34315 |
| AP51 | 2 | #ffffff | #ffffff | 1 | unused | unknown | C173/F02 | T1 / blue | orange | ingress; internal pairing unresolved | AGG5 ↔ AP51 | — | 34316 |
| AP51 | 3 | #13861c | #13861c | 1 | in_use | unknown | C173/F03 | T1 / blue | green | ingress; internal pairing unresolved | AGG5 ↔ AP51 | — | 34317 |
| AP51 | 4 | #ffffff | #ffffff | 1 | unused | unknown | C173/F04 | T1 / blue | brown | ingress; internal pairing unresolved | AGG5 ↔ AP51 | — | 34318 |
| AP51 | 5 | #ffffff | #ffffff | 1 | unused | unknown | C173/F05 | T1 / blue | slate | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34319 |
| AP51 | 6 | #ffffff | #ffffff | 1 | unused | unknown | C173/F06 | T1 / blue | white | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34320 |
| AP51 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C173/F07 | T1 / blue | red | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34321 |
| AP51 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C173/F08 | T1 / blue | black | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34322 |
| AP51 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C173/F09 | T1 / blue | yellow | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34323 |
| AP51 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C173/F10 | T1 / blue | violet | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34324 |
| AP51 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C173/F11 | T1 / blue | rose | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34325 |
| AP51 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C173/F12 | T1 / blue | aqua | ingress; internal pairing unresolved | AP50 ↔ AP51 | — | 34326 |
| AP51 | 13 | #ffffff | #ffffff | 1 | unused | unknown | C173/F13 | T2 / orange | blue | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34327 |
| AP51 | 14 | #ffffff | #ffffff | 1 | unused | unknown | C173/F14 | T2 / orange | orange | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34328 |
| AP51 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C173/F15 | T2 / orange | green | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34329 |
| AP51 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C173/F16 | T2 / orange | brown | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34330 |
| AP51 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C173/F17 | T2 / orange | slate | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34331 |
| AP51 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C173/F18 | T2 / orange | white | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34332 |
| AP51 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C173/F19 | T2 / orange | red | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34333 |
| AP51 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C173/F20 | T2 / orange | black | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34334 |
| AP51 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C173/F21 | T2 / orange | yellow | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34335 |
| AP51 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C173/F22 | T2 / orange | violet | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34336 |
| AP51 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C173/F23 | T2 / orange | rose | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34337 |
| AP51 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C173/F24 | T2 / orange | aqua | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 34338 |
| AP52 | 1 | #ffffff | #ffffff | 1 | unused | unknown | C175/F01 | T1 / blue | blue | ingress; internal pairing unresolved | AGG5 ↔ AP52 | — | 35093 |
| AP52 | 2 | #ffffff | #ffffff | 1 | unused | unknown | C175/F02 | T1 / blue | orange | ingress; internal pairing unresolved | AGG5 ↔ AP52 | — | 35094 |
| AP52 | 3 | #ffffff | #ffffff | 1 | unused | unknown | C175/F03 | T1 / blue | green | ingress; internal pairing unresolved | AGG5 ↔ AP52 | — | 35095 |
| AP52 | 4 | #ffffff | #ffffff | 1 | unused | unknown | C175/F04 | T1 / blue | brown | ingress; internal pairing unresolved | AGG5 ↔ AP52 | — | 35096 |
| AP52 | 5 | #ffffff | #ffffff | 1 | unused | unknown | C175/F05 | T1 / blue | slate | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35097 |
| AP52 | 6 | #ffffff | #ffffff | 1 | unused | unknown | C175/F06 | T1 / blue | white | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35098 |
| AP52 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C175/F07 | T1 / blue | red | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35099 |
| AP52 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C175/F08 | T1 / blue | black | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35100 |
| AP52 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C175/F09 | T1 / blue | yellow | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35101 |
| AP52 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C175/F10 | T1 / blue | violet | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35102 |
| AP52 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C175/F11 | T1 / blue | rose | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35103 |
| AP52 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C175/F12 | T1 / blue | aqua | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35104 |
| AP52 | 13 | #ffffff | #ffffff | 1 | unused | unknown | C175/F13 | T2 / orange | blue | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35105 |
| AP52 | 14 | #ffffff | #ffffff | 1 | unused | unknown | C175/F14 | T2 / orange | orange | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35106 |
| AP52 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C175/F15 | T2 / orange | green | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35107 |
| AP52 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C175/F16 | T2 / orange | brown | ingress; internal pairing unresolved | AP51 ↔ AP52 | — | 35108 |
| AP52 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C175/F17 | T2 / orange | slate | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35109 |
| AP52 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C175/F18 | T2 / orange | white | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35110 |
| AP52 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C175/F19 | T2 / orange | red | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35111 |
| AP52 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C175/F20 | T2 / orange | black | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35112 |
| AP52 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C175/F21 | T2 / orange | yellow | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35113 |
| AP52 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C175/F22 | T2 / orange | violet | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35114 |
| AP52 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C175/F23 | T2 / orange | rose | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35115 |
| AP52 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C175/F24 | T2 / orange | aqua | ingress; internal pairing unresolved | AP52 ↔ Lentekhi Aggregation | — | 35116 |
| AP53 | 1 | #128729 | #128729 | 1 | in_use | unknown | C182/F01 | T1 / blue | blue | ingress; internal pairing unresolved | AP53 ↔ Lentekhi Aggregation | — | 37811 |
| AP53 | 2 | #128729 | #128729 | 1 | in_use | unknown | C182/F02 | T1 / blue | orange | ingress; internal pairing unresolved | AP53 ↔ Lentekhi Aggregation | — | 37812 |
| AP53 | 3 | #ffffff | #ffffff | 1 | unused | unknown | C182/F03 | T1 / blue | green | ingress; internal pairing unresolved | AP53 ↔ Lentekhi Aggregation | — | 37813 |
| AP53 | 4 | #ffffff | #ffffff | 1 | unused | unknown | C182/F04 | T1 / blue | brown | ingress; internal pairing unresolved | AP53 ↔ Lentekhi Aggregation | — | 37814 |
| AP53 | 5 | #128729 | #128729 | 1 | in_use | unknown | C182/F05 | T1 / blue | slate | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37815 |
| AP53 | 6 | #128729 | #128729 | 1 | in_use | unknown | C182/F06 | T1 / blue | white | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37816 |
| AP53 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C182/F07 | T1 / blue | red | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37817 |
| AP53 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C182/F08 | T1 / blue | black | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37818 |
| AP53 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C182/F09 | T1 / blue | yellow | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37819 |
| AP53 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C182/F10 | T1 / blue | violet | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37820 |
| AP53 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C182/F11 | T1 / blue | rose | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37821 |
| AP53 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C182/F12 | T1 / blue | aqua | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37822 |
| AP53 | 13 | #ffffff | #ffffff | 1 | unused | unknown | C182/F13 | T2 / orange | blue | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37823 |
| AP53 | 14 | #ffffff | #ffffff | 1 | unused | unknown | C182/F14 | T2 / orange | orange | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37824 |
| AP53 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C182/F15 | T2 / orange | green | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37825 |
| AP53 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C182/F16 | T2 / orange | brown | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 37826 |
| AP53 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C182/F17 | T2 / orange | slate | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37827 |
| AP53 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C182/F18 | T2 / orange | white | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37828 |
| AP53 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C182/F19 | T2 / orange | red | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37829 |
| AP53 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C182/F20 | T2 / orange | black | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37830 |
| AP53 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C182/F21 | T2 / orange | yellow | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37831 |
| AP53 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C182/F22 | T2 / orange | violet | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37832 |
| AP53 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C182/F23 | T2 / orange | rose | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37833 |
| AP53 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C182/F24 | T2 / orange | aqua | ingress; internal pairing unresolved | AP53 ↔ SC225 stop/unresolved | — | 37834 |
| AP54 | 1 | #00b050 | #00b050 | 1 | in_use | unknown | C183/F01 | T1 / blue | blue | ingress; internal pairing unresolved | AP54 ↔ Lentekhi Aggregation | — | 38362 |
| AP54 | 2 | #00b050 | #00b050 | 1 | in_use | unknown | C183/F02 | T1 / blue | orange | ingress; internal pairing unresolved | AP54 ↔ Lentekhi Aggregation | — | 38363 |
| AP54 | 3 | #ff0000 | #ff0000 | 1 | unknown | unknown | C183/F03 | T1 / blue | green | ingress; internal pairing unresolved | AP54 ↔ Lentekhi Aggregation | — | 38364 |
| AP54 | 4 | #ff0000 | #ff0000 | 1 | unknown | unknown | C183/F04 | T1 / blue | brown | ingress; internal pairing unresolved | AP54 ↔ Lentekhi Aggregation | — | 38365 |
| AP54 | 5 | #ff0000 | #ff0000 | 0 | unknown | unknown | C183/F05 | T1 / blue | slate | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38366 |
| AP54 | 6 | #ffffff | #ffffff | 1 | unused | unknown | C183/F06 | T1 / blue | white | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38367 |
| AP54 | 7 | #ffffff | #ffffff | 1 | unused | unknown | C183/F07 | T1 / blue | red | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38368 |
| AP54 | 8 | #ffffff | #ffffff | 1 | unused | unknown | C183/F08 | T1 / blue | black | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38369 |
| AP54 | 9 | #ffffff | #ffffff | 1 | unused | unknown | C183/F09 | T1 / blue | yellow | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38370 |
| AP54 | 10 | #ffffff | #ffffff | 1 | unused | unknown | C183/F10 | T1 / blue | violet | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38371 |
| AP54 | 11 | #ffffff | #ffffff | 1 | unused | unknown | C183/F11 | T1 / blue | rose | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38372 |
| AP54 | 12 | #ffffff | #ffffff | 1 | unused | unknown | C183/F12 | T1 / blue | aqua | ingress; internal pairing unresolved | AP54 ↔ SC225 stop/unresolved | — | 38373 |
| AP54 | 13 | #128729 | #128729 | 1 | in_use | unknown | C183/F13 | T2 / orange | blue | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38374 |
| AP54 | 14 | #128729 | #128729 | 1 | in_use | unknown | C183/F14 | T2 / orange | orange | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38375 |
| AP54 | 15 | #ffffff | #ffffff | 1 | unused | unknown | C183/F15 | T2 / orange | green | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38376 |
| AP54 | 16 | #ffffff | #ffffff | 1 | unused | unknown | C183/F16 | T2 / orange | brown | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38377 |
| AP54 | 17 | #ffffff | #ffffff | 1 | unused | unknown | C183/F17 | T2 / orange | slate | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38378 |
| AP54 | 18 | #ffffff | #ffffff | 1 | unused | unknown | C183/F18 | T2 / orange | white | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38379 |
| AP54 | 19 | #ffffff | #ffffff | 1 | unused | unknown | C183/F19 | T2 / orange | red | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38380 |
| AP54 | 20 | #ffffff | #ffffff | 1 | unused | unknown | C183/F20 | T2 / orange | black | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38381 |
| AP54 | 21 | #ffffff | #ffffff | 1 | unused | unknown | C183/F21 | T2 / orange | yellow | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38382 |
| AP54 | 22 | #ffffff | #ffffff | 1 | unused | unknown | C183/F22 | T2 / orange | violet | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38383 |
| AP54 | 23 | #ffffff | #ffffff | 1 | unused | unknown | C183/F23 | T2 / orange | rose | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38384 |
| AP54 | 24 | #ffffff | #ffffff | 1 | unused | unknown | C183/F24 | T2 / orange | aqua | ingress; internal pairing unresolved | AP53 ↔ AP54 | — | 38385 |
| ODF-LENTEKHI-01 | 1 | — | — | 0 | unknown | unknown | C184/F01 | T1 / blue | blue | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37438 |
| ODF-LENTEKHI-01 | 2 | — | — | 0 | unknown | unknown | C184/F02 | T1 / blue | orange | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37439 |
| ODF-LENTEKHI-01 | 3 | — | — | 0 | unknown | unknown | C184/F03 | T1 / blue | green | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37440 |
| ODF-LENTEKHI-01 | 4 | — | — | 0 | unknown | unknown | C184/F04 | T1 / blue | brown | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37441 |
| ODF-LENTEKHI-01 | 5 | — | — | 0 | unknown | unknown | C184/F05 | T1 / blue | slate | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36549 |
| ODF-LENTEKHI-01 | 6 | — | — | 0 | unknown | unknown | C184/F06 | T1 / blue | white | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36550 |
| ODF-LENTEKHI-01 | 7 | — | — | 0 | unknown | unknown | C184/F07 | T1 / blue | red | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36551 |
| ODF-LENTEKHI-01 | 8 | — | — | 0 | unknown | unknown | C184/F08 | T1 / blue | black | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36552 |
| ODF-LENTEKHI-01 | 9 | — | — | 0 | unknown | unknown | C184/F09 | T1 / blue | yellow | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36553 |
| ODF-LENTEKHI-01 | 10 | — | — | 0 | unknown | unknown | C184/F10 | T1 / blue | violet | aggregation termination | Lentekhi Aggregation ↔ SC217 stop/unresolved | — | 36554 |
| ODF-LENTEKHI-01 | 11 | — | — | 0 | unknown | unknown | C184/F11 | T1 / blue | rose | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36555 |
| ODF-LENTEKHI-01 | 12 | — | — | 0 | unknown | unknown | C184/F12 | T1 / blue | aqua | aggregation termination | Lentekhi Aggregation ↔ SC217 stop/unresolved | — | 36556 |
| ODF-LENTEKHI-01 | 13 | — | — | 0 | unknown | unknown | C184/F13 | T2 / orange | blue | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36567 |
| ODF-LENTEKHI-01 | 14 | — | — | 0 | unknown | unknown | C184/F14 | T2 / orange | orange | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36568 |
| ODF-LENTEKHI-01 | 15 | — | — | 0 | unknown | unknown | C184/F15 | T2 / orange | green | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36569 |
| ODF-LENTEKHI-01 | 16 | — | — | 0 | unknown | unknown | C184/F16 | T2 / orange | brown | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36570 |
| ODF-LENTEKHI-01 | 17 | — | — | 0 | unknown | unknown | C184/F17 | T2 / orange | slate | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36571 |
| ODF-LENTEKHI-01 | 18 | — | — | 0 | unknown | unknown | C184/F18 | T2 / orange | white | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36572 |
| ODF-LENTEKHI-01 | 19 | — | — | 0 | unknown | unknown | C184/F19 | T2 / orange | red | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36573 |
| ODF-LENTEKHI-01 | 20 | — | — | 0 | unknown | unknown | C184/F20 | T2 / orange | black | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36574 |
| ODF-LENTEKHI-01 | 21 | — | — | 0 | unknown | unknown | C184/F21 | T2 / orange | yellow | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36575 |
| ODF-LENTEKHI-01 | 22 | — | — | 0 | unknown | unknown | C184/F22 | T2 / orange | violet | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 36576 |
| ODF-LENTEKHI-01 | 23 | — | — | 0 | unknown | unknown | C184/F23 | T2 / orange | rose | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37392 |
| ODF-LENTEKHI-01 | 24 | — | — | 0 | unknown | unknown | C184/F24 | T2 / orange | aqua | aggregation termination | AGG5 ↔ Lentekhi Aggregation | — | 37393 |
| ODF-LENTEKHI-01 | 25 | — | — | 0 | unknown | unknown | C184/F25 | T3 / green | blue | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37404 |
| ODF-LENTEKHI-01 | 26 | — | — | 0 | unknown | unknown | C184/F26 | T3 / green | orange | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37405 |
| ODF-LENTEKHI-01 | 27 | — | — | 0 | unknown | unknown | C184/F27 | T3 / green | green | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37406 |
| ODF-LENTEKHI-01 | 28 | — | — | 0 | unknown | unknown | C184/F28 | T3 / green | brown | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37407 |
| ODF-LENTEKHI-01 | 29 | — | — | 0 | unknown | unknown | C184/F29 | T3 / green | slate | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37408 |
| ODF-LENTEKHI-01 | 30 | — | — | 0 | unknown | unknown | C184/F30 | T3 / green | white | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37409 |
| ODF-LENTEKHI-01 | 31 | — | — | 0 | unknown | unknown | C184/F31 | T3 / green | red | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37410 |
| ODF-LENTEKHI-01 | 32 | — | — | 0 | unknown | unknown | C184/F32 | T3 / green | black | aggregation termination | AP52 ↔ Lentekhi Aggregation | — | 37411 |
| ODF-LENTEKHI-01 | 33 | — | — | 0 | unknown | unknown | C184/F33 | T3 / green | yellow | aggregation termination | AP54 ↔ Lentekhi Aggregation | — | 37412 |
| ODF-LENTEKHI-01 | 34 | — | — | 0 | unknown | unknown | C184/F34 | T3 / green | violet | aggregation termination | AP54 ↔ Lentekhi Aggregation | — | 37413 |
| ODF-LENTEKHI-01 | 35 | — | — | 0 | unknown | unknown | C184/F35 | T3 / green | rose | aggregation termination | AP54 ↔ Lentekhi Aggregation | — | 37414 |
| ODF-LENTEKHI-01 | 36 | — | — | 0 | unknown | unknown | C184/F36 | T3 / green | aqua | aggregation termination | AP54 ↔ Lentekhi Aggregation | — | 37415 |
| ODF-LENTEKHI-01 | 37 | — | — | 0 | unknown | unknown | C184/F37 | T4 / brown | blue | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37426 |
| ODF-LENTEKHI-01 | 38 | — | — | 0 | unknown | unknown | C184/F38 | T4 / brown | orange | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37427 |
| ODF-LENTEKHI-01 | 39 | — | — | 0 | unknown | unknown | C184/F39 | T4 / brown | green | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37428 |
| ODF-LENTEKHI-01 | 40 | — | — | 0 | unknown | unknown | C184/F40 | T4 / brown | brown | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37429 |
| ODF-LENTEKHI-01 | 41 | — | — | 0 | unknown | unknown | C184/F41 | T4 / brown | slate | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37430 |
| ODF-LENTEKHI-01 | 42 | — | — | 0 | unknown | unknown | C184/F42 | T4 / brown | white | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37431 |
| ODF-LENTEKHI-01 | 43 | — | — | 0 | unknown | unknown | C184/F43 | T4 / brown | red | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37432 |
| ODF-LENTEKHI-01 | 44 | — | — | 0 | unknown | unknown | C184/F44 | T4 / brown | black | aggregation termination | Lentekhi Aggregation ↔ SC225 stop/unresolved | — | 37433 |
| ODF-LENTEKHI-01 | 45 | — | — | 0 | unknown | unknown | C184/F45 | T4 / brown | yellow | aggregation termination | AP53 ↔ Lentekhi Aggregation | — | 37434 |
| ODF-LENTEKHI-01 | 46 | — | — | 0 | unknown | unknown | C184/F46 | T4 / brown | violet | aggregation termination | AP53 ↔ Lentekhi Aggregation | — | 37435 |
| ODF-LENTEKHI-01 | 47 | — | — | 0 | unknown | unknown | C184/F47 | T4 / brown | rose | aggregation termination | AP53 ↔ Lentekhi Aggregation | — | 37436 |
| ODF-LENTEKHI-01 | 48 | — | — | 0 | unknown | unknown | C184/F48 | T4 / brown | aqua | aggregation termination | AP53 ↔ Lentekhi Aggregation | — | 37437 |
| ODF-TSAGERI-01 | 1 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43610, 44013 |
| ODF-TSAGERI-01 | 2 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43611, 44014 |
| ODF-TSAGERI-01 | 3 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43612, 44015 |
| ODF-TSAGERI-01 | 4 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43613, 44016 |
| ODF-TSAGERI-01 | 5 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43614, 44017 |
| ODF-TSAGERI-01 | 6 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43615, 44018 |
| ODF-TSAGERI-01 | 7 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43616, 44019 |
| ODF-TSAGERI-01 | 8 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43617, 44020 |
| ODF-TSAGERI-01 | 9 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43633, 44036 |
| ODF-TSAGERI-01 | 10 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43680, 44083 |
| ODF-TSAGERI-01 | 11 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43705, 44108 |
| ODF-TSAGERI-01 | 12 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43729, 44132 |
| ODF-TSAGERI-01 | 13 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43734, 44137 |
| ODF-TSAGERI-01 | 14 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43757, 44160 |
| ODF-TSAGERI-01 | 15 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43778, 44181 |
| ODF-TSAGERI-01 | 16 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43779, 44182 |
| ODF-TSAGERI-01 | 17 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43470, 43873 |
| ODF-TSAGERI-01 | 18 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43471, 43874 |
| ODF-TSAGERI-01 | 19 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43472, 43875 |
| ODF-TSAGERI-01 | 20 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43473, 43876 |
| ODF-TSAGERI-01 | 21 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43474, 43877 |
| ODF-TSAGERI-01 | 22 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43475, 43878 |
| ODF-TSAGERI-01 | 23 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43476, 43879 |
| ODF-TSAGERI-01 | 24 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43477, 43880 |
| ODF-TSAGERI-01 | 25 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43488, 43891 |
| ODF-TSAGERI-01 | 26 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43489, 43892 |
| ODF-TSAGERI-01 | 27 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43490, 43893 |
| ODF-TSAGERI-01 | 28 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43491, 43894 |
| ODF-TSAGERI-01 | 29 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43492, 43895 |
| ODF-TSAGERI-01 | 30 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43493, 43896 |
| ODF-TSAGERI-01 | 31 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43494, 43897 |
| ODF-TSAGERI-01 | 32 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43495, 43898 |
| ODF-TSAGERI-01 | 33 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43496, 43899 |
| ODF-TSAGERI-01 | 34 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43497, 43900 |
| ODF-TSAGERI-01 | 35 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43498, 43901 |
| ODF-TSAGERI-01 | 36 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43499, 43902 |
| ODF-TSAGERI-01 | 37 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43510, 43913 |
| ODF-TSAGERI-01 | 38 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43511, 43914 |
| ODF-TSAGERI-01 | 39 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43512, 43915 |
| ODF-TSAGERI-01 | 40 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43513, 43916 |
| ODF-TSAGERI-01 | 41 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43514, 43917 |
| ODF-TSAGERI-01 | 42 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43515, 43918 |
| ODF-TSAGERI-01 | 43 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43516, 43919 |
| ODF-TSAGERI-01 | 44 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43517, 43920 |
| ODF-TSAGERI-01 | 45 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43518, 43921 |
| ODF-TSAGERI-01 | 46 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43519, 43922 |
| ODF-TSAGERI-01 | 47 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43520, 43923 |
| ODF-TSAGERI-01 | 48 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43521, 43924 |
| ODF-TSAGERI-01 | 49 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43532, 43935 |
| ODF-TSAGERI-01 | 50 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43533, 43936 |
| ODF-TSAGERI-01 | 51 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43534, 43937 |
| ODF-TSAGERI-01 | 52 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43535, 43938 |
| ODF-TSAGERI-01 | 53 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43536, 43939 |
| ODF-TSAGERI-01 | 54 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43537, 43940 |
| ODF-TSAGERI-01 | 55 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43538, 43941 |
| ODF-TSAGERI-01 | 56 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43539, 43942 |
| ODF-TSAGERI-01 | 57 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43540, 43943 |
| ODF-TSAGERI-01 | 58 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43541, 43944 |
| ODF-TSAGERI-01 | 59 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43542, 43945 |
| ODF-TSAGERI-01 | 60 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43543, 43946 |
| ODF-TSAGERI-01 | 61 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43554, 43957 |
| ODF-TSAGERI-01 | 62 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43555, 43958 |
| ODF-TSAGERI-01 | 63 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43556, 43959 |
| ODF-TSAGERI-01 | 64 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43557, 43960 |
| ODF-TSAGERI-01 | 65 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43558, 43961 |
| ODF-TSAGERI-01 | 66 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43559, 43962 |
| ODF-TSAGERI-01 | 67 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43560, 43963 |
| ODF-TSAGERI-01 | 68 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43561, 43964 |
| ODF-TSAGERI-01 | 69 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43562, 43965 |
| ODF-TSAGERI-01 | 70 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43563, 43966 |
| ODF-TSAGERI-01 | 71 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43564, 43967 |
| ODF-TSAGERI-01 | 72 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43565, 43968 |
| ODF-TSAGERI-01 | 73 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43576, 43979 |
| ODF-TSAGERI-01 | 74 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43577, 43980 |
| ODF-TSAGERI-01 | 75 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43578, 43981 |
| ODF-TSAGERI-01 | 76 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43579, 43982 |
| ODF-TSAGERI-01 | 77 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43580, 43983 |
| ODF-TSAGERI-01 | 78 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43581, 43984 |
| ODF-TSAGERI-01 | 79 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43582, 43985 |
| ODF-TSAGERI-01 | 80 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43583, 43986 |
| ODF-TSAGERI-01 | 81 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43584, 43987 |
| ODF-TSAGERI-01 | 82 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43585, 43988 |
| ODF-TSAGERI-01 | 83 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43586, 43989 |
| ODF-TSAGERI-01 | 84 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43587, 43990 |
| ODF-TSAGERI-01 | 85 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43598, 44001 |
| ODF-TSAGERI-01 | 86 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43599, 44002 |
| ODF-TSAGERI-01 | 87 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43600, 44003 |
| ODF-TSAGERI-01 | 88 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43601, 44004 |
| ODF-TSAGERI-01 | 89 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43602, 44005 |
| ODF-TSAGERI-01 | 90 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43603, 44006 |
| ODF-TSAGERI-01 | 91 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43604, 44007 |
| ODF-TSAGERI-01 | 92 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43605, 44008 |
| ODF-TSAGERI-01 | 93 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43606, 44009 |
| ODF-TSAGERI-01 | 94 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43607, 44010 |
| ODF-TSAGERI-01 | 95 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43608, 44011 |
| ODF-TSAGERI-01 | 96 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43609, 44012 |
| ODF-TSAGERI-01 | 97 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43628, 44031 |
| ODF-TSAGERI-01 | 98 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43629, 44032 |
| ODF-TSAGERI-01 | 99 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43630, 44033 |
| ODF-TSAGERI-01 | 100 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43631, 44034 |
| ODF-TSAGERI-01 | 101 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43632, 44035 |
| ODF-TSAGERI-01 | 102 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43634, 44037 |
| ODF-TSAGERI-01 | 103 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43635, 44038 |
| ODF-TSAGERI-01 | 104 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43636, 44039 |
| ODF-TSAGERI-01 | 105 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43637, 44040 |
| ODF-TSAGERI-01 | 106 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43638, 44041 |
| ODF-TSAGERI-01 | 107 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43639, 44042 |
| ODF-TSAGERI-01 | 108 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43640, 44043 |
| ODF-TSAGERI-01 | 109 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43651, 44054 |
| ODF-TSAGERI-01 | 110 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43652, 44055 |
| ODF-TSAGERI-01 | 111 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43653, 44056 |
| ODF-TSAGERI-01 | 112 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43654, 44057 |
| ODF-TSAGERI-01 | 113 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43655, 44058 |
| ODF-TSAGERI-01 | 114 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43656, 44059 |
| ODF-TSAGERI-01 | 115 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43657, 44060 |
| ODF-TSAGERI-01 | 116 | — | — | 0 | unknown | unknown | — | — | — | Ambrolauri direction | owner range only; exact Fiber binding unresolved | — | 43658, 44061 |
| ODF-TSAGERI-01 | 117 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43659, 44062 |
| ODF-TSAGERI-01 | 118 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43730, 44133 |
| ODF-TSAGERI-01 | 119 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43660, 44063 |
| ODF-TSAGERI-01 | 120 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43661, 44064 |
| ODF-TSAGERI-01 | 121 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43691, 44094 |
| ODF-TSAGERI-01 | 122 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43692, 44095 |
| ODF-TSAGERI-01 | 123 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43731, 44134 |
| ODF-TSAGERI-01 | 124 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43693, 44096 |
| ODF-TSAGERI-01 | 125 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43694, 44097 |
| ODF-TSAGERI-01 | 126 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43695, 44098 |
| ODF-TSAGERI-01 | 127 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43696, 44099 |
| ODF-TSAGERI-01 | 128 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43697, 44100 |
| ODF-TSAGERI-01 | 129 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43698, 44101 |
| ODF-TSAGERI-01 | 130 | — | — | 0 | unknown | unknown | — | — | — | intentional SC205 stop | owner range only; exact Fiber binding unresolved | — | 43699, 44102 |
| ODF-TSAGERI-01 | 131 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43700, 44103 |
| ODF-TSAGERI-01 | 132 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43701, 44104 |
| ODF-TSAGERI-01 | 133 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43702, 44105 |
| ODF-TSAGERI-01 | 134 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43716, 44119 |
| ODF-TSAGERI-01 | 135 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43717, 44120 |
| ODF-TSAGERI-01 | 136 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43718, 44121 |
| ODF-TSAGERI-01 | 137 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43719, 44122 |
| ODF-TSAGERI-01 | 138 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43720, 44123 |
| ODF-TSAGERI-01 | 139 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43721, 44124 |
| ODF-TSAGERI-01 | 140 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43722, 44125 |
| ODF-TSAGERI-01 | 141 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43723, 44126 |
| ODF-TSAGERI-01 | 142 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43724, 44127 |
| ODF-TSAGERI-01 | 143 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43725, 44128 |
| ODF-TSAGERI-01 | 144 | — | — | 0 | unknown | unknown | — | — | — | AP41 direction | owner range only; exact Fiber binding unresolved | — | 43726, 44129 |
| ODF-TSAGERI-01 | 145 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43732, 44135 |
| ODF-TSAGERI-01 | 146 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43733, 44136 |
| ODF-TSAGERI-01 | 147 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43735, 44138 |
| ODF-TSAGERI-01 | 148 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43736, 44139 |
| ODF-TSAGERI-01 | 149 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43737, 44140 |
| ODF-TSAGERI-01 | 150 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43738, 44141 |
| ODF-TSAGERI-01 | 151 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43739, 44142 |
| ODF-TSAGERI-01 | 152 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43740, 44143 |
| ODF-TSAGERI-01 | 153 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43741, 44144 |
| ODF-TSAGERI-01 | 154 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43742, 44145 |
| ODF-TSAGERI-01 | 155 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43743, 44146 |
| ODF-TSAGERI-01 | 156 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43744, 44147 |
| ODF-TSAGERI-01 | 157 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43756, 44159 |
| ODF-TSAGERI-01 | 158 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43745, 44148 |
| ODF-TSAGERI-01 | 159 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43746, 44149 |
| ODF-TSAGERI-01 | 160 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43747, 44150 |
| ODF-TSAGERI-01 | 161 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43748, 44151 |
| ODF-TSAGERI-01 | 162 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43749, 44152 |
| ODF-TSAGERI-01 | 163 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43750, 44153 |
| ODF-TSAGERI-01 | 164 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43751, 44154 |
| ODF-TSAGERI-01 | 165 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43752, 44155 |
| ODF-TSAGERI-01 | 166 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43753, 44156 |
| ODF-TSAGERI-01 | 167 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43754, 44157 |
| ODF-TSAGERI-01 | 168 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43755, 44158 |
| ODF-TSAGERI-01 | 169 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43784, 44187 |
| ODF-TSAGERI-01 | 170 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43785, 44188 |
| ODF-TSAGERI-01 | 171 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43807, 44210 |
| ODF-TSAGERI-01 | 172 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43786, 44189 |
| ODF-TSAGERI-01 | 173 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43787, 44190 |
| ODF-TSAGERI-01 | 174 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43788, 44191 |
| ODF-TSAGERI-01 | 175 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43789, 44192 |
| ODF-TSAGERI-01 | 176 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43790, 44193 |
| ODF-TSAGERI-01 | 177 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43791, 44194 |
| ODF-TSAGERI-01 | 178 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43792, 44195 |
| ODF-TSAGERI-01 | 179 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43793, 44196 |
| ODF-TSAGERI-01 | 180 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43794, 44197 |
| ODF-TSAGERI-01 | 181 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43795, 44198 |
| ODF-TSAGERI-01 | 182 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43796, 44199 |
| ODF-TSAGERI-01 | 183 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43797, 44200 |
| ODF-TSAGERI-01 | 184 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43798, 44201 |
| ODF-TSAGERI-01 | 185 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43799, 44202 |
| ODF-TSAGERI-01 | 186 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43800, 44203 |
| ODF-TSAGERI-01 | 187 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43801, 44204 |
| ODF-TSAGERI-01 | 188 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43802, 44205 |
| ODF-TSAGERI-01 | 189 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43803, 44206 |
| ODF-TSAGERI-01 | 190 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43804, 44207 |
| ODF-TSAGERI-01 | 191 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43805, 44208 |
| ODF-TSAGERI-01 | 192 | — | — | 0 | unknown | unknown | — | — | — | Lentekhi direction | owner range only; exact Fiber binding unresolved | — | 43806, 44209 |

Company labels remain annotation/use context only. They do not establish Cable, Fiber, ODF, provider, customer or rights ownership. AP-internal pairing is not inferred from occupancy.
