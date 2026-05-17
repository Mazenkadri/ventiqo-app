import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Send } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SupportRequest {
    id: number;
    subject: string;
    message: string;
    status: string;
    admin_reply: string | null;
    created_at: string;
    user: User;
}

interface Props {
    requests: SupportRequest[];
}

export default function AdminSupport({ requests }: Props) {
    const { t } = useTranslation();
    const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
    const [reply, setReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('nav.admin'), href: '/admin/dashboard' },
        { title: t('support.title'), href: '/admin/support' },
    ];

    const sendReply = async () => {
        if (!selectedRequest || !reply.trim()) return;
        setSubmitting(true);
        try {
            await fetch(route('admin.support.reply', selectedRequest.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || ''
                    ),
                },
                body: JSON.stringify({ admin_reply: reply }),
            });
            router.reload();
            setSelectedRequest(null);
            setReply('');
        } catch (error) {
            console.error('Reply failed', error);
        } finally {
            setSubmitting(false);
        }
    };

    const updateStatus = (id: number, status: string) => {
        router.put(route('admin.support.status', id), { status });
    };

    const getStatusBadge = (status: string) => {
        if (status === 'solved') return (
            <span className="px-2 py-1 rounded-lg text-xs bg-primary/20 text-primary">{t('admin.support.status.solved')}</span>
        );
        return (
            <span className="px-2 py-1 rounded-lg text-xs bg-warning/20 text-warning">{t('admin.support.status.in_progress')}</span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin — Support" />
            <div className="p-6 flex flex-col gap-6">
                <h1 className="text-3xl font-bold font-heading">
                    {t('admin.support.title_1')} <span className="text-accent">{t('admin.support.title_2')}</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Requests List */}
                    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-3">
                        {requests.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('admin.support.no_requests')}</p>
                        ) : (
                            requests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => { setSelectedRequest(req); setReply(req.admin_reply || ''); }}
                                    className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                                        selectedRequest?.id === req.id
                                            ? 'border-accent bg-accent/5'
                                            : 'border-border hover:border-accent/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{req.subject}</span>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    <p className="text-muted-foreground text-xs">{req.user.name} · {req.user.email}</p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Reply Panel */}
                    {selectedRequest ? (
                        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
                            <div>
                                <h3 className="font-bold font-heading">{selectedRequest.subject}</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t('admin.support.from')} {selectedRequest.user.name} ({selectedRequest.user.email})
                                </p>
                            </div>
                            <div className="bg-background border border-border rounded-xl p-4 text-sm">
                                {selectedRequest.message}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">{t('admin.support.reply_label')}</label>
                                <textarea
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                    rows={4}
                                    className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors resize-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={sendReply}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                                >
                                    <Send className="w-3 h-3" />
                                    {submitting ? t('admin.support.sending') : t('admin.support.send_reply')}
                                </button>
                                <button
                                    onClick={() => updateStatus(selectedRequest.id, selectedRequest.status === 'solved' ? 'in_progress' : 'solved')}
                                    className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent/10 transition-colors"
                                >
                                    {selectedRequest.status === 'solved' 
                                        ? t('admin.support.mark_as_in_progress') 
                                        : t('admin.support.mark_as_solved')
                                    }
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-card border border-border rounded-2xl p-6 flex items-center justify-center text-muted-foreground text-sm">
                            {t('admin.support.select_request')}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}