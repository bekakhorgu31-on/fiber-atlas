import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { repository } from '../src/data/repository';
import { validateIteration28E } from '../src/domain/iteration28e';
import { resolveCurrentFiberPath } from '../src/domain/currentFiberPath';

const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const data=await repository.load();
const projection=data.fiberUsageProjection;
if(!projection)throw new Error('Iteration 28E projection did not activate.');
const errors=validateIteration28E(data);if(errors.length)throw new Error(errors.join('; '));
const summary={schema:'fiber-lineage-usage-summary/1',grammarId:projection.grammarId,projectionRule:projection.projectionRule,sourceSha256:projection.sourceSha256,topologyRevision:projection.topologyRevision,counts:projection.counts,localViewsByOrganization:Object.fromEntries([...new Set(projection.localViews.map(view=>view.organization).filter(Boolean))].map(org=>[org,projection.localViews.filter(view=>view.organization===org).length])),reviewCategories:Object.fromEntries([...new Set(projection.reviewCases.map(item=>item.category))].map(category=>[category,projection.reviewCases.filter(item=>item.category===category).length])),samples:{blue:projection.sourceEvidence.find(line=>line.disposition==='blue_solid_unused'),green:projection.sourceEvidence.find(line=>line.disposition==='green_solid_opennet'),otdr:projection.sourceEvidence.find(line=>line.disposition==='green_solid_opennet_otdr'),redNamed:projection.sourceEvidence.find(line=>line.disposition==='red_solid_in_use_named'),redUnknown:projection.sourceEvidence.find(line=>line.disposition==='red_solid_in_use_organization_unknown'),redDashed:projection.reviewCases.find(item=>item.category==='red_dashed_semantics'),remappedF11:{path:resolveCurrentFiberPath(data,data.cables.find(c=>c.legacyCableId==='161'&&c.sourceRepresentations?.some(s=>/alpana|tvishi/i.test(s.file)))!.id,11),views:projection.localViews.filter(view=>['161','164'].includes(data.cables.find(c=>c.id===view.segmentId)?.legacyCableId??'')&&[11,23].includes(view.fiberNumber))}}};
const output={grammarId:projection.grammarId,projectionRule:projection.projectionRule,sourceSha256:projection.sourceSha256,topologyRevision:projection.topologyRevision,counts:projection.counts,claims:projection.claims,localViews:projection.localViews};
mkdirSync('migration/iteration28e',{recursive:true});
writeFileSync('migration/iteration28e/fiber-lineage-usage.json',JSON.stringify(output));
writeFileSync('migration/iteration28e/review-queue.json',JSON.stringify({schema:'iteration28e-review-queue/1',sourceSha256:projection.sourceSha256,previousIteration28D:data.sourceReviewCases??[],reviewCases:projection.reviewCases,counts:{previous28D:(data.sourceReviewCases??[]).length,iteration28E:projection.reviewCases.length,redDashed:projection.counts.redDashed,byCategory:summary.reviewCategories}},null,2));
writeFileSync('migration/iteration28e/usage-summary.json',JSON.stringify(summary,null,2));
console.log(JSON.stringify({counts:projection.counts,topologyRevision:projection.topologyRevision,claims:projection.claims.length,localViews:projection.localViews.length,reviews:projection.reviewCases.length,validation:errors,summaryHash:hash(summary)},null,2));
