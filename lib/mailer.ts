/**
 * @file lib/mailer.ts
 * Sends transactional emails via Zoho SMTP using Nodemailer.
 *
 * Required env vars:
 *   SMTP_HOST=smtp.zoho.com
 *   SMTP_PORT=465
 *   SMTP_USER=noreply@memorialyard.com
 *   SMTP_PASS=<zoho app password>
 */

import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.zoho.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
    },
});

function htmlToPlainText(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
}): Promise<void> {
    const fromAddress = process.env.SMTP_USER ?? 'noreply@memorialyard.com';

    await transporter.sendMail({
        from: `"MemorialYard" <${fromAddress}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: htmlToPlainText(params.html),
        messageId: `<${randomUUID()}@memorialyard.com>`,
        headers: {
            'X-Mailer': 'MemorialYard',
        },
    });
}
