import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Download, Pencil, Check, X, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, LineChart, Line, ResponsiveContainer
} from 'recharts';

interface Section {
    id: number;
    section_name: string;
    generated_text: string | null;
    validation_status: string;
    edited: boolean | number;
    chart_data?: any;
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

interface Bmc {
    key_partners: string | null;
    key_activities: string | null;
    key_resources: string | null;
    value_propositions: string | null;
    customer_relationships: string | null;
    customer_segments: string | null;
    channels: string | null;
    cost: string | null;
    revenue_streams: string | null;
}

interface Props {
    business_plan: BusinessPlan;
    project: Project;
    sections: Record<string, Section>;
    bmc: Bmc | null;
    plan_type?: string;
    can_export_bmc?: boolean;
    allowed_templates?: number[];
}

const SECTION_ORDER = [
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

const BMC_FIELDS = [
    'key_partners',
    'key_activities',
    'key_resources',
    'value_propositions',
    'customer_relationships',
    'customer_segments',
    'channels',
    'cost',
    'revenue_streams',
];

const TEMPLATES = [
    {
        id: 1,
        name: 'Corporate Dark',
        description: 'Navy & blue, professional',
        preview: { cover: '#1a2540', accent: '#2563eb', text: '#ffffff', body: '#f8fafc' }
    },
    {
        id: 2,
        name: 'Modern Minimal',
        description: 'White & cyan, clean',
        preview: { cover: '#ffffff', accent: '#00D4FF', text: '#000000', body: '#ffffff' }
    },
    {
        id: 3,
        name: 'Bold Executive',
        description: 'Black & gold, powerful',
        preview: { cover: '#000000', accent: '#F59E0B', text: '#ffffff', body: '#fffbeb' }
    },
    {
        id: 4,
        name: 'Clean Green',
        description: 'White & green, fresh',
        preview: { cover: '#00B981', accent: '#00B981', text: '#ffffff', body: '#f0fdf4' }
    },
];

const stripFirstHeading = (text: string): string =>
    text.replace(/^#+\s+.+\n?/m, '').trim();

function FinancialCharts({ revenueData, costBreakdownData, breakeven, arpu, growthRate }: {
    revenueData: any[];
    costBreakdownData: any[];
    breakeven: number;
    arpu: number;
    growthRate: number;
}) {
    return (
        <div className="flex flex-col gap-6 mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Break-even</p>
                    <p className="text-2xl font-bold font-heading text-accent">Month {breakeven}</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">ARPU</p>
                    <p className="text-2xl font-bold font-heading text-primary">${arpu}</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">Monthly Growth</p>
                    <p className="text-2xl font-bold font-heading text-accent">{growthRate}%</p>
                </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">Revenue vs Costs (3 Years)</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costs" name="Costs" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name="Profit" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">Cost Breakdown by Year</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={costBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="development" name="Development" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="marketing" name="Marketing" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="operations" name="Operations" fill="#ff9f43" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">Profit Growth Trajectory</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Profit']} />
                        <Line type="monotone" dataKey="profit" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function TemplateSelector({ selectedTemplate, setSelectedTemplate, allowedTemplates = [1, 2, 3, 4] }: {
    selectedTemplate: number;
    setSelectedTemplate: (id: number) => void;
    allowedTemplates?: number[];
}) {
    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Choose a template</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TEMPLATES.map(template => {
                    const isAllowed = allowedTemplates.includes(template.id);
                    return (
                        <button
                            key={template.id}
                            onClick={() => isAllowed && setSelectedTemplate(template.id)}
                            className={`relative flex flex-col rounded-xl border-2 overflow-hidden transition-all ${!isAllowed
                                ? 'opacity-60 cursor-not-allowed border-border'
                                : selectedTemplate === template.id
                                    ? 'border-accent shadow-lg scale-[1.02]'
                                    : 'border-border hover:border-accent/50'
                                }`}
                        >
                            {!isAllowed && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
                                    <span className="text-xs font-bold text-white bg-warning/90 px-2 py-1 rounded-lg">
                                        Basic+
                                    </span>
                                </div>
                            )}
                            <div className="w-full h-20 flex flex-col" style={{ backgroundColor: template.preview.body }}>
                                <div className="h-7 w-full flex items-center justify-center gap-1 px-2" style={{ backgroundColor: template.preview.cover }}>
                                    <div className="h-1.5 rounded-full w-8" style={{ backgroundColor: template.preview.accent }} />
                                    <div className="h-1 rounded-full w-4 opacity-60" style={{ backgroundColor: template.preview.text }} />
                                </div>
                                <div className="flex-1 p-2 flex flex-col gap-1 justify-center">
                                    <div className="h-1.5 rounded-full w-3/4" style={{ backgroundColor: template.preview.accent, opacity: 0.8 }} />
                                    <div className="h-1 rounded-full w-full opacity-20" style={{ backgroundColor: '#000' }} />
                                    <div className="h-1 rounded-full w-5/6 opacity-20" style={{ backgroundColor: '#000' }} />
                                </div>
                            </div>
                            <div className={`px-2 py-1.5 text-left ${selectedTemplate === template.id ? 'bg-accent/10' : 'bg-card'}`}>
                                <p className={`text-xs font-semibold ${selectedTemplate === template.id ? 'text-accent' : 'text-foreground'}`}>
                                    {template.name}
                                </p>
                                <p className="text-xs text-muted-foreground">{template.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function BusinessPlanResult({ business_plan, project, sections, bmc, plan_type = 'free', can_export_bmc = false, allowed_templates = [1] }: Props) {
    const { t } = useTranslation();
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [saving, setSaving] = useState(false);
    const [selectedSections, setSelectedSections] = useState<string[]>(
        SECTION_ORDER.filter(key => sections[key]?.generated_text)
    );
    const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
    const [selectedBmcTemplate, setSelectedBmcTemplate] = useState<number>(1);
    const [showBpExportOverlay, setShowBpExportOverlay] = useState(false);
    const [showBmcExportOverlay, setShowBmcExportOverlay] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [bpExportError, setBpExportError] = useState<string | null>(null);
    const [bmcExportError, setBmcExportError] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('projects.title'), href: '/projects' },
        { title: project.name, href: `/projects/${project.id}/business-plan` },
        { title: t('bp.view_result'), href: `/business-plans/${business_plan.id}/result` },
    ];

    const financialChartData = sections['financial_plan']?.chart_data;

    const revenueData = financialChartData ? [
        { year: 'Year 1', revenue: financialChartData.revenue[0], costs: financialChartData.costs[0], profit: financialChartData.profit[0] },
        { year: 'Year 2', revenue: financialChartData.revenue[1], costs: financialChartData.costs[1], profit: financialChartData.profit[1] },
        { year: 'Year 3', revenue: financialChartData.revenue[2], costs: financialChartData.costs[2], profit: financialChartData.profit[2] },
    ] : [];

    const costBreakdownData = financialChartData ? [
        { year: 'Year 1', ...financialChartData.cost_breakdown_y1 },
        { year: 'Year 2', ...financialChartData.cost_breakdown_y2 },
        { year: 'Year 3', ...financialChartData.cost_breakdown_y3 },
    ] : [];

    const toggleSection = (key: string) => {
        setSelectedSections(prev =>
            prev.includes(key)
                ? prev.length === 1 ? prev : prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const handleBpExport = async () => {
        const params = new URLSearchParams();
        selectedSections.forEach(s => params.append('sections[]', s));
        params.append('template', String(selectedTemplate));
        const url = route('business-plan.export', business_plan.id) + '?' + params.toString();
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.status === 403) {
            const data = await res.json();
            if (data.reason === 'template') {
                setBpExportError(t('bp.template_error'));
                setShowBpExportOverlay(false);
                return;
            }
        }
        window.location.href = url;
    };

    const handleBmcExport = async () => {
        const params = new URLSearchParams();
        params.append('template', String(selectedBmcTemplate));
        const url = route('business-plan.export-bmc', business_plan.id) + '?' + params.toString();
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.status === 403) {
            setBmcExportError(t('bp.bmc_error'));
            setShowBmcExportOverlay(false);
            return;
        }
        window.location.href = url;
    };

    const startEdit = (sectionName: string) => {
        setEditingSection(sectionName);
        setEditText(sections[sectionName]?.generated_text || '');
    };

    const cancelEdit = () => {
        setEditingSection(null);
        setEditText('');
    };

    const saveEdit = async (sectionId: number) => {
        setSaving(true);
        try {
            await fetch(route('sections.update', sectionId), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
                    ),
                },
                body: JSON.stringify({ generated_text: editText }),
            });
            router.reload({ only: ['sections'] });
            setEditingSection(null);
        } catch (error) {
            console.error('Save failed', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={business_plan.title} />
            <div className="p-6 flex flex-col gap-8 max-w-5xl mx-auto">

                {/* Header + Export Buttons */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-heading">
                            {business_plan.title}
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {project.company_name} · {project.name}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        {bmc && can_export_bmc && (
                            <button
                                onClick={() => setShowBmcExportOverlay(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                <Download className="w-4 h-4" />
                                {t('bmc.export_bmc')}
                            </button>
                        )}
                        {bmc && !can_export_bmc && (
                            <button
                                onClick={() => setBmcExportError('BMC export requires a Basic or Unlimited plan. Upgrade to access this feature.')}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-warning/30 text-warning hover:bg-warning/10 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {t('bmc.export_bmc')} 🔒
                            </button>
                        )}
                        <button
                            onClick={() => setShowBpExportOverlay(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                        >
                            <Download className="w-4 h-4" />
                            {t('bp.export_pdf')}
                        </button>
                    </div>
                </div>

                {/* Error banners */}
                {bpExportError && (
                    <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
                        <span>{bpExportError}</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit(route('subscription'))}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                {t('bp.upgrade_plan')}
                            </button>
                            <button onClick={() => setBpExportError(null)} className="flex-shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {bmcExportError && (
                    <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
                        <span>{bmcExportError}</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit(route('subscription'))}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                {t('bp.upgrade_plan')}
                            </button>
                            <button onClick={() => setBmcExportError(null)} className="flex-shrink-0">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Business Model Canvas */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold font-heading mb-6">
                        Business <span className="text-accent">Model Canvas</span>
                    </h2>
                    {bmc ? (
                        <div className="grid grid-cols-3 gap-4">
                            {BMC_FIELDS.map(field => (
                                <div key={field} className="bg-background border border-border rounded-xl p-4 min-h-[100px] flex flex-col gap-2">
                                    <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">
                                        {t(`bmc.${field}`)}
                                    </h3>
                                    <p className="text-sm text-foreground">
                                        {bmc[field as keyof Bmc] || t('bmc.not_available')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            {BMC_FIELDS.map(field => (
                                <div key={field} className="bg-background border border-dashed border-border rounded-xl p-4 min-h-[100px] flex flex-col gap-2">
                                    <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">
                                        {t(`bmc.${field}`)}
                                    </h3>
                                    <p className="text-muted-foreground text-xs italic">
                                        {t('bmc.coming_soon')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Business Plan Sections */}
                <div className="flex flex-col gap-6">
                    <h2 className="text-xl font-bold font-heading">
                        {t('bp.full_plan')}
                    </h2>

                    {SECTION_ORDER.map(sectionKey => {
                        const section = sections[sectionKey];
                        if (!section || !section.generated_text) return null;
                        const isEditing = editingSection === sectionKey;

                        return (
                            <div key={sectionKey} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold font-heading text-accent">
                                        {t(`bp.sections.${sectionKey}`)}
                                        {(section.edited === true || section.edited === 1) && (
                                            <span className="ml-2 text-xs text-warning font-normal">{t('bp.edited')}</span>
                                        )}
                                    </h3>
                                    {!isEditing && (
                                        <button
                                            onClick={() => startEdit(sectionKey)}
                                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                                        >
                                            <Pencil className="w-3 h-3" />
                                            {t('common.edit')}
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={editText}
                                            onChange={e => setEditText(e.target.value)}
                                            rows={15}
                                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none w-full"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={cancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent/10 transition-colors">
                                                <X className="w-3 h-3" />
                                                {t('common.cancel')}
                                            </button>
                                            <button
                                                onClick={() => saveEdit(section.id)}
                                                disabled={saving}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                                                style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                                            >
                                                <Check className="w-3 h-3" />
                                                {saving ? t('common.loading') : t('common.save')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        <div className="result-content text-sm">
                                            <ReactMarkdown>{stripFirstHeading(section.generated_text)}</ReactMarkdown>
                                        </div>
                                        {sectionKey === 'financial_plan' && financialChartData && (
                                            <FinancialCharts
                                                revenueData={revenueData}
                                                costBreakdownData={costBreakdownData}
                                                breakeven={financialChartData.breakeven_month}
                                                arpu={financialChartData.arpu}
                                                growthRate={financialChartData.monthly_growth_rate}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* BP Export Overlay */}
            {showBpExportOverlay && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                            <h2 className="text-lg font-bold font-heading">
                                {t('bp.export_title_1')} <span className="text-accent">{t('bp.export_title_2')}</span>
                            </h2>
                            <button onClick={() => setShowBpExportOverlay(false)} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
                            {/* Section Selector */}
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-semibold">{t('bp.select_sections')}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {SECTION_ORDER.map(key => {
                                        const section = sections[key];
                                        if (!section || !section.generated_text) return null;
                                        const isSelected = selectedSections.includes(key);
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => toggleSection(key)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors text-left ${isSelected ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/50'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-accent border-accent' : 'border-muted-foreground'
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3 text-black" />}
                                                </div>
                                                {t(`bp.sections.${key}`)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Template Selector */}
                            <TemplateSelector
                                selectedTemplate={selectedTemplate}
                                setSelectedTemplate={setSelectedTemplate}
                                allowedTemplates={allowed_templates}
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 border-t border-border flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                                {selectedSections.length} {t('bp.sections_selected')}
                            </p>
                            <button
                                onClick={handleBpExport}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                <Download className="w-4 h-4" />
                                {t('bp.export_pdf')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BMC Export Overlay */}
            {showBmcExportOverlay && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl w-full max-w-2xl flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-lg font-bold font-heading">
                                {t('bmc.export_bmc')} — <span className="text-accent">Template</span>
                            </h2>
                            <button onClick={() => setShowBmcExportOverlay(false)} className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6">
                            <TemplateSelector
                                selectedTemplate={selectedBmcTemplate}
                                setSelectedTemplate={setSelectedBmcTemplate}
                                allowedTemplates={allowed_templates}
                            />
                        </div>
                        <div className="flex justify-end p-6 border-t border-border">
                            <button
                                onClick={handleBmcExport}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                <Download className="w-4 h-4" />
                                {t('bmc.export_bmc')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-accent/10 hover:border-accent transition-colors shadow-lg z-40"
                >
                    <ChevronUp className="w-4 h-4" />
                </button>
            )}

        </AppLayout>
    );
}