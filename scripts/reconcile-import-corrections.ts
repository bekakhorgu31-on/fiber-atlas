import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {hydrateOperationalPayload,buildOperationalPayload} from '../src/domain/operationalPayload';
import {reconcileImportCorrections,correctionImpact} from '../src/domain/portCorrection';
const [previousFile,candidateFile,impactFile,runId,decisionFile]=process.argv.slice(2),previous=hydrateOperationalPayload(JSON.parse(readFileSync(previousFile,'utf8'))),candidate=JSON.parse(readFileSync(candidateFile,'utf8'));
const rows=reconcileImportCorrections(previous,candidate.authority,runId);
if(decisionFile){const decision=JSON.parse(readFileSync(decisionFile,'utf8'));const conflicts=rows.filter(r=>r.status==='requires_owner_decision');if(JSON.stringify(conflicts.map(r=>r.draftId).sort())!==JSON.stringify(decision.draftIds.slice().sort()))throw Error('Every incompatible correction must be acknowledged.');for(const r of conflicts){r.status='superseded_by_source';r.actorId=decision.actorId;r.reason=decision.reason;}}
const impact=correctionImpact(previous,candidate.authority);writeFileSync(impactFile,JSON.stringify(impact));
candidate.networkRevision='RECONCILE-'+createHash('sha256').update(JSON.stringify({sourceCandidate:candidate.networkRevision,runId,rows})).digest('hex').slice(0,32);
candidate.authoritySha256=createHash('sha256').update(JSON.stringify(candidate.authority)).digest('hex');candidate.operational=buildOperationalPayload(candidate.authority,candidate.networkRevision);candidate.details.networkRevision=candidate.networkRevision;
candidate.portCorrectionReconciliation={runId,rows,counts:impact.counts,requiresDecision:rows.some(r=>r.status==='requires_owner_decision')};
writeFileSync(candidateFile,JSON.stringify(candidate));
