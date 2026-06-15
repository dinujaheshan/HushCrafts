require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const resendApiKey = process.env.RESEND_API_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = 465;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Hush Craft <noreply@hushcraft.lk>';
const TEST_TO = process.env.SMTP_USER || ''; // Send to self for testing

async function testResend() {
  console.log("Testing Resend API...");
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: TEST_TO,
        subject: 'Test Resend',
        html: '<p>Testing Resend</p>'
      })
    });
    console.log("Resend Status:", res.status);
    const body = await res.json();
    console.log("Resend Response Body:", JSON.stringify(body, null, 2));
  } catch (err) {
    console.error("Resend fetch error:", err);
  }
}

async function testSmtp() {
  console.log("Testing Gmail SMTP...");
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    console.log("Verifying SMTP configuration...");
    await transporter.verify();
    console.log("SMTP Config is valid! Sending test email...");

    const info = await transporter.sendMail({
      from: `Hush Craft <${SMTP_USER}>`,
      to: TEST_TO,
      subject: 'Test SMTP',
      html: '<p>Testing SMTP</p>'
    });
    console.log("SMTP Success! Message ID:", info.messageId);
  } catch (err) {
    console.error("SMTP error details:", err);
  }
}

async function run() {
  await testResend();
  await testSmtp();
}

run();
