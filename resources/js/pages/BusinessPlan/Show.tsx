import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Check, X, Loader2, Lock, ChevronRight } from 'lucide-react';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Section {
    id: number;
    section_name: string;
    input_json: Record<string, string>;
    generated_text: string | null;
    validation_status: string;
    edited: boolean;
}

interface BusinessPlan {
    id: number;
    title: string;
    language: string;
}

interface Project {
    id: number;
    name: string;
    company_name: string;
}

interface Product {
    id: number;
    name: string;
    description: string;
}

interface Props {
    project: Project;
    business_plan: BusinessPlan | null;
    sections: Record<string, Section>;
    products: Product[];
}

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTION_DEFS: {
    key: string;
    deps: string[];
    fields: string[];
    required: string[];
    autoGenerate?: boolean;
}[] = [
    {
        key: 'company_presentation',
        deps: [],
        fields: ['company_name', 'legal_form', 'industry', 'location', 'founding_date', 'founders', 'mission', 'vision', 'history', 'products_summary'],
        required: ['company_name', 'legal_form', 'industry', 'location', 'founders', 'mission', 'products_summary'],
    },
    {
        key: 'market_analysis',
        deps: ['company_presentation'],
        fields: ['target_market', 'market_size', 'target_customer', 'competitors', 'market_trends', 'demand_drivers', 'supply_constraints'],
        required: ['target_market', 'target_customer', 'competitors', 'market_trends'],
    },
    {
        key: 'org_management',
        deps: ['company_presentation', 'market_analysis'],
        fields: ['management_team', 'governance_model', 'org_structure', 'key_departments', 'advisory_board', 'legal_setup'],
        required: ['management_team'],
    },
    {
        key: 'strategy',
        deps: ['company_presentation', 'market_analysis', 'org_management'],
        fields: ['commercial_strategy', 'sales_channels', 'revenue_streams', 'pricing_model', 'marketing_approach', 'brand_positioning', 'acquisition_channels', 'dev_roadmap', 'rd_plans', 'product_milestones'],
        required: ['commercial_strategy', 'sales_channels', 'revenue_streams', 'pricing_model', 'marketing_approach', 'brand_positioning', 'acquisition_channels', 'dev_roadmap'],
    },
    {
        key: 'operational_plan',
        deps: ['company_presentation', 'org_management', 'strategy'],
        fields: ['production_process', 'infrastructure', 'logistics', 'hiring_plan', 'calendar', 'operational_kpis'],
        required: ['production_process', 'hiring_plan', 'calendar'],
    },
    {
        key: 'financial_plan',
        deps: ['company_presentation', 'strategy', 'operational_plan'],
        fields: ['startup_costs', 'monthly_burn', 'breakeven', 'revenue_y1', 'revenue_y2', 'revenue_y3', 'funding_sources', 'financial_assumptions'],
        required: ['startup_costs', 'monthly_burn', 'revenue_y1', 'funding_sources'],
    },
    {
        key: 'risk_opportunity',
        deps: ['company_presentation', 'market_analysis', 'strategy', 'operational_plan', 'financial_plan'],
        fields: ['internal_risks', 'external_risks', 'mitigation_plans', 'opportunities', 'contingency'],
        required: ['internal_risks', 'external_risks', 'mitigation_plans', 'opportunities'],
    },
    {
        key: 'appendices',
        deps: ['company_presentation', 'financial_plan', 'risk_opportunity'],
        fields: ['appendix_docs', 'references', 'cvs_attached', 'market_links'],
        required: [],
    },
    {
        key: 'executive_summary',
        deps: ['company_presentation', 'market_analysis', 'org_management', 'strategy', 'operational_plan', 'financial_plan', 'risk_opportunity', 'appendices'],
        fields: [],
        required: [],
        autoGenerate: true,
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function BusinessPlanShow({ project, business_plan, sections, products }: Props) {
    const { t } = useTranslation();
    const [currentSection, setCurrentSection] = useState(0);
    const [sectionData, setSectionData]       = useState<Record<string, Record<string, string>>>({});
    const [localSections, setLocalSections]   = useState<Record<string, Section>>(sections);
    const [generating, setGenerating]         = useState<Record<string, boolean>>({});
    const [limitError, setLimitError]           = useState<string | null>(null);

    // Tracks which sections have been submitted this session.
    // Pre-populated from server: already-completed sections count as submitted.
    const [submitted, setSubmitted] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.keys(sections).forEach(key => {
            if (sections[key]?.validation_status === 'completed') {
                initial[key] = true;
            }
        });
        return initial;
    });


    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'),   href: '/dashboard' },
        { title: t('projects.title'), href: '/projects' },
        { title: project.name,        href: `/projects/${project.id}/business-plan` },
    ];

    const { data, setData, post, processing } = useForm({
        title:    project.name,
        language: 'english',
    });

    // ── Auto-scroll to top of main content whenever the active section changes ─
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentSection]);

    // ── Status helpers ────────────────────────────────────────────────────────

    const isCompleted  = (key: string) => localSections[key]?.validation_status === 'completed';
    const isFailed     = (key: string) => localSections[key]?.validation_status === 'failed';
    const isGenerating = (key: string) => !!generating[key];

    // Form is fillable once every dep has been submitted (sent to n8n),
    // regardless of whether n8n has finished yet.
    const isFillable = (key: string): boolean => {
        const def = SECTION_DEFS.find(s => s.key === key);
        if (!def || def.deps.length === 0) return true;
        return def.deps.every(dep => submitted[dep] || isCompleted(dep));
    };

    // Generate button is enabled only when every dep is fully COMPLETED
    // (n8n returned success → memory_summary exists in DB).
    const canGenerate = (key: string): boolean => {
        const def = SECTION_DEFS.find(s => s.key === key);
        if (!def) return false;
        return def.deps.every(dep => isCompleted(dep)) && !isGenerating(key);
    };

    const completedCount = SECTION_DEFS.filter(s => isCompleted(s.key)).length;
    const progress       = Math.round((completedCount / 9) * 100);

    // ── Field helpers ─────────────────────────────────────────────────────────

    const handleFieldChange = (sectionKey: string, field: string, value: string) => {
        setSectionData(prev => ({
            ...prev,
            [sectionKey]: { ...(prev[sectionKey] ?? {}), [field]: value },
        }));
    };

    // ── Section submission ────────────────────────────────────────────────────

    const submitSection = async (sectionKey: string) => {
        if (!business_plan) return;

        setGenerating(prev => ({ ...prev, [sectionKey]: true }));

        // Mark as submitted immediately so the next section's form unlocks
        setSubmitted(prev => ({ ...prev, [sectionKey]: true }));

        // Auto-advance view to the next section
        const currentIndex = SECTION_DEFS.findIndex(s => s.key === sectionKey);
        const nextDef = SECTION_DEFS[currentIndex + 1];

        if (nextDef && !nextDef.autoGenerate) {
            setCurrentSection(currentIndex + 1);
            // scrollTo is handled by the useEffect watching currentSection
        }

        try {
            const response = await fetch(route('sections.store', business_plan.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
                    ),
                    'X-Inertia': 'true',
                },
                body: JSON.stringify({
                    section_name: sectionKey,
                    input_json: sectionData[sectionKey] || {},
                }),
            });

            const result = await response.json();

            if (
                response.status === 403 &&
                result.message === 'weekly_limit_reached'
            ) {
                setLimitError(
                    `You've reached your weekly limit of ${result.limit} business plans. Upgrade your plan to generate more.`
                );

                setSubmitted(prev => ({
                    ...prev,
                    [sectionKey]: false,
                }));

                return;
            }

            setLocalSections(prev => ({
                ...prev,
                [sectionKey]: result,
            }));

            if (result?.validation_status === 'completed') {
                setSubmitted(prev => ({
                    ...prev,
                    [sectionKey]: true,
                }));
            }
        } catch (error) {
            console.error('Section submission failed', error);

            setLocalSections(prev => ({
                ...prev,
                [sectionKey]: {
                    ...(prev[sectionKey] ?? ({} as Section)),
                    validation_status: 'failed',
                },
            }));
        } finally {
            setGenerating(prev => ({
                ...prev,
                [sectionKey]: false,
            }));
        }
    };

    // ── No business plan yet ──────────────────────────────────────────────────

    if (!business_plan) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={project.name} />
                <div className="p-6 flex items-center justify-center min-h-[60vh]">
                    <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md">
                        <h2 className="text-2xl font-bold font-heading mb-2">{t('bp.create_title')}</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            {project.name} · {project.company_name}
                        </p>
                        <form
                            onSubmit={e => { e.preventDefault(); post(route('business-plan.store', project.id)); }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">{t('bp.plan_title')}</label>
                                <input
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">{t('bp.language')}</label>
                                <select
                                    value={data.language}
                                    onChange={e => setData('language', e.target.value)}
                                    className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent"
                                >
                                    <option value="english">English</option>
                                    <option value="french">Français</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                {t('bp.create_button')}
                            </button>
                        </form>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // ── Sidebar icon ──────────────────────────────────────────────────────────

    const getSidebarIcon = (key: string) => {
        if (isGenerating(key)) return <Loader2 className="w-4 h-4 animate-spin text-accent" />;
        if (isCompleted(key))  return <Check className="w-4 h-4 text-primary" />;
        if (isFailed(key))     return <X className="w-4 h-4 text-destructive" />;
        if (isFillable(key))   return <span className="w-2 h-2 rounded-full bg-accent/60" />;
        return <Lock className="w-4 h-4" />;
    };

    const currentDef = SECTION_DEFS[currentSection];

    // Generate button requires: deps completed + required fields filled
    const generateEnabled =
        canGenerate(currentDef.key) &&
        !currentDef.autoGenerate &&
        currentDef.required.every(f => {
            const val =
                sectionData[currentDef.key]?.[f] ??
                localSections[currentDef.key]?.input_json?.[f] ??
                '';
            return String(val).trim().length > 0;
        });

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={business_plan.title} />
            <div className="flex flex-col h-full">

                {/* Progress bar */}
                <div className="w-full h-1 bg-border">
                    <div
                        className="h-1 transition-all duration-500"
                        style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
                    />
                </div>

                {/* limit error banner */}
                {limitError && (
                    <div className="px-6 py-3 bg-destructive/10 border-b border-destructive/20 flex items-center justify-between">
                        <span className="text-sm text-destructive">{limitError}</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit(route('subscription'))}
                                className="px-4 py-1.5 rounded-xl text-xs font-medium"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                Upgrade Plan
                            </button>
                            <button onClick={() => setLimitError(null)}>
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                    </div>
                )}

                {/* "View Result" banner */}
                {completedCount === 9 && (
                    <div className="px-6 py-3 bg-accent/10 border-b border-accent/20 flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                            {t('bp.all_sections_complete')}
                        </span>
                        <button
                            onClick={() => router.visit(route('business-plan.result', business_plan.id))}
                            className="px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                        >
                            {t('bp.view_result')}
                        </button>
                    </div>
                )}

                <div className="flex flex-1 overflow-hidden">

                    {/* ── Sidebar ───────────────────────────────────────────── */}
                    <div className="w-64 border-r border-border bg-card flex flex-col p-4 gap-1 overflow-y-auto">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                            {business_plan.title}
                        </h3>
                        {SECTION_DEFS.map((section, index) => {
                            const fillable = isFillable(section.key);
                            const locked   = !fillable && !isCompleted(section.key);

                            return (
                                <button
                                    key={section.key}
                                    onClick={() => !locked && setCurrentSection(index)}
                                    disabled={locked}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                                        currentSection === index
                                            ? 'bg-accent/20 text-accent'
                                            : locked
                                            ? 'opacity-40 cursor-not-allowed'
                                            : 'hover:bg-accent/10'
                                    }`}
                                >
                                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        {getSidebarIcon(section.key)}
                                    </span>
                                    <span className="truncate">{t(`bp.sections.${section.key}`)}</span>
                                    {isGenerating(section.key) && (
                                        <span className="ml-auto w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Main content — ref enables programmatic scroll ───── */}
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold font-heading">
                                    {t(`bp.sections.${currentDef.key}`)}
                                </h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    {t(`bp.descriptions.${currentDef.key}`)}
                                </p>
                            </div>

                            {/* ── Auto-generate section (executive_summary) ─── */}
                            {currentDef.autoGenerate ? (
                                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                    <p className="text-muted-foreground mb-4">
                                        {t('bp.auto_generate_desc')}
                                    </p>
                                    <button
                                        onClick={() => submitSection(currentDef.key)}
                                        disabled={!canGenerate(currentDef.key)}
                                        className="px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
                                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                                    >
                                        {isGenerating(currentDef.key) ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {t('bp.generating')}
                                            </span>
                                        ) : t('bp.generate_summary')}
                                    </button>
                                </div>
                            ) : (
                                /* ── Regular section form ───────────────────── */
                                <div className="bg-card border border-border rounded-2xl p-6">

                                    {/* Status banners */}
                                    {isCompleted(currentDef.key) && (
                                        <div className="mb-4 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2">
                                            <Check className="w-4 h-4" />
                                            {t('bp.section_completed')}
                                        </div>
                                    )}
                                    {isFailed(currentDef.key) && (
                                        <div className="mb-4 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                                            <X className="w-4 h-4" />
                                            {t('bp.section_failed')}
                                        </div>
                                    )}
                                    {isGenerating(currentDef.key) && (
                                        <div className="mb-4 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('bp.section_generating')}
                                        </div>
                                    )}

                                    {/* Fields */}
                                    <div className="grid grid-cols-1 gap-4">
                                        {currentDef.fields.map(field => (
                                            <div key={field} className="flex flex-col gap-1">
                                                <label className="text-sm font-medium capitalize">
                                                    {t(`bp.fields.${field}`)}
                                                    {currentDef.required.includes(field) && (
                                                        <span className="text-destructive ml-1">*</span>
                                                    )}
                                                </label>

                                                {field === 'products_summary' && currentDef.key === 'company_presentation' && products.length > 0 ? (
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            value={sectionData[currentDef.key]?.['_selected_product'] || ''}
                                                            onChange={e => {
                                                                const selected = products.find(p => p.name === e.target.value);
                                                                if (selected) {
                                                                    handleFieldChange(currentDef.key, '_selected_product', selected.name);
                                                                    handleFieldChange(currentDef.key, 'products_summary', selected.description);
                                                                } else {
                                                                    handleFieldChange(currentDef.key, '_selected_product', '');
                                                                }
                                                            }}
                                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                                        >
                                                            <option value="">{t('bp.select_product')}</option>
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.name}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        <textarea
                                                            rows={3}
                                                            value={
                                                                sectionData[currentDef.key]?.['products_summary']
                                                                ?? localSections[currentDef.key]?.input_json?.['products_summary']
                                                                ?? ''
                                                            }
                                                            onChange={e => handleFieldChange(currentDef.key, 'products_summary', e.target.value)}
                                                            placeholder={t('bp.product_description_placeholder')}
                                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <textarea
                                                        rows={3}
                                                        value={
                                                            sectionData[currentDef.key]?.[field]
                                                            ?? localSections[currentDef.key]?.input_json?.[field]
                                                            ?? ''
                                                        }
                                                        onChange={e => handleFieldChange(currentDef.key, field, e.target.value)}
                                                        placeholder={t(`bp.placeholders.${field}`)}
                                                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Bottom bar */}
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                                        <div className="text-xs text-muted-foreground">
                                            {/* Deps submitted but not yet completed → waiting */}
                                            {!canGenerate(currentDef.key) && isFillable(currentDef.key) && !isCompleted(currentDef.key) && (
                                                <span className="text-warning flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    {t('bp.waiting_for_deps')}
                                                </span>
                                            )}
                                            {/* Form itself is still locked */}
                                            {!isFillable(currentDef.key) && !isCompleted(currentDef.key) && (
                                                <span className="text-warning">{t('bp.deps_not_ready')}</span>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            {currentSection > 0 && (
                                                <button
                                                    onClick={() => setCurrentSection(prev => prev - 1)}
                                                    className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent/10 transition-colors"
                                                >
                                                    {t('bp.previous')}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => submitSection(currentDef.key)}
                                                disabled={!generateEnabled || isGenerating(currentDef.key)}
                                                className="px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                                                title={!canGenerate(currentDef.key) ? t('bp.waiting_for_deps') : undefined}
                                            >
                                                {isGenerating(currentDef.key) ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        {t('bp.generating')}
                                                    </>
                                                ) : (
                                                    <>
                                                        {t('bp.generate')}
                                                        <ChevronRight className="w-4 h-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}