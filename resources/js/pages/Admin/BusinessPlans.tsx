import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Search, X, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer } from 'recharts';

interface PlanSection {
    section_name: string;
    validation_status: string;
    generated_text: string | null;
    chart_data?: any;
}

interface Company {
    name: string;
}

interface Project {
    name: string;
    company: Company;
}

interface User {
    name: string;
    email: string;
}

interface BusinessPlan {
    id: number;
    title: string;
    language: string;
    created_at: string;
    plan_sections: PlanSection[];
    project: Project & { company: Company & { user: User } };
}

interface Props {
    plans: BusinessPlan[];
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


const LABELS: Record<string, string> = {
    company_presentation: 'S1', market_analysis: 'S2',
    org_management: 'S3', strategy: 'S4',
    operational_plan: 'S5', financial_plan: 'S6',
    risk_opportunity: 'S7', appendices: 'S8',
    executive_summary: 'S9',
};

const stripFirstHeading = (text: string): string => text.replace(/^#+\s+.+\n?/m, '').trim();

function FinancialCharts({ revenueData, costBreakdownData, breakeven, arpu, growthRate }: {
    revenueData: any[];
    costBreakdownData: any[];
    breakeven: number;
    arpu: number;
    growthRate: number;
}) {

    const { t } = useTranslation();
    return (
        <div className="flex flex-col gap-6 mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t('admin.business_plans.charts.breakeven')}</p>
                    <p className="text-2xl font-bold font-heading text-accent">{t('admin.business_plans.charts.month')} {breakeven}</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t('admin.business_plans.charts.arpu')}</p>
                    <p className="text-2xl font-bold font-heading text-primary">${arpu}</p>
                </div>
                <div className="bg-background border border-border rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground">{t('admin.business_plans.charts.monthly_growth')}</p>
                    <p className="text-2xl font-bold font-heading text-accent">{growthRate}%</p>
                </div>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">{t('admin.business_plans.charts.revenue_vs_costs')}</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="revenue" name={t('admin.business_plans.charts.revenue')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="costs" name={t('admin.business_plans.charts.costs')} fill="#ff6b6b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="profit" name={t('admin.business_plans.charts.profit')} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">{t('admin.business_plans.charts.cost_breakdown')}</h4>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={costBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                        <Legend />
                        <Bar dataKey="development" name={t('admin.business_plans.charts.development')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="marketing" name={t('admin.business_plans.charts.marketing')} fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="operations" name={t('admin.business_plans.charts.operations')} fill="#ff9f43" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-background border border-border rounded-xl p-4">
                <h4 className="text-sm font-semibold text-accent mb-4">{t('admin.business_plans.charts.profit_growth')}</h4>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, t('admin.business_plans.charts.profit')]} />
                        <Line type="monotone" dataKey="profit" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 5 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}


export default function AdminBusinessPlans({ plans }: Props) {
    const { t } = useTranslation();
    const getSectionLabel = (key: string) => t(`admin.business_plans.sections.${key}`);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.admin'), href: '/admin/dashboard' },
        { title: t('admin.business_plans.title_1') + ' ' + t('admin.business_plans.title_2'), href: '/admin/business-plans' },
    ];

    const [search, setSearch] = useState('');
    const [viewingPlan, setViewingPlan] = useState<BusinessPlan | null>(null);

    const getSectionStatus = (sections: PlanSection[], name: string) => {
        const section = sections.find(s => s.section_name === name);
        if (!section) return 'missing';
        return section.validation_status;
    };

    const filteredPlans = useMemo(() => {
        if (!search) return plans;
        const q = search.toLowerCase();
        return plans.filter(plan =>
            plan.title.toLowerCase().includes(q) ||
            plan.project?.company?.user?.name?.toLowerCase().includes(q) ||
            plan.project?.company?.user?.email?.toLowerCase().includes(q)
        );
    }, [plans, search]);

