const express = require("express");
const db = require("../config.js");

router = express.Router();
//data
router.post('/score', async (req, res) => {
    console.log("in post score")
    const data = req.body;
    try {
        const [result] = await db.query(
          "INSERT INTO Score (conf_id, score_formular, sjr_score, sjr_year, hindex_score, hindex_year, score_result, core_rank) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [data.conf_id, data.score_formular, data.sjr_score || null, data.sjr_year || null, 
            data.hindex_score || null, data.hindex_year || null, data.score_result || null, data.core_rank || null]
        );
        console.log(data)
        res.status(201).json({ message: "Score created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/scores", async (req, res) => {
    try {
      const [scores] = await db.query("SELECT * FROM Score");
      res.status(200).json(scores);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


exports.router = router;