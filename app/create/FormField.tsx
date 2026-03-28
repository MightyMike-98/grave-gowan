'use client';

/**
 * Kleiner Layout-Helfer, der ein Label über einem Eingabefeld anzeigt.
 * Unterstützt optionale Icons: 'lock' (gesperrt) oder 'edit' (editierbar).
 */
export function FormField({ label, icon, children }: { label: string; icon?: 'lock' | 'edit'; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-light">
                {label}
                {icon === 'lock' && (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }} title="Only the owner can edit this field">🔒</span>
                )}
                {icon === 'edit' && (
                    <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }} title="You can edit this field">✏️</span>
                )}
            </label>
            {children}
        </div>
    );
}