    const getSectionsForPlan = (plan: BusinessPlan): Record<string, PlanSection> => {
        const map: Record<string, PlanSection> = {};
        plan.plan_sections.forEach(s => { map[s.section_name] = s; });
        return map;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin — Business Plans" />
            <div className="p-6 flex flex-col gap-6">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-heading">
                        {t('admin.business_plans.title_1')} <span className="text-accent">{t('admin.business_plans.title_2')}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {filteredPlans.length} {t('admin.business_plans.plans_count')} {plans.length} {t('admin.business_plans.plans_suffix')}
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t('admin.business_plans.search_placeholder')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-input border border-[var(--input-border)] rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                    />
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.title')}</th>
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.company')}</th>
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.owner')}</th>
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.language')}</th>
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.sections')}</th>
                                <th className="pb-3 font-medium">{t('admin.business_plans.table.date')}</th>
                                <th className="pb-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlans.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                                        {t('admin.business_plans.table.no_plans')}
                                    </td>
                                </tr>
                            ) : filteredPlans.map(plan => (
                                <tr key={plan.id} className="border-b border-border/50 text-sm">
                                    <td className="py-4 font-medium">{plan.title}</td>
                                    <td className="py-4 text-muted-foreground">
                                        {plan.project?.company?.name ?? '—'}
                                    </td>
                                    <td className="py-4 text-muted-foreground">
                                        <div>{plan.project?.company?.user?.name ?? '—'}</div>
                                        <div className="text-xs text-muted-foreground/60">{plan.project?.company?.user?.email ?? ''}</div>
                                    </td>
                                    <td className="py-4 capitalize">{plan.language}</td>
                                    <td className="py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {SECTION_ORDER.map(section => {
                                                const status = getSectionStatus(plan.plan_sections, section);
                                                return (
                                                    <span
                                                        key={section}
                                                        title={section}
                                                        className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                                            status === 'completed'
                                                                ? 'bg-primary/20 text-primary'
                                                                : status === 'failed'
                                                                ? 'bg-destructive/20 text-destructive'
                                                                : status === 'pending'
                                                                ? 'bg-warning/20 text-warning'
                                                                : 'bg-border text-muted-foreground'
                                                        }`}
                                                    >
                                                        {LABELS[section]}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="py-4 text-muted-foreground">
                                        {new Date(plan.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <button
                                            onClick={() => setViewingPlan(plan)}
                                            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent/10 transition-colors"
                                        >
                                            <Eye className="w-3 h-3" />
                                            {t('admin.business_plans.table.view')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* View Plan Overlay */}
                {viewingPlan && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                        <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                            {/* Overlay Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold font-heading">
                                        {viewingPlan.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        {viewingPlan.project?.company?.name ?? '—'} · {viewingPlan.project?.company?.user?.name ?? '—'} · {viewingPlan.language}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setViewingPlan(null)}
                                    className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Sections */}
                            <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-4">
                                {(() => {
                                    const sectionsMap = getSectionsForPlan(viewingPlan);
                                    const hasAnySection = SECTION_ORDER.some(key => sectionsMap[key] && sectionsMap[key].generated_text);

                                    if(!hasAnySection) {
                                        return (
                                            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                                                {t('admin.business_plans.overlay.no_sections')}
                                            </div>
                                        );
                                    }
                                    return SECTION_ORDER.map(key => {
                                        const section = sectionsMap[key];
                                        if (!section || !section.generated_text) return null;
                                        return (
                                            <div
                                                key={key}
                                                className="bg-background border border-border rounded-xl p-5 flex flex-col gap-3"
                                            >
                                                <h3 className="text-sm font-bold text-accent uppercase tracking-wider">
                                                    {getSectionLabel(key)}
                                                </h3>
                                                <div className="result-content text-sm text-foreground">
                                                    <ReactMarkdown>
                                                        {stripFirstHeading(section.generated_text)}
                                                    </ReactMarkdown>
                                                    {key === 'financial_plan' && section.chart_data && (() => {
                                                        const cd = section.chart_data;
                                                        const revenueData = [
                                                            { year: 'Year 1', revenue: cd.revenue[0], costs: cd.costs[0], profit: cd.profit[0] },
                                                            { year: 'Year 2', revenue: cd.revenue[1], costs: cd.costs[1], profit: cd.profit[1] },
                                                            { year: 'Year 3', revenue: cd.revenue[2], costs: cd.costs[2], profit: cd.profit[2] },
                                                        ];
                                                        const costBreakdownData = [
                                                            { year: 'Year 1', ...cd.cost_breakdown_y1 },
                                                            { year: 'Year 2', ...cd.cost_breakdown_y2 },
                                                            { year: 'Year 3', ...cd.cost_breakdown_y3 },
                                                        ];
                                                        return (
                                                            <FinancialCharts
                                                                revenueData={revenueData}
                                                                costBreakdownData={costBreakdownData}
                                                                breakeven={cd.breakeven_month}
                                                                arpu={cd.arpu}
                                                                growthRate={cd.monthly_growth_rate}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}