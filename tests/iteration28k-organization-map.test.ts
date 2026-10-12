import test from 'node:test';
import assert from 'node:assert/strict';
import {repository} from '../src/data/repository';
import {exactOrganizationEntry} from '../src/domain/organizationEntry';
import {createOrganizationMapModel,organizationLegKey} from '../src/domain/iteration28k';
import {createEngineerQueryService} from '../src/domain/engineerQuery';
import {parseRoute,routeHash} from '../src/domain/navigation';
import {createCurrentFiberPathResolver} from '../src/domain/currentFiberPath';
import {orderedJourneySteps} from '../src/domain/iteration28i';
const ready=repository.load();
test('28K canonical aliases enter overview while qualifiers retain engineering scope',async()=>{
 const data=await ready,service=createEngineerQueryService(data);
 for(const org of data.organizationNetworkProjection!.organizations){
  for(const q of [org.name,...org.aliases]){assert.equal(exactOrganizationEntry(data,q)?.organizationId,org.organizationId);assert.equal(service.search(q)[0].route.view,'organization');}
  for(const qualifier of ['OTDR','C148','review','unsupported qualification']){const q=`${org.name} ${qualifier}`;assert.equal(exactOrganizationEntry(data,q),undefined);assert.equal(service.search(q)[0].route.view,'engineer');}
 }
});
test('28K complete organization models preserve every logical path and exact source-scoped membership',async()=>{
 const data=await ready,resolver=createCurrentFiberPathResolver(data);
 for(const org of data.organizationNetworkProjection!.organizations){
  const before=JSON.stringify(org),model=createOrganizationMapModel(data,org.organizationId)!;
  assert.deepEqual(model.strands.map(s=>s.strand.id),org.strands.map(s=>s.id));
  assert.deepEqual([...model.membership].sort(),org.localFiberLegs.map(organizationLegKey).sort());
  for(const s of model.strands){const path=resolver.resolve(s.leg.segmentId,s.leg.fiberNumber);assert.equal(s.path.signature,path.signature);assert.deepEqual(s.journeys,orderedJourneySteps(data,path));assert.deepEqual([...s.membership],s.strand.localFiberLegs.map(organizationLegKey));assert.deepEqual(s.bindings.map(b=>b.binding.id),s.strand.portBindingIds);}
  assert.equal(JSON.stringify(org),before);
 }
 assert.equal(createOrganizationMapModel(data,'opennet')!.strands.length,17);
});
test('organization map uses current corrected Silknet groups and three real ODF bindings',async()=>{
 const model=createOrganizationMapModel(await ready,'silknet')!;
 assert.equal(model.strands.length,3);assert.equal(model.membership.size,36);assert.equal(model.org.cableIds.length,12);assert.equal(model.org.portBindingIds.length,3);assert.deepEqual(model.org.apIds,[]);
 const bindings=model.strands.flatMap(s=>s.bindings);assert.equal(bindings.length,3);assert.ok(bindings.every(b=>b.binding.ownerType==='odf'));assert.ok(model.strands.some(s=>s.missingPort));assert.ok(model.strands.some(s=>s.strand.reviewCaseIds.length));assert.ok(model.strands.every(s=>s.evidence.length));
});
test('28K canonical deep links preserve strand, independent inspection, original query and network mode',()=>{
 const route={view:'organization' as const,id:'silknet',strand:'stable-source-strand',inspect:'fiber:CAB-000148:1',mode:'network' as const,query:'სილქნეტი',collapsed:['root:5']};
 assert.deepEqual(parseRoute(routeHash(route)),route);assert.deepEqual(parseRoute(routeHash({view:'engineer',query:'Silknet',report:true})),{view:'engineer',query:'Silknet',report:true});
});
test('28K qualified Cable and review answers do not expose unfiltered organization routes',async()=>{
 const service=createEngineerQueryService(await ready);
 for(const q of ['Silknet C148','Silknet review','Silknet OTDR']){const answer=service.run(q);assert.ok(!(answer.actions??[]).some(a=>a.view==='organization'));assert.ok(!(answer.results??[]).some(r=>r.route.view==='organization'));}
 const cable=service.run('Silknet C148');assert.ok(cable.facts.every(f=>f.startsWith('C148/')));assert.equal(service.run('Silknet review').outcome,'review_required');
});
