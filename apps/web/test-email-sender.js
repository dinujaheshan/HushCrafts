const nodemailer = require('nodemailer');

const resendApiKey = 're_57dFSYNL_MJHTnsDLM6rHujDZ922yArZT';
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;
const SMTP_USER = 'hushcraftslk@gmail.com';
const SMTP_PASS = 'kkyj jmrg qekd dpll';
const SENDER_EMAIL = 'Hush Craft <noreply@hushcraft.lk>';
const TEST_TO = 'hushcraftslk@gmail.com'; // Send to self for testing

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
