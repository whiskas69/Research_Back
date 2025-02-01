const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionPC', async (req, res) => {
    console.log("in post Officers_opinion_pc")
    const data = req.body;
    try {
        const [result] = await db.query(
          "INSERT INTO Officers_opinion_pc (pageC_id, p_research_admin, p_reason, p_deputy_dean, p_date_dean_approve, p_approve_result) VALUES (?, ?, ?, ?, ?, ?)",
          [data.pageC_id, data.p_research_admin, data.p_reason, 
            data.p_deputy_dean, data.p_date_dean_approve, data.p_approve_result]
        );
        console.log(data)
        res.status(201).json({ message: "Officers_opinion_pc created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/allopinionPC", async (req, res) => {
    try {
      const [allopinionPC] = await db.query("SELECT * FROM Officers_opinion_pc");
      res.status(200).json(allopinionPC);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


exports.router = router;