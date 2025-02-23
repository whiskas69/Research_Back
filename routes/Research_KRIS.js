const express = require("express");
const multer = require('multer');
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads' //สร้างโฟเดอร์ 'uploads'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    cb(null, dir)
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname))
  }
})

const uploadDocuments = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const allowedFields = [
      'kris_file',
    ];

    // Check if field name is allowed
    const isAllowedField = allowedFields.includes(file.fieldname);
    // Check if file is a PDF
    const isPDF = file.mimetype === 'application/pdf';

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


//data
router.post('/kris', uploadDocuments.fields([
  { name: 'kris_file' },
]), async (req, res) => {
  if (req.invalidFiles && req.invalidFiles.length > 0) {
    return res.status(400).json({ errors: req.invalidFiles });
  }

  try {
    console.log("in post Research_KRIS");
    const data = req.body;

    const query = `INSERT INTO Research_KRIS (
      user_id,
      name_research_th,
      name_research_en,
      research_cluster,
      res_cluster_other,
      res_standard,
      res_standard_trade,
      h_index,
      his_inveninno,
      participation_percen,
      year,
      project_periodStart,
      project_periodEnd
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      data.user_id,
      data.name_research_th,
      data.name_research_en,
      Array.isArray(data.research_cluster) ? JSON.stringify(data.research_cluster) : data.research_cluster,
      data.res_cluster_other || null,
      Array.isArray(data.res_standard) ? JSON.stringify(data.res_standard) : data.res_standard,
      data.res_standard_trade || null,
      data.h_index,
      data.his_inveninno,
      data.participation_percen || null,
      data.year,
      data.project_periodStart,
      data.project_periodEnd
    ];

    console.log("Executing query:", query, "with values:", values);

    const [result] = await db.query(query, values);

    console.log("Data inserted successfully with ID:", result.insertId);

    const krisID = result.insertId;

    const files = req.files;
    console.log("Uploaded files:", files);

    const fileData = {
      type: "Research_KRIS",
      kris_id: krisID,
      kris_file: files?.kris_file?.[0]?.filename || null,
    };
    console.log("File data to insert:", fileData);
    await db.query('INSERT INTO File_pdf SET ?', fileData);

    const formData = {
      form_type: "Research_KRIS",
      kris_id: krisID,
      form_status: "ฝ่ายบริหารทรัพยากรบุคคล",
      form_money: 0,
    }
    console.log("formData data to insert:", formData);
    await db.query('INSERT INTO Form SET ?', formData);


    res.status(201).json({ message: "Research_KRIS created successfully!", id: krisID });

  } catch (err) {
    console.error("Error inserting data:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/allkris", async (req, res) => {
  try {
    const [allkris] = await db.query("SELECT * FROM Research_KRIS");
    res.status(200).json(allkris);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/kris/:id", async (req, res) => {
  const { id } = req.params;

  console.log("id, ", id)
  try {
    const [kris] = await db.query(
      "SELECT * FROM Research_KRIS WHERE kris_id = ?",
      [id]
    );
    if (kris.length === 0) {
      return res.status(404).json({ message: "kris not found" });
    }
    console.log("Get kris: ", kris[0]);
    res.status(200).json(kris[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;