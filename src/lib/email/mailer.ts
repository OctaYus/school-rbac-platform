import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

import { logger } from "@/lib/logger";

/**
 * Email transport (SMTP via nodemailer). Configure SMTP_HOST/PORT/USER/PASSWORD
 * and EMAIL_FROM. On Vercel, Resend SMTP works well:
 *   SMTP_HOST=smtp.resend.com  SMTP_PORT=465  SMTP_USER=resend  SMTP_PASSWORD=<API key>
 *
 * When SMTP is not configured, sends are skipped (logged) so flows degrade
 * gracefully in local/dev.
 */
export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

let transport: Transporter | null = null;
function getTransport(): Transporter | null {
  if (!smtpConfigured()) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transport;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    logger.warn({ to: opts.to, subject: opts.subject }, "email skipped — SMTP not configured");
    return false;
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM, ...opts });
    return true;
  } catch (e) {
    logger.error({ err: e, to: opts.to }, "email send failed");
    return false;
  }
}

function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px">
    <div style="font-weight:700;font-size:20px;background:linear-gradient(90deg,#6366f1,#7c3aed);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:16px">Scholaris</div>
    <div style="background:#fff;border:1px solid #e4e4e7;border-radius:12px;padding:24px">
      <h1 style="font-size:18px;margin:0 0 12px">${title}</h1>
      ${body}
    </div>
    <p style="color:#71717a;font-size:12px;margin-top:16px">Scholaris · secure school management. If you didn't expect this email, you can ignore it.</p>
  </div></body></html>`;
}

export async function sendInviteEmail(to: string, url: string): Promise<boolean> {
  return sendMail({
    to,
    subject: "You're invited to Scholaris",
    text: `You've been invited to Scholaris. Activate your account: ${url}`,
    html: layout(
      "You're invited to Scholaris",
      `<p style="font-size:14px;color:#3f3f46">Click below to set your password and activate your account. This link expires in 72 hours.</p>
       <p style="margin:20px 0"><a href="${url}" style="display:inline-block;background:#6366f1;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">Activate account</a></p>
       <p style="font-size:12px;color:#71717a;word-break:break-all">${url}</p>`,
    ),
  });
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendMail({
    to,
    subject: `Your Scholaris verification code: ${code}`,
    text: `Your Scholaris verification code is ${code}. It expires in 10 minutes.`,
    html: layout(
      "Verify your email",
      `<p style="font-size:14px;color:#3f3f46">Use this code to confirm your email change. It expires in 10 minutes.</p>
       <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>`,
    ),
  });
}
