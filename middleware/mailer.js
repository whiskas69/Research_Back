require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, html, from }) {
  try {
    const result = await resend.emails.send({
      from: from || process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("📤 ส่งผลลัพธ์เต็ม:", JSON.stringify(result, null, 2));
    console.log("📤 Email ส่งสำเร็จ:");
    console.log(
      "🆔 Email ID:",
      result?.data?.id || "ไม่มี ID (อาจอยู่ใน dev mode)"
    );
    console.log("📬 ไปที่:", to);
    console.log("📌 หัวข้อ:", subject);

    return result;
  } catch (error) {
    // ❌ หากส่งไม่สำเร็จ แสดงข้อความ error
    console.error("❌ ส่งอีเมลล้มเหลว:", error);
    throw error;
  }
}

module.exports = sendEmail;
