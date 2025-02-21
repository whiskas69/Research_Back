const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionPC', async (req, res) => {
    console.log("in post Officers_opinion_pc")
    const data = req.body;
    try {
        const [result] = await db.query(
          `INSERT INTO Officers_opinion_pc
          (pageC_id, p_research_admin, p_reason, p_deputy_dean, 
          p_date_accepted_approve, p_approve_result, research_doc_submit_date,
          associate_doc_submit_date, dean_doc_submit_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [data.pageC_id, data.p_research_admin, data.p_reason, 
            data.p_deputy_dean, data.p_date_accepted_approve || null, data.p_approve_result,
            data.research_doc_submit_date, data.associate_doc_submit_date, 
            data.dean_doc_submit_date]
        );
        const [updateForm] = await db.query(
          `UPDATE Form SET form_type = ?, pageC_id = ?, form_status = ? WHERE pageC_id = ?`,
          ["Page_Charge", data.conf_id, data.form_status, id]
        );
        console.log("update: ", updateForm);
        console.log(data)
        res.status(201).json({ message: "Officers_opinion_pc created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/allOpinionPC", async (req, res) => {
    try {
      const [allopinionPC] = await db.query("SELECT * FROM Officers_opinion_pc");
      res.status(200).json(allopinionPC);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


exports.router = router;