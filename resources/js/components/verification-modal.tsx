import { useState, useEffect, useRef } from 'react';
import { X, Mail, LoaderCircle, ShieldCheck } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Props {
    type: 'verification' | 'reset';
    email?: string;
    onClose?: () => void;
    onSuccess?: () => void;
}

const getCsrfToken = () => {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
};

export default function VerificationModal({ type, email, onClose, onSuccess }: Props) {
    const [step, setStep] = useState<'send' | 'verify'>('send');
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [sending, setSending] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timer, setTimer] = useState(0);
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const { t } = useTranslation();

    useEffect(() => {
        if (timer > 0) {
            const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [timer]);

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...code];
        newCode[index] = value.slice(-1);
        setCode(newCode);
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setCode(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const sendCode = async () => {
        setSending(true);
        setError('');
        setSuccess('');
        try {
            if (type === 'verification') {
                const res = await fetch(route('verification.send.code'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                    },
                });
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.message || t('verification.err_send_failed'));
                    return;
                }
            } else {
                const res = await fetch(route('password.send.code'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });
                if (!res.ok) {
                    const data = await res.json();
                    setError(data.message || t('verification.err_send_failed'));
                    return;
                }
            }
            setStep('verify');
            setTimer(60);
            setSuccess(t('verification.succ_code_sent'));
        } catch (e) {
            setError(t('verification.err_send_failed_retry'));
        } finally {
            setSending(false);
        }
    };

    const verify = async () => {
        const fullCode = code.join('');
        if (fullCode.length !== 6) {
            setError(t('verification.err_enter_6_digits'));
            return;
        }
        setVerifying(true);
        setError('');
        try {
            if (type === 'verification') {
                const res = await fetch(route('verification.verify.code'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({ code: fullCode }),
                });
                const data = await res.json();
                if (res.ok && data.verified) {
                    setSuccess(t('verification.succ_verified'));
                    setTimeout(() => {
                        onSuccess ? onSuccess() : router.visit(route('dashboard'));
                    }, 1000);
                } else {
                    setError(data.message || t('verification.err_invalid_code'));
                }
            } else {
                if (!password || password !== passwordConfirm) {
                    setError(t('verification.err_passwords_match'));
                    setVerifying(false);
                    return;
                }
                const res = await fetch(route('password.reset.code'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': getCsrfToken(),
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        code: fullCode,
                        password,
                        password_confirmation: passwordConfirm,
                    }),
                });
                const data = await res.json();
                if (res.ok) {
                    setSuccess(t('verification.succ_reset'));
                    setTimeout(() => router.visit(route('login')), 1500);
                } else {
                    setError(data.message || t('verification.err_invalid_code'));
                }
            }
        } catch (e) {
            setError(t('verification.err_wrong'));
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            {step === 'send'
                                ? <Mail className="w-5 h-5 text-accent" />
                                : <ShieldCheck className="w-5 h-5 text-accent" />
                            }
                        </div>
                        <div>
                            <h2 className="text-lg font-bold font-heading">
                                {type === 'verification' ? t('verification.verify_your') : t('verification.reset_your')}
                                <span className="text-accent">
                                    {type === 'verification' ? t('verification.email') : t('verification.password')}
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {step === 'send'
                                    ? `${t('verification.send_code_to')} ${email ?? t('verification.email').toLowerCase()}`
                                    : t('verification.enter_code')
                                }
                            </p>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Success message */}
                {success && (
                    <div className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm text-center">
                        {success}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Step 1 — Send */}
                {step === 'send' && (
                    <button
                        onClick={sendCode}
                        disabled={sending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                        style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                    >
                        {sending && <LoaderCircle className="w-4 h-4 animate-spin" />}
                        {type === 'verification' ? t('verification.send_verification') : t('verification.send_reset')}
                    </button>
                )}

                {/* Step 2 — Verify */}
                {step === 'verify' && (
                    <div className="flex flex-col gap-5">

                        {/* 6-digit code inputs */}
                        <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleCodeChange(i, e.target.value)}
                                    onKeyDown={e => handleCodeKeyDown(i, e)}
                                    className="w-12 h-14 text-center text-xl font-bold bg-input border-2 border-[var(--input-border)] rounded-xl outline-none focus:border-accent transition-colors"
                                />
                            ))}
                        </div>

                        {/* Password fields for reset */}
                        {type === 'reset' && (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('verification.new_password')}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder={t('verification.min_8_chars')}
                                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">{t('verification.confirm_password')}</label>
                                    <input
                                        type="password"
                                        value={passwordConfirm}
                                        onChange={e => setPasswordConfirm(e.target.value)}
                                        placeholder={t('verification.repeat_password')}
                                        className="bg-input border border-[var(--input-border)] rounded-xl px-3 py-2 text-sm outline-none focus:border-accent transition-colors"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={sendCode}
                                disabled={timer > 0 || sending}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-border hover:bg-accent/10 transition-colors disabled:opacity-50"
                            >
                                {timer > 0 ? `${t('verification.resend_in')}${timer}s` : t('verification.resend_code')}
                            </button>
                            <button
                                onClick={verify}
                                disabled={verifying || code.join('').length !== 6}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50"
                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                            >
                                {verifying && <LoaderCircle className="w-4 h-4 animate-spin" />}
                                {t('verification.verify')}
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}