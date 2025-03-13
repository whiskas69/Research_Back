const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const Joi = require("joi");
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

const upload = multer({ storage });

const fileSchema = Joi.object({
  mimetype: Joi.string()
    .valid("application/pdf")
    .required()
    .messages({ "any.only": "อัปโหลดได้เฉพาะไฟล์ PDF เท่านั้น" }),
});

const researchSchema = Joi.object({
  user_id: Joi.number().required().messages({ "any.required": "กรุณาระบุ user_id" }),

  name_research_th: Joi.string().pattern(/^[ก-๙0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]+$/)
    .required().messages({"string.pattern.base": "ชื่อวิจัย (TH) ต้องเป็นภาษาไทย ตัวเลข หรืออักขระพิเศษเท่านั้น",
      "any.required": "กรุณาระบุชื่อวิจัยภาษาไทย",}),

  name_research_en: Joi.string().pattern(/^[A-Za-z0-9\s!@#$%^&*()_+={}\[\]:;"'<>,.?/-]+$/)
    .required().messages({"string.pattern.base":"ชื่อวิจัย (EN) ต้องเป็นภาษาอังกฤษ ตัวเลข หรืออักขระพิเศษเท่านั้น",
      "any.required": "กรุณาระบุชื่อวิจัยภาษาอังกฤษ",}),

  research_cluster: Joi.alternatives()
    .try(Joi.string().required(), Joi.array().items(Joi.string()).required())
    .messages({ "any.required": "กรุณาเลือกกลุ่มวิจัย" }),

  res_cluster_other: Joi.when("research_cluster", {
    is: Joi.alternatives().try("อื่นๆ", Joi.array().items(Joi.string().valid("อื่นๆ"))),
    then: Joi.string().required().messages({ "any.required": "กรุณาระบุรายละเอียดสำหรับ 'อื่นๆ'" }),
    otherwise: Joi.optional(),
  }),

  res_standard: Joi.alternatives()
    .try(Joi.string().required(), Joi.array().items(Joi.string()).required())
    .messages({ "any.required": "กรุณาเลือกมาตรฐานงานวิจัย" }),

  res_standard_trade: Joi.when("res_standard", {
    is: Joi.alternatives().try(
      "มีการใช้พันธุ์พืช",
      Joi.array().items(Joi.string().valid("มีการใช้พันธุ์พืช"))
    ),
    then: Joi.string()
      .required()
      .messages({ "any.required": "กรุณาระบุรายละเอียดการใช้พันธุ์พืช" }),
    otherwise: Joi.optional(),
  }),

  h_index: Joi.number()
    .required()
    .messages({ "any.required": "กรุณาระบุค่า H-index" }),

  his_invention: Joi.string()
    .required()
    .messages({ "any.required": "กรุณาระบุประวัติสิ่งประดิษฐ์หรือการพัฒนา" }),

  participation_percent: Joi.number().greater(0).max(100).required().messages({
    "number.greater": "เปอร์เซ็นต์การมีส่วนร่วมต้องมากกว่า 0",
    "number.max": "เปอร์เซ็นต์การมีส่วนร่วมต้องไม่เกิน 100",
    "any.required": "กรุณาระบุเปอร์เซ็นต์การมีส่วนร่วม",
  }),

  year: Joi.number()
    .integer()
    .required()
    .messages({ "any.required": "กรุณาระบุปี" }),

  project_periodStart: Joi.date()
    .required()
    .messages({ "any.required": "กรุณาระบุวันที่เริ่มโครงการ" }),

  project_periodEnd: Joi.date()
    .greater(Joi.ref("project_periodStart"))
    .required()
    .messages({
      "date.greater": "วันสิ้นสุดโครงการต้องมากกว่าวันเริ่มต้น",
      "any.required": "กรุณาระบุวันสิ้นสุดโครงการ",
    }),
});

//insert data to db
router.post("/kris", upload.single("kris_file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาแนบไฟล์ PDF" });
    }

    const { error: fileError } = fileSchema.validate({ mimetype: req.file.mimetype });

    if (fileError) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { error: dataError } = researchSchema.validate(req.body, { abortEarly: false });
    if (dataError) {
      return res.status(400).json({
        error: dataError.details.map((err) => err.message)
      })
    }

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
      his_invention,
      participation_percent,
      year,
      project_periodStart,
      project_periodEnd
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      data.user_id,
      data.name_research_th,
      data.name_research_en,
      Array.isArray(data.research_cluster)
        ? JSON.stringify(data.research_cluster)
        : data.research_cluster,
      data.res_cluster_other || null,
      Array.isArray(data.res_standard)
        ? JSON.stringify(data.res_standard)
        : data.res_standard,
      data.res_standard_trade || null,
      data.h_index,
      data.his_invention,
      data.participation_percent || null,
      data.year,
      data.project_periodStart,
      data.project_periodEnd,
    ];

    const [result] = await db.query(query, values);

    const krisID = result.insertId;

    const fileData = {
      type: "Research_KRIS",
      kris_id: krisID,
      kris_file: req.file ? req.file.filename : null,
    };
    await db.query("INSERT INTO File_pdf SET ?", fileData);

    const formData = {
      form_type: "Research_KRIS",
      kris_id: krisID,
      form_status: "ฝ่ายบริหารงานวิจัย",
      form_money: 0,
    };
    const [resultForm] = await db.query("INSERT INTO Form SET ?", formData);
    console.log("form_id", resultForm.insertId) 
    console.log("Inserted ID:", resultForm.insertId || "No ID returned");

    const noti = {
      user_id: data.user_id,
      kris_id: krisID,
      form_id: resultForm.insertId,
      status_form: "ฝ่ายบริหารงานวิจัย",
      name_form: data.name_research_th,
    };console.log("noti", noti) 
    try {
      const [resultNoti] = await db.query("INSERT INTO Notification SET ?", noti);
      console.log("Notification Insert Result:", resultNoti);
    } catch (error) {
      console.error("Error inserting into Notification:", error);
    }
    res
      .status(201)
      .json({ message: "Research_KRIS created successfully!", id: krisID });
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
    const [name] = await db.query(
      "SELECT name_research_th FROM research_kris WHERE kris_id = ?",
      [id]
    );

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
