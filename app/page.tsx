'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { createSupabaseBrowserClient } from '@data/browser-client';
import { useTranslations, useLocale } from 'next-intl';
import { X, Eye, PenLine, Plus, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.7, ease: 'easeOut' as const },
    }),
};

const roles = {
    en: [
        {
            icon: Eye,
            tab: 'Visitor',
            items: [
                'Click "Visit Memorial" on the home page',
                "Search for the Memorial you're looking for",
                'Private Memorials are accessible via a personal invitation link — no account needed',
                'Want to save it for later? Create a free account',
            ],
        },
        {
            icon: PenLine,
            tab: 'Editor',
            items: [
                "You'll receive a personal invitation link by email",
                "Register for free if you don't have an account yet",
                'The Memorial appears in your dashboard under "Shared with me"',
                'Add milestones, photos, donations, or guestbook entries',
                'All contributions require approval by the creator',
            ],
        },
        {
            icon: Plus,
            tab: 'Creator',
            items: [
                'Create a free account and sign in',
                'Click "+ New" in your dashboard to create a Memorial',
                'Enter name, dates, biography, and a photo',
                'Choose public (searchable) or private (invitation only)',
                'Share the link and invite Editors to contribute together',
                'Review and approve incoming guestbook entries',
            ],
        },
    ],
    de: [
        {
            icon: Eye,
            tab: 'Besucher',
            items: [
                'Klicke auf der Startseite auf „Memorial besuchen"',
                'Suche nach dem gewünschten Memorial',
                'Private Memorials sind nur über einen persönlichen Einladungslink erreichbar — kein Konto nötig',
                'Möchtest du das Memorial speichern? Erstelle kostenlos ein Konto',
            ],
        },
        {
            icon: PenLine,
            tab: 'Editor',
            items: [
                'Du erhältst einen persönlichen Link per E-Mail',
                'Falls du noch kein Konto hast: Registriere dich zunächst kostenlos',
                'Das Memorial erscheint in deinem Dashboard unter „Geteilt mit mir"',
                'Füge Meilensteine, Fotos, Spenden oder Gästebucheinträge hinzu',
                'Alle Beiträge werden erst nach Freigabe durch den Ersteller sichtbar',
            ],
        },
        {
            icon: Plus,
            tab: 'Ersteller',
            items: [
                'Erstelle kostenlos ein Konto und melde dich an',
                'Klicke im Dashboard auf „+ Neu", um ein Memorial anzulegen',
                'Gib Name, Daten, Biografie und ein Foto ein',
                'Wähle öffentlich (auffindbar) oder privat (nur per Einladung)',
                'Teile den Link und lade Editoren ein',
                'Prüfe und genehmige eingehende Gästebucheinträge',
            ],
        },
    ],
};

