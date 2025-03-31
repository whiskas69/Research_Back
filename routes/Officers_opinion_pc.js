const express = require("express");
const db = require("../config.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionPC", async (req, res) => {
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert research opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_pc
          (research_id, associate_id, dean_id, pageC_id, p_research_admin, p_reason, p_deputy_dean,
          p_date_accepted_approve, p_acknowledge, p_approve_result, research_doc_submit_date,
          associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.research_id|| null, 
        data.associate_id || null, 
        data.dean_id || null,
        data.pageC_id,
        data.p_research_admin || null,
        data.p_reason || null,
        data.p_deputy_dean || null,
        data.p_date_accepted_approve || null,
        data.p_acknowledge || null,
        data.p_approve_result || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
      ]
    );

    console.log("create Opinion :", createOpi_result);

    //update status from
    const [updateForm_result] = await db.query(
      "UPDATE Form SET form_status = ? WHERE pageC_id = ?",
      [data.form_status, data.pageC_id]
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
router.put("/opinionPC/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //update: add opinion of other role
    const [updateOpi_result] = await database.query(
      `UPDATE officers_opinion_pc SET
          research_id = ?, associate_id = ?, dean_id = ?,
          pageC_id = ?, p_research_admin = ?, p_reason = ?, p_deputy_dean = ?,
          p_date_accepted_approve = ?, p_acknowledge = ?, p_approve_result = ?, p_reason_dean_approve = ?,
          research_doc_submit_date = ?, associate_doc_submit_date = ?, dean_doc_submit_date = ? WHERE pageC_id = ?`,
      [
        data.research_id|| null, 
        data.associate_id || null,
        data.dean_id || null,
        data.pageC_id,
        data.p_research_admin,
        data.p_reason,
        data.p_deputy_dean || null,
        data.p_date_accepted_approve || null,
        data.p_acknowledge || null,
        data.p_approve_result || null,
        data.p_reason_dean_approve || null,
        data.research_doc_submit_date || null,
        data.associate_doc_submit_date || null,
        data.dean_doc_submit_date || null,
        id,
      ]
    );

    console.log("updateOpi_result: ", updateOpi_result);

    //update status form
    const [updateForm_result] = await database.query(
      "UPDATE Form SET form_status = ? WHERE pageC_id = ?",
      [data.form_status, id]
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

router.get("/allOpinionPC", async (req, res) => {
  try {
    const [allopinionPC] = await db.query("SELECT * FROM officers_opinion_pc");
    res.status(200).json(allopinionPC);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opinionPC/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionPC] = await db.query(
      "SELECT * FROM officers_opinion_pc WHERE pageC_id = ?",
      [id]
    );
    if (opinionPC.length === 0) {
      return res.status(404).json({ message: "opinionPC not found" });
    }
    console.log("Get opinionPC: ", opinionPC[0]);
    res.status(200).json(opinionPC[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;
