const express = require("express");
const db = require("../config.js");
const sendEmail = require("../middleware/mailer.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionConf", async (req, res) => {
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert hr opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_conf
          (hr_id, research_id, associate_id, dean_id, conf_id, 
          c_research_hr, c_reason, c_noteOther, c_meet_quality, 
          c_quality_reason, c_deputy_dean, c_approve_result, 
          research_doc_submit_date, associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.hr_id || null,
        data.research_id || null,
        data.associate_id || null,
        data.dean_id || null,
        data.conf_id,
        data.c_research_hr,
        data.c_reason,
        data.c_noteOther || null,
        data.c_meet_quality || null,
        data.c_quality_reason || null,
        data.c_deputy_dean || null,
        data.c_approve_result || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
      ]
    );
    console.log("createOpi_result :", createOpi_result);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ? WHERE conf_id = ?",
      [data.form_status, data.conf_id]
    );

    //get form_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [data.conf_id]
    );
    console.log("GetID : ", getID);

    await database.commit(); //commit transaction

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

    console.log("Email sent successfully");
    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

//update: add opinion of other role
router.put("/opinionConf/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //update: add opinion of other role
    const [updateOpi_result] = await database.query(
      `UPDATE officers_opinion_conf SET
      hr_id = ?, research_id = ?, associate_id = ?, dean_id = ?,
      conf_id = ?, c_research_hr = ?, c_reason = ?, c_noteOther = ?, c_meet_quality = ?,
      c_quality_reason = ?, c_deputy_dean = ?, c_approve_result = ?, hr_doc_submit_date = ?,
      research_doc_submit_date = ?, associate_doc_submit_date = ?, dean_doc_submit_date = ? WHERE conf_id = ?`,
      [
        data.hr_id || null,
        data.research_id || null,
        data.associate_id || null,
        data.dean_id || null,
        data.conf_id,
        data.c_research_hr,
        data.c_reason,
        data.c_noteOther || null,
        data.c_meet_quality || null,
        data.c_quality_reason || null,
        data.c_deputy_dean || null,
        data.c_approve_result || null,
        data.hr_doc_submit_date || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
        id,
      ]
    );

    console.log("updateOpi_result :", updateOpi_result);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ? WHERE conf_id = ?",
      [data.form_status, id]
    );

    //get form_id
    const [getID] = await database.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [id]
    );
    console.log("GetID : ", getID);

    await database.commit(); //commit transaction

    //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ";
    const message = `
      มีแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุมรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

    console.log("Email sent successfully");

    res.status(200).json({ success: true, message: "Success" });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.get("/allOpinionConf", async (req, res) => {
  try {
    const [allopinionConf] = await db.query(
      "SELECT * FROM officers_opinion_conf"
    );
    res.status(200).json(allopinionConf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opinionConf/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionConf] = await db.query(
      `SELECT ooc.hr_id, ooc.research_id, ooc.associate_id, ooc.dean_id, 
      ooc.c_office_id, ooc.conf_id, ooc.c_research_hr, ooc.c_reason, ooc.c_noteOther,
      ooc.c_meet_quality,ooc.c_quality_reason, ooc.c_deputy_dean,
      ooc.c_approve_result, ooc.hr_doc_submit_date,
      ooc.research_doc_submit_date, ooc.associate_doc_submit_date,
      ooc.dean_doc_submit_date, u.user_confer
      FROM officers_opinion_conf ooc
      LEFT JOIN Conference c ON ooc.conf_id = c.conf_id
      LEFT JOIN Users u ON c.user_id = u.user_id
      WHERE ooc.conf_id = ?
      `,
      [id]
    );
    console.log("opinionConf", opinionConf[0]);
    if (opinionConf.length === 0) {
      return res.status(404).json({ message: "opinionConf not found" });
    }
    console.log("Get opinionConf: ", opinionConf[0]);
    res.status(200).json(opinionConf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
