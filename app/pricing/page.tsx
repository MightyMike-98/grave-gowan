/**
 * @file app/pricing/page.tsx
 * @description Pricing-Seite — Free vs Premium Plan.
 *
 * UI 1:1 übernommen von gentle-code-mover/Pricing.tsx,
 * angepasst auf Next.js + next-intl.
 *
 * Premium gilt pro Memorial (nicht pro Account).
 */

'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' as const },
    }),
};

const plans = {
    monthly: { free: '0', premium: '9.99' },
    yearly: { free: '0', premium: '7.99' },
};

function PricingContent() {
    const t = useTranslations('pricing');
    const router = useRouter();
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

    const freeFeatures = [
        t('freeFeature1'),
        t('freeFeature2'),
        t('freeFeature3'),
        t('freeFeature4'),
    ];

    const premiumFeatures = [
        t('premiumFeature1'),
        t('premiumFeature2'),
        t('premiumFeature3'),
        t('premiumFeature4'),
        t('premiumFeature5'),
        t('premiumFeature6'),
        t('premiumFeature7'),
        t('premiumFeature8'),
    ];

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
            <motion.div
                initial="hidden"
                animate="visible"
                className="w-full max-w-3xl space-y-10"
            >
                <div className="text-center space-y-3">
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                        <button
                            onClick={() => router.back()}
                            className="text-sm font-light transition-colors hover:opacity-100"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {t('back')}
                        </button>
                    </motion.div>

                    <motion.h1
                        custom={0.5}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="text-4xl font-light tracking-tight md:text-5xl"
                        style={{ fontFamily: 'var(--font-serif)' }}
                    >
                        {t('heading')}
                    </motion.h1>

                    <motion.p
                        custom={1}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="text-sm font-light"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                        {t('subtext')}
                    </motion.p>

                    {/* Billing toggle */}
                    <motion.div
                        custom={1.5}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        className="flex items-center justify-center gap-1 pt-2"
                    >
                        <div
                            className="relative flex rounded-full p-1 shadow-sm"
                            style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.6)' }}
                        >
                            <button
                                onClick={() => setBilling('monthly')}
                                className="relative z-10 rounded-full px-5 py-2 text-xs font-medium tracking-wide transition-colors duration-300"
                                style={{ color: billing === 'monthly' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
                            >
                                {t('monthly')}
                            </button>
                            <button
                                onClick={() => setBilling('yearly')}
                                className="relative z-10 rounded-full px-5 py-2 text-xs font-medium tracking-wide transition-colors duration-300"
                                style={{ color: billing === 'yearly' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))' }}
                            >
                                {t('yearly')}
                            </button>
                            <motion.div
                                layout
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                className="absolute inset-y-1 rounded-full shadow-sm"
                                style={{
                                    backgroundColor: 'hsl(var(--primary))',
                                    width: 'calc(50% - 4px)',
                                    left: billing === 'monthly' ? '4px' : 'calc(50%)',
                                }}
                            />
                        </div>
                        {billing === 'yearly' && (
                            <motion.span
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="ml-2 rounded-full px-3 py-1 text-[10px] font-medium"
                                style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                            >
                                {t('save20')}
                            </motion.span>
                        )}
                    </motion.div>
                </div>

                {/* Plans */}
                <motion.div
                    custom={2}
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                    className="grid gap-5 md:grid-cols-2"
                >
                    {/* Free Plan */}
                    <div
                        className="flex flex-col rounded-2xl p-7 shadow-sm"
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border) / 0.5)' }}
                    >
                        <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t('freePlan')}</h3>
                        <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-4xl font-light" style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--foreground))' }}>
                                €{plans[billing].free}
                            </span>
                            <span className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('perMonth')}</span>
                        </div>
                        <p className="mt-2 text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('freeDesc')}
                        </p>
                        <ul className="mt-6 flex-1 space-y-3">
                            {freeFeatures.map((f) => (
                                <li key={f} className="flex items-start gap-2.5 text-sm font-light" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'hsl(var(--muted-foreground))' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            className="mt-8 w-full rounded-full py-5 text-xs font-normal uppercase tracking-[0.2em] transition-colors"
                            style={{ backgroundColor: 'transparent', color: 'hsl(var(--foreground))', border: '1px solid hsl(var(--border) / 0.6)' }}
                        >
                            {t('currentPlan')}
                        </button>
                    </div>

                    {/* Premium Plan */}
                    <div
                        className="relative flex flex-col rounded-2xl p-7 shadow-md"
                        style={{ backgroundColor: 'hsl(var(--card))', border: '2px solid hsl(var(--primary) / 0.2)' }}
                    >
                        <div
                            className="absolute -top-3 right-6 rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-wider"
                            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        >
                            {t('recommended')}
                        </div>
                        <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--foreground))' }}>{t('premiumPlan')}</h3>
                        <div className="mt-3 flex items-baseline gap-1">
                            <motion.span
                                key={billing}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-4xl font-light"
                                style={{ fontFamily: 'var(--font-serif)', color: 'hsl(var(--foreground))' }}
                            >
                                €{plans[billing].premium}
                            </motion.span>
                            <span className="text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('perMonth')}</span>
                        </div>
                        {billing === 'yearly' && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-1 text-[11px] font-light"
                                style={{ color: 'hsl(var(--muted-foreground))' }}
                            >
                                {t('billedYearly', { amount: `€${(parseFloat(plans.yearly.premium) * 12).toFixed(2)}` })}
                            </motion.p>
                        )}
                        <p className="mt-2 text-xs font-light" style={{ color: 'hsl(var(--muted-foreground))' }}>
                            {t('premiumDesc')}
                        </p>
                        <ul className="mt-6 flex-1 space-y-3">
                            {premiumFeatures.map((f) => (
                                <li key={f} className="flex items-start gap-2.5 text-sm font-light" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'hsl(var(--primary))' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <button
                            className="mt-8 w-full rounded-full py-5 text-xs font-normal uppercase tracking-[0.2em] shadow-sm transition-shadow duration-300 hover:shadow-md"
                            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
                        >
                            {t('upgrade')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default function PricingPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center">
                <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: 'hsl(var(--muted-foreground))', borderTopColor: 'transparent' }} />
            </main>
        }>
            <PricingContent />
        </Suspense>
    );
}
