import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props {
    token: string;
    email: string;
}
import { useTranslation } from 'react-i18next';

export default function ResetPassword({ token, email }: Props) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Head title={t('auth.reset_password.title_1') + ' ' + t('auth.reset_password.title_2')} />

            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <LockKeyhole className="w-8 h-8 text-accent" />
                </div>

                {/* Title */}
                <div className="text-center flex flex-col gap-2">
                    <h1 className="text-2xl font-bold font-heading">
                        {t('auth.reset_password.title_1')} <span className="text-accent">{t('auth.reset_password.title_2')}</span>
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('auth.reset_password.prompt_new')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{t('auth.reset_password.email_address')}</label>
                        <input
                            type="email"
                            value={data.email}
                            readOnly
                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none opacity-60 cursor-not-allowed"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{t('auth.reset_password.new_password')}</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            placeholder="Min 8 characters"
                            autoFocus
                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                        />
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">{t('auth.reset_password.confirm_password')}</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            placeholder="Repeat password"
                            className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                        />
                        {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                    >
                        {processing && <LoaderCircle className="w-4 h-4 animate-spin" />}
                        {t('auth.reset_password.reset_button')}
                    </button>
                </form>

            </div>
        </div>
    );
}