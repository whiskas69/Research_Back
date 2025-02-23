const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads"; //สร้างโฟเดอร์ 'uploads'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadDocuments = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedFields = [
      "full_page",
      "published_journals",
      "q_proof",
      "call_for_paper",
      "accepted",
      "fee_receipt",
      "fx_rate_document",
      "conf_proof",
      "other_file",
    ];

    // Check if field name is allowed
    const isAllowedField = allowedFields.includes(file.fieldname);
    // Check if file is a PDF
    const isPDF = file.mimetype === "application/pdf";

    if (isAllowedField && isPDF) {
      cb(null, true);
    } else {
      const errorMsg = `Invalid file: ${file.fieldname} (${file.mimetype}). Only PDFs are allowed.`;
      console.log(errorMsg);

      // Collect invalid file errors
      req.invalidFiles = req.invalidFiles || [];
      req.invalidFiles.push(errorMsg);

      cb(null, false); // Reject the file
    }
  },
});


//data แก้ date ของดาต้าเบส
router.post('/conference', uploadDocuments.fields([
  { name: "full_page" },
  { name: "published_journals" },
  { name: "q_proof" },
  { name: "call_for_paper" },
  { name: "accepted" },
  { name: "fee_receipt" },
  { name: "fx_rate_document" },
  { name: "conf_proof" },
  { name: "other_file" },
]), async (req, res) => {
  console.log("in post conference")
  if (req.invalidFiles && req.invalidFiles.length > 0) {
    return res.status(400).json({ errors: req.invalidFiles });
  }
  try {
    // Handle database insertion for Page_Charge
    const data = req.body;
    console.log("data", data);
    console.log("User ID:", data.user_id);

    const query = `
      INSERT INTO Conference (
      user_id, conf_times, conf_days, trav_dateStart, trav_dateEnd, conf_research, conf_name,
      meeting_date, meeting_venue, date_submit_orrganizer, argument_date_review, last_day_register,
      meeting_type, quality_meeting, presenter_type, time_of_leave, locattion_1, wos_2_leave, name_2_leave,
      withdraw, wd_100_quality, wd_name_100, country_conf, num_register_articles, regist_amount_1_article, total_amount, 
      domestic_expenses, overseas_expenses, travel_country, inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
      num_travel_days, daily_allowance,total_allowance, all_money, doc_submit_date
      ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
    const [result] = await db.query(query, [
      data.user_id, data.conf_times, data.conf_days, data.trav_dateStart, data.trav_dateEnd, data.conf_research, data.conf_name,
      data.meeting_date, data.meeting_venue, data.date_submit_orrganizer, data.argument_date_review,
      data.last_day_register, data.meeting_type, data.quality_meeting, data.presenter_type,
      data.time_of_leave, data.locattion_1 || null, data.wos_2_leave || null, data.name_2_leave || null, data.withdraw || null, data.wd_100_quality || null,
      data.wd_name_100 || null, data.country_conf, data.num_register_articles, data.regist_amount_1_article,
      data.total_amount, data.domestic_expenses || null, data.overseas_expenses || null, data.travel_country || null,
      data.inter_expenses || null, data.airplane_tax || null, data.num_days_room || null, data.room_cost_per_night || null, data.total_room || null,
      data.num_travel_days || null, data.daily_allowance || null, data.total_allowance || null, data.all_money,
      data.doc_submit_date,
    ]);

    const confId = result.insertId;
    console.log("conferID: ", confId);

    const { score_formular, sjr_score, sjr_year, hindex_score, hindex_year, citat, score_result, core_rank } = req.body;
    const scoreData = {
      conf_id: confId,
      score_formular,
      sjr_score: sjr_score || null, 
      sjr_year: sjr_year || null, 
      hindex_score: hindex_score || null, 
      hindex_year: hindex_year || null, 
      citat: citat || null, 
      score_result: score_result || null, 
      core_rank: core_rank || null,
    }
    console.log("Score data to insert:", scoreData);
    await db.query("INSERT INTO Score SET ?", scoreData);

    const { type, date_published_journals, other_name } = req.body;
    // Insert uploaded file data into the database
    const files = req.files;
    console.log("filesss", req.files);
    const fileData = {
      type,
      conf_id: confId,
      full_page: files?.full_page?.[0]?.filename || null,
      date_published_journals,
      published_journals: files?.published_journals?.[0]?.filename || null,
      q_proof: files?.q_proof?.[0]?.filename || null,
      call_for_paper: files?.call_for_paper?.[0]?.filename || null,
      accepted: files?.accepted?.[0]?.filename || null,
      fee_receipt: files?.fee_receipt?.[0]?.filename || null,
      fx_rate_document: files?.fx_rate_document?.[0]?.filename || null,
      conf_proof: files?.conf_proof?.[0]?.filename || null,
      other_name,
      other_file: files?.other_file?.[0]?.filename || null,
    };
    console.log("File data to insert:", fileData);
    await db.query("INSERT INTO File_pdf SET ?", fileData);

    //เพิ่มเข้าตาราง Form
    const formData = {
      form_type: type,
      conf_id: confId,
      form_status: "ฝ่ายบริหารทรัพยากรบุคคล",
      form_money: req.body.form_money,
    };
    console.log("formData data to insert:", formData);
    await db.query("INSERT INTO Form SET ?", formData);

    res.status(201).json({ message: 'Conference entry created', conf_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});

router.get("/conferences", async (req, res) => {
  console.log("in get conference")
  try {
    const [conferences] = await db.query('SELECT * FROM Conference');
    res.status(200).json(conferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/conference/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [conference] = await db.query(
      "SELECT * FROM Conference WHERE conf_id = ?",
      [id]
    );
    if (conference.length === 0) {
      return res.status(404).json({ message: "conference not found" });
    }
    console.log("Get conference: ", conference[0]);
    res.status(200).json(conference[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conference/:id', async (req, res) => {
  console.log("in Update conference")

  const { id } = req.params;
  const updates = req.body;
  try {
    const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const query = `UPDATE Conference SET ${fields} WHERE conf_id = ?`;
    const [result] = await db.query(query, [...values, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Conference not found' });
    }
    res.status(200).json({ message: 'Conference updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;