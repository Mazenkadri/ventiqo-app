import { useEffect, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    FileText, Zap, Globe, BarChart3, Edit3, Download,
    ArrowRight, Check, ChevronDown, Sun, Moon, Menu, X,
    Building2, Brain, Layers, Crown, Infinity
} from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

// ─── Animated Counter ────────────────────────────────────────────────────────
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                let start = 0;
                const step = end / 60;
                const timer = setInterval(() => {
                    start += step;
                    if (start >= end) { setCount(end); clearInterval(timer); }
                    else setCount(Math.floor(start));
                }, 16);
            }
        });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end]);

    return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Scroll Reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
        }, { threshold: 0.1 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// ─── Floating Document Card ───────────────────────────────────────────────────
function FloatingCard({ style, lines }: { style: React.CSSProperties; lines: string[] }) {
    return (
        <div
            className="absolute bg-card border border-border rounded-2xl p-4 shadow-2xl"
            style={{ width: 200, ...style }}
        >
            <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-warning" />
            </div>
            {lines.map((w, i) => (
                <div
                    key={i}
                    className="h-2 rounded-full bg-border mb-2"
                    style={{ width: w, opacity: 1 - i * 0.15 }}
                />
            ))}
        </div>
    );
}

export default function Welcome() {
    const { t, i18n } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    
    const { appearance, updateAppearance } = useAppearance();
    const isDark = appearance === 'dark' || (appearance === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'fr' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
    };

    const features = [
        { icon: Brain, key: 'ai_sections' },
        { icon: Globe, key: 'bilingual' },
        { icon: Layers, key: 'bmc' },
        { icon: BarChart3, key: 'charts' },
        { icon: Edit3, key: 'edit' },
        { icon: Download, key: 'export' },
    ];

    const steps = [
        { icon: Building2, num: '01', key: 'step1' },
        { icon: FileText, num: '02', key: 'step2' },
        { icon: Download, num: '03', key: 'step3' },
    ];

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
            icon: Infinity,
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

    const stats = [
        { end: 9, suffix: '', key: 'sections' },
        { end: 2, suffix: '', key: 'languages' },
        { end: 4, suffix: '', key: 'templates' },
        { end: 30, suffix: t('landing.stats.days_suffix'), key: 'trial' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            <Head title={t('landing.page_title')} />

            {/* ── Navbar ── */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
                style={{
                    backgroundColor: scrolled ? 'var(--card)' : 'transparent',
                    borderBottom: scrolled ? '1px solid var(--border)' : 'none',
                    backdropFilter: scrolled ? 'blur(12px)' : 'none',
                }}
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <img src="/Ventiqo-lightmode.svg" alt="Ventiqo" className="h-8 w-auto block dark:hidden" />
                        <img src="/Ventiqo-darkmode.svg" alt="Ventiqo" className="h-8 w-auto hidden dark:block" />
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        {['features', 'how_it_works', 'pricing'].map(key => (
                            <a
                                key={key}
                                href={`#${key}`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {t(`landing.nav.${key}`)}
                            </a>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl border border-border hover:bg-accent/10 transition-colors"
                        >
                            {isDark
                                ? <Sun className="w-4 h-4 text-muted-foreground" />
                                : <Moon className="w-4 h-4 text-muted-foreground" />
                            }
                        </button>
                        <button
                            onClick={toggleLanguage}
                            className="p-2 rounded-xl border border-border hover:bg-accent/10 transition-colors flex items-center justify-center min-w-[34px]"
                            title={t('landing.nav.change_language') || "Change Language"}
                        >
                            <span className="text-xs font-bold text-muted-foreground uppercase leading-none mt-[1px]">
                                {i18n.language === 'en' ? 'fr' : 'en'}
                            </span>
                        </button>
                        <Link
                            href="/login"
                            className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                        >
                            {t('landing.nav.login')}
                        </Link>
                        <Link
                            href="/login"
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                        >
                            {t('landing.nav.get_started')}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                            className="md:hidden p-2 rounded-xl border border-border"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden bg-card border-t border-border px-6 py-4 flex flex-col gap-4">
                        {['features', 'how_it_works', 'pricing'].map(key => (
                            <a
                                key={key}
                                href={`#${key}`}
                                className="text-sm text-muted-foreground"
                                onClick={() => setMenuOpen(false)}
                            >
                                {t(`landing.nav.${key}`)}
                            </a>
                        ))}
                        <Link href="/login" className="text-sm text-accent font-medium">{t('landing.nav.get_started')}</Link>
                    </div>
                )}
            </nav>

            {/* ── Hero ── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

                {/* Background glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: isDark
                            ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 70%)'
                            : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 70%)',
                    }}
                />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Floating cards */}
                <div className="absolute inset-0 pointer-events-none hidden lg:block">
                    <FloatingCard
                        style={{ top: '20%', left: '5%', animation: 'float1 6s ease-in-out infinite' }}
                        lines={['75%', '90%', '60%', '80%', '50%']}
                    />
                    <FloatingCard
                        style={{ top: '35%', right: '4%', animation: 'float2 7s ease-in-out infinite' }}
                        lines={['85%', '65%', '75%', '55%']}
                    />
                    <FloatingCard
                        style={{ bottom: '20%', left: '8%', animation: 'float3 8s ease-in-out infinite' }}
                        lines={['70%', '85%', '60%']}
                    />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                    {/* Badge */}
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium mb-8"
                        style={{
                            borderColor: 'rgba(0,212,255,0.3)',
                            backgroundColor: 'rgba(0,212,255,0.05)',
                            color: 'var(--accent)',
                            animation: 'fadeInDown 0.6s ease both',
                        }}
                    >
                        <Zap className="w-3 h-3" />
                        {t('landing.hero.badge')}
                    </div>

                    {/* Headline */}
                    <h1
                        className="font-heading font-bold mb-6 leading-tight"
                        style={{
                            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                            animation: 'fadeInUp 0.7s ease 0.1s both',
                        }}
                    >
                        {t('landing.hero.title_1')}{' '}
                        <span
                            style={{
                                background: 'linear-gradient(135deg, #00D4FF 0%, #00B981 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            {t('landing.hero.title_accent')}
                        </span>{' '}
                        {t('landing.hero.title_2')}
                    </h1>

                    {/* Subtext */}
                    <p
                        className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
                        style={{ animation: 'fadeInUp 0.7s ease 0.2s both' }}
                    >
                        {t('landing.hero.subtitle')}
                    </p>

                    {/* CTAs */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        style={{ animation: 'fadeInUp 0.7s ease 0.3s both' }}
                    >
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold transition-all hover:scale-105 hover:shadow-lg"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-foreground)',
                                boxShadow: '0 0 32px rgba(0,212,255,0.25)',
                            }}
                        >
                            {t('landing.hero.cta_primary')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                            href="#how_it_works"
                            className="flex items-center gap-2 px-8 py-4 rounded-xl text-base font-medium border border-border hover:border-accent/50 hover:bg-accent/5 transition-all"
                        >
                            {t('landing.hero.cta_secondary')}
                            <ChevronDown className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Trial note */}
                    <p
                        className="text-xs text-muted-foreground mt-6"
                        style={{ animation: 'fadeInUp 0.7s ease 0.4s both' }}
                    >
                        {t('landing.hero.trial_note')}
                    </p>
                </div>

                {/* Scroll indicator */}
                <div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2"
                    style={{ animation: 'bounce 2s ease-in-out infinite' }}
                >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
            </section>

            {/* ── Stats Bar ── */}
            <section className="border-y border-border bg-card/50">
                <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat, i) => (
                        <Reveal key={stat.key} delay={i * 80} className="text-center">
                            <div className="text-4xl font-bold font-heading text-accent mb-1">
                                <Counter end={stat.end} suffix={stat.suffix} />
                            </div>
                            <div className="text-sm text-muted-foreground">{t(`landing.stats.${stat.key}`)}</div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ── Problem Section ── */}
            <section className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            {t('landing.problem.title_1')}{' '}
                            <span className="text-destructive">{t('landing.problem.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.problem.subtitle')}</p>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[0, 1, 2].map(i => (
                            <Reveal key={i} delay={i * 120}>
                                <div
                                    className="relative rounded-2xl p-6 border overflow-hidden group"
                                    style={{
                                        borderColor: 'rgba(255,0,0,0.15)',
                                        backgroundColor: 'rgba(255,0,0,0.03)',
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,0,0,0.06) 0%, transparent 70%)' }}
                                    />
                                    <div className="text-4xl mb-4">{['⏱️', '💸', '📄'][i]}</div>
                                    <h3 className="font-bold font-heading text-lg mb-2 text-foreground">
                                        {t(`landing.problem.p${i + 1}_title`)}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {t(`landing.problem.p${i + 1}_desc`)}
                                    </p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how_it_works" className="py-24 px-6 bg-card/30">
                <div className="max-w-7xl mx-auto">
                    <Reveal className="text-center mb-16">
                        <span className="text-xs font-semibold tracking-widest text-accent uppercase block mb-3">
                            {t('landing.how.eyebrow')}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            {t('landing.how.title_1')}{' '}
                            <span className="text-accent">{t('landing.how.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.how.subtitle')}</p>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div
                            className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }}
                        />

                        {steps.map((step, i) => (
                            <Reveal key={step.key} delay={i * 150}>
                                <div className="flex flex-col items-center text-center group">
                                    <div
                                        className="relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-300"
                                        style={{
                                            backgroundColor: 'rgba(0,212,255,0.1)',
                                            border: '1px solid rgba(0,212,255,0.2)',
                                            boxShadow: '0 0 24px rgba(0,212,255,0.1)',
                                        }}
                                    >
                                        <step.icon className="w-8 h-8 text-accent" />
                                        <div
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)' }}
                                        >
                                            {i + 1}
                                        </div>
                                    </div>
                                    <h3 className="font-bold font-heading text-lg mb-2">{t(`landing.how.${step.key}_title`)}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.how.${step.key}_desc`)}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal className="text-center mb-16">
                        <span className="text-xs font-semibold tracking-widest text-accent uppercase block mb-3">
                            {t('landing.features.eyebrow')}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            {t('landing.features.title_1')}{' '}
                            <span className="text-accent">{t('landing.features.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.features.subtitle')}</p>
                    </Reveal>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, i) => (
                            <Reveal key={feature.key} delay={i * 80}>
                                <div
                                    className="group relative rounded-2xl p-6 border border-border bg-card hover:border-accent/40 transition-all duration-300 overflow-hidden cursor-default"
                                >
                                    <div
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                        style={{ background: 'radial-gradient(circle at 0% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)' }}
                                    />
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                                        style={{ backgroundColor: 'rgba(0,212,255,0.1)' }}
                                    >
                                        <feature.icon className="w-5 h-5 text-accent" />
                                    </div>
                                    <h3 className="font-bold font-heading mb-2">{t(`landing.features.${feature.key}_title`)}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{t(`landing.features.${feature.key}_desc`)}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Preview ── */}
            <section className="py-24 px-6 bg-card/30 overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <Reveal className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            {t('landing.preview.title_1')}{' '}
                            <span className="text-accent">{t('landing.preview.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.preview.subtitle')}</p>
                    </Reveal>

                    <Reveal delay={100}>
                        <div
                            className="relative rounded-3xl border border-border overflow-hidden mx-auto max-w-5xl"
                            style={{ boxShadow: '0 0 80px rgba(0,212,255,0.08)' }}
                        >
                            {/* Fake browser bar */}
                            <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                                    <div className="w-3 h-3 rounded-full bg-primary/60" />
                                </div>
                                <div className="flex-1 bg-background rounded-lg px-3 py-1 text-xs text-muted-foreground">
                                    ventiqo.com/business-plans/result
                                </div>
                            </div>

                            {/* Fake app preview */}
                            <div className="bg-background p-6 grid grid-cols-3 gap-4 min-h-[320px]">
                                {/* Sidebar */}
                                <div className="col-span-1 bg-card rounded-xl p-4 flex flex-col gap-2">
                                    <div className="h-3 bg-accent/20 rounded-full w-3/4 mb-2" />
                                    {['Executive Summary', 'Company', 'Market', 'Strategy', 'Financial', 'Risk'].map((s, i) => (
                                        <div
                                            key={s}
                                            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs"
                                            style={{
                                                backgroundColor: i === 0 ? 'rgba(0,212,255,0.1)' : 'transparent',
                                                color: i === 0 ? 'var(--accent)' : 'var(--muted-foreground)',
                                            }}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-primary' : 'bg-border'}`} />
                                            {s}
                                        </div>
                                    ))}
                                </div>

                                {/* Content */}
                                <div className="col-span-2 flex flex-col gap-3">
                                    <div className="bg-card rounded-xl p-4">
                                        <div className="h-3 bg-accent/30 rounded-full w-1/3 mb-3" />
                                        <div className="space-y-2">
                                            {['95%', '80%', '70%', '85%', '60%'].map((w, i) => (
                                                <div key={i} className="h-2 bg-border/60 rounded-full" style={{ width: w }} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['Revenue', 'Costs', 'Profit'].map((label, i) => (
                                            <div key={label} className="bg-card rounded-xl p-3 text-center">
                                                <div className="text-xs text-muted-foreground mb-1">{label}</div>
                                                <div
                                                    className="text-sm font-bold font-heading"
                                                    style={{ color: i === 2 ? 'var(--primary)' : 'var(--accent)' }}
                                                >
                                                    ${['120k', '80k', '40k'][i]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-card rounded-xl p-4 flex items-end gap-1 h-24">
                                        {[30, 50, 40, 70, 55, 80, 65, 90, 75, 100].map((h, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 rounded-t-sm transition-all"
                                                style={{
                                                    height: `${h}%`,
                                                    backgroundColor: i % 2 === 0 ? 'var(--accent)' : 'var(--primary)',
                                                    opacity: 0.6 + (i / 10) * 0.4,
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="pricing" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <Reveal className="text-center mb-16">
                        <span className="text-xs font-semibold tracking-widest text-accent uppercase block mb-3">
                            {t('landing.pricing.eyebrow')}
                        </span>
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
                            {t('landing.pricing.title_1')}{' '}
                            <span className="text-accent">{t('landing.pricing.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">{t('landing.pricing.subtitle')}</p>
                    </Reveal>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {plans.map((plan, i) => {
                            const Icon = plan.icon;
                            return (
                                <Reveal key={plan.key} delay={i * 100}>
                                    <div
                                        className="relative bg-card rounded-2xl p-6 flex flex-col gap-5 border-2 transition-all duration-300 hover:scale-[1.02]"
                                        style={{
                                            borderColor: plan.highlight ? 'var(--accent)' : 'var(--border)',
                                            boxShadow: plan.highlight ? '0 0 32px rgba(0,212,255,0.08)' : 'none',
                                        }}
                                    >
                                        {plan.highlight && (
                                            <div
                                                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                                                style={{ backgroundColor: 'var(--accent)', color: '#000' }}
                                            >
                                                Popular
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
                                            <span className="text-4xl font-bold font-heading">{plan.price}</span>
                                            {plan.key !== 'free' && (
                                                <span className="text-muted-foreground text-sm ml-1">/mo</span>
                                            )}
                                        </div>

                                        <ul className="flex flex-col gap-3 flex-1">
                                            {plan.features.map((feature, fi) => (
                                                <li key={fi} className="flex items-center gap-2 text-sm">
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

                                        <Link
                                            href="/login"
                                            className="w-full flex items-center justify-center py-3 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 mt-4"
                                            style={plan.highlight
                                                ? { backgroundColor: 'var(--accent)', color: '#000' }
                                                : { border: '1px solid var(--border)', color: 'var(--foreground)' }
                                            }
                                        >
                                            Get Started
                                        </Link>
                                    </div>
                                </Reveal>
                            );
                        })}
                    </div>

                    <Reveal className="text-center mt-8">
                        <p className="text-sm text-muted-foreground">
                            {t('landing.pricing.trial_note')}
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="py-24 px-6">
                <Reveal>
                    <div
                        className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
                        style={{
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,185,129,0.1) 100%)'
                                : 'linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(0,185,129,0.08) 100%)',
                            border: '1px solid rgba(0,212,255,0.2)',
                        }}
                    >
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(0,212,255,0.1) 0%, transparent 60%)' }}
                        />
                        <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4 relative z-10">
                            {t('landing.cta.title_1')}{' '}
                            <span className="text-accent">{t('landing.cta.title_accent')}</span>
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-lg mx-auto relative z-10">{t('landing.cta.subtitle')}</p>
                        <Link
                            href="/login"
                            className="relative z-10 inline-flex items-center gap-2 px-10 py-4 rounded-xl text-base font-semibold transition-all hover:scale-105"
                            style={{
                                backgroundColor: 'var(--accent)',
                                color: 'var(--accent-foreground)',
                                boxShadow: '0 0 40px rgba(0,212,255,0.3)',
                            }}
                        >
                            {t('landing.cta.button')}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </Reveal>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-border py-12 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img src="/Ventiqo-lightmode.svg" alt="Ventiqo" className="h-6 w-auto block dark:hidden" />
                        <img src="/Ventiqo-darkmode.svg" alt="Ventiqo" className="h-6 w-auto hidden dark:block" />
                        <span className="text-sm text-muted-foreground ml-3">{t('landing.footer.tagline')}</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <Link href="/login" className="hover:text-foreground transition-colors">{t('landing.nav.login')}</Link>
                        <Link href="/login" className="hover:text-foreground transition-colors">{t('landing.nav.get_started')}</Link>
                    </div>
                    <p className="text-xs text-muted-foreground">{t('landing.footer.copyright')}</p>
                </div>
            </footer>

            {/* ── Global Animations ── */}
            <style>{`
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes float1 {
                    0%, 100% { transform: translateY(0px) rotate(-2deg); }
                    50%       { transform: translateY(-16px) rotate(2deg); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translateY(0px) rotate(2deg); }
                    50%       { transform: translateY(-20px) rotate(-1deg); }
                }
                @keyframes float3 {
                    0%, 100% { transform: translateY(0px) rotate(-1deg); }
                    50%       { transform: translateY(-12px) rotate(3deg); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50%       { transform: translateX(-50%) translateY(8px); }
                }
            `}</style>
        </div>
    );
}