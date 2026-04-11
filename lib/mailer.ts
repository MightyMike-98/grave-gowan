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

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.zoho.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
        user: process.env.SMTP_USER ?? '',
        pass: process.env.SMTP_PASS ?? '',
    },
});

export async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
}): Promise<void> {
    await transporter.sendMail({
        from: `"MemorialYard" <${process.env.SMTP_USER ?? 'noreply@memorialyard.com'}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
    });
}
