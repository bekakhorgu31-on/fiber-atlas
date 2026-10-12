<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['fiber_atlas.review_cache_namespace' => bin2hex(random_bytes(12))]);
    }
}
