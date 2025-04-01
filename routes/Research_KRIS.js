const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const db = require("../config.js");

const Joi = require("joi");
const { DateTime } = require("luxon");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, DateTime.now() + path.extname(file.originalname));
    // const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9ก-๙_.-]/g,"_");
    // cb(null, sanitizedFilename);
  },
});
//file filter
const fileFilter = function (req, file, cb) {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    req.fileValidationError = "กรุณาแนบไฟล์ PDF";
    cb(null, false);
  }
};
const upload = multer({ storage, fileFilter });

//validation
const researchSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  name_research_th: Joi.string().pattern(/^[ก-๙0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]+$/).required(),
  name_research_en: Joi.string().pattern(/^[A-Za-z0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]+$/).required(),
  research_cluster: Joi.alternatives().try(
    Joi.string().required(),
    Joi.array().items(Joi.string()).required()
  ),
  res_cluster_other: Joi.when("research_cluster", {
    is: Joi.alternatives().try(
      "อื่นๆ",
      Joi.array().items(Joi.string().valid("อื่นๆ"))
    ),
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  res_standard: Joi.alternatives().try(
    Joi.string().required(),
    Joi.array().items(Joi.string()).required()
  ),
  res_standard_trade: Joi.when("res_standard", {
    is: Joi.alternatives().try(
      "มีการใช้พันธุ์พืช",
      Joi.array().items(Joi.string().valid("มีการใช้พันธุ์พืช"))
    ),
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  h_index: Joi.number().required(),
  his_invention: Joi.string().required(),
  participation_percent: Joi.number().greater(0).max(100).required(),
  year: Joi.number().integer().required(),
  project_periodStart: Joi.date().required(),
  project_periodEnd: Joi.date()
    .greater(Joi.ref("project_periodStart"))
    .required(),
});

//insert data to db
router.post("/kris", upload.single("kris_file"), async (req, res) => {
  // check dataError and file
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }

    if (!req.file) {
      return res.status(400).json({ message: "กรุณาแนบไฟล์ PDF" });
    }

    await researchSchema.validateAsync(req.body, { abortEarly: false });
  } catch (error) {
    console.log("error", error);
    return res.status(400).json({ error: error.details.map((err) => err.message) });
  }

  const kris_data = req.body;

  const database = await db.getConnection();
  await database.beginTransaction(); //start transaction

  try {
    //insert data to Research_KRIS
    const [kris_result] = await database.query(
      `INSERT INTO Research_KRIS (
      user_id, name_research_th, name_research_en, research_cluster, res_cluster_other, res_standard, res_standard_trade, h_index, his_invention, participation_percent, year, project_periodStart, project_periodEnd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kris_data.user_id,
        kris_data.name_research_th,
        kris_data.name_research_en,
        JSON.stringify(kris_data.research_cluster),
        kris_data.res_cluster_other || null,
        JSON.stringify(kris_data.res_standard),
        kris_data.res_standard_trade || null,
        kris_data.h_index,
        kris_data.his_invention,
        kris_data.participation_percent || null,
        kris_data.year,
        kris_data.project_periodStart,
        kris_data.project_periodEnd,
      ]
    );
    console.log("kris_result", kris_result);

    const krisID = kris_result.insertId;

    //data for file_pdf
    const fileData = {
      type: "Research_KRIS",
      kris_id: krisID,
      kris_file: req.file ? req.file.filename : null,
    };

    //insert data to File_pdf
    const [file_result] = await database.query(
      "INSERT INTO File_pdf SET ?",fileData
    );
    console.log("file_result", file_result);

    //data for Form
    const formData = {
      form_type: "Research_KRIS",
      kris_id: krisID,
      form_status: "ฝ่ายบริหารงานวิจัย"
    };

    //insert data to Form
    const [form_result] = await database.query(
      "INSERT INTO Form SET ?",formData
    );
    console.log("form_result", form_result);

    //insert data to Notification
    const [notification_result] = await database.query(
      `INSERT INTO Notification (
      user_id, form_id, name_form, is_read)
      VALUES (?, ?, ?, ?)`,
      [
        kris_data.user_id,
        form_result.insertId,
        kris_data.name_research_th,
        false,
      ]
    );
    console.log("notification_result", notification_result);

    await database.commit(); //commit transaction
    res.status(200).json({ success: true, message: "Success",});
  } catch (error) {
    database.rollback(); //rollback transaction
    console.error("Error inserting into database:", error);
    res.status(500).json({ error: error.message });
  } finally {
    database.release(); //release connection
  }
});

//get all data from database kris
router.get("/allkris", async (req, res) => {
  try {
    const [allkris] = await db.query("SELECT * FROM Research_KRIS");
    res.status(200).json(allkris);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get data by id
router.get("/kris/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [kris] = await db.query(
      "SELECT * FROM Research_KRIS WHERE kris_id = ?",[id]
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
      name: name[0]?.name_research_th,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

router.get("/getFilekris", async (req, res) => {
  const { kris_id } = req.query;

  const file = await db.query(
    "SELECT kris_file FROM file_pdf WHERE kris_id = ?",
    [kris_id]
  );

  const fileUrl = `http://localhost:3000/uploads/${file[0]?.[0]?.kris_file}`;

  res.json({ message: "Get File successfully", fileUrl });
});

exports.router = router;
