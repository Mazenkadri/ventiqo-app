<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\PlanLimitsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    public function index(Request $request){
        return response()->json($request->user()->subscription, 200);
    }

    public function store(Request $request){
        $request->validate([
            'plan_type' => 'required|in:basic,unlimited',
        ]);

        $subscription = $request->user()->subscription;
        $subscription->status    = 'active';
        $subscription->plan_type = $request->plan_type;
        $subscription->start_date = now();
        $subscription->end_date   = now()->addMonth();
        $subscription->save();

        return redirect()->route('subscription');
    }

    public function indexPage(Request $request){
        $subscription = $request->user()->subscription;
        $limits = app(PlanLimitsService::class);

        return Inertia::render('Subscription/Index', [
            'subscription'     => $subscription,
            'plan_type'        => $limits->getPlanType($request->user()),
            'can_export_bmc'   => $limits->canExportBmc($request->user()),
            'weekly_limit'     => $limits->weeklyBpLimit($request->user()),
            'weekly_count'     => $limits->weeklyBpCount($request->user()),
        ]);
    }
}