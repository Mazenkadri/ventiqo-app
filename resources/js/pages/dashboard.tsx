import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Building2, FolderKanban, HeadphonesIcon, CreditCard, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type BreadcrumbItem } from '@/types';

interface Stats {
    total_companies: number;
    total_projects: number;
    support_requests: number;
}

interface Subscription {
    status: string;
    end_date: string;
}

interface RecentProject {
    id: number;
    name: string;
    start_date: string;
    company_name: string;
    industry: string | null;
}

interface Props {
    stats: Stats;
    subscription: Subscription | null;
    recent_projects: RecentProject[];
}

export default function Dashboard({ stats, subscription, recent_projects }: Props) {
    const { t } = useTranslation();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
    ];

    const daysRemaining = subscription
        ? Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const statCards = [
        {
            title: t('dashboard.total_companies'),
            value: stats.total_companies,
            icon: Building2,
            href: '/companies',
        },
        {
            title: t('dashboard.total_projects'),
            value: stats.total_projects,
            icon: FolderKanban,
            href: '/projects',
        },
        {
            title: t('dashboard.support_requests'),
            value: stats.support_requests,
            icon: HeadphonesIcon,
            href: '/support',
        },
        {
            title: t('dashboard.subscription_status'),
            value: subscription ? `${daysRemaining} ${t('dashboard.days_left')}` : '—',
            icon: CreditCard,
            href: '/subscription',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="p-6 flex flex-col gap-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold font-heading">
                        {t('dashboard.title')}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {t('dashboard.welcome')}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card) => (
                        <Link
                            href={card.href}
                            key={card.title}
                            className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground font-medium">
                                    {card.title}
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                                    <card.icon className="w-4 h-4 text-accent" />
                                </div>
                            </div>
                            <span className="text-3xl font-bold font-heading">
                                {card.value}
                            </span>
                        </Link>
                    ))}
                </div>

                {/* Recent Projects */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold font-heading">
                            {t('dashboard.recent_projects_1')}{' '}
                            <span className="text-accent">{t('dashboard.recent_projects_2')}</span>
                        </h2>
                        <Link
                            href="/projects"
                            className="text-sm text-muted-foreground hover:text-accent transition-colors border border-border px-3 py-1.5 rounded-xl"
                        >
                            {t('dashboard.view_all')} →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recent_projects.map(project => (
                            <div
                                key={project.id}
                                onClick={() => router.visit(`/projects/${project.id}/business-plan`)}
                                className="bg-background border border-border rounded-xl p-4 flex flex-col gap-3 cursor-pointer hover:border-accent/50 transition-colors"
                            >
                                <div>
                                    <h3 className="font-bold font-heading">{project.name}</h3>
                                    <p className="text-muted-foreground text-sm">
                                        {project.company_name}
                                        {project.industry && ` · ${project.industry}`}
                                    </p>
                                </div>
                                <div className="border-t border-border pt-3">
                                    <p className="font-semibold text-sm">{project.start_date?.slice(0, 7)}</p>
                                    <p className="text-muted-foreground text-xs">{t('dashboard.created')}</p>
                                </div>
                            </div>
                        ))}

                        {/* New Plan Card */}
                        <Link
                            href="/projects"
                            className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-accent/50 transition-colors min-h-[120px]"
                        >
                            <Plus className="w-6 h-6 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm font-medium">
                                {t('dashboard.new_plan')}
                            </span>
                        </Link>
                    </div>
                </div>

                {/* Subscription Alert */}
                {subscription?.status === 'trial' && daysRemaining <= 7 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 flex items-center justify-between">
                        <p className="text-sm text-warning">
                            {t('dashboard.trial_ending')} {daysRemaining} {t('dashboard.days_left')}
                        </p>
                        <Link
                            href="/subscription"
                            className="text-sm font-medium px-4 py-2 rounded-xl"
                            style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                        >
                            {t('subscription.subscribe')}
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}