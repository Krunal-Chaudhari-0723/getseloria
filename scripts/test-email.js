const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testEmail() {
  const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER?.trim();
  let smtpPass = process.env.SMTP_PASS?.trim();
  
  if (smtpHost.includes('gmail') && smtpPass) {
    smtpPass = smtpPass.replace(/\s+/g, '');
  }

  console.log('Testing SMTP with:');
  console.log('Host:', smtpHost);
  console.log('Port:', smtpPort);
  console.log('User:', smtpUser);
  console.log('Pass length:', smtpPass ? smtpPass.length : 0);

  if (!smtpUser || !smtpPass) {
    console.error('ERROR: SMTP_USER or SMTP_PASS is missing in .env.local');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SUCCESS! SMTP credentials are valid and working.');
  } catch (error) {
    console.error('❌ FAILED:', error.message);
  }
}

testEmail();
