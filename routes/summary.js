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

router.get("/all_summary_page_charge", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
        p.pageC_id,
        u.user_nameth,
        p.article_title,
        p.journal_name,
        p.quality_journal,
        p.qt_isi,
        p.qt_sjr,
        p.qt_scopus,
        p.month,
        p.year,
        p.article_research_ject,
        p.research_type,
        p.request_support,
        f.form_status
        FROM Page_Charge p
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN form f ON p.pageC_id = f.pageC_id
        WHERE f.form_status = "อนุมัติ";`
    );
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all_summary_kris", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
        k.kris_id,
        u.user_nameth,
        k.name_research_th,
        k.research_cluster,
        k.res_cluster_other,
        k.res_standard,
        k.res_standard_trade,
        k.year,
        k.project_periodStart,
        k.project_periodEnd,
        f.form_status
        FROM Research_KRIS k
        JOIN users u ON k.user_id = u.user_id
        LEFT JOIN form f ON k.kris_id = f.kris_id
        WHERE f.form_status = "อนุมัติ";`
    );
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.router = router;
