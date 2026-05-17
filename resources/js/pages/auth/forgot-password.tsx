import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, KeyRound } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function ForgotPassword({ status }: { status?: string }) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Head title={t('auth.forgot_password.title_1') + t('auth.forgot_password.title_2')} />

            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-accent" />
                </div>

                {/* Title */}
                <div className="text-center flex flex-col gap-2">
                    <h1 className="text-2xl font-bold font-heading">
                        {t('auth.forgot_password.title_1')}<span className="text-accent">{t('auth.forgot_password.title_2')}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('auth.forgot_password.prompt')}
                    </p>
                </div>

                {/* Success status */}
                {status && (
                    <div className="w-full px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                        {status}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit} className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{t('auth.forgot_password.email_address')}</label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            placeholder="your@email.com"
                            autoFocus
                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                    >
                        {processing && <LoaderCircle className="w-4 h-4 animate-spin" />}
                        {t('auth.forgot_password.send_link')}
                    </button>

                    <div className="text-center text-sm text-muted-foreground">
                        {t('auth.forgot_password.remember_password')}{' '}
                        <Link href={route('login')} className="text-accent hover:underline">
                            {t('auth.forgot_password.back_to_login')}
                        </Link>
                    </div>
                </form>

            </div>
        </div>
    );
}