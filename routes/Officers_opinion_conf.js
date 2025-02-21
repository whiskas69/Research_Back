const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/opinionConf', async (req, res) => {
  console.log("in post Officers_opinion_conf")
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Officers_opinion_conf 
          (conf_id, c_research_hr, c_reason, c_meet_quality, c_good_reason, 
          c_deputy_dean, c_approve_result, hr_doc_submit_date, research_doc_submit_date, 
          associate_doc_submit_date, dean_doc_submit_date) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.conf_id, data.c_research_hr, data.c_reason, data.c_meet_quality || null, 
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

router.put('/opinionConf/:id', async (req, res) => {
  console.log("in Update opinionConf");
  
  const { id } = req.params; // Extracting ID from URL params
  const updates = req.body;

  try {
    const [result] = await db.query(
      `UPDATE Officers_opinion_conf SET 
          conf_id = ?, c_research_hr = ?, c_reason = ?, c_meet_quality = ?, 
          c_good_reason = ?, c_deputy_dean = ?, c_approve_result = ?, hr_doc_submit_date = ?, 
          research_doc_submit_date = ?, associate_doc_submit_date = ?, dean_doc_submit_date = ?
       WHERE conf_id = ?`,
      [
        updates.conf_id, updates.c_research_hr, updates.c_reason, updates.c_meet_quality || null,
        updates.c_good_reason || null, updates.c_deputy_dean || null, updates.c_approve_result || null,
        updates.hr_doc_submit_date || null, updates.research_doc_submit_date || null, 
        updates.associate_doc_submit_date || null, updates.dean_doc_submit_date || null, id
      ]
    );
    console.log("update: ", result);

    const [updateForm] = await db.query(
      `UPDATE Form SET form_type = ?, conf_id = ?, form_status = ? WHERE conf_id = ?`,
      ["Conference", updates.conf_id, updates.form_status, id]
    );

    console.log("update: ", updateForm);
    
    res.status(200).json({ message: "Officers_opinion_conf updated successfully!", id });
  
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});


router.get("/allOpinionConf", async (req, res) => {
  try {
    const [allopinionConf] = await db.query("SELECT * FROM Officers_opinion_conf");
    res.status(200).json(allopinionConf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opinionConf/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [opinionConf] = await db.query(
      "SELECT * FROM Officers_opinion_conf WHERE conf_id = ?",
      [id]
    );
    if (opinionConf.length === 0) {
      return res.status(404).json({ message: "opinionConf not found" });
    }
    console.log("Get opinionConf: ", opinionConf[0]);
    res.status(200).json(opinionConf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;