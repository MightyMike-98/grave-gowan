import Link from 'next/link';

export default function DatenschutzPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="max-w-lg space-y-6 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <h1 className="text-lg font-normal" style={{ color: 'hsl(var(--foreground))' }}>Datenschutzerklärung</h1>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>1. Verantwortlicher</h2>
                    <p>MemorialYard, Musterstraße 1, 12345 Musterstadt. Kontakt: kontakt@memorialyard.de</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>2. Erhebung und Speicherung personenbezogener Daten</h2>
                    <p>Beim Besuch unserer Website werden automatisch Informationen (Server-Logfiles) erfasst, die Ihr Browser übermittelt. Diese Daten sind nicht bestimmten Personen zuordenbar.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>3. Cookies</h2>
                    <p>Unsere Website verwendet Cookies, um die Nutzererfahrung zu verbessern. Sie können die Verwendung von Cookies in Ihren Browsereinstellungen deaktivieren.</p>
                </section>

                <section className="space-y-2">
                    <h2 className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>4. Ihre Rechte</h2>
                    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO.</p>
                </section>

                <Link
                    href="/"
                    className="mt-8 inline-block text-xs transition-colors"
                    style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
                >
                    ← Zurück
                </Link>
            </div>
        </div>
    );
}
