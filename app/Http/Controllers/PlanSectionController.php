<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BusinessPlan;
use App\Models\PlanSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\BmcExtractorService;
use App\Services\PlanLimitsService;

class PlanSectionController extends Controller
{
    private array $webhooks = [
        'company_presentation' => '/webhook/s1-company',
        'market_analysis'      => '/webhook/s2-market',
        'org_management'       => '/webhook/s3-org',
        'strategy'             => '/webhook/s4-strategy',
        'operational_plan'     => '/webhook/s5-operations',
        'financial_plan'       => '/webhook/s6-financial',
        'risk_opportunity'     => '/webhook/s7-risk',
        'executive_summary'    => '/webhook/s8-executive',
        'appendices'           => '/webhook/s9-appendices',
    ];

    private array $dependencies = [
        'company_presentation' => [],
        'market_analysis'      => ['company_presentation'],
        'org_management'       => ['company_presentation', 'market_analysis'],
        'strategy'             => ['company_presentation', 'market_analysis', 'org_management'],
        'operational_plan'     => ['company_presentation', 'org_management', 'strategy'],
        'financial_plan'       => ['company_presentation', 'strategy', 'operational_plan'],
        'risk_opportunity'     => ['company_presentation', 'market_analysis', 'strategy', 'operational_plan', 'financial_plan'],
        'executive_summary'    => ['company_presentation', 'market_analysis', 'org_management', 'strategy', 'operational_plan', 'financial_plan', 'risk_opportunity', 'appendices'],
        'appendices'           => ['company_presentation', 'financial_plan', 'risk_opportunity'],
    ];

    public function store(Request $request, $id)
    {
        $businessPlan = BusinessPlan::find($id);
        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check weekly limit for plan section generation
        $limits = app(PlanLimitsService::class);
        $sectionName = $request->section_name;

        // Only count S1 (company_presentation) as a new BP generation
        if ($sectionName === 'company_presentation') {
            if (!$limits->canGenerateBp($request->user())) {
                return response()->json([
                    'message' => 'weekly_limit_reached',
                    'limit'   => $limits->weeklyBpLimit($request->user()),
                    'count'   => $limits->weeklyBpCount($request->user()),
                ], 403);
            }
        }

        $request->validate([
            'section_name' => 'required|string|in:' . implode(',', array_keys($this->webhooks)),
            'input_json'   => 'sometimes|array',
        ]);

        $sectionName = $request->section_name;

        // Check dependencies are completed
        $deps = $this->dependencies[$sectionName];
        if (!empty($deps)) {
            $completedSections = $businessPlan->planSections()
                ->where('validation_status', 'completed')
                ->pluck('section_name')
                ->toArray();

            $missing = array_diff($deps, $completedSections);
            if (!empty($missing)) {
                return response()->json([
                    'message' => 'Dependencies not completed: ' . implode(', ', $missing)
                ], 422);
            }
        }

        // Save or update section record with pending status
        $planSection = $businessPlan->planSections()
            ->updateOrCreate(
                ['section_name' => $sectionName],
                [
                    'input_json'        => json_encode($request->input_json ?? []),
                    'validation_status' => 'pending',
                    'generated_text'    => null,
                    'edited'            => false,
                ]
            );

        // Fetch dependency memory summaries from DB
        $planContext = [];
        foreach ($deps as $dep) {
            $depSection = $businessPlan->planSections()
                ->where('section_name', $dep)
                ->where('validation_status', 'completed')
                ->first();
            if ($depSection) {
                $planContext[$dep] = $depSection->memory_summary;
            }
        }

        // Send to n8n
        $n8nBase = config('services.n8n.base_url');
        $webhook = $this->webhooks[$sectionName];

        try {
            $response = Http::timeout(300)
                ->withoutVerifying()
                ->withHeaders([
                    'ngrok-skip-browser-warning' => 'true',
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ])
                ->post($n8nBase . $webhook, [
                    'section_name'     => $sectionName,
                    'section_id'       => $planSection->id,
                    'business_plan_id' => $businessPlan->id,
                    'language'         => $businessPlan->language,
                    'input_json'       => $request->input_json,
                    'plan_context'     => $planContext,
                ]);
                Log::info('n8n raw response', [
                    'status_code' => $response->status(),
                    'body'        => $response->body(),
                    'json'        => $response->json(),
                ]);

            $responseData = $response->json();
            $status = is_array($responseData) && isset($responseData[0])
                ? ($responseData[0]['status'] ?? null)
                : ($responseData['status'] ?? null);

            if ($response->successful() && $response->json('status') === 'completed') {
                Log::info('entering completed block');
                $planSection->update([
                    'validation_status' => 'completed',
                ]);
                $planSection->refresh();

                // Recalculate token totals for the business plan
                $totals = $businessPlan->planSections()
                    ->selectRaw('SUM(tokens_input) as `ti`, SUM(tokens_output) as `to_`, SUM(tokens_total) as `tt`')
                    ->first();

                $businessPlan->update([
                    'total_tokens_input'  => $totals->ti ?? 0,
                    'total_tokens_output' => $totals->to_ ?? 0,
                    'total_tokens'        => $totals->tt ?? 0,
                ]);

                // Trigger BMC extraction after executive summary completes
                if ($sectionName === 'executive_summary') {
                    try {
                        app(BmcExtractorService::class)->extract($businessPlan);
                    } catch (\Exception $e) {
                        Log::info('BMC extraction failed', ['error' => $e->getMessage()]);
                    }
                }

            } else {
                $planSection->update([
                    'validation_status' => 'failed',
                ]);
            }
        } catch (\Exception $e) {
            Log::info('catch block hit', ['error' => $e->getMessage()]);
            $planSection->update([
                'validation_status' => 'failed',
            ]);
        }

        return response()->json($planSection);
    }

    public function update(Request $request, $id)
    {
        $planSection = PlanSection::find($id);
        if (!$planSection || $planSection->businessPlan->project->company->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate([
            'generated_text' => 'required|string',
        ]);
        $planSection->update([
            'generated_text' => $request->generated_text,
            'edited'         => true,
        ]);
        return response()->json($planSection);
    }
}