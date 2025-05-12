const express = require("express");
const db = require("../config.js");
const createTransporter = require("../middleware/mailer.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionKris", async (req, res) => {
  const data = req.body;
  console.log("data", data)

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert research opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_kris
          (user_id, kris_id, research_admin)
          VALUES (?, ?, ?)`,
      [data.user_id, data.kris_id, data.research_admin]
    );

    console.log("createOpi_result :", createOpi_result);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ? WHERE kris_id = ?",
      [data.form_status, data.kris_id]
    );
    console.log("updateForm_result :", updateForm_result);

    //get kris_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE kris_id = ?", [data.kris_id]
    )
    console.log("GetID : ", getID);

    //update Noti
    const [updateNoti_result] = await database.query(
      `UPDATE Notification SET is_read = 0 WHERE form_id = ?`, [getID[0].form_id]
    )
    console.log("updateNoti_result : ", updateNoti_result);

    await database.commit(); //commit transaction

    //send email to user
    const transporter = createTransporter();
    const mailOptions = {
      form: `"ระบบสนับสนุนงานบริหารงานวิจัย" <${process.env.EMAIL_USER}>`,
      to: "64070105@kmitl.ac.th", //edit mail
      subject: "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มงานวิจัยรอการอนุมัติและตรวจสอบ",
      text: `มีแบบฟอร์มงานวิจัยรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
    } catch (error) {
      console.error("Error sending email:", error);
    }

    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.get("/opinionkris/:id", async (req, res) => {
  const { id } = req.params;
  console.log("id", req.params.id)
  try {
    const [opinionkris] = await db.query(
      "SELECT * FROM officers_opinion_kris WHERE kris_id = ?",
      [id]
    );

    console.log("opinionkris", opinionkris)

    if (opinionkris.length === 0) {
      return res.status(404).json({ message: "opinionkris not found" });
    }
    console.log("Get opinionkris: ", opinionkris[0]);
    res.status(200).json(opinionkris[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
