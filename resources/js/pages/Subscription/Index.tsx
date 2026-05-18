import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Check, X, Zap, Crown, Infinity as InfinityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Subscription {
    id: number;
    status: string;
    plan_type: string;
    start_date: string;
    end_date: string;
}

interface Props {
    subscription: Subscription | null;
    plan_type: string;
    can_export_bmc: boolean;
    weekly_limit: number | string;
    weekly_count: number;
}

export default function SubscriptionIndex({
    subscription,
    plan_type,
    weekly_limit,
    weekly_count,
}: Props) {
    const { t } = useTranslation();
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('subscription.title'), href: '/subscription' },
    ];

    const daysRemaining = subscription
        ? Math.max(0, Math.ceil(
            (new Date(subscription.end_date).getTime() - new Date().getTime())
            / (1000 * 60 * 60 * 24)
        ))
        : 0;

    const isExpired = subscription?.status === 'expired' || plan_type === 'none';
    const isTrial = subscription?.status === 'trial';
    const isBasic = plan_type === 'basic';
    const isUnlimited = plan_type === 'unlimited';

    const subscribe = async (planType: string) => {
        setCheckoutLoading(planType);
        try {
            const res = await fetch(route('stripe.checkout'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''),
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ plan_type: planType }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (e) {
            console.error(e);
        } finally {
            setCheckoutLoading(null);
        }
    };

    const getStatusBadge = () => {
        if (isExpired) return <span className="px-3 py-1 rounded-lg text-xs bg-destructive/20 text-destructive font-medium">{t('subscription.expired')}</span>;
        if (isTrial) return <span className="px-3 py-1 rounded-lg text-xs bg-warning/20 text-warning font-medium">{t('subscription.trial')}</span>;
        if (isBasic) return <span className="px-3 py-1 rounded-lg text-xs bg-accent/20 text-accent font-medium">Basic</span>;
        if (isUnlimited) return <span className="px-3 py-1 rounded-lg text-xs bg-primary/20 text-primary font-medium">Unlimited</span>;
        return null;
    };

    const plans = [
        {
            key: 'free',
            name: t('subscription.plans_data.free.name'),
            price: '$0',
            period: t('subscription.plans_data.free.period'),
            icon: Zap,
            color: 'text-warning',
            features: [
                { label: t('subscription.plans_data.free.feat_1'), included: true },
                { label: t('subscription.plans_data.free.feat_2'), included: true },
                { label: t('subscription.plans_data.free.feat_3'), included: false },
                { label: t('subscription.plans_data.free.feat_4'), included: false },
                { label: t('subscription.plans_data.free.feat_5'), included: false },
            ],
        },
        {
            key: 'basic',
            name: t('subscription.plans_data.basic.name'),
            price: '$19.99',
            period: t('subscription.plans_data.basic.period'),
            icon: Crown,
            color: 'text-accent',
            highlight: true,
            features: [
                { label: t('subscription.plans_data.basic.feat_1'), included: true },
                { label: t('subscription.plans_data.basic.feat_2'), included: true },
                { label: t('subscription.plans_data.basic.feat_3'), included: true },
                { label: t('subscription.plans_data.basic.feat_4'), included: true },
                { label: t('subscription.plans_data.basic.feat_5'), included: false },
            ],
        },
        {
            key: 'unlimited',
            name: t('subscription.plans_data.unlimited.name'),
            price: '$49.99',
            period: t('subscription.plans_data.unlimited.period'),
            icon: InfinityIcon,
            color: 'text-primary',
            features: [
                { label: t('subscription.plans_data.unlimited.feat_1'), included: true },
                { label: t('subscription.plans_data.unlimited.feat_2'), included: true },
                { label: t('subscription.plans_data.unlimited.feat_3'), included: true },
                { label: t('subscription.plans_data.unlimited.feat_4'), included: true },
                { label: t('subscription.plans_data.unlimited.feat_5'), included: true },
            ],
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('subscription.title')} />
            <div className="p-6 flex flex-col gap-6 max-w-5xl">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-heading">
                            {t('subscription.subscribe_plans_1')}{' '}
                            <span className="text-accent">{t('subscription.subscribe_plans_2')}</span>
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <p className="text-muted-foreground text-sm">{t('subscription.current_plan')}:</p>
                            {getStatusBadge()}
                            {!isExpired && daysRemaining > 0 && (
                                <p className="text-muted-foreground text-sm">
                                    · {daysRemaining} {t('subscription.days_remaining').toLowerCase()}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expired warning */}
                {isExpired && (
                    <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        {t('subscription.expired_warning')}
                    </div>
                )}

                {/* Usage */}
                {!isExpired && (
                    <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">{t('subscription.this_week')}</p>
                            <p className="text-2xl font-bold font-heading">
                                {weekly_count}
                                <span className="text-muted-foreground text-base font-normal">
                                    {' '}/ {weekly_limit === 'unlimited' ? '∞' : weekly_limit} {t('subscription.plans')}
                                </span>
                            </p>
                        </div>
                        <div className="flex-1">
                            {weekly_limit !== 'unlimited' && (
                                <div className="w-full bg-border rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${Math.min(100, (weekly_count / (weekly_limit as number)) * 100)}%`,
                                            backgroundColor: weekly_count >= (weekly_limit as number) ? 'var(--destructive)' : 'var(--accent)',
                                        }}
                                    />
                                </div>
                            )}
                            {weekly_limit === 'unlimited' && (
                                <p className="text-sm text-primary">{t('subscription.unlimited_generations')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map(plan => {
                        const Icon = plan.icon;
                        const isCurrent =
                            (plan.key === 'free' && isTrial) ||
                            (plan.key === 'basic' && isBasic) ||
                            (plan.key === 'unlimited' && isUnlimited);

                        return (
                            <div
                                key={plan.key}
                                className="relative bg-card rounded-2xl p-6 flex flex-col gap-5 border-2 transition-all"
                                style={{
                                    borderColor: isCurrent ? 'var(--accent)' : 'var(--border)',
                                    boxShadow: plan.highlight ? '0 0 32px rgba(0,212,255,0.08)' : 'none',
                                }}
                            >
                                {isCurrent && (
                                    <div
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                                    >
                                        {t('subscription.current_plan')}
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                                        <Icon className={`w-5 h-5 ${plan.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold font-heading">{plan.name}</h3>
                                        <p className="text-xs text-muted-foreground">{plan.period}</p>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-3xl font-bold font-heading">{plan.price}</span>
                                    {plan.key !== 'free' && (
                                        <span className="text-muted-foreground text-sm ml-1">/mo</span>
                                    )}
                                </div>

                                <ul className="flex flex-col gap-2.5 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm">
                                            {feature.included
                                                ? <Check className="w-4 h-4 text-primary flex-shrink-0" />
                                                : <X className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                                            }
                                            <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'}>
                                                {feature.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.key === 'free' ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 rounded-xl text-sm border border-border text-muted-foreground cursor-not-allowed"
                                    >
                                        {isTrial ? t('subscription.current_plan') : t('subscription.trial_ended')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => subscribe(plan.key)}
                                        disabled={checkoutLoading === plan.key || isCurrent}
                                        className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-60"
                                        style={isCurrent
                                            ? { border: '1px solid var(--border)', color: 'var(--muted-foreground)' }
                                            : { backgroundColor: 'var(--accent)', color: '#000' }
                                        }
                                    >
                                        {checkoutLoading === plan.key ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Billing History */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold font-heading mb-6">
                        {t('subscription.billing_history_1')}{' '}
                        <span className="text-accent">{t('subscription.billing_history_2')}</span>
                    </h2>
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                <th className="pb-3 font-medium">{t('subscription.date')}</th>
                                <th className="pb-3 font-medium">{t('subscription.plan')}</th>
                                <th className="pb-3 font-medium">{t('subscription.amount')}</th>
                                <th className="pb-3 font-medium">{t('subscription.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscription?.status === 'active' ? (
                                <tr className="border-b border-border/50 text-sm">
                                    <td className="py-4">{subscription.start_date}</td>
                                    <td className="py-4 capitalize">{subscription.plan_type}</td>
                                    <td className="py-4">{isBasic ? '$19.99' : '$49.99'}</td>
                                    <td className="py-4">
                                        <span className="px-2 py-1 rounded-lg text-xs bg-primary/20 text-primary">{t('subscription.active')}</span>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-4 text-muted-foreground text-sm">
                                        {t('subscription.no_history')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </AppLayout>
    );
}