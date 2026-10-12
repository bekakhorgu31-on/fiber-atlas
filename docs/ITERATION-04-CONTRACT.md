# Iteration04 implementation contract

Types are authoritative in src/domain/types.ts. Architecture owner is root; no inference of missing network facts. Existing user brief at /Users/khkh/.codex/attachments/47d0c0e1-5048-4dbe-b8b8-8d089b2c2066/Pasted text.txt.

New Cable.id stored CAB-000172 etc. All relationships store canonical IDs. findCable(data, token) accepts canonical id, legacyCableId or legacyLabels; helpers normalize to canonical IDs. Old URLs numeric accepted; root ownsApp/dashboard/router. Display collisions allowed. Nevercomputeidentityfromdisplay.

Root implements helpers in network.ts (existingnames remain):
- cableDisplayName(cable): 'SC217 ↔ SC218 · 48F'
- cableLegacyLabel(cable): 'ძველი ID: 172 · 172-217-218-48'
- typedAssetLabel(ref): SC218/AP51/ODF50/AGG5/SITE...; assetLabel retainsGeorgian
- orderedRouteNodes(cable): sequence-sorted copy
- routeSpans(cable): {from:RouteNode,to:RouteNode}[] adjacentdescribedintervals
- routeSummary(cable): {knownNodes:number, intermediateCount:number|null, describedSpans:number, complete:boolean}; endpoints_only intermediateCount=null! Do notshowzeroasabsence.
- assetExists(data,ref):boolean; assetRoute(ref):Route|null. Currentinventory AP/closure/aggregationonly; futureODF/SITE nonclickableunlessrecordpresent.
- fiberTube(data,fiber):Tube|undefined
- tubeLabel(tube): 'ტუბი 3' when documented, 'სავარაუდო ჯგუფი 3' when provisional, 'ტუბი უცნობია' absent
- colorLabel(color):string, unknown 'უცნობია'; proposed suffix 'სავარაუდო — დაუდასტურებელი'
- endLabel(end,data?): endpoint-based cable name +Fxx when data present. endLegacyLabel(end,data): C172/F29 or AP51port1.
- manufacturerLabel(cable): string manufacturer??'უცნობია'
- searchInventory supportsnew/legacyaliases,endpointmulti-tokenname,manufacturer+explicitcommercialrelationships; actualfixturemanufacturersunknown.
- traceResult existingfields; stop.side 'a'|'b' (display A/B), no trafficdirectionclaim. Solidaccepted/dashedcandidate/warningconflict UI.

Cable endpoints endpointA/endpointB replacea/z. legacyLabels[] replacelegacyLabel. cableType replacestype. All manufacturer/model/productCode/constructionType/tubeCount/colorScheme nullactualpilot. routeNodes onlytwoendpointsknown foractualcables; routeCompleteness endpoints_only. Treatmentsunknown; cablebeingopened neverimpliesfibersplice. Nevermerge172+173intonewcable.

Fiber: number retained strandnumber; physicalColor unknown neutral, proposedColor optionalpriorhypothesis; tubeId references Tube candidategroup (basisprovisional), positionInTube null, proposedPositionInTube old12poshypothesis. Tube.number nullactual; proposedNumber1..4; physicalColorunknown; verificationneeds. Allprimary physicalcolorsunknown. Do not useproposed colors asdefaultphysicalidentities. Tube grouping UI can showprovisionalgroupheadersclearly or unknowngroup + optinproposedgroups. No bigtablevirtualizerfor240fibersnecessary.

Actual fixtureswill6cables169..174=240fibers,20provisional12-positiontubegroups,closures206/216/217/218/219,AP50+51,AGG5. Existing54candidates preserved. SC216cableendsfromsource; fiberlinksunknownunlessseparatelysource-derived+reviewed. AP50and51identityNote explainsAP/ODF symbolambiguity. ODF50alias resolvesAP50, notClosure50.

UIagent owns src/components/ui.tsx and src/views/NetworkViews.tsx only. May splitnewsrc/views/CableView.tsx orsrc/components/CableRoute.tsx. Preserveexports. CSSrootowns, sendnewclassneeds. Rootowns data/domain/App/Dashboard/HANDOFF. Testagentownstests. Evidenceagentonlywork/iteration04.
