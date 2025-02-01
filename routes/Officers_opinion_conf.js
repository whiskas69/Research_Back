const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionConf', async (req, res) => {
    console.log("in post Officers_opinion_conf")
    const data = req.body;
    try {
        const [result] = await db.query(
          "INSERT INTO Officers_opinion_conf (conf_id, c_research_admin, c_reason, c_meet_quality, c_good_reason, c_deputy_dean, c_approve_result) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [data.conf_id, data.c_research_admin, data.c_reason, 
            data.c_meet_quality, data.c_good_reason, data.c_deputy_dean, data.c_approve_result]
        );
        console.log(data)
        res.status(201).json({ message: "Officers_opinion_conf created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/allopinionConf", async (req, res) => {
    try {
      const [allopinionConf] = await db.query("SELECT * FROM Officers_opinion_conf");
      res.status(200).json(allopinionConf);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


exports.router = router;