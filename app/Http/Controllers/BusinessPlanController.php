<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\Project;
use App\Models\BusinessPlan;
use Inertia\Inertia;
use Dompdf\Dompdf;
use Dompdf\Options;
use App\Services\PlanLimitsService;

class BusinessPlanController extends Controller
{
    public function store(Request $request, $id)
    {
        $project = Project::find($id);
        if (!$project || $project->company->user_id !== $request->user()->id){
            abort(403);
        }
        if ($project->businessPlan) {
            return redirect()->route('projects.business-plan', $id);
        }
        $request->validate([
            'title' => 'required|string|max:255',
            'language' => 'required|string|max:255',
        ]);
        $project->businessPlan()->create([
            'title' => $request->title,
            'language' => $request->language,
        ]);
        return redirect()->route('projects.business-plan', $id);
    }

    public function show (Request $request, $id){
        $businessPlan = BusinessPlan::find($id);
        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id){
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return $businessPlan->load('planSections');
    }

    public function destroy (Request $request, $id){
        $businessPlan = BusinessPlan::find($id);
        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id){
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $businessPlan->delete();
        return response()->json(['message' => 'Business plan deleted successfully'], 200);
    }

    public function showPage(Request $request, $id)
    {
        $project = Project::with([
            'businessPlan.planSections',
            'company'
        ])->find($id);

        if (!$project || $project->company->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('BusinessPlan/Show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'company_name' => $project->company->name,
            ],
            'business_plan' => $project->businessPlan,
            'sections' => $project->businessPlan
                ? $project->businessPlan->planSections->keyBy('section_name')->map(function($section) {
                    $section->input_json = is_string($section->input_json) 
                        ? json_decode($section->input_json, true) 
                        : $section->input_json;
                    return $section;
                })
                : [],
            'products' => $project->company->products->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'description' => $p->description,
            ]),
        ]);
    }

    public function resultPage(Request $request, $id)
    {
        $businessPlan = BusinessPlan::with(['planSections', 'project.company', 'bmc'])->find($id);

        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id) {
            abort(403);
        }

        $sections = $businessPlan->planSections->keyBy('section_name');

        $limits = app(PlanLimitsService::class);
        $user = $request->user();

        return Inertia::render('BusinessPlan/Result', [
            'business_plan' => $businessPlan,
            'project' => [
                'id' => $businessPlan->project->id,
                'name' => $businessPlan->project->name,
                'company_name' => $businessPlan->project->company->name,
            ],
            'sections' => $sections,
            'bmc' => $businessPlan->bmc,
            'plan_type' => $limits->getPlanType($user),
            'can_export_bmc' => $limits->canExportBmc($user),
            'allowed_templates' => $limits->getAllowedTemplates($user),
        ]);
    }

    public function export(Request $request, $id){
        $businessPlan = BusinessPlan::with(['planSections', 'project.company'])->find($id);

        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id) {
            abort(403);
        }

        $limits = app(PlanLimitsService::class);
        $template = (int) $request->input('template', 1);

        if (!$limits->canUseTemplate($request->user(), $template)) {
            return response()->json(['message' => 'upgrade_required', 'reason' => 'template'], 403);
        }

        $sections = $businessPlan->planSections->keyBy('section_name');
        $companySection = $sections['company_presentation'] ?? null;
        $inputJson = $companySection ? json_decode($companySection->input_json, true) : [];

        $language = $businessPlan->language ?? 'english';
        $isFrench = strtolower($language) === 'french';

        $allSections = [
            'executive_summary',
            'company_presentation',
            'market_analysis',
            'org_management',
            'strategy',
            'operational_plan',
            'financial_plan',
            'risk_opportunity',
            'appendices',
        ];

        $requestedSections = $request->input('sections', $allSections);
        $sectionOrder = array_filter($allSections, fn($s) => in_array($s, $requestedSections));
        $sectionOrder = array_values($sectionOrder);

        $sectionTitles = $isFrench ? [
            'executive_summary'    => 'Résumé Exécutif',
            'company_presentation' => 'Présentation de l\'Entreprise',
            'market_analysis'      => 'Analyse du Marché',
            'org_management'       => 'Organisation & Management',
            'strategy'             => 'Stratégie',
            'operational_plan'     => 'Plan Opérationnel',
            'financial_plan'       => 'Plan Financier',
            'risk_opportunity'     => 'Risques & Opportunités',
            'appendices'           => 'Annexes',
        ] : [
            'executive_summary'    => 'Executive Summary',
            'company_presentation' => 'Company Presentation',
            'market_analysis'      => 'Market Analysis',
            'org_management'       => 'Organization & Management',
            'strategy'             => 'Strategy',
            'operational_plan'     => 'Operational Plan',
            'financial_plan'       => 'Financial Plan',
            'risk_opportunity'     => 'Risk & Opportunity',
            'appendices'           => 'Appendices',
        ];

        $companyName = $inputJson['company_name'] ?? $businessPlan->title;
        $date = now()->format('F j, Y');

        $template = (int) $request->input('template', 1);
        $html = match($template){
            2 => $this->buildTemplate2($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench),
            3 => $this->buildTemplate3($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench),
            4 => $this->buildTemplate4($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench),
            default => $this->buildPdfHtml($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench),     
        };

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'Arial');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = str_replace(' ', '_', $companyName) . '_Business_Plan.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function generateTocItems($sectionOrder, $sections, $sectionTitles)
    {
        $tocHtml = '';
        $i = 1;
        foreach ($sectionOrder as $key) {
            $section = $sections[$key] ?? null;
            if (!$section || !$section->generated_text) continue;
            $num = str_pad($i, 2, '0', STR_PAD_LEFT);
            $title = htmlspecialchars($sectionTitles[$key]);
            $tocHtml .= "
            <div style='display: block; clear: both; margin-bottom: 15px; border-bottom: 1px dotted #cbd5e1; padding-bottom: 5px;'>
                <span style='color: #2563eb; font-weight: bold; margin-right: 10px;'>{$num}</span>
                <span style='color: #1e293b;'>{$title}</span>
            </div>";
            $i++;
        }
        return $tocHtml;
    }

    //default template
    public function buildPdfHtml($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench = false)
    {
        // 1. PREPARE THE CONTENT FIRST
        $sectionsHtml = '';
        $number = 1;
        foreach ($sectionOrder as $key) {
            $section = $sections[$key] ?? null;
            if (!$section || !$section->generated_text) continue;

            $content = $this->markdownToHtml($section->generated_text);
            
            // Inject financial tables if this is the financial section
            if ($key === 'financial_plan' && isset($section->chart_data)) {
                $chartData = is_array($section->chart_data) ? $section->chart_data : json_decode($section->chart_data, true);
                if ($chartData) {
                    $content .= $this->buildFinancialTables($chartData, $isFrench);
                }
            }

            $title = $sectionTitles[$key];
            $num = str_pad($number, 2, '0', STR_PAD_LEFT);

            $sectionsHtml .= "
            <div class='content-page section-break'>
                <div class='section-number'>" . ($isFrench ? 'SECTION' : 'SECTION') . " {$num}</div>
                <h1 class='section-title'>{$title}</h1>
                <div class='blue-line'></div>
                <div class='text-block'>{$content}</div>
            </div>";
            $number++;
        }

        $industry = $inputJson['industry'] ?? '—';
        $location = $inputJson['location'] ?? '—';
        $founders = $inputJson['founders'] ?? '—';

        // 2. THE HTML STRUCTURE 
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
            /* Global Reset */
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
            
            body { font-family: 'Helvetica', sans-serif; background: white; }

            /* THE COVER - Independent of everything */
            #cover-page {
                width: 210mm;
                height: 297mm;
                background-color: #1a2540;
                color: #ffffff;
                display: block;
                position: relative;
                overflow: hidden;
                text-align: center;
            }
            .cover-body { padding: 100px 60px; }
            .c-name { font-size: 38pt; font-weight: bold; margin-top: 80px; color: #ffffff; }
            .c-sub { font-size: 14pt; letter-spacing: 5px; color: #60a5fa; margin: 20px 0 60px; text-transform: uppercase; }
            .c-line { width: 60px; height: 4px; background: #2563eb; margin: 0 auto 60px; }
            .c-meta { margin-bottom: 25px; }
            .c-label { font-size: 8pt; color: #94a3b8; text-transform: uppercase; }
            .c-val { font-size: 13pt; color: #f8fafc; margin-top: 5px; }

            /* CONTENT PAGES - Use padding to simulate margins */
            .content-page {
                page-break-before: always;
                padding: 2.5cm 2cm;
                min-height: 297mm;
                color: #1e293b;
            }
            .section-number { font-size: 9pt; color: #2563eb; font-weight: bold; letter-spacing: 2px; }
            .section-title { font-size: 26pt; color: #1a2540; margin: 10px 0; }
            .blue-line { height: 3px; background: #2563eb; width: 50px; margin-bottom: 35px; }
            .text-block { line-height: 1.7; font-size: 10.5pt; text-align: justify; }

            /* PAGE NUMBERING - Only visible on non-cover pages */
            .footer {
                position: fixed;
                bottom: 1cm;
                width: 100%;
                text-align: center;
                font-size: 8pt;
                color: #94a3b8;
            }
            .pagenum:before { content: counter(page); }

            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 9pt; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 9pt; }
        </style></head><body><div id='cover-page'><div class='cover-body'><div class='c-name'>".htmlspecialchars($companyName)."</div><div class='c-sub'>BUSINESS PLAN</div><div class='c-line'></div><div class='c-meta'><div class='c-label'>Industry</div><div class='c-val'>".htmlspecialchars($industry)."</div></div><div class='c-meta'><div class='c-label'>Location</div><div class='c-val'>".htmlspecialchars($location)."</div></div><div class='c-meta'><div class='c-label'>Founders</div><div class='c-val'>".htmlspecialchars($founders)."</div></div><div style='margin-top: 100px; opacity: 0.5; color: #94a3b8;'>Prepared {$date}</div></div></div><div class='footer'>Page <span class='pagenum'></span></div><div class='content-page'>
                <h2 style='font-size: 22pt; color: #1a2540; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>" . ($isFrench ? 'Table des Matières' : 'Table of Contents') . "</h2>
                " . $this->generateTocItems($sectionOrder, $sections, $sectionTitles) . "
            </div>{$sectionsHtml}</body></html>";
    }

    //template 2 Modern Minimal
    public function buildTemplate2($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench = false)
    {
        // 1. PREPARE THE CONTENT FIRST
        $sectionsHtml = '';
        $number = 1;
        foreach ($sectionOrder as $key) {
            $section = $sections[$key] ?? null;
            if (!$section || !$section->generated_text) continue;

            $content = $this->markdownToHtml($section->generated_text);
            
            // Inject financial tables if this is the financial section
            if ($key === 'financial_plan' && isset($section->chart_data)) {
                $chartData = is_array($section->chart_data) ? $section->chart_data : json_decode($section->chart_data, true);
                if ($chartData) {
                    $content .= $this->buildFinancialTables($chartData, $isFrench);
                }
            }

            $title = $sectionTitles[$key];
            $num = str_pad($number, 2, '0', STR_PAD_LEFT);

            $sectionsHtml .= "
            <div class='content-page section-break'>
                <div class='section-number'>" . ($isFrench ? 'SECTION' : 'SECTION') . " {$num}</div>
                <h1 class='section-title'>{$title}</h1>
                <div class='blue-line'></div>
                <div class='text-block'>{$content}</div>
            </div>";
            $number++;
        }

        $industry = $inputJson['industry'] ?? '—';
        $location = $inputJson['location'] ?? '—';
        $founders = $inputJson['founders'] ?? '—';

        // 2. THE HTML STRUCTURE
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
            /* Global Reset */
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
            
            body { font-family: 'Helvetica', sans-serif; background: white; }

            /* THE COVER */
            #cover-page {
                width: 210mm;
                height: 297mm;
                background-color: #ffffff;
                border-left: 20px solid #2563eb;
                color: #1a2540;
                display: block;
                position: relative;
                overflow: hidden;
            }
            .cover-body { padding: 100px 80px; }
            .c-name { font-size: 38pt; font-weight: bold; margin-top: 80px; color: #1e293b; }
            .c-sub { font-size: 14pt; letter-spacing: 5px; color: #2563eb; margin: 20px 0 60px; text-transform: uppercase; }
            .c-line { width: 60px; height: 4px; background: #2563eb; margin-bottom: 60px; }
            .c-meta { margin-bottom: 25px; }
            .c-label { font-size: 8pt; color: #94a3b8; text-transform: uppercase; }
            .c-val { font-size: 13pt; color: #1e293b; margin-top: 5px; }

            /* CONTENT PAGES */
            .content-page {
                page-break-before: always;
                padding: 2.5cm 2cm;
                min-height: 297mm;
                color: #1e293b;
            }
            .section-number { font-size: 9pt; color: #2563eb; font-weight: bold; letter-spacing: 2px; }
            .section-title { font-size: 26pt; color: #1a2540; margin: 10px 0; }
            .blue-line { height: 3px; background: #2563eb; width: 50px; margin-bottom: 35px; }
            .text-block { line-height: 1.7; font-size: 10.5pt; text-align: justify; }

            /* FINANCIAL TABLES STYLING */
            table { width: 100%; border-collapse: collapse; margin: 25px 0; table-layout: fixed; }
            th { background: #f8fafc; color: #1a2540; padding: 12px 10px; text-align: left; border-bottom: 2px solid #2563eb; font-size: 9pt; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 9pt; color: #334155; }
            tr:nth-child(even) { background-color: #fcfcfc; }

            /* FOOTER */
            .footer {
                position: fixed;
                bottom: 1cm;
                width: 100%;
                text-align: center;
                font-size: 8pt;
                color: #94a3b8;
            }
            .pagenum:before { content: counter(page); }
        </style></head><body><div id='cover-page'><div class='cover-body'><div class='c-name'>".htmlspecialchars($companyName)."</div><div class='c-sub'>BUSINESS PLAN</div><div class='c-line'></div><div class='c-meta'><div class='c-label'>Industry</div><div class='c-val'>".htmlspecialchars($industry)."</div></div><div class='c-meta'><div class='c-label'>Location</div><div class='c-val'>".htmlspecialchars($location)."</div></div><div class='c-meta'><div class='c-label'>Founders</div><div class='c-val'>".htmlspecialchars($founders)."</div></div><div style='margin-top: 100px; opacity: 0.5; color: #94a3b8;'>Prepared {$date}</div></div></div><div class='footer'>Page <span class='pagenum'></span></div><div class='content-page'>
                    <h2 style='font-size: 22pt; color: #1a2540; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>" . ($isFrench ? 'Table des Matières' : 'Table of Contents') . "</h2>
                    " . $this->generateTocItems($sectionOrder, $sections, $sectionTitles) . "
                </div>{$sectionsHtml}</body></html>";
    }

    //template 3 Bold Executive
    private function buildTemplate3($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench = false): string
    {
        $sectionsHtml = '';
        $number = 1;
        foreach ($sectionOrder as $key) {
            $section = $sections[$key] ?? null;
            if (!$section || !$section->generated_text) continue;
            
            $content = $this->markdownToHtml($section->generated_text);
            
            if ($key === 'financial_plan' && isset($section->chart_data)) {
                $chartData = is_array($section->chart_data) ? $section->chart_data : json_decode($section->chart_data, true);
                if ($chartData) $content .= $this->buildFinancialTables($chartData, $isFrench);
            }
            
            $num = str_pad($number, 2, '0', STR_PAD_LEFT);
            $sectionsHtml .= "
            <div class='content-page'>
                <table style='width:100%; background:#000; border-left: 5px solid #F59E0B; margin-bottom:30px; border-collapse: collapse;'>
                    <tr><td style='padding:15px 25px;'>
                        <span style='color:#F59E0B; font-size:8pt; margin-right:15px; letter-spacing: 2px;'>SECTION {$num}</span>
                        <span style='color:#fff; font-size:14pt; font-weight:bold; text-transform:uppercase;'>{$sectionTitles[$key]}</span>
                    </td></tr>
                </table>
                <div class='text-block'>{$content}</div>
            </div>";
            $number++;
        }

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; }
            body { font-family: 'Helvetica', sans-serif; background: #fff; margin: 0; }
            
            #cover-page { width: 210mm; height: 297mm; background: #000; color: #fff; padding: 100px 72px; position: relative; }
            .c-name { font-size: 44pt; font-weight: bold; margin: 20px 0; }
            
            .content-page { page-break-before: always; padding: 2.5cm 2cm; min-height: 290mm; color: #1a1a1a; }
            .text-block { line-height: 1.7; font-size: 10.5pt; text-align: justify; }

            /* FINANCIAL TABLES STYLING (Bold Executive Theme) */
            table { width: 100%; border-collapse: collapse; margin: 25px 0; table-layout: fixed; }
            th { background: #1a1a1a; color: #F59E0B; padding: 12px 10px; text-align: left; font-size: 9pt; border-bottom: 2px solid #F59E0B; text-transform: uppercase; letter-spacing: 1px; }
            td { padding: 10px; border-bottom: 1px solid #e5e5e5; font-size: 9pt; color: #333; }
            tr:nth-child(even) td { background-color: #fffbeb; } /* Subtle gold-tint for zebra striping */

            .footer { position: fixed; bottom: 1cm; right: 2cm; font-size: 8pt; color: #F59E0B; }
            .pagenum:before { content: counter(page); }
        </style></head><body>
        <div id='cover-page'>
            <div style='font-size: 8pt; color: #F59E0B; letter-spacing: 5px;'>BUSINESS PLAN</div>
            <div class='c-name'>".htmlspecialchars($companyName)."</div>
            <div style='width: 100%; height: 1px; background: #F59E0B; margin-bottom: 50px;'></div>
            <table style='width: 100%; color: #fff; border: none;'>
                <tr><td style='font-size: 7pt; color: #F59E0B; padding-bottom: 5px; border:none; background:none;'>INDUSTRY</td></tr>
                <tr><td style='font-size: 12pt; padding-bottom: 25px; border:none; background:none;'>".htmlspecialchars($inputJson['industry'])."</td></tr>
                <tr><td style='font-size: 7pt; color: #F59E0B; padding-bottom: 5px; border:none; background:none;'>LOCATION</td></tr>
                <tr><td style='font-size: 12pt; padding-bottom: 25px; border:none; background:none;'>".htmlspecialchars($inputJson['location'])."</td></tr>
                <tr><td style='font-size: 7pt; color: #F59E0B; padding-bottom: 5px; border:none; background:none;'>FOUNDERS</td></tr>
                <tr><td style='font-size: 12pt; border:none; background:none;'>".htmlspecialchars($inputJson['founders'])."</td></tr>
            </table>
            <div style='position: absolute; bottom: 80px; color: #666; font-size: 8pt;'>Prepared {$date}</div>
        </div>
        <div class='footer'>Page <span class='pagenum'></span></div>
        <div class='content-page'>
            <h2 style='font-size: 18pt; border-left: 4px solid #F59E0B; padding-left: 15px; margin-bottom: 30px;'>" . ($isFrench ? 'Table des Matières' : 'Table of Contents') . "</h2>
            " . $this->generateTocItems($sectionOrder, $sections, $sectionTitles) . "
        </div>
        {$sectionsHtml}</body></html>";
    }

    //template 4 Clean Green
    private function buildTemplate4($companyName, $date, $inputJson, $sections, $sectionOrder, $sectionTitles, $isFrench = false): string
    {
        $sectionsHtml = '';
        $number = 1;
        foreach ($sectionOrder as $key) {
            $section = $sections[$key] ?? null;
            if (!$section || !$section->generated_text) continue;
            $content = $this->markdownToHtml($section->generated_text);
            if ($key === 'financial_plan' && isset($section->chart_data)) {
                $chartData = is_array($section->chart_data) ? $section->chart_data : json_decode($section->chart_data, true);
                if ($chartData) $content .= $this->buildFinancialTables($chartData, $isFrench);
            }
            $num = str_pad($number, 2, '0', STR_PAD_LEFT);
            $sectionsHtml .= "<div class='content-page'><div style='font-size: 8pt; color: #00B981; font-weight: bold; letter-spacing: 3px;'>SECTION {$num}</div><h1 style='font-size: 26pt; font-weight: bold; color: #1e293b; margin: 5px 0 10px;'>{$sectionTitles[$key]}</h1><div style='height: 3px; background: #00B981; width: 60px; margin-bottom: 30px;'></div><div class='text-block'>{$content}</div></div>";
            $number++;
        }

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'><style>
            @page { margin: 0; size: A4; }
            body { font-family: 'Helvetica', sans-serif; margin: 0; }
            .content-page { page-break-before: always; padding: 2.5cm 2cm; min-height: 290mm; }
            .text-block { line-height: 1.7; font-size: 10.5pt; text-align: justify; }
            /* Table Styling */
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #00B981; color: #fff; padding: 10px; text-align: left; font-size: 9pt; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 9pt; }
            tr:nth-child(even) td { background: #f0fdf4; }
            .footer { position: fixed; bottom: 1cm; left: 2cm; font-size: 8pt; color: #94a3b8; }
            .pagenum:before { content: counter(page); }
        </style></head><body>
        <div id='cover-page' style='width: 210mm; height: 297mm;'>
            <div style='background: #00B981; height: 110mm; padding: 80px 72px; color: white;'>
                <div style='font-size: 8pt; letter-spacing: 4px; opacity: 0.8;'>BUSINESS PLAN</div>
                <div style='font-size: 38pt; font-weight: bold; margin-top: 20px;'>".htmlspecialchars($companyName)."</div>
            </div>
            <div style='background: #f0fdf4; height: 187mm; padding: 60px 72px;'>
                <table style='width: 100%; border: none;'>
                    <tr><td style='font-size: 7pt; color: #00B981; font-weight: bold; padding-bottom: 5px; border:none; background:none;'>INDUSTRY</td></tr>
                    <tr><td style='font-size: 12pt; padding-bottom: 25px; border:none; background:none;'>".htmlspecialchars($inputJson['industry'])."</td></tr>
                    <tr><td style='font-size: 7pt; color: #00B981; font-weight: bold; padding-bottom: 5px; border:none; background:none;'>LOCATION</td></tr>
                    <tr><td style='font-size: 12pt; padding-bottom: 25px; border:none; background:none;'>".htmlspecialchars($inputJson['location'])."</td></tr>
                    <tr><td style='font-size: 7pt; color: #00B981; font-weight: bold; padding-bottom: 5px; border:none; background:none;'>FOUNDERS</td></tr>
                    <tr><td style='font-size: 12pt; border:none; background:none;'>".htmlspecialchars($inputJson['founders'])."</td></tr>
                </table>
                <div style='margin-top: 50px; font-size: 8pt; color: #94a3b8;'>Prepared {$date}</div>
            </div>
        </div>
        <div class='footer'>Page <span class='pagenum'></span></div>
        <div class='content-page'><h2 style='font-size: 18pt; color: #00B981; margin-bottom: 30px;'>Table of Contents</h2>".$this->generateTocItems($sectionOrder, $sections, $sectionTitles)."</div>
        {$sectionsHtml}</body></html>";
    }

    private function buildFinancialTables(array $chartData, bool $isFrench = false): string
    {
        $revenue   = $chartData['revenue'] ?? [0, 0, 0];
        $costs     = $chartData['costs']   ?? [0, 0, 0];
        $profit    = $chartData['profit']  ?? [0, 0, 0];
        $breakdown1 = $chartData['cost_breakdown_y1'] ?? [];
        $breakdown2 = $chartData['cost_breakdown_y2'] ?? [];
        $breakdown3 = $chartData['cost_breakdown_y3'] ?? [];

        $projTitle   = $isFrench ? 'Projections Financières'   : 'Financial Projections';
        $breakTitle  = $isFrench ? 'Répartition des Coûts'     : 'Cost Breakdown';
        $metricLabel = $isFrench ? 'Indicateur'                : 'Metric';
        $y1Label     = $isFrench ? 'Année 1'                   : 'Year 1';
        $y2Label     = $isFrench ? 'Année 2'                   : 'Year 2';
        $y3Label     = $isFrench ? 'Année 3'                   : 'Year 3';
        $revLabel    = $isFrench ? 'Revenus'                   : 'Revenue';
        $costLabel   = $isFrench ? 'Coûts'                     : 'Costs';
        $profLabel   = $isFrench ? 'Bénéfice'                  : 'Profit';
        $catLabel    = $isFrench ? 'Catégorie'                 : 'Category';
        $devLabel    = $isFrench ? 'Développement'             : 'Development';
        $mktLabel    = $isFrench ? 'Marketing'                 : 'Marketing';
        $opsLabel    = $isFrench ? 'Opérations'                : 'Operations';
        $beLabel     = $isFrench ? 'Seuil de rentabilité'      : 'Break-even';
        $monthLabel  = $isFrench ? 'Mois'                      : 'Month';
        $growthLabel = $isFrench ? 'Croissance mensuelle'      : 'Monthly Growth';

        return "
        <div style='margin: 24px 0;'>
            <h3 style='color: #2563eb; margin-bottom: 12px;'>{$projTitle}</h3>
            <table>
                <tr>
                    <th>{$metricLabel}</th>
                    <th>{$y1Label}</th>
                    <th>{$y2Label}</th>
                    <th>{$y3Label}</th>
                </tr>
                <tr>
                    <td><strong>{$revLabel}</strong></td>
                    <td>\${$revenue[0]}</td>
                    <td>\${$revenue[1]}</td>
                    <td>\${$revenue[2]}</td>
                </tr>
                <tr>
                    <td><strong>{$costLabel}</strong></td>
                    <td>\${$costs[0]}</td>
                    <td>\${$costs[1]}</td>
                    <td>\${$costs[2]}</td>
                </tr>
                <tr>
                    <td><strong>{$profLabel}</strong></td>
                    <td>\${$profit[0]}</td>
                    <td>\${$profit[1]}</td>
                    <td>\${$profit[2]}</td>
                </tr>
            </table>

            <h3 style='color: #2563eb; margin: 20px 0 12px;'>{$breakTitle}</h3>
            <table>
                <tr>
                    <th>{$catLabel}</th>
                    <th>{$y1Label}</th>
                    <th>{$y2Label}</th>
                    <th>{$y3Label}</th>
                </tr>
                <tr>
                    <td><strong>{$devLabel}</strong></td>
                    <td>\$" . ($breakdown1['development'] ?? 0) . "</td>
                    <td>\$" . ($breakdown2['development'] ?? 0) . "</td>
                    <td>\$" . ($breakdown3['development'] ?? 0) . "</td>
                </tr>
                <tr>
                    <td><strong>{$mktLabel}</strong></td>
                    <td>\$" . ($breakdown1['marketing'] ?? 0) . "</td>
                    <td>\$" . ($breakdown2['marketing'] ?? 0) . "</td>
                    <td>\$" . ($breakdown3['marketing'] ?? 0) . "</td>
                </tr>
                <tr>
                    <td><strong>{$opsLabel}</strong></td>
                    <td>\$" . ($breakdown1['operations'] ?? 0) . "</td>
                    <td>\$" . ($breakdown2['operations'] ?? 0) . "</td>
                    <td>\$" . ($breakdown3['operations'] ?? 0) . "</td>
                </tr>
            </table>

            <div style='display: flex; gap: 20px; margin-top: 16px;'>
                <div style='background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 12px 20px; text-align: center;'>
                    <div style='font-size: 9pt; color: #64748b;'>{$beLabel}</div>
                    <div style='font-size: 16pt; font-weight: 700; color: #2563eb;'>{$monthLabel} {$chartData['breakeven_month']}</div>
                </div>
                <div style='background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 12px 20px; text-align: center;'>
                    <div style='font-size: 9pt; color: #64748b;'>ARPU</div>
                    <div style='font-size: 16pt; font-weight: 700; color: #2563eb;'>\${$chartData['arpu']}</div>
                </div>
                <div style='background: #eff6ff; border: 1px solid #2563eb; border-radius: 8px; padding: 12px 20px; text-align: center;'>
                    <div style='font-size: 9pt; color: #64748b;'>{$growthLabel}</div>
                    <div style='font-size: 16pt; font-weight: 700; color: #2563eb;'>{$chartData['monthly_growth_rate']}%</div>
                </div>
            </div>
        </div>";
    }

    private function markdownToHtml(string $text): string
    {
        // Remove excessive asterisks used as decorators
        $text = preg_replace('/^\*{3,}$/m', '<hr/>', $text);
        
        // Headings
        $text = preg_replace('/^#### (.+)$/m', '<h4>$1</h4>', $text);
        $text = preg_replace('/^### (.+)$/m', '<h3>$1</h3>', $text);
        $text = preg_replace('/^## (.+)$/m', '<h2>$1</h2>', $text);
        $text = preg_replace('/^# (.+)$/m', '<h1>$1</h1>', $text);
        
        // Bold and italic
        $text = preg_replace('/\*\*\*(.+?)\*\*\*/s', '<strong><em>$1</em></strong>', $text);
        $text = preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $text);
        $text = preg_replace('/\*(.+?)\*/s', '<em>$1</em>', $text);
        
        // Horizontal rules
        $text = preg_replace('/^---+$/m', '<hr/>', $text);
        
        // Ordered lists
        $text = preg_replace('/^\d+\.\s+(.+)$/m', '<li>$1</li>', $text);
        
        // Unordered lists
        $text = preg_replace('/^[-*]\s+(.+)$/m', '<li>$1</li>', $text);
        
        // Wrap consecutive li items in ul
        $text = preg_replace('/(<li>.*<\/li>[\n\r]*)+/s', '<ul>$0</ul>', $text);
        
        // Paragraphs — wrap non-HTML lines
        $lines = explode("\n", $text);
        $result = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            if (preg_match('/^<(h[1-4]|ul|li|hr|table|tr|th|td)/', $line)) {
                $result[] = $line;
            } else {
                $result[] = "<p>{$line}</p>";
            }
        }
        
        return implode("\n", $result);
    }

    //BMC Export function
    public function exportBmc(Request $request, $id)
    {
        $businessPlan = BusinessPlan::with(['bmc', 'project.company'])->find($id);

        if (!$businessPlan || $businessPlan->project->company->user_id !== $request->user()->id) {
            abort(403);
        }

        $limits = app(PlanLimitsService::class);

        if (!$limits->canExportBmc($request->user())) {
            return response()->json(['message' => 'upgrade_required', 'reason' => 'bmc'], 403);
        }

        $bmc = $businessPlan->bmc;
        if (!$bmc) {
            abort(404);
        }

        $language = $businessPlan->language ?? 'english';
        $isFrench = strtolower($language) === 'french';

        $companySection = $businessPlan->planSections->where('section_name', 'company_presentation')->first();
        $inputJson = $companySection ? (is_string($companySection->input_json) ? json_decode($companySection->input_json, true) : $companySection->input_json) : [];
        $companyName = $inputJson['company_name'] ?? $businessPlan->title;
        $date = now()->format('F j, Y');

        $fields = [
            'key_partners'           => $isFrench ? 'Partenaires Clés'         : 'Key Partners',
            'key_activities'         => $isFrench ? 'Activités Clés'           : 'Key Activities',
            'key_resources'          => $isFrench ? 'Ressources Clés'          : 'Key Resources',
            'value_propositions'     => $isFrench ? 'Proposition de Valeur'    : 'Value Propositions',
            'customer_relationships' => $isFrench ? 'Relations Clients'        : 'Customer Relationships',
            'customer_segments'      => $isFrench ? 'Segments Clients'         : 'Customer Segments',
            'channels'               => $isFrench ? 'Canaux'                   : 'Channels',
            'cost'                   => $isFrench ? 'Structure des Coûts'      : 'Cost Structure',
            'revenue_streams'        => $isFrench ? 'Sources de Revenus'       : 'Revenue Streams',
        ];

        $titleLabel    = $isFrench ? 'Business Model Canvas' : 'Business Model Canvas';
        $preparedLabel = $isFrench ? 'Préparé le'            : 'Prepared';
        $naLabel       = $isFrench ? 'Non disponible'        : 'Not available';

        $cardsHtml = '';
        foreach ($fields as $key => $label) {
            $value = $bmc->$key ?? $naLabel;
            $cardsHtml .= "
            <div style='border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; break-inside: avoid; margin-bottom: 16px;'>
                <div style='font-size: 8pt; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;'>{$label}</div>
                <div style='font-size: 10pt; color: #1e293b; line-height: 1.6;'>{$value}</div>
            </div>";
        }

        $template = (int) $request->input('template',1);
        $html = match($template) {
            2 => $this->buildBmcTemplate2($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench),
            3 => $this->buildBmcTemplate3($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench),
            4 => $this->buildBmcTemplate4($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench),
            default => $this->buildBmcTemplate1($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench),
        };

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'Arial');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        $filename = str_replace(' ', '_', $companyName) . '_BMC.pdf';

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function buildBmcTemplate1($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench): string
    {
        // The table generation call
        $cardsHtml = $this->buildBmcTable($bmc, $fields, $naLabel, '#2563eb', '#1a2540', '#ffffff', '#e2e8f0');

        return "<!DOCTYPE html>
        <html><head><meta charset='UTF-8'/>
        <style>
            /* Reset and Global Styles */
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; }
            body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; background: white; font-size: 8pt; line-height: 1.2; }
            
            /* Landscape setup with tighter margins to prevent overflow */
            @page { margin: 10mm; size: A4 landscape; }

            /* Compact Header to save vertical space */
            .container { width: 100%; display: block; }
            .header { 
                text-align: left; 
                padding-bottom: 10px; 
                margin-bottom: 15px; 
                border-bottom: 2px solid #2563eb; 
                position: relative;
            }
            .company { font-size: 16pt; font-weight: 700; color: #1a2540; }
            .bmc-title { font-size: 10pt; font-weight: 700; color: #2563eb; letter-spacing: 1px; text-transform: uppercase; }
            .date { font-size: 7pt; color: #94a3b8; position: absolute; right: 0; top: 10px; }

            /* Ensure the table container doesn't force a break */
            .bmc-wrapper { width: 100%; display: block; page-break-inside: avoid; }
            
            /* styling for the actual BMC tables if they aren't fully styled in buildBmcTable */
            table { border-collapse: collapse; width: 100%; table-layout: fixed; }
        </style></head><body>
        <div class='container'>
            <div class='header'>
                <div class='company'>" . htmlspecialchars($companyName) . "</div>
                <div class='bmc-title'>{$titleLabel}</div>
                <div class='date'>{$preparedLabel} {$date}</div>
            </div>
            <div class='bmc-wrapper'>
                {$cardsHtml}
            </div>
        </div>
        </body></html>";
    }

    private function buildBmcTemplate2($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench): string
    {
        $cardsHtml = $this->buildBmcTable($bmc, $fields, $naLabel, '#00D4FF', '#000000', '#f8f8f8', '#eeeeee');
        
        return "<!DOCTYPE html>
        <html><head><meta charset='UTF-8'/>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; }
            body { font-family: 'Helvetica', Arial, sans-serif; color: #111; background: white; font-size: 8pt; }
            
            /* Landscape setup with tight vertical margins */
            @page { margin: 8mm 10mm; size: A4 landscape; }

            .container { width: 100%; display: block; }

            /* Table header is more stable for PDF engine flow control */
            .header-table { 
                width: 100%; 
                margin-bottom: 12px; 
                border-left: 6px solid #00D4FF; 
                background: #fafafa;
            }
            .header-td { padding: 12px 20px; }
            
            .company { font-size: 17pt; font-weight: 700; color: #000; line-height: 1.1; }
            .bmc-title { font-size: 9pt; color: #00D4FF; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
            .date { font-size: 7pt; color: #999; text-align: right; vertical-align: bottom; padding: 12px 20px; }

            .bmc-wrapper { width: 100%; display: block; page-break-inside: avoid; }
        </style></head><body>
        <div class='container'>
            <table class='header-table'>
                <tr>
                    <td class='header-td'>
                        <div class='company'>" . htmlspecialchars($companyName) . "</div>
                        <div class='bmc-title'>{$titleLabel}</div>
                    </td>
                    <td class='date'>
                        {$preparedLabel} {$date}
                    </td>
                </tr>
            </table>
            
            <div class='bmc-wrapper'>
                {$cardsHtml}
            </div>
        </div>
        </body></html>";
    }

    private function buildBmcTemplate3($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench): string
    {
        $cardsHtml = $this->buildBmcTable($bmc, $fields, $naLabel, '#F59E0B', '#000000', '#fffbeb', '#e5e5e5');
        
        return "<!DOCTYPE html>
        <html><head><meta charset='UTF-8'/>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; }
            body { font-family: 'Helvetica', Arial, sans-serif; color: #1a1a1a; background: white; font-size: 8pt; }
            
            /* Landscape setup: No top margin to allow the black header to sit flush if needed, 
            or very small margin to maximize vertical space */
            @page { margin: 8mm 12mm; size: A4 landscape; }

            .container { width: 100%; display: block; }

            /* Stable Table-based header replacing Flexbox */
            .header-table { 
                width: 100%; 
                background: #000; 
                color: #fff; 
                margin-bottom: 15px; 
                border-collapse: collapse;
            }
            .header-left { padding: 15px 25px; text-align: left; }
            .header-right { padding: 15px 25px; text-align: right; vertical-align: bottom; }
            
            .company { font-size: 18pt; font-weight: 700; color: #ffffff; line-height: 1.1; }
            .bmc-title { font-size: 9pt; color: #F59E0B; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
            .date { font-size: 8pt; color: #999; }

            /* Force content to stay together */
            .bmc-wrapper { width: 100%; display: block; page-break-inside: avoid; }
        </style></head><body>
        <div class='container'>
            <table class='header-table'>
                <tr>
                    <td class='header-left'>
                        <div class='company'>" . htmlspecialchars($companyName) . "</div>
                        <div class='bmc-title'>{$titleLabel}</div>
                    </td>
                    <td class='header-right'>
                        <div class='date'>{$preparedLabel} {$date}</div>
                    </td>
                </tr>
            </table>
            
            <div class='bmc-wrapper'>
                {$cardsHtml}
            </div>
        </div>
        </body></html>";
    }

    private function buildBmcTemplate4($bmc, $companyName, $date, $fields, $titleLabel, $preparedLabel, $naLabel, $isFrench): string
    {
        $cardsHtml = $this->buildBmcTable($bmc, $fields, $naLabel, '#00B981', '#00B981', '#f0fdf4', '#d1fae5');
        
        return "<!DOCTYPE html>
        <html><head><meta charset='UTF-8'/>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust: exact; }
            body { font-family: 'Helvetica', Arial, sans-serif; color: #1e293b; background: white; font-size: 8pt; }
            
            /* Landscape setup: Reduced margins to prevent the 'overflow jump' to page 2 */
            @page { margin: 8mm 12mm; size: A4 landscape; }

            .container { width: 100%; display: block; }

            /* Stable Header Table */
            .header-table { 
                width: 100%; 
                background: #00B981; 
                margin-bottom: 15px; 
                border-collapse: collapse;
            }
            .header-td { padding: 15px 25px; text-align: left; }
            .header-right { padding: 15px 25px; text-align: right; vertical-align: bottom; }
            
            .company { font-size: 18pt; font-weight: 700; color: #ffffff; line-height: 1.1; }
            /* Using solid hex for better PDF compatibility over rgba */
            .bmc-title { font-size: 9pt; color: #e2f9f1; letter-spacing: 3px; text-transform: uppercase; margin-top: 2px; }
            .date { font-size: 8pt; color: #d1fae5; }

            /* Prevent page breaks within the BMC table block */
            .bmc-wrapper { width: 100%; display: block; page-break-inside: avoid; }
        </style></head><body>
        <div class='container'>
            <table class='header-table'>
                <tr>
                    <td class='header-td'>
                        <div class='company'>" . htmlspecialchars($companyName) . "</div>
                        <div class='bmc-title'>{$titleLabel}</div>
                    </td>
                    <td class='header-right'>
                        <div class='date'>{$preparedLabel} {$date}</div>
                    </td>
                </tr>
            </table>
            
            <div class='bmc-wrapper'>
                {$cardsHtml}
            </div>
        </div>
        </body></html>";
    }

    private function buildBmcTable($bmc, $fields, $naLabel, $accentColor, $headerBg, $cellBg, $borderColor): string
    {
        return "
        <table style='width:100%; height:180mm; border-collapse:collapse; table-layout:fixed;'>
            <tr style='height:60mm;'>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['key_partners']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->key_partners ?? $naLabel) . "</div>
                </td>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['key_activities']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->key_activities ?? $naLabel) . "</div>
                </td>
                <td rowspan='2' style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['value_propositions']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->value_propositions ?? $naLabel) . "</div>
                </td>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['customer_relationships']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->customer_relationships ?? $naLabel) . "</div>
                </td>
                <td rowspan='2' style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['customer_segments']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->customer_segments ?? $naLabel) . "</div>
                </td>
            </tr>
            <tr style='height:60mm;'>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['key_resources']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->key_resources ?? $naLabel) . "</div>
                </td>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['channels']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->channels ?? $naLabel) . "</div>
                </td>
                <td style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['customer_relationships']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->customer_relationships ?? $naLabel) . "</div>
                </td>
            </tr>
            <tr style='height:60mm;'>
                <td colspan='2' style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['cost']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->cost ?? $naLabel) . "</div>
                </td>
                <td colspan='3' style='border:2px solid {$borderColor}; padding:12px; vertical-align:top; background:{$cellBg};'>
                    <div style='font-size:7pt; font-weight:700; color:{$accentColor}; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px;'>{$fields['revenue_streams']}</div>
                    <div style='font-size:8.5pt; line-height:1.5;'>" . ($bmc->revenue_streams ?? $naLabel) . "</div>
                </td>
            </tr>
        </table>";
    }

}