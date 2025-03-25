const express = require("express");
const db = require("../config.js");

router = express.Router();

//create first opinion and update form
router.post("/opinionPC", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert research opinion
    const [createOpi_result] = await database.query(
      `INSERT INTO officers_opinion_pc
          (pageC_id, p_research_admin, p_reason, p_deputy_dean,
          p_date_accepted_approve, p_acknowledge, p_approve_result, research_doc_submit_date,
          associate_doc_submit_date, dean_doc_submit_date)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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

    // console.log("data: ", data.form_status)

    //update status from
    const [updateForm_result] = await db.query(
      "UPDATE Form SET form_status = ? WHERE pageC_id = ?",
      [data.form_status, data.pageC_id]
    );

    console.log("updateForm_result :", updateForm_result);
    // console.log("updateForm: ", updateForm[0]);
    // console.log(data)
    await database.commit(); //commit transaction
    res.status(200).json({ success: true, message: "Success" });
    // res.status(201).json({ message: "officers_opinion_pc created successfully!", id: result.insertId });
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

router.put("/opinionPC/:id", async (req, res) => {
  console.log("in Update opinionPC");
  const { id } = req.params; // Extracting ID from URL params
  const updates = req.body;

  try {
    const [result] = await db.query(
      `UPDATE officers_opinion_pc SET
          pageC_id = ?, p_research_admin = ?, p_reason = ?, p_deputy_dean = ?,
          p_date_accepted_approve = ?, p_acknowledge = ?, p_approve_result = ?, p_reason_dean_approve = ?,
          research_doc_submit_date = ?, associate_doc_submit_date = ?, dean_doc_submit_date = ? WHERE pageC_id = ?`,
      [
        updates.pageC_id,
        updates.p_research_admin,
        updates.p_reason,
        updates.p_deputy_dean || null,
        updates.p_date_accepted_approve || null,
        updates.p_acknowledge || null,
        updates.p_approve_result || null,
        updates.p_reason_dean_approve || null,
        updates.research_doc_submit_date || null,
        updates.associate_doc_submit_date || null,
        updates.dean_doc_submit_date || null,
        id,
      ]
    );
    console.log("update: ", result);

    const [updateForm] = await db.query(
      `UPDATE Form SET form_type = ?, pageC_id = ?, form_status = ? WHERE pageC_id = ?`,
      ["Page_Charge", updates.pageC_id, updates.form_status, id]
    );

    console.log("update: ", updateForm);
    res
      .status(200)
      .json({ message: "officers_opinion_pc updated successfully!", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
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
