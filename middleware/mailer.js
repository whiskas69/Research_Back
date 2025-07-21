// require("dotenv").config();
// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// async function sendEmail({ to, subject, html, from }) {
//   try {
//     const result = await resend.emails.send({
//       from: from || process.env.EMAIL_FROM,
//       to,
//       subject,
//       html,
//     });

//     console.log("📤 ส่งผลลัพธ์เต็ม:", JSON.stringify(result, null, 2));
//     console.log("📤 Email ส่งสำเร็จ:");
//     console.log(
//       "🆔 Email ID:",
//       result?.data?.id || "ไม่มี ID (อาจอยู่ใน dev mode)"
//     );
//     console.log("📬 ไปที่:", to);
//     console.log("📌 หัวข้อ:", subject);

//     return result;
//   } catch (error) {
//     // ❌ หากส่งไม่สำเร็จ แสดงข้อความ error
//     console.error("❌ ส่งอีเมลล้มเหลว:", error);
//     throw error;
//   }
// }

// module.exports = sendEmail;

const nodemiler = require('nodemailer');

//create reusable transporter
const transporter = nodemiler.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your email address
    pass: process.env.EMAIL_PASS, // your email password or app password
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certificates
  },
});

async function sendEmail(recipients, subject, message) {
  for (const email of recipients) {
    const mailOptions = {
      from: `"RESEARCH ADMINISTRATION" <${process.env.EMAIL_USER}>`, // sender address
      to: email,
      subject: subject,
      text: message,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }
}

module.exports = sendEmail;
