import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const resendApiKey = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Hush Craft <noreply@hushcraft.lk>';

export async function POST(req: Request) {
  try {
    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Try sending via Resend API
    if (resendApiKey && resendApiKey !== 're_dummy_key') {
      try {
        console.log(`[Next.js API route] Attempting to send email to ${to} via Resend...`);
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: SENDER_EMAIL,
            to,
            subject,
            html
          })
        });
        
        if (res.ok) {
          console.log(`[Next.js API route] Email sent successfully to ${to} via Resend.`);
          return NextResponse.json({ success: true, method: 'resend' });
        }
        
        const errJson = await res.json().catch(() => ({}));
        console.warn(`[Next.js API route] Resend API failed. Falling back to SMTP... Error:`, errJson);
      } catch (resendErr) {
        console.warn(`[Next.js API route] Resend API failed with error. Falling back to SMTP...`, resendErr);
      }
    }

    // 2. Try sending via Gmail SMTP
    if (SMTP_PASS) {
      console.log(`[Next.js API route] Attempting to send email to ${to} via Gmail SMTP...`);
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `Hush Craft <${SMTP_USER}>`,
        to,
        subject,
        html
      });

      console.log(`[Next.js API route] Email sent successfully to ${to} via Gmail SMTP.`);
      return NextResponse.json({ success: true, method: 'smtp' });
    }

    return NextResponse.json({ success: false, error: 'No email services configured' }, { status: 500 });
  } catch (err: any) {
    console.error(`[Next.js API route] Email send error:`, err);
    return NextResponse.json({ success: false, error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
