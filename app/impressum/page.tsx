import Link from 'next/link';

export default function ImpressumPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16" style={{ color: 'hsl(var(--foreground))' }}>
            <div className="max-w-lg space-y-6 text-sm font-light leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <h1 className="text-lg font-normal" style={{ color: 'hsl(var(--foreground))' }}>Impressum</h1>
                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>MemorialYard</p>
                    <p>Musterstraße 1</p>
                    <p>12345 Musterstadt</p>
                    <p>Deutschland</p>
                </div>
                <div className="space-y-1">
                    <p>E-Mail: kontakt@memorialyard.de</p>
                    <p>Telefon: +49 123 456 789</p>
                </div>
                <div className="space-y-1">
                    <p className="font-normal" style={{ color: 'hsl(var(--foreground))' }}>Verantwortlich für den Inhalt</p>
                    <p>Max Mustermann</p>
                </div>
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
