/**
 * @file lib/email-templates.ts
 * Reusable HTML email templates with inline CSS for maximum email client compatibility.
 * Design based on the MemorialYard brand (serif header, clean body, rounded CTAs).
 */

function layout(content: string): string {
    return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MemorialYard</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#d4d8e8,#dddde5,#e3ddd6);padding:32px 32px;text-align:center;border-bottom:1px solid #e8e8eb;">
<h1 style="margin:0;font-size:24px;font-weight:400;letter-spacing:0.04em;color:rgba(24,24,27,0.8);font-family:'Cormorant Garamond','Georgia',serif;">MemorialYard</h1>
</td></tr>

<!-- Content -->
<tr><td style="padding:32px 32px;">
${content}
</td></tr>

<!-- Footer -->
<tr><td style="padding:0 32px 32px 32px;border-top:1px solid #e8e8eb;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding-top:24px;text-align:center;">
<p style="margin:0;font-size:12px;color:#a1a1aa;">Mit freundlichen Grüßen,</p>
<p style="margin:4px 0 0 0;font-size:14px;color:rgba(24,24,27,0.6);font-family:'Cormorant Garamond','Georgia',serif;">Das MemorialYard-Team</p>
</td></tr></table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(text: string, url: string, style: 'primary' | 'secondary' = 'primary'): string {
    const bg = style === 'primary'
        ? 'background-color:#18181b;color:#fafafa;'
        : 'background-color:#f4f4f5;color:rgba(24,24,27,0.8);border:1px solid rgba(24,24,27,0.15);';
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
<a href="${url}" target="_blank" style="display:inline-block;${bg}border-radius:9999px;padding:14px 32px;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.2em;text-decoration:none;">${text}</a>
</td></tr></table>`;
}

// ─── Template: Registration Confirmation ─────────────────────────────

export function confirmationEmail(confirmUrl: string): string {
    return layout(`
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    Hallo,
</p>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    vielen Dank für deine Registrierung bei MemorialYard. Bitte bestätige dein Konto, indem du auf den folgenden Button klickst:
</p>

${ctaButton('Konto best\u00e4tigen \u2192', confirmUrl)}

<p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
    Falls du dich nicht bei MemorialYard registriert hast, kannst du diese E-Mail ignorieren.
</p>
`);
}

// ─── Template: Password Reset ────────────────────────────────────────

export function passwordResetEmail(resetUrl: string): string {
    return layout(`
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    Hallo,
</p>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den folgenden Button, um ein neues Passwort zu wählen:
</p>

${ctaButton('Passwort zur\u00fccksetzen \u2192', resetUrl)}

<p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
    Dieser Link ist 24 Stunden gültig. Falls du kein neues Passwort angefordert hast, kannst du diese E-Mail ignorieren.
</p>
`);
}

// ─── Template: Editor Invitation ─────────────────────────────────────

export function editorInviteEmail(params: {
    recipientName: string;
    memorialName: string;
    inviterName: string;
    acceptUrl: string;
    locale?: string;
}): string {
    const { recipientName, memorialName, inviterName, acceptUrl, locale } = params;
    const en = locale === 'en';
    return layout(`
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    ${en ? 'Hello' : 'Hallo'} <strong style="color:#18181b;">${recipientName}</strong>,
</p>
<p style="margin:0 0 20px 0;font-size:14px;line-height:1.7;color:rgba(24,24,27,0.85);">
    ${en
        ? `You have been invited as an editor for the memorial &ldquo;<strong style="color:#18181b;">${memorialName}</strong>&rdquo; on MemorialYard.`
        : `du wurdest als Editor für das Memorial &bdquo;<strong style="color:#18181b;">${memorialName}</strong>&ldquo; auf MemorialYard eingeladen.`}
</p>
<p style="margin:0 0 24px 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
    ${en
        ? `This invitation was sent by <strong style="color:rgba(24,24,27,0.8);">${inviterName}</strong>.`
        : `Diese Einladung wurde von <strong style="color:rgba(24,24,27,0.8);">${inviterName}</strong> initiiert.`}
</p>

<!-- Primary CTA: Accept invitation -->
${ctaButton(en ? 'Accept invitation \u2192' : 'Einladung annehmen \u2192', acceptUrl)}

<p style="margin:20px 0 24px 0;font-size:12px;line-height:1.6;color:#a1a1aa;text-align:center;">
    ${en
        ? 'Until you accept, the invitation stays pending. No account yet? You can sign up on the same page.'
        : 'Bis du annimmst, bleibt die Einladung offen. Noch kein Konto? Du kannst dich auf derselben Seite registrieren.'}
</p>

<!-- Editor capabilities -->
<p style="margin:24px 0 12px 0;font-size:14px;font-weight:500;color:#18181b;">${en ? 'As an editor you can:' : 'Als Editor hast du folgende Möglichkeiten:'}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
<tr><td style="padding:6px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
    <span style="color:#c4c4c8;">•</span>&nbsp;&nbsp;<strong style="color:rgba(24,24,27,0.8);">${en ? 'Timeline' : 'Lebensweg'}</strong> – ${en ? 'Add milestones from their life.' : 'Meilensteine aus dem Leben hinzufügen.'}
</td></tr>
<tr><td style="padding:6px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
    <span style="color:#c4c4c8;">•</span>&nbsp;&nbsp;<strong style="color:rgba(24,24,27,0.8);">${en ? 'Gallery' : 'Galerie'}</strong> – ${en ? 'Share personal photos.' : 'Persönliche Bilder teilen.'}
</td></tr>
<tr><td style="padding:6px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
    <span style="color:#c4c4c8;">•</span>&nbsp;&nbsp;<strong style="color:rgba(24,24,27,0.8);">${en ? 'Donations' : 'Spenden'}</strong> – ${en ? 'Add a donation link and description.' : 'Spendenlink und Beschreibung hinterlegen.'}
</td></tr>
<tr><td style="padding:6px 0;font-size:13px;line-height:1.6;color:#a1a1aa;">
    <span style="color:#c4c4c8;">•</span>&nbsp;&nbsp;<strong style="color:rgba(24,24,27,0.8);">${en ? 'Guest book' : 'Gästebuch'}</strong> – ${en ? 'Share your own memory.' : 'Eigene Erinnerung eintragen.'}
</td></tr>
</table>

<p style="margin:24px 0 0 0;font-size:12px;line-height:1.6;color:#a1a1aa;">
    ${en
        ? 'If you did not expect this invitation, you can ignore this email or contact us at'
        : 'Falls du diese Einladung nicht erwartet hast, kannst du diese E-Mail ignorieren oder uns unter'}
    <a href="mailto:info@memorialyard.com" style="color:#a1a1aa;text-decoration:underline;">info@memorialyard.com</a> ${en ? '.' : 'kontaktieren.'}
</p>
`);
}
