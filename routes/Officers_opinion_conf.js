const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionConf', async (req, res) => {
  console.log("in post Officers_opinion_conf")
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Officers_opinion_conf 
          (conf_id, c_research_admin, c_reason, c_meet_quality, c_good_reason, 
          c_deputy_dean, c_approve_result, hr_doc_submit_date, research_doc_submit_date, 
          associate_doc_submit_date, dean_doc_submit_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.conf_id, data.c_research_admin, data.c_reason, data.c_meet_quality || null, 
        data.c_good_reason|| null, data.c_deputy_dean|| null, data.c_approve_result || null,
        data.hr_doc_submit_date || null, data.research_doc_submit_date || null, 
        data.associate_doc_submit_date || null, data.dean_doc_submit_date || null]
    );
    console.log("result:", result)
    const conferID = data.conf_id;
    console.log("conferID", conferID)

    // const formData = {
    //   form_type: "Conference",
    //   conf_id: conferID,
    //   form_status: "ฝ่ายบริหารงานวิจัย",
    // }
    // console.log("formData data to update:", formData);
    // await db.query('UPDATE Form SET ?  WHERE conf_id = ?', [formData, conferID]);

    const [update] = await db.query(
      `UPDATE Form SET form_type = ?, conf_id = ?, form_status = ? WHERE conf_id = ?`,
      [ "Conference", data.conf_id, "ฝ่ายบริหารงานวิจัย", data.conf_id]
    );

    console.log("update : ", update);

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