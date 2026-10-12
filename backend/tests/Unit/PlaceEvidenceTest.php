<?php

namespace Tests\Unit;

use App\Services\ReviewInboxStore;
use PHPUnit\Framework\TestCase;

class PlaceEvidenceTest extends TestCase
{
    public function test_capacity_conflict_opens_a_cable_without_fabricating_a_fiber_number(): void
    {
        $source = ['sourceRevision' => 'DOC/'.str_repeat('f', 64), 'shapeIds' => ['LABEL']];
        $data = [
            'sourceDocuments' => [['id' => 'DOC', 'sourceSha256' => str_repeat('f', 64), 'title' => 'Source', 'importedAssetIds' => ['CABLE']]],
            'networkNodes' => [['id' => 'AP20', 'displayName' => 'AP20'], ['id' => 'SC25024', 'displayName' => 'SC25024']],
            'cables' => [['id' => 'CABLE', 'fiberCount' => 24, 'endpointA' => ['kind' => 'network_node', 'id' => 'SC25024'], 'endpointB' => ['kind' => 'network_node', 'id' => 'AP20'], 'source' => $source]],
            'fibers' => [['id' => 'FIBER', 'cableId' => 'CABLE', 'number' => 1, 'source' => $source]],
            'sourceReviewCases' => [
                ['id' => 'CAPACITY', 'category' => 'source_conflict', 'source' => $source, 'affectedIds' => ['CABLE'], 'question' => '20 versus 24', 'observation' => 'Complete FO24 source banks contradict the label.'],
                ['id' => 'COLOR', 'category' => 'source_conflict', 'source' => $source, 'affectedIds' => ['FIBER'], 'question' => 'Color conflict', 'observation' => 'Different source colors.'],
            ],
        ];
        $cases = (new ReviewInboxStore)->candidateIndex($data, 'TEST')['cases'];
        $this->assertSame([['kind' => 'segment', 'id' => 'CABLE']], $cases[0]['assets']);
        $this->assertSame('SC25024 ↔ AP20 · 24F', $cases[0]['object']);
        $this->assertSame('კაბელის ჟილების რაოდენობა წყაროში განსხვავდება', $cases[0]['title']);
        $this->assertSame($source['sourceRevision'], $cases[0]['sourceRevision']);
        $this->assertSame([['kind' => 'fiber', 'id' => 'CABLE', 'number' => 1]], $cases[1]['assets']);
        $this->assertStringEndsWith(' / F1', $cases[1]['object']);
        $this->assertSame('ჟილის ფერები წყაროში განსხვავდება', $cases[1]['title']);
    }

    public function test_exact_run_endpoint_annotation_is_not_a_mapping(): void
    {
        $anchor = ['id' => 'PORT', 'geometry' => ['world_bounds' => ['min_x' => 1, 'max_x' => 2, 'min_y' => 1, 'max_y' => 2]]];
        $stroke = ['id' => 'STROKE', 'type' => 'Shape', 'text' => '', 'geometry' => ['world_geometry_sections' => [['rows' => [['attributes' => ['T' => 'MoveTo'], 'world_point' => ['x' => 1, 'y' => 1.5]], ['attributes' => ['T' => 'LineTo'], 'world_point' => ['x' => 4, 'y' => 1.5]]]]]]];
        $store = new ReviewInboxStore;
        $highlights = $store->portEvidenceHighlights($anchor, [$stroke], []);
        $this->assertSame('STROKE', $highlights[0]['shapeId']);
        $this->assertSame(['x' => 4, 'y' => 1.5], $highlights[0]['unresolvedEndpoint']);
        $this->assertSame('exact_run_geometry_only', $highlights[0]['basis']);
        $this->assertSame('diagnostic_only_not_a_mapping', $highlights[0]['status']);
        $this->assertSame('rejection_metadata_missing', $highlights[0]['reason']);
        $recorded = $store->portEvidenceHighlights($anchor, [$stroke], [['strokeShapeId' => 'STROKE', 'reason' => 'bank_without_unique_cable_association']]);
        $this->assertSame('recorded_rejection', $recorded[0]['basis']);
        $this->assertSame('bank_without_unique_cable_association', $recorded[0]['reason']);
        $this->assertSame([], $store->portEvidenceHighlights($anchor, [$stroke], [['strokeShapeId' => 'OTHER', 'reason' => 'rejected']]));
        $stroke['geometry']['world_geometry_sections'][0]['rows'][0]['world_point']['x'] = 2.01;
        $this->assertSame([], $store->portEvidenceHighlights($anchor, [$stroke], []));
    }
}
