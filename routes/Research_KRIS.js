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

    const [result] = await db.query(query, values);

    const krisID = result.insertId;

    const files = req.files;

    const fileData = {
      type: "Research_KRIS",
      kris_id: krisID,
      kris_file: files?.kris_file?.[0]?.filename || null,
    };
    await db.query('INSERT INTO File_pdf SET ?', fileData);

    const formData = {
      form_type: "Research_KRIS",
      kris_id: krisID,
      form_status: "ฝ่ายบริหารงานวิจัย",
      form_money: 0,
    }
    await db.query('INSERT INTO Form SET ?', formData);


    res.status(201).json({ message: "Research_KRIS created successfully!", id: krisID });

  } catch (err) {
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

    res.status(200).json(kris[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//status page
router.get("/form/kris/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(401).json({ error: "ไม่มีแบบฟอร์มนี้" });
  }

  try {
    const [form] = await db.query("SELECT * FROM Form WHERE kris_id = ?", [id]);
    const [name] = await db.query("SELECT name_research_th FROM research_kris WHERE kris_id = ?", [id]);

    if (!form.length && !name.length) {
      return res.status(404).json({ error: "ไม่พบข้อมูลฟอร์ม" });
    }

    return res.status(200).json({
      form: form[0],
      name: name[0]?.name_research_th
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/getFilekris", async (req, res) => {
  const { kris_id } = req.query;

  const file = await db.query(
    "SELECT kris_file FROM file_pdf WHERE kris_id = ?", [kris_id]
  );

  const fileUrl = `http://localhost:3000/uploads/${file[0]?.[0]?.kris_file}`

  res.json({message: 'Get File successfully', fileUrl});
})

exports.router = router;