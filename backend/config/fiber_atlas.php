<?php

return [
    'python' => env('FIBER_PYTHON', 'python'),
    'extractor_version' => 'fiber-atlas-vsdx-package-reader/3',
    'interpreter_version' => 'owner-upload-grammar/1',
    'node' => env('FIBER_NODE', str_replace('\\', '/', getenv('USERPROFILE').'/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe')),
    'max_upload_bytes' => 20 * 1024 * 1024,
    'max_uncompressed_bytes' => 256 * 1024 * 1024,
    'max_entry_bytes' => 128 * 1024 * 1024,
    'full_extraction_max_bytes' => 64 * 1024 * 1024,
    'max_inventory_shapes' => 100000,
    'timeout_seconds' => 90,
    'reprocess_lease_seconds' => 900,
];
