<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Events\CommandStarting;
use Illuminate\Support\Facades\Event;
use App\Support\DatabaseScope;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Event::listen(CommandStarting::class,function(CommandStarting $event){
            if(in_array($event->command,['migrate:fresh','migrate:refresh','migrate:reset','migrate:rollback','db:wipe'],true))DatabaseScope::assertDestructiveTestTarget();
            elseif(in_array($event->command,['migrate','fiber:seed-baseline','fiber:activate'],true))DatabaseScope::assertWritable();
            elseif($event->command==='fiber:local-users'&&DatabaseScope::profile()!=='local')throw new \RuntimeException('Local test accounts cannot be created on the server profile.');
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
