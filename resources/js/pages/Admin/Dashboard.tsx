import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Users, FileText, HeadphonesIcon, AlertTriangle, CreditCard, Zap } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, LineChart, Line, PieChart, Pie, Cell,
    ResponsiveContainer
} from 'recharts';

interface Stats {
    total_users: number;
    active_subscriptions: number;
    total_plans: number;
    failed_sections: number;
    support_requests: number;
    in_progress_requests: number;
    total_tokens: number;
    avg_tokens_per_plan: number;
}

interface ChartData {
    plans_per_month: { month: string; count: number }[];
    section_stats: Record<string, { validation_status: string; count: number }>;
    users_per_month: { month: string; count: number }[];
    subscription_stats: { status: string; count: number }[];
    tokens_per_month?: { month: string; tokens: number }[];
    tokens_per_section?: { section_name: string; avg_tokens: number }[];
    most_active_users?: { name: string; email: string; total_plans: number }[];
    plans_per_user_distribution?: { label: string; count: number }[];
    language_distribution?: { language: string; count: number }[];
}

interface Props {
    stats: Stats;
    charts: ChartData;
}

const COLORS = {
    completed: '#00D4FF',
    failed: '#FF0000',
    pending: '#FF9900',
    trial: '#FF9900',
    active: '#00D4FF',
    expired: '#FF0000',
};

