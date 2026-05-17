import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface SupportRequest {
    id: number;
    subject: string;
    message: string;
    status: string;
    admin_reply: string | null;
    created_at: string;
}

interface Props {
    requests: SupportRequest[];
}

export default function SupportIndex({ requests }: Props) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        subject: '',
        message: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.dashboard'), href: '/dashboard' },
        { title: t('support.title'), href: '/support' },
    ];

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('support.store'), {
            onSuccess: () => reset(),
        });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'solved') {
            return (
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/20 text-primary">
                    {t('support.solved')}
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-warning/20 text-warning">
                {t('support.in_progress')}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('support.title')} />
            <div className="p-6 flex flex-col gap-6">
                <h1 className="text-3xl font-bold font-heading">
                    {t('support.title')}
                </h1>
                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold font-heading mb-6">
                        {t('support.new_request')}
                    </h2>
                    <form onSubmit={submit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">{t('support.subject')}</label>
                            <input
                                type="text"
                                value={data.subject}
                                onChange={e => setData('subject', e.target.value)}
                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                required
                            />
                            {errors.subject && <span className="text-destructive text-xs">{errors.subject}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium">{t('support.message')}</label>
                            <textarea
                                value={data.message}
                                onChange={e => setData('message', e.target.value)}
                                rows={4}
                                className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                                required
                            />
                            {errors.message && <span className="text-destructive text-xs">{errors.message}</span>}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {t('support.send_request')}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h2 className="text-xl font-bold font-heading mb-6">
                        {t('support.title')}
                    </h2>
                    {requests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('support.no_requests')}</p>
                    ) : (
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                                    <th className="pb-3 font-medium">{t('support.request_id')}</th>
                                    <th className="pb-3 font-medium">{t('support.subject')}</th>
                                    <th className="pb-3 font-medium">{t('support.date')}</th>
                                    <th className="pb-3 font-medium">{t('support.status')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(request => (
                                    <tr key={request.id} className="border-b border-border/50 text-sm">
                                        <td className="py-4 text-muted-foreground">#{request.id}</td>
                                        <td className="py-4 font-medium">{request.subject}</td>
                                        <td className="py-4 text-muted-foreground">
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">{getStatusBadge(request.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}