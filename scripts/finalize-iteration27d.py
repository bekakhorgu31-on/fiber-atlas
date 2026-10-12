"""Promote the layered network manifest after 27D's executable topology gate passes."""
import hashlib, json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))
def write(path,obj): (ROOT/path).write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
v1_path=ROOT/'reference/tsageri-lentekhi-v1.manifest.json'
v1_sha=hashlib.sha256(v1_path.read_bytes()).hexdigest()
expected='59ce208663b1dcb7f0fe5849faa9f9f1b62182bfc01cc7c5f4947cf366340125'
if v1_sha != expected: raise SystemExit(f'Frozen V1 manifest changed: {v1_sha}')
projection=read('src/data/iteration27d-network-projection.json')
ledger=read('migration/iteration27/source-b-transition-ledger.json')
semantic=read('migration/iteration27/semantic-audit.json')
owner=read('src/data/iteration27d-owner-confirmations.json')
if projection['sourceSha256'] != ledger['sourceSha256'] or len(projection['transitions']) != 775 or len(projection['overlapTransitions']) != 376 or ledger['summary']['unexplained'] != 0 or owner['topologyCriticalConfirmationCount'] != 0:
    raise SystemExit('27D topology-critical promotion preconditions failed.')
manifest=read('reference/fiber-atlas-network-v1.manifest.json')
manifest['id']='FIBER-ATLAS-COMBINED-NETWORK'
manifest['status']='ACTIVE'
manifest['updatedAt']='2026-09-30'
manifest['frozenSource']['manifestSha256']=expected
manifest['candidateSource'].update({'status':'ACTIVE_TOPOLOGY_CERTIFIED','certificationState':'CERTIFIED_FOR_NETWORK_ACTIVATION'})
manifest['topologyCertification']={
    'status':'PASS','activation':'ACTIVE','packageIntegrity':'PASS','cableLabelsAccounted':22,'markerBanksAccounted':42,
    'fiberPositionsAcrossSourceLabels':1512,'exactSourceTransitionsActivated':775,'duplicateOverlapEvidenceAttached':376,
    'unexplainedTransitions':0,'topologyCriticalOwnerConfirmationsRequired':0,
    'sourceOnlyCableSegments':17,'sharedCanonicalCables':5,'newPhysicalFiberRecords':912,
    'combinedV1AndSourceBFiberRecords':2088,'neutralPhysicalEndpoints':19,
    'crossDocumentC151C152Transitions':143,'C151F118Continuation':'not represented; no continuation inferred',
    'C169CanonicalFibers':48,'C169SC206TransitionsWithDualEvidence':48,
    'sourceDocumentId':projection['documentId'],'sourceSha256':projection['sourceSha256'],
    'inventoryValidator':'PASS'
}
manifest['assetTypingStatus']={'status':'PARTIAL','coverage':'not expressed as a percentage; source does not type all terminal endpoints','neutralNetworkNodes':19,'unresolvedTokens':['41–49','207–215','225']}
manifest['portSemanticsStatus']={'status':'NOT_DECODED_FROM_CURRENT_SOURCE','logicalPorts':0,'occupancyBindings':0,'portFiberBindings':0,'blocksTopologyActivation':False}
manifest['companyAttributionStatus']={'status':'OCCURRENCES_PRESERVED_SCOPE_UNRESOLVED','occurrences':24,'logicalAssignments':0,'blocksTopologyActivation':False}
manifest['annotationStatus']={'status':'SOURCE_TEXT_ACCOUNTED_SCOPE_PARTIAL','meaningfulOccurrences':106,'cutModuleNotes':{'count':3,'category':'source_instruction','executionStatus':'unknown'},'placeAndDirectionScope':'unresolved where unscoped','createsFiberEdges':False}
manifest['unresolvedEnrichment']=['neutral endpoint type/name','Source B Port schedule/occupancy/bindings','company-use scope','cut-note execution status','unscoped place/direction labels','optional named Route scope']
manifest['sourceConflicts']=projection['sourceConflicts']
manifest['overlapCandidates']=[{'sourceA':'SC205','sourceB':'Source B SC205','state':'canonical_shared_identity'}, {'sourceA':'SC206','sourceB':'Source B SC206','state':'canonical_shared_identity'}, {'sourceA':'CAB-000148','sourceB':'Source B C148','state':'canonical_identity_tube_color_conflict_preserved'}, {'sourceA':'CAB-000149','sourceB':'Source B C149','state':'exact_construction_correspondence'}, {'sourceA':'CAB-000150','sourceB':'Source B C150','state':'exact_construction_correspondence'}, {'sourceA':'CAB-000151','sourceB':'Source B C151','state':'exact_construction_endpoint207_neutral'}, {'sourceA':'CAB-000169','sourceB':'Source B C169','state':'golden_48_of_48'}]
manifest['crossDocumentCorrespondenceCandidates']=[{'canonicalCandidate':'Node 207','sourceBContext':'C151 far endpoint / C152 near endpoint','state':'physical_endpoint_reconciled_asset_type_unknown','transitionCount':143,'unmappedFiberNumber':118}]
manifest['canonicalAssetMerges']=[{'sourceA':'SC205','sourceB':'Source B endpoint 205','canonicalId':'205','state':'active'}, {'sourceA':'SC206','sourceB':'Source B endpoint 206','canonicalId':'206','state':'active'}, {'sourceA':'Aggregation #5','sourceB':'Aagregacia #5 / cageri','canonicalId':'5','state':'source-reconciled'}, {'sourceA':'C148','sourceB':'Source B C148','canonicalId':'CAB-000148','state':'active_with_attribute_conflict'}, {'sourceA':'C149','sourceB':'Source B C149','canonicalId':'CAB-000149','state':'active'}, {'sourceA':'C150','sourceB':'Source B C150','canonicalId':'CAB-000150','state':'active'}, {'sourceA':'C151','sourceB':'Source B C151','canonicalId':'CAB-000151','state':'active'}, {'sourceA':'C169','sourceB':'Source B C169','canonicalId':'CAB-000169','state':'active'}]
manifest['documentBoundaryLinks']=[{'historicalAlias':'BOUNDARY-SC207','canonicalPhysicalNodeId':'207','assetType':'unknown','state':'resolved_at_neutral_physical_endpoint','sourceCable':'CAB-000151'}]
manifest['crossDocumentFiberLinks']=[{'fromCable':'CAB-000151','toCable':'SRC-TSAGERI-ALPANA-TVISHI-419DEF34-C152','node':'207','transitionCount':143,'fiber118':'unmapped; no continuation inferred'}]
manifest['combinedTopologySummary']={'canonicalCableSegments':37,'canonicalFibers':2088,'sourceDocuments':2,'sourceBLocalTransitionsActivated':775,'overlapEvidenceAttached':376,'neutralPhysicalNodes':19}
manifest['overlapCrossValidation']['canonicalMappingsActivated']=True
manifest['sourceBSemanticCertification']={
    'state':'CERTIFIED_FOR_NETWORK_ACTIVATION','activation':'ACTIVE',
    'gates':{'physicalOpticalTopology':'PASS','assetTyping':'PARTIAL_NON_BLOCKING','portSemantics':'NOT_DECODED_NON_BLOCKING','companyAttribution':'UNRESOLVED_NON_BLOCKING','annotationInterpretation':'PRESERVED_SCOPE_PARTIAL_NON_BLOCKING','crossDocumentCorrespondence':'PASS'},
    'transitionDispositions':{'candidateCount':1151,'duplicateOverlapEvidence':376,'exactSourceTransitions':775,'notSemanticallyReviewed':0,'unexplained':0,'activeTransitions':775},
    'sourceBInventory':{'cableSegments':22,'fiberPositions':1512,'markerBankGroups':42,'fiberMarkerShapes':2928,'organizationOccurrences':24,'sourceAnnotationsPreserved':84,'sourceOnlyCableSegments':17,'newPhysicalFibers':912,'logicalPorts':0},
    'boundary207':{'status':'RESOLVED_AT_NEUTRAL_PHYSICAL_NODE','canonicalNodeId':'207','assetType':'unknown','C151toC152Transitions':143,'C151F118':'partial_at_endpoint'},
    'combinedTopologySummary':{'canonicalCables':37,'canonicalFiberRecords':2088,'neutralNodes':19,'activeNewTransitions':775},
    'blockerIds':[],'nonBlockingEnrichment':manifest['unresolvedEnrichment'],
    'auditReport':'docs/ITERATION-27-TSAGERI-ALPANA-TVISHI-CERTIFICATION.md','ownerChecklist':'docs/ITERATION-27D-OWNER-CONFIRMATION-CHECKLIST.md'
}
manifest['promotion']={'status':'ACTIVE','atomic':True,'reason':'All topology-critical evidence gates pass; optional metadata remains explicitly unresolved.'}
manifest['activationGate']='Topology is active from exact Cable/Fiber construction and node-local transition evidence. Optional endpoint typing, Ports, company assignments, and annotation scopes do not create or remove optical edges.'
write('reference/fiber-atlas-network-v1.manifest.json',manifest)
summary={'schemaVersion':1,'status':'CERTIFIED_FOR_NETWORK_ACTIVATION','sourceSha256':projection['sourceSha256'],'frozenV1ManifestSha256BeforeAndAfter':v1_sha,'candidateTransitions':1151,'exactTransitionsActivated':775,'duplicateOverlapEvidenceAttached':376,'unexplained':0,'cableLabels':22,'fiberPositions':1512,'sourceOnlyCables':17,'newPhysicalFibers':912,'sharedCanonicalCables':5,'sharedFibersNotDuplicated':600,'neutralNetworkNodes':19,'crossDocumentTransitionsAtNode207':143,'C151F118':'partial_no_inferred_continuation','C169CanonicalFibers':48,'C148TubeConflictPositions':72,'companyOccurrences':24,'companyAssignments':0,'sourceBPortBindings':0,'meaningfulTextOccurrences':106,'cutModuleNotes':{'count':3,'classification':'source_instruction','executionStatus':'unknown'},'inventoryValidation':'PASS','ownerConfirmationsRequiredForTopology':0}
write('migration/iteration27/iteration27d-activation-summary.json',summary)
if hashlib.sha256(v1_path.read_bytes()).hexdigest()!=expected: raise SystemExit('Frozen V1 changed during promotion.')
print(json.dumps(summary,ensure_ascii=False,indent=2))