export default function AdminDashboard({ stats, charts }: Props) {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.admin'), href: '/admin/dashboard' },
        { title: t('nav.admin_dashboard'), href: '/admin/dashboard' },
    ];

    const statCards: { title: string; value: string | number; icon: any; href: string; color: string }[] = [
        { title: t('admin.dashboard.stat_cards.total_users'), value: stats.total_users, icon: Users, href: '/admin/users', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.active_subscriptions'), value: stats.active_subscriptions, icon: CreditCard, href: '/admin/users', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.total_business_plans'), value: stats.total_plans, icon: FileText, href: '/admin/business-plans', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.failed_sections'), value: stats.failed_sections, icon: AlertTriangle, href: '/admin/business-plans', color: 'text-destructive' },
        { title: t('admin.dashboard.stat_cards.support_requests'), value: stats.support_requests, icon: HeadphonesIcon, href: '/admin/support', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.in_progress_requests'), value: stats.in_progress_requests, icon: HeadphonesIcon, href: '/admin/support', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.total_tokens_used'), value: (stats.total_tokens || 0).toLocaleString(), icon: Zap, href: '/admin/business-plans', color: 'text-accent' },
        { title: t('admin.dashboard.stat_cards.avg_tokens_plan'), value: (stats.avg_tokens_per_plan || 0).toLocaleString(), icon: Zap, href: '/admin/business-plans', color: 'text-accent' },
    ];

    // Prepare section stats for pie chart
    const sectionPieData = [
        { name: t('admin.dashboard.charts.completed'), value: charts.section_stats['completed']?.count || 0, color: COLORS.completed },
        { name: t('admin.dashboard.charts.failed'), value: charts.section_stats['failed']?.count || 0, color: COLORS.failed },
        { name: t('admin.dashboard.charts.pending'), value: charts.section_stats['pending']?.count || 0, color: COLORS.pending },
    ].filter(d => d.value > 0);

    // Prepare subscription pie data
    const subscriptionPieData = (charts.subscription_stats || []).map(s => ({
        name: t(`admin.dashboard.charts.${s.status}`),
        value: s.count,
        color: COLORS[s.status as keyof typeof COLORS] || '#4E5568',
    }));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="p-6 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold font-heading">
                        {t('admin.dashboard.title_1')} <span className="text-accent">{t('admin.dashboard.title_2')}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t('admin.dashboard.subtitle')}
                    </p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map(card => (
                        <Link
                            href={card.href}
                            key={card.title}
                            className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground font-medium">{card.title}</span>
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                    <card.icon className={`w-4 h-4 ${card.color}`} />
                                </div>
                            </div>
                            <span className="text-4xl font-bold font-heading">{card.value}</span>
                        </Link>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Business Plans per Month */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.business_plans_per_month_1')} <span className="text-accent">{t('admin.dashboard.charts.business_plans_per_month_2')}</span>
                        </h3>
                        {(charts.plans_per_month || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={charts.plans_per_month}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" name={t('admin.dashboard.charts.plans')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                    {/* New Users per Month */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.new_users_per_month_1')} <span className="text-accent">{t('admin.dashboard.charts.new_users_per_month_2')}</span>
                        </h3>
                        {(charts.users_per_month || []).length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={charts.users_per_month}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        name={t('admin.dashboard.charts.users')}
                                        stroke="var(--accent)"
                                        strokeWidth={2}
                                        dot={{ fill: 'var(--accent)', r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Section Generation Status */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.section_generation_status_1')} <span className="text-accent">{t('admin.dashboard.charts.section_generation_status_2')}</span>
                        </h3>
                        {sectionPieData.length > 0 ? (
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width="60%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={sectionPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {sectionPieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-3">
                                    {sectionPieData.map(entry => (
                                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="text-muted-foreground">{entry.name}:</span>
                                            <span className="font-semibold">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                    {/* Subscription Breakdown */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.subscription_breakdown_1')} <span className="text-accent">{t('admin.dashboard.charts.subscription_breakdown_2')}</span>
                        </h3>
                        {subscriptionPieData.length > 0 ? (
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width="60%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={subscriptionPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="value"
                                        >
                                            {subscriptionPieData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-3">
                                    {subscriptionPieData.map(entry => (
                                        <div key={entry.name} className="flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                            <span className="text-muted-foreground">{entry.name}:</span>
                                            <span className="font-semibold">{entry.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Charts Row 3 — Token Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Tokens per Month */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.token_usage_per_month_1')} <span className="text-accent">{t('admin.dashboard.charts.token_usage_per_month_2')}</span>
                        </h3>
                        {(charts.tokens_per_month ?? []).length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={charts.tokens_per_month}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} ${t('admin.dashboard.charts.tokens').toLowerCase()}`, '']} />
                                    <Bar dataKey="tokens" name={t('admin.dashboard.charts.tokens')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                    {/* Avg Tokens per Section */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.avg_tokens_per_section_1')} <span className="text-accent">{t('admin.dashboard.charts.avg_tokens_per_section_2')}</span>
                        </h3>
                        {(charts.tokens_per_section ?? []).length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart
                                    data={charts.tokens_per_section}
                                    layout="vertical"
                                    margin={{ left: 80 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v.toFixed(0)}`} />
                                    <YAxis type="category" dataKey="section_name" tick={{ fontSize: 10 }} width={80} />
                                    <Tooltip formatter={(value) => [`${Number(value).toFixed(0)} ${t('admin.dashboard.charts.tokens').toLowerCase()}`, '']} />
                                    <Bar dataKey="avg_tokens" name={t('admin.dashboard.charts.avg_tokens')} fill="var(--accent)" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                </div>

                {/* Charts Row 4 — User Engagement */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Most Active Users */}
                    <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-1">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.most_active_users_1')} <span className="text-accent">{t('admin.dashboard.charts.most_active_users_2')}</span>
                        </h3>
                        {(charts.most_active_users ?? []).length > 0 ? (
                            <div className="flex flex-col gap-2">
                                {(charts.most_active_users ?? []).map((user, index) => (
                                    <div key={user.email} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                                        <span className={`text-xs font-bold w-5 text-center flex-shrink-0 ${
                                            index === 0 ? 'text-warning' :
                                            index === 1 ? 'text-muted-foreground' :
                                            index === 2 ? 'text-warning/60' :
                                            'text-muted-foreground/50'
                                        }`}>
                                            #{index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <span className="text-sm font-bold text-accent flex-shrink-0">
                                            {user.total_plans} <span className="text-xs font-normal text-muted-foreground">{t('admin.dashboard.charts.plans_suffix')}</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                    {/* Plans per User Distribution */}
                    <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-1">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.plans_per_user_distribution_1')} <span className="text-accent">{t('admin.dashboard.charts.plans_per_user_distribution_2')}</span>
                        </h3>
                        {(charts.plans_per_user_distribution ?? []).some(d => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={charts.plans_per_user_distribution}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip formatter={(value) => [`${value} ${t('admin.dashboard.charts.users_suffix')}`, '']} />
                                    <Bar dataKey="count" name={t('admin.dashboard.charts.users')} fill="var(--accent)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                    {/* Language Distribution */}
                    <div className="bg-card border border-border rounded-2xl p-6 lg:col-span-1">
                        <h3 className="font-bold font-heading mb-4">
                            {t('admin.dashboard.charts.language_distribution_1')} <span className="text-accent">{t('admin.dashboard.charts.language_distribution_2')}</span>
                        </h3>
                        {(charts.language_distribution ?? []).length > 0 ? (
                            <div className="flex items-center gap-6">
                                <ResponsiveContainer width="60%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={charts.language_distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            dataKey="count"
                                            nameKey="language"
                                        >
                                            {(charts.language_distribution ?? []).map((entry, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={index === 0 ? 'var(--accent)' : 'var(--warning)'}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} ${t('admin.dashboard.charts.plans_suffix')}`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex flex-col gap-3">
                                    {(charts.language_distribution ?? []).map((entry, index) => (
                                        <div key={entry.language} className="flex items-center gap-2 text-sm">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: index === 0 ? 'var(--accent)' : 'var(--warning)' }}
                                            />
                                            <span className="text-muted-foreground capitalize">{entry.language}:</span>
                                            <span className="font-semibold">{entry.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                                {t('admin.dashboard.charts.no_data_yet')}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}