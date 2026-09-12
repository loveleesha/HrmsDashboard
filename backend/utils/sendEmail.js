const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

async function sendOtpEmail(to, otp) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Verify your account",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
}

async function sendResetLinkEmail(to, link) {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Reset your password",
    text: `Click the link below to reset your password. It expires in 1 hour.\n\n${link}`,
    html: `<p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${link}">${link}</a></p>`,
  });
}

module.exports = { sendOtpEmail, sendResetLinkEmail };
