<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SubscriptionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) return $next($request);

        $sub = $user->subscription;

        // No subscription at all
        if (!$sub) {
            return redirect()->route('subscription');
        }

        // Update expired subscriptions automatically
        if ($sub->status !== 'expired' && now()->isAfter($sub->end_date)) {
            $sub->update(['status' => 'expired']);
        }

        // Block expired users
        if ($sub->status === 'expired') {
            if ($request->inertia()) {
                return redirect()->route('subscription');
            }
            return redirect()->route('subscription');
        }

        return $next($request);
    }
}
