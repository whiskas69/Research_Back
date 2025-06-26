require('dotenv').config();

const nodemailer = require('nodemailer');
const { Resend }  = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * ส่งอีเมล
 * @param {Object} options - ตัวเลือกของอีเมล
 * @param {string} options.to - อีเมลผู้รับ
 * @param {string} options.subject - หัวข้ออีเมล
 * @param {string} options.html - เนื้อหาอีเมลในรูปแบบ HTML
 * @param {string} [options.from] - อีเมลผู้ส่ง (optional)
 */

async function sendEmail({ to, subject, html, from }) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.EMAIL_FROM, // ใช้ default จาก .env
      to,
      subject,
      html,
    });

    const info = await Transporter.sendMail(mailOptions);
    console.log('Email sent to:', to);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = sendEmail;