'use client';

import { Check, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

export function CopyLinkButton({ slug }: { slug: string }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(`${window.location.origin}/memorial/${slug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={copy}
            className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors"
            style={{ border: '1px solid hsl(var(--border) / 0.4)', color: 'hsl(var(--muted-foreground))' }}
            title="Link kopieren"
        >
            {copied ? (
                <Check className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
            ) : (
                <LinkIcon className="h-3.5 w-3.5" />
            )}
        </button>
    );
}
