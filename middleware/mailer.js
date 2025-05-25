// middleware/mailer.js
require('dotenv').config(); // โหลด .env ที่นี่อีกครั้ง (เฉพาะกรณี)

console.log('[mailer] EMAIL_USER:', process.env.EMAIL_USER); // ต้องไม่ undefined
console.log('[mailer] EMAIL_PASS:', process.env.EMAIL_PASS); // ต้องไม่ undefined

const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

module.exports = createTransporter;