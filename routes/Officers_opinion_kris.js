const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionKris', async (req, res) => {
  console.log("in post Officers_opinion_kris")
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Officers_opinion_kris 
          (kris_id, research_admin, doc_submit_date) 
          VALUES (?, ?, ?)`,
      [data.kris_id, data.research_admin, data.doc_submit_date]
    );
    console.log("result:", result)
    // const krisId = data.kris_id;
    console.log("data: ", data)
    // console.log("krisId : ", krisId);

    const [update] = await db.query(
      `UPDATE Form SET form_type = ?, kris_id = ?, form_status = ? WHERE kris_id = ?`,
      [ "Research_KRIS", data.kris_id, data.form_status, data.kris_id]
    );
    console.log("update : ", update);

    res.status(201).json({ message: "Officers_opinion_kris created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});
exports.router = router;