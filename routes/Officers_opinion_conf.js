const express = require("express");
const db = require("../config.js");

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
          hr_doc_submit_date, research_doc_submit_date,
          associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.hr_id || null, 
        data.research_id|| null, 
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
      ]
    );

    console.log("createOpi_result :", createOpi_result);

    //update status form
    const [updateForm_result] = await db.query(
      "UPDATE Form SET form_status = ? WHERE conf_id = ?",
      ["ฝ่ายบริหารงานวิจัย", data.conf_id]
    );

    console.log("updateForm_result :", updateForm_result);

    await database.commit(); //commit transaction
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
        data.research_id|| null, 
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

    console.log("updateForm_result: ", updateForm_result);

    await database.commit(); //commit transaction
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
