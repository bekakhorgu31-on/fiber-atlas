<?php
namespace App\Http\Middleware;
use App\Support\DatabaseScope;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
final class EnforceDatabaseScope
{
    public function handle(Request $request,Closure $next)
    {
        if(!$request->is('api/*'))return $next($request);
        try {
            DatabaseScope::assertTarget();
            if(!in_array($request->method(),['GET','HEAD','OPTIONS'],true))DatabaseScope::assertWritable();
        }catch(\Throwable $e){
            Log::warning('Database connection/scope unavailable.',['profile'=>DatabaseScope::profile(),'exception'=>get_class($e)]);
            return response()->json(['message'=>'Database connection or schema prerequisites are unavailable.'],503);
        }
        return $next($request);
    }
}
