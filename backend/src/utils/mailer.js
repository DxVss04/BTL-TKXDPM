const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendVerificationCode(email, code) {
  if (!transporter) {
    console.log(`[MAIL-DEV] Mã xác thực cho ${email}: ${code}`);
    return false;
  }
  await transporter.sendMail({
    from: `"Đi chợ tiện lợi" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Mã xác thực tài khoản Đi chợ tiện lợi',
    html: `<p>Mã xác thực của bạn là: <b style="font-size:20px">${code}</b></p><p>Mã có hiệu lực trong 15 phút.</p>`,
  });
  return true;
}

module.exports = { sendVerificationCode, isMailConfigured: () => !!transporter };
