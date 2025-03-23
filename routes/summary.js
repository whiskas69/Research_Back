const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_summary_conference", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
        c.conf_id,
        u.user_nameth,
        c.conf_research,
        c.conf_name,
        c.location,
        c.meeting_type,
        c.quality_meeting,
        c.time_of_leave,
        c.withdraw,
        c.num_register_articles,
        c.all_money,
        f.form_status
        FROM conference c
        JOIN users u ON c.user_id = u.user_id
        LEFT JOIN form f ON c.conf_id = f.conf_id
        WHERE f.form_status = "อนุมัติ";`
    );
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.router = router;
