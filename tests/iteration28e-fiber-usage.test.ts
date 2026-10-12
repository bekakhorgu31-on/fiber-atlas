import test from 'node:test';
import assert from 'node:assert/strict';
import { repository } from '../src/data/repository';
import { resolveCurrentFiberPath } from '../src/domain/currentFiberPath';
import { validateIteration28E } from '../src/domain/iteration28e';
import { sourceBAPInventory } from '../src/domain/iteration28d';

test('Iteration 28E classifies source line styles and projects through exact current Fiber paths', async t => {
  const data=await repository.load(),projection=data.fiberUsageProjection;
  assert.ok(projection);
  await t.test('complete candidate accounting and owner-confirmed grammar',()=>{
    assert.equal(projection.counts.lineShapes,3092);
    assert.equal(projection.counts.unknownStyle,0);
    assert.equal(projection.sourceEvidence.filter(line=>line.disposition==='blue_solid_unused').length,2603);
    assert.equal(projection.sourceEvidence.filter(line=>line.disposition==='green_solid_opennet').length,226);
    assert.equal(projection.sourceEvidence.filter(line=>line.disposition==='green_solid_opennet_otdr').length,4);
    assert.equal(projection.sourceEvidence.filter(line=>line.disposition==='red_dashed_review_required').length,28);
    assert.equal(projection.reviewCases.filter(item=>item.category==='red_dashed_semantics').length,28);
    assert.equal(projection.reviewCases.filter(item=>item.category==='line_fiber_alignment_ambiguous').length,5);
  });
  await t.test('operational color remains separate from physical Fiber color and availability',()=>{
    const blue=projection.sourceEvidence.find(line=>line.shapeId==='23805')!;
    assert.equal(blue.usageState,'unused');
    assert.equal(blue.physicalFiberColor,'#f48c37');
    const cable=data.cables.find(item=>item.legacyCableId==='153')!;
    const view=projection.localViews.find(item=>item.segmentId===cable.id&&item.fiberNumber===2)!;
    assert.equal(view.availability,'unknown');
    assert.equal(view.administrativeAllocation,'unknown');
    assert.equal(view.usageState,'unused');
    const red=projection.sourceEvidence.find(line=>line.disposition==='red_solid_in_use_organization_unknown')!;
    assert.equal(red.usageState,'in_use');
    assert.notEqual(red.effectiveLineColor?.rgb?.toLowerCase(),red.physicalFiberColor);
  });
  await t.test('green, OTDR and red named evidence retain exact source Shapes',()=>{
    const green=projection.sourceEvidence.find(line=>line.shapeId==='26771')!;
    assert.equal(green.organization,'OpenNet');assert.equal(green.purpose,'internal');
    const otdr=projection.sourceEvidence.filter(line=>line.disposition==='green_solid_opennet_otdr');
    assert.ok(otdr.length>0);assert.ok(otdr.every(line=>line.otdrAnnotationShapeIds.length>0));
    const named=projection.sourceEvidence.find(line=>line.shapeId==='17536')!;
    assert.equal(named.disposition,'red_solid_in_use_named');assert.equal(named.organization,'Magti');
    assert.deepEqual(named.companyLabelShapeIds,['17536']);
  });
  await t.test('lineage usage follows a nonidentity remap and remains visible from its local legs',()=>{
    const cable=data.cables.find(item=>item.legacyCableId==='161'&&item.sourceRepresentations?.some(source=>/alpana|tvishi/i.test(source.file)))!;
    const path=resolveCurrentFiberPath(data,cable.id,11);
    assert.ok(path.sides.some(side=>side.legs.some(leg=>leg.segmentId===data.cables.find(item=>item.legacyCableId==='164')?.id&&leg.fiberNumber===23)));
    const remappedClaim=projection.claims.find(item=>item.localFiberLegs.some(leg=>leg.segmentId===data.cables.find(c=>c.legacyCableId==='164')?.id&&leg.fiberNumber===23&&item.usageState==='unused'))!;
    assert.ok(remappedClaim.localFiberLegs.some(leg=>leg.segmentId===cable.id&&leg.fiberNumber===11));
    const source=data.cables.find(item=>item.legacyCableId==='148')!;
    const sourceView=projection.localViews.find(view=>view.segmentId===source.id&&view.fiberNumber===20)!;
    assert.equal(sourceView.organization,'Magti');
    const claim=projection.claims.find(item=>item.localFiberLegs.some(leg=>leg.segmentId===source.id&&leg.fiberNumber===20)&&item.sourceLabelShapeIds.includes('17536'))!;
    assert.ok(claim.localFiberLegs.length>=3);
    for(const leg of claim.localFiberLegs)assert.equal(projection.localViews.find(view=>view.segmentId===leg.segmentId&&view.fiberNumber===leg.fiberNumber)?.organization,'Magti');
  });
  await t.test('28C topology and 28D Ports stay unchanged',()=>{
    assert.equal(data.nodeFiberTransitions?.length,1631);
    assert.equal(sourceBAPInventory.blocks.flatMap(block=>block.ports).length,216);
    assert.equal(data.apPorts?.length,192);
    assert.equal(data.portTopologyBindings?.filter(binding=>binding.id.startsWith('28D-')).length,192);
    assert.equal(projection.localViews.length,2088);
    assert.deepEqual(validateIteration28E(data),[]);
  });
});
