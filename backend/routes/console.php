<?php

use App\Models\User;
use App\Services\NetworkStore;
use App\Services\OwnerSetup;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;

Artisan::command('fiber:local-users', function () {
    if (! app()->environment('local', 'testing')) {
        throw new RuntimeException('Local development command only.');
    }
    $settings = json_decode(file_get_contents(dirname(base_path()).'/.dev-runtime/backend-settings.json'), true, flags: JSON_THROW_ON_ERROR);
    foreach (['reviewer', 'viewer'] as $role) {
        $email = $role.'@fiber-atlas.local';
        if (User::where('email', $email)->exists()) {
            continue;
        }
        $user = new User;
        $user->forceFill(['name' => ucfirst($role).' (local)', 'email' => $email, 'password' => Hash::make($settings[$role.'Password']), 'role' => $role])->save();
    }
    $this->info('Local reviewer/viewer accounts configured; passwords are in ignored .dev-runtime/backend-settings.json.');
});

Artisan::command('fiber:seed-baseline {--activate} {--expected=}', function (NetworkStore $store) {
    $revision = $store->seedBaseline();
    if ($this->option('activate')) {
        $store->activate($revision, $this->option('expected') ?: null, 'local-cli');
    }
    $this->info('Reviewed baseline persisted: '.$revision);
});
Artisan::command('fiber:activate {revision} {--expected=} {--rollback}', function (NetworkStore $store) {
    $store->activate($this->argument('revision'), $this->option('expected') ?: null, 'local-cli', $this->option('rollback') ? 'rollback' : 'activate');
    $this->info('Active revision: '.$this->argument('revision'));
});

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('fiber:owner-setup', function (OwnerSetup $setup) {
    $this->info($setup->issue() ? 'Private owner setup ticket saved for the local launcher.' : 'Existing accounts preserved; sign in normally.');
});