export default function LandingPage() {
    const t = useTranslations('landing');
    const locale = useLocale() as 'de' | 'en';
    const [guideOpen, setGuideOpen] = useState(false);
    const [guideStep, setGuideStep] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const supabase = createSupabaseBrowserClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setIsLoggedIn(true);
        });
    }, []);

    const currentRoles = roles[locale] ?? roles.en;

    return (
        <div className="relative flex flex-col items-center">
            {/* Hero – full viewport */}
            <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4">
                {/* Subtle radial glow */}
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `radial-gradient(ellipse 80% 60% at 50% 40%, hsl(230 40% 92% / 0.6), transparent)`,
                    }}
                />

                {/* How it works + Language toggle — top left */}
                <motion.div
                    custom={3}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="absolute left-6 top-6 flex items-center gap-5"
                >
                    <button
                        onClick={() => setGuideOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-light tracking-wide transition-colors duration-300"
                        style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground) / 0.5)')}
                    >
                        <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                        <span
                            className="underline underline-offset-[3px] text-xs"
                            style={{ textDecorationColor: 'hsl(var(--muted-foreground) / 0.3)' }}
                        >
                            {t('howItWorks')}
                        </span>
                    </button>
                    <LanguageToggle />
                </motion.div>

                {/* Login — top right */}
                <motion.div
                    custom={3}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    className="absolute right-6 top-6"
                >
                    <Link
                        href={isLoggedIn ? '/dashboard' : '/login'}
                        className="flex items-center gap-1.5 rounded-full border px-4.5 py-2 text-xs font-normal tracking-wide shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-[hsl(var(--foreground)/0.35)] hover:bg-[hsl(var(--foreground)/0.08)] hover:text-[hsl(var(--foreground)/0.9)]"
                        style={{
                            borderColor: 'hsl(var(--foreground) / 0.15)',
                            backgroundColor: 'hsl(var(--foreground) / 0.04)',
                            color: 'hsl(var(--foreground) / 0.6)',
                        }}
                    >
                        {isLoggedIn ? t('dashboard') : t('login')}
                    </Link>
                </motion.div>

                {/* Center content */}
                <div className="relative flex flex-col items-center gap-3 text-center">
                    <motion.div
                        custom={0}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="flex flex-col items-center gap-2"
                    >
                        <Image
                            src="/logo.png"
                            alt="MemorialYard Logo"
                            width={160}
                            height={160}
                            className="h-32 w-32 object-contain md:h-40 md:w-40"
                            priority
                        />
                        <h1
                            className="text-4xl tracking-tight md:text-6xl"
                            style={{ color: 'hsl(var(--foreground))' }}
                        >
                            Memorial<span className="font-medium">Yard</span>
                        </h1>
                        <p
                            className="max-w-lg text-base font-light"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {t('tagline')}
                        </p>
                    </motion.div>

                    <motion.div
                        custom={1}
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="mt-6 flex flex-col items-center gap-4"
                    >
                        <Link
                            href="/visit"
                            className="w-72 rounded-full py-4 text-center text-xs font-normal uppercase tracking-[0.25em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                            style={{
                                backgroundColor: 'hsl(var(--primary))',
                                color: 'hsl(var(--primary-foreground))',
                            }}
                        >
                            {t('visitMemorial')}
                        </Link>

                        <Link
                            href={isLoggedIn ? '/create' : '/login?next=/create'}
                            className="text-sm font-light transition-colors hover:opacity-80"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {t('createMemorial')}
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Legal footer — visible on scroll */}
            <div
                className="flex items-center justify-center gap-3 py-10 text-[11px] font-light"
                style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }}
            >
                <Link
                    href="/impressum"
                    className="transition-colors"
                    style={{ color: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground) / 0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                >
                    {t('legalNotice')}
                </Link>
                <span>·</span>
                <Link
                    href="/datenschutz"
                    className="transition-colors"
                    style={{ color: 'inherit' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--muted-foreground) / 0.7)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                >
                    {t('privacyPolicy')}
                </Link>
            </div>

            {/* Guide overlay */}
            <AnimatePresence>
                {guideOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-50 flex items-center justify-center px-6"
                        style={{ backgroundColor: 'hsl(var(--background) / 0.8)', backdropFilter: 'blur(4px)' }}
                        onClick={() => { setGuideOpen(false); setGuideStep(0); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="relative w-full max-w-md rounded-3xl border p-10 shadow-2xl md:p-12"
                            style={{
                                borderColor: 'hsl(var(--border) / 0.4)',
                                backgroundColor: 'hsl(var(--card))',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => { setGuideOpen(false); setGuideStep(0); }}
                                className="absolute right-5 top-5 transition-colors"
                                style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }}
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <p
                                className="mb-1 text-center text-[11px] font-light uppercase tracking-[0.3em]"
                                style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                            >
                                {t('gettingStarted')}
                            </p>
                            <h2
                                className="mb-6 text-center text-2xl font-light tracking-tight"
                                style={{ color: 'hsl(var(--foreground))' }}
                            >
                                {t('howItWorks')}
                            </h2>

                            {/* Role tabs */}
                            <div
                                className="mb-6 flex items-center justify-center gap-1 rounded-full border p-1"
                                style={{
                                    borderColor: 'hsl(var(--border) / 0.3)',
                                    backgroundColor: 'hsl(var(--muted) / 0.3)',
                                }}
                            >
                                {currentRoles.map((role, i) => {
                                    const Icon = role.icon;
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setGuideStep(i)}
                                            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-light transition-all duration-300"
                                            style={{
                                                backgroundColor: guideStep === i ? 'hsl(var(--card))' : 'transparent',
                                                color: guideStep === i ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                                                boxShadow: guideStep === i ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
                                            }}
                                        >
                                            <Icon className="h-3 w-3" />
                                            {role.tab}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active role content – fixed height to prevent layout shift */}
                            <div className="relative h-[270px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${locale}-${guideStep}`}
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -8 }}
                                        transition={{ duration: 0.25 }}
                                        className="absolute inset-x-0 top-0"
                                    >
                                        <ol className="space-y-2.5 pl-1">
                                            {currentRoles[guideStep].items.map((item, j) => (
                                                <li
                                                    key={j}
                                                    className="flex gap-2.5 text-[13px] font-light leading-relaxed"
                                                    style={{ color: 'hsl(var(--muted-foreground))' }}
                                                >
                                                    <span style={{ color: 'hsl(var(--muted-foreground) / 0.4)' }} className="shrink-0">
                                                        {j + 1}.
                                                    </span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ol>
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Navigation dots */}
                            <div className="mt-8 flex items-center justify-center gap-1.5">
                                {currentRoles.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setGuideStep(i)}
                                        className="rounded-full transition-all duration-300"
                                        style={{
                                            width: guideStep === i ? 20 : 6,
                                            height: 6,
                                            backgroundColor: guideStep === i
                                                ? 'hsl(var(--primary) / 0.5)'
                                                : 'hsl(var(--border) / 0.6)',
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
