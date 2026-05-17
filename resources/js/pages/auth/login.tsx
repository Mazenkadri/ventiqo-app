import { Head, router } from '@inertiajs/react';
import { useState, useEffect, FormEventHandler } from 'react';
import { LoaderCircle, Sun, Moon } from 'lucide-react';
import VerificationModal from '@/components/verification-modal';
import { useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { useAppearance } from '@/hooks/use-appearance';

interface Props {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: Props) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [showReset, setShowReset] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [resetEmailInput, setResetEmailInput] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [showResetEmailStep, setShowResetEmailStep] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const { data: loginData, setData: setLoginData, post: loginPost, processing: loginProcessing, errors: loginErrors, reset: loginReset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const { data: registerData, setData: setRegisterData, post: registerPost, processing: registerProcessing, errors: registerErrors, reset: registerReset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    

    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const submitLogin: FormEventHandler = (e) => {
        e.preventDefault();
        loginPost(route('login'), {
            onFinish: () => loginReset('password'),
            onError: () => {},
        });
    };

    const submitRegister: FormEventHandler = (e) => {
        e.preventDefault();
        registerPost(route('register'), {
            onSuccess: () => {
                setRegisteredEmail(registerData.email);
                setShowVerification(true);
            },
            onFinish: () => registerReset('password', 'password_confirmation'),
        });
    };

    const inputClass = "w-full bg-input border border-[var(--input-border)] rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:border-accent transition-colors placeholder:text-muted-foreground";
    const labelClass = "text-xs font-semibold tracking-widest text-muted-foreground uppercase";

    // Shared brand panel content
    const BrandPanel = () => (
        <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-10 flex justify-center">
                <img src="/Ventiqo-lightmode.svg" alt="Ventiqo" className="h-full w-auto block dark:hidden" />
                <img src="/Ventiqo-darkmode.svg" alt="Ventiqo" className="h-full w-auto hidden dark:block" />
            </div>
            <p className="text-muted-foreground text-sm">{t('auth.ai_powered_business_planning')}</p>

            {/* Document illustration */}
            <div className="w-32 h-36 border-2 border-accent rounded-2xl flex flex-col items-center justify-center gap-2 p-4">
                <div className="w-full h-1.5 bg-accent rounded-full opacity-80" />
                <div className="w-full h-1.5 bg-accent rounded-full opacity-60" />
                <div className="w-full h-1.5 bg-accent rounded-full opacity-40" />
                <div className="w-full h-1.5 bg-accent rounded-full opacity-60" />
                <div className="w-full h-1.5 bg-accent rounded-full opacity-40" />
                <div className="w-full h-1.5 bg-accent rounded-full opacity-20" />
                <div className="flex gap-1.5 mt-1">
                    <div className="w-2 h-2 rounded-full bg-accent opacity-60" />
                    <div className="w-2 h-2 rounded-full bg-accent opacity-40" />
                    <div className="w-2 h-2 rounded-full bg-accent opacity-20" />
                </div>
            </div>

            {mode === 'login' ? (
                <>
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-foreground text-sm">{t('auth.login.new_here')}</p>
                        <p className="text-accent text-sm font-medium">{t('auth.login.create_account')}</p>
                    </div>
                    <button
                        onClick={() => setMode('register')}
                        className="px-8 py-2.5 rounded-xl border border-accent text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
                    >
                        {t('auth.login.get_started')}
                    </button>
                </>
            ) : (
                <>
                    <p className="text-foreground text-sm">{t('auth.login.already_have_account')}</p>
                    <button
                        onClick={() => setMode('login')}
                        className="px-8 py-2.5 rounded-xl border border-accent text-accent text-sm font-medium hover:bg-accent/10 transition-colors"
                    >
                        {t('auth.login.sign_in')}
                    </button>
                </>
            )}

            {/* Theme toggle */}
            <button
                onClick={toggleTheme}
                className="flex items-center gap-1 bg-input rounded-full px-3 py-1.5 border border-border transition-colors hover:border-accent"
            >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${isDark ? 'bg-transparent' : 'bg-accent/20'}`}>
                    <Sun className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-muted-foreground' : 'text-accent'}`} />
                </div>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all ${isDark ? 'bg-accent/20' : 'bg-transparent'}`}>
                    <Moon className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Head title={mode === 'login' ? 'Sign In' : 'Sign Up'} />

            {/* Main container */}
            <div className="relative w-full max-w-4xl h-[560px] flex rounded-3xl overflow-hidden shadow-2xl bg-card border border-border">

                {/* ─── LOGIN FORM (left side) ─── */}
                <div
                    className="relative w-1/2 flex-shrink-0 flex flex-col justify-center px-12 py-10 z-10"
                    style={{
                        opacity: mode === 'login' ? 1 : 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: mode === 'login' ? 'auto' : 'none',
                    }}
                >
                    <h1 className="text-4xl font-bold text-foreground mb-1 font-heading">{t('auth.login.welcome')}</h1>
                    <h1 className="text-4xl font-bold text-accent mb-2 font-heading">{t('auth.login.back')}</h1>
                    <p className="text-muted-foreground text-sm mb-8">{t('auth.login.sign_in_prompt')}</p>

                    {status && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submitLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className={labelClass}>{t('auth.login.email_address')}</label>
                            <input
                                type="email"
                                value={loginData.email}
                                onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                                placeholder="you@company.com"
                                required
                                className={inputClass}
                            />
                            {loginErrors.email && <p className="text-xs text-destructive">{loginErrors.email}</p>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className={labelClass}>{t('auth.login.password')}</label>
                                {canResetPassword && (
                                    <button
                                        type="button"
                                        onClick={() => setShowResetEmailStep(true)}
                                        className="text-xs text-accent hover:underline"
                                    >
                                        {t('auth.login.forget_password')}
                                    </button>
                                )}
                            </div>
                            <input
                                type="password"
                                value={loginData.password}
                                onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                                placeholder="••••••••••••••"
                                required
                                className={inputClass}
                            />
                            {loginErrors.password && <p className="text-xs text-destructive">{loginErrors.password}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={loginData.remember}
                                onChange={e => setLoginData(p => ({ ...p, remember: e.target.checked }))}
                                className="rounded"
                            />
                            <label htmlFor="remember" className="text-xs text-muted-foreground">{t('auth.login.remember_me')}</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loginProcessing}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-50"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                        >
                            {loginProcessing && <LoaderCircle className="w-4 h-4 animate-spin" />}
                            {t('auth.login.sign_in')}
                        </button>

                        <p className="text-center text-xs text-muted-foreground">
                            {t('auth.login.dont_have_account')}{' '}
                            <button type="button" onClick={() => setMode('register')} className="text-accent hover:underline">
                                {t('auth.login.create_account')}
                            </button>
                        </p>
                    </form>
                </div>

                {/* ─── SLIDING BRAND PANEL ─── */}
                <div
                    className="absolute top-0 w-1/2 h-full flex flex-col items-center justify-center px-10 py-10 rounded-3xl z-20 bg-card border border-border"
                    style={{
                        right: mode === 'login' ? '0%' : '50%',
                        transition: 'right 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: mode === 'login'
                            ? '-8px 0 32px rgba(0,0,0,0.3)'
                            : '8px 0 32px rgba(0,0,0,0.3)',
                    }}
                >
                    <BrandPanel />
                </div>

                {/* ─── REGISTER FORM (right side, revealed when panel slides left) ─── */}
                <div
                    className="absolute right-0 top-0 w-1/2 h-full flex flex-col justify-center px-12 py-10"
                    style={{
                        opacity: mode === 'register' ? 1 : 0,
                        transition: 'opacity 0.3s ease 0.2s',
                        pointerEvents: mode === 'register' ? 'auto' : 'none',
                    }}
                >
                    <h1 className="text-4xl font-bold text-accent mb-2 font-heading">{t('auth.signup.welcome')}</h1>
                    <p className="text-muted-foreground text-sm mb-6">{t('auth.signup.create_account_prompt')}</p>

                    <form onSubmit={submitRegister} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>{t('auth.signup.name')}</label>
                            <input
                                type="text"
                                value={registerData.name}
                                onChange={e => setRegisterData(p => ({ ...p, name: e.target.value }))}
                                placeholder={t('auth.signup.username')}
                                required
                                className={inputClass}
                            />
                            {registerErrors.name && <p className="text-xs text-destructive">{registerErrors.name}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>{t('auth.signup.email_address')}</label>
                            <input
                                type="email"
                                value={registerData.email}
                                onChange={e => setRegisterData(p => ({ ...p, email: e.target.value }))}
                                placeholder="you@company.com"
                                required
                                className={inputClass}
                            />
                            {registerErrors.email && <p className="text-xs text-destructive">{registerErrors.email}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>{t('auth.signup.password')}</label>
                            <input
                                type="password"
                                value={registerData.password}
                                onChange={e => setRegisterData(p => ({ ...p, password: e.target.value }))}
                                placeholder="••••••••••••••"
                                required
                                className={inputClass}
                            />
                            {registerErrors.password && <p className="text-xs text-destructive">{registerErrors.password}</p>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>{t('auth.signup.confirm_password')}</label>
                            <input
                                type="password"
                                value={registerData.password_confirmation}
                                onChange={e => setRegisterData(p => ({ ...p, password_confirmation: e.target.value }))}
                                placeholder="••••••••••••••"
                                required
                                className={inputClass}
                            />
                            {registerErrors.password_confirmation && <p className="text-xs text-destructive">{registerErrors.password_confirmation}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loginProcessing}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold disabled:opacity-50 mt-1"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                        >
                            {loginProcessing && <LoaderCircle className="w-4 h-4 animate-spin" />}
                            {t('auth.signup.sign_up')}
                        </button>

                        <p className="text-center text-xs text-muted-foreground">
                            {t('auth.signup.already_have_account')}{' '}
                            <button type="button" onClick={() => setMode('login')} className="text-accent hover:underline">
                                {t('auth.signup.login')}
                            </button>
                        </p>
                    </form>
                </div>

            </div>

            {/* Reset email step overlay */}
            {showResetEmailStep && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md flex flex-col gap-5">
                        <h2 className="text-lg font-bold font-heading">
                            {t('auth.reset_password.title_1')} <span className="text-accent">{t('auth.reset_password.title_2')}</span>
                        </h2>
                        <p className="text-sm text-muted-foreground">{t('auth.reset_password.prompt')}</p>
                        <div className="flex flex-col gap-1">
                            <label className={labelClass}>{t('auth.reset_password.email_address')}</label>
                            <input
                                type="email"
                                value={resetEmailInput}
                                onChange={e => setResetEmailInput(e.target.value)}
                                placeholder="you@company.com"
                                autoFocus
                                className={inputClass}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetEmailStep(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border text-muted-foreground hover:bg-accent/10 transition-colors"
                            >
                                {t('auth.reset_password.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (!resetEmailInput) return;
                                    setResetEmail(resetEmailInput);
                                    setShowResetEmailStep(false);
                                    setShowReset(true);
                                }}
                                disabled={!resetEmailInput}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                            >
                                {t('auth.reset_password.continue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerification && (
                <VerificationModal
                    type="verification"
                    email={registeredEmail}
                />
            )}

            {/* Password Reset Modal */}
            {showReset && (
                <VerificationModal
                    type="reset"
                    email={resetEmail}
                    onClose={() => setShowReset(false)}
                />
            )}
        </div>
    );
}