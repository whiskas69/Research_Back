const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const Joi = require("joi");
const { DateTime } = require("luxon");
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
      "pc_proof",
      "q_pc_proof",
      "invoice_public",
      "accepted",
      "copy_article",
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

const today = DateTime.now().toISODate(); // ได้รูปแบบ YYYY-MM-DD

// แปลง JSON String > Array
const parseJsonArray = (value, helpers) => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed;
  } catch (err) {
    return helpers.error("any.invalid");
  }
};

const pageChargeSchema = Joi.object({
  user_id: Joi.number().required()
    .messages({ "any.required": "กรุณาระบุ user_id" }),

  pageC_times: Joi.number().greater(0).required().messages({
    "any.required": "กรุณาระบุจำนวนครั้ง",
    "number.greater": "ต้องมากกว่า 0",
  }),

  pageC_days: Joi.date().max(today).required().messages({
    "any.required": "กรุณาระบุวันที่",
    "date.max": "วันที่ต้องไม่มากกว่าวันนี้",
  }),

  journal_name: Joi.string().required()
    .messages({ "any.required": "กรุณาระบุชื่อวารสาร" }),

  quality_journal: Joi.alternatives().try(
      Joi.string().custom(parseJsonArray),
      Joi.array().items(Joi.string().valid("ISI", "SJR", "Scopus", "nature"))
    ).required()
    .messages({
      "any.invalid":
        "ข้อมูลไม่ถูกต้อง ต้องเป็น JSON Array ของ ISI, SJR, Scopus, หรือ Nature",
      "any.required": "กรุณาเลือกคุณภาพของวารสาร",
    }),

  pc_isi_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().integer().max(new Date().getFullYear()).required()
    .messages({
      "any.required": "กรุณากรอกปี ISI",
      "number.base": "ปี ISI ต้องเป็นจำนวนเต็ม",
    }),
    otherwise: Joi.forbidden(),
  }),

  pc_sjr_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().integer().max(new Date().getFullYear()).required()
    .messages({
      "any.required": "กรุณากรอกปี SJR",
      "number.base": "ปี SJR ต้องเป็นจำนวนเต็ม",
    }),
    otherwise: Joi.forbidden(),
  }),

  pc_scopus_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().integer().max(new Date().getFullYear()).required()
    .messages({
      "any.required": "กรุณากรอกปี Scopus",
      "number.base": "ปี Scopus ต้องเป็นจำนวนเต็ม",
    }),
    otherwise: Joi.forbidden(),
  }),

  impact_factor: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().greater(0).required().messages({
      "number.base": "Impact Factor ต้องเป็นตัวเลข",
      "number.greater": "Impact Factor ต้องมากกว่า 0",
      "any.required": "กรุณากรอก Impact Factor เนื่องจากเลือก ISI",
    }),
    otherwise: Joi.forbidden(),
  }),

  sjr_score: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().greater(0).required().messages({
      "number.base": "SJR Score ต้องเป็นตัวเลข",
      "number.greater": "SJR Score ต้องมากกว่า 0",
      "any.required": "กรุณากรอก SJR Score เนื่องจากเลือก SJR",
    }),
    otherwise: Joi.forbidden(),
  }),

  cite_score: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().greater(0).required().messages({
      "number.base": "Cite Score ต้องเป็นตัวเลข",
      "number.greater": "Cite Score ต้องมากกว่า 0",
      "any.required": "กรุณากรอก Cite Score เนื่องจากเลือก Scopus",
    }),
    otherwise: Joi.forbidden(),
  }),

  qt_isi: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().valid(1, 2, 3, 4).required().messages({
      "any.only": "ลำดับ Quartile ต้องเป็น 1, 2, 3 หรือ 4 เท่านั้น",
      "any.required": "กรุณากรอก Quartile เนื่องจากเลือก ISI",
    }),
    otherwise: Joi.forbidden(),
  }),

  qt_sjr: Joi.when("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().valid(1, 2, 3, 4).required().messages({
      "any.only": "ลำดับ Quartile ต้องเป็น 1, 2, 3 หรือ 4 เท่านั้น",
      "any.required": "กรุณากรอก Quartile เนื่องจากเลือก SJR",
    }),
    otherwise: Joi.forbidden(),
  }),

  qt_scopus: Joi.when("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().valid(1, 2, 3, 4).required().messages({
      "any.only": "ลำดับ Quartile ต้องเป็น 1, 2, 3 หรือ 4 เท่านั้น",
      "any.required": "กรุณากรอก Quartile เนื่องจากเลือก Scopus",
    }),
    otherwise: Joi.forbidden(),
  }),

  support_limit: Joi.number().valid(10000, 20000, 30000, 40000, 60000, 70000).required()
    .messages({
      "any.required": "กรุณาระบุวงเงินสนับสนุน",
      "any.only":
        "วงเงินต้องเป็น 10000, 20000, 30000, 40000, 60000 หรือ 70000 เท่านั้น",
    }),

  article_title: Joi.string().required().messages({ "any.required": "กรุณาระบุชื่อบทความ" }),

  vol_journal: Joi.number().integer().min(new Date().getFullYear()).required().messages({ "any.required": "กรุณาระบุปีที่ตีพิมพ์ (Vol.)" }),

  issue_journal: Joi.number().integer().required().messages({ "any.required": "กรุณาระบุฉบับวารสาร (Issue)" }),

  month: Joi.string()
    .valid(
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม"
    )
    .required().messages({ "any.required": "กรุณาระบุเดือนที่ตีพิมพ์" }),

  year: Joi.number().integer().required().min(new Date().getFullYear()).messages({ "any.required": "กรุณาระบุปีที่ตีพิมพ์" }),

  ISSN_ISBN: Joi.string().required().messages({ "any.required": "กรุณาระบุ ISSN/ISBN" }),

  submission_date: Joi.date().max(today).required().messages({
    "any.required": "กรุณาระบุวันที่ส่งบทความ",
    "date.max": "วันที่ส่งบทความต้องไม่มากกว่าวันนี้",
  }),

  date_review_announce: Joi.date().min(Joi.ref("submission_date")).required()
    .messages({
      "any.required": "กรุณาระบุวันที่ประกาศผล",
      "date.min": "วันที่ประกาศผลต้องไม่เร็วกว่าวันที่ส่งบทความ",
    }),

  final_date: Joi.date().min(today).required().messages({
    "any.required": "กรุณาระบุวันสิ้นสุด",
    "date.min": "วันสิ้นสุดต้องไม่น้อยกว่าวันนี้",
  }),

  article_research_ject: Joi.string().allow(null),

  research_type: Joi.string().valid("วิจัยพื้นฐาน", "วิจัยประยุกต์", "วิจัยและพัฒนา", "อื่นๆ").when("article_research_ject", { is: Joi.exist(), then: Joi.required() })
    .messages({ "any.required": "กรุณาระบุประเภทของการวิจัย" }),

  research_type2: Joi.string().when("research_type", { is: "อื่นๆ", then: Joi.required() })
    .messages({
      "any.required": "กรุณาระบุรายละเอียดเพิ่มเติมสำหรับ 'วิจัยอื่นๆ'",
    }),

  name_funding_source: Joi.string().when("article_research_ject", { is: Joi.exist(), then: Joi.required() }).messages({ "any.required": "กรุณาระบุแหล่งทุน" }),

  budget_limit: Joi.number().when("article_research_ject", { is: Joi.exist(), then: Joi.required() }).messages({ "any.required": "กรุณาระบุวงเงิน" }),

  annual: Joi.number().integer().max(new Date().getFullYear()).when("article_research_ject", { is: Joi.exist(), then: Joi.required() }).messages({ "any.required": "กรุณาระบุปี" }),

  presenter_type: Joi.string().valid("First Author", "Corresponding Author").required()
    .messages({
      "any.required": "กรุณาระบุประเภทผู้นำเสนอ",
      "any.only":
        "ประเภทต้องเป็น First Author หรือ Corresponding Author เท่านั้น",
    }),

  request_support: Joi.number().required().messages({"any.required": "กรุณาระบุคำร้องขอการสนับสนุนค่าใช้จ่ายในการลงตีพิมพ์",}),
});

//insert to database
router.post(
  "/page_charge",
  uploadDocuments.fields([
    { name: "pc_proof" },
    { name: "q_pc_proof" },
    { name: "invoice_public" },
    { name: "accepted" },
    { name: "copy_article" },
  ]),
  async (req, res) => {
    const requiredFiles = ["pc_proof", "q_pc_proof", "copy_article"];
    const missingFiles = requiredFiles.filter((field) => !req.files[field]);

    if (missingFiles.length > 0) {
      console.log(`กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`);
      return res.status(400).json({
        error: `กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`,
      });
    }

    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ errors: req.invalidFiles });
    }

    const { error } = pageChargeSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      console.log(req.body);
      console.log(error.details.map((err) => err.message));
      return res.status(400).json({
        error: error.details.map((err) => err.message),
      });
    }

    try {
      const data = req.body;

      console.log(data)

      const query = `INSERT INTO Page_Charge (
        user_id, pageC_times, pageC_days, journal_name, quality_journal,
        pc_isi_year, pc_sjr_year, pc_scopus_year, impact_factor, sjr_score,
        cite_score, qt_isi, qt_sjr, qt_scopus, support_limit, article_title,
        vol_journal, issue_journal, month, year, ISSN_ISBN, submission_date,
        date_review_announce, final_date, article_research_ject, research_type,
        research_type2, name_funding_source, budget_limit, annual, presenter_type,
        request_support)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      const [result] = await db.query(query, [
        data.user_id,
        data.pageC_times,
        data.pageC_days,
        data.journal_name,
        JSON.stringify(data.quality_journal),
        data.pc_isi_year || null,
        data.pc_sjr_year || null,
        data.pc_scopus_year || null,
        data.impact_factor || null,
        data.sjr_score || null,
        data.cite_score || null,
        data.qt_isi || null,
        data.qt_sjr || null,
        data.qt_scopus || null,
        data.support_limit,
        data.article_title,
        data.vol_journal,
        data.issue_journal,
        data.month,
        data.year,
        data.ISSN_ISBN,
        data.submission_date,
        data.date_review_announce,
        data.final_date,
        data.article_research_ject || null,
        data.research_type || null,
        data.research_type2 || null,
        data.name_funding_source || null,
        data.budget_limit || null,
        data.annual || null,
        data.presenter_type,
        data.request_support,
      ]);

      const pageCId = result.insertId;

      // Insert uploaded file data into the database
      const files = req.files;
      console.log("filesss", req.files);
      const fileData = {
        type: "Page_Charge",
        pageC_id: pageCId,
        pc_proof: files?.pc_proof?.[0]?.filename,
        q_pc_proof: files?.q_pc_proof?.[0]?.filename,
        invoice_public: files?.invoice_public?.[0]?.filename || null,
        accepted: files?.accepted?.[0]?.filename || null,
        copy_article: files?.copy_article?.[0]?.filename,
      };
      console.log("File data to insert:", fileData);
      await db.query("INSERT INTO File_pdf SET ?", fileData);

      //ดพิ่มเข้าตาราง Form
      const formData = {
        form_type: "Page_Charge",
        pageC_id: pageCId,
        form_status: "ฝ่ายบริหารงานวิจัย",
        form_money: 0,
      };
      console.log("formData data to insert:", formData);
      await db.query("INSERT INTO Form SET ?", formData);

      res.status(201).json({
        message: "Page Charge and files uploaded successfully",
        pc_id: pageCId,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get("/page_charges", async (req, res) => {
  console.log("in get pc");
  try {
    const [Page_Charge] = await db.query("SELECT * FROM Page_Charge");
    res.status(200).json(Page_Charge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/page_charge/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [page_charge] = await db.query(
      "SELECT * FROM Page_Charge WHERE pageC_id = ?",
      [id]
    );
    if (page_charge.length === 0) {
      return res.status(404).json({ message: "page_charge not found" });
    }
    console.log("Get page_charge: ", page_charge[0]);
    res.status(200).json(page_charge[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//status page
router.get("/form/Pc/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(401).json({ error: "ไม่มีแบบฟอร์มนี้" });
  }

  try {
    const [form] = await db.query("SELECT * FROM Form WHERE pageC_id = ?", [
      id,
    ]);
    const [page_c] = await db.query(
      "SELECT * FROM File_pdf WHERE pageC_id = ?",
      [id]
    );

    const [info_pageC] = await db.query(
      "SELECT journal_name, article_title FROM page_charge WHERE pageC_id = ? ",
      [id]
    );

    res.status(200).json({
      form: form[0],
      page_c: page_c[0],
      journal: info_pageC[0].journal_name,
      name: info_pageC[0].article_title,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
  }
});

//update pc_file
router.put(
  "/updateFilePage_C",
  uploadDocuments.fields([
    { name: "pc_proof" },
    { name: "q_pc_proof" },
    { name: "invoice_public" },
    { name: "accepted" },
    { name: "copy_article" },
  ]),
  async (req, res) => {
    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ error: req.invalidFiles });
    }

    const data = req.body;

    try {
      const files = req.files;

      if (!files) {
        throw new Error("No files received.");
      }

      const fileData = {
        q_pc_proof: files.q_pc_proof?.[0]?.filename || null,
        invoice_public: files.invoice_public?.[0]?.filename || null,
        accepted: files.accepted?.[0]?.filename || null,
        copy_article: files.copy_article?.[0]?.filename || null,
      };

      const update = await db.query(
        `UPDATE File_pdf SET q_pc_proof = ?, invoice_public = ?, accepted = ?, copy_article = ? WHERE pageC_id = ?`,
        [
          fileData.q_pc_proof,
          fileData.invoice_public,
          fileData.accepted,
          fileData.copy_article,
          data.pageC_id,
        ]
      );

      console.log("✅ Update successful:", update);
      res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (error) {
      console.error("❌ Error updating database:", error.message);
      res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
  }
);

router.get("/getFilepage_c", async (req, res) => {
  const { pageC_id } = req.query;

  const file = await db.query(
    `SELECT pc_proof, q_pc_proof, invoice_public, accepted, copy_article FROM file_pdf WHERE pageC_id = ?`,
    [pageC_id]
  );

  const file_pc_proof = `http://localhost:3000/uploads/${file[0]?.[0]?.pc_proof}`;
  const file_q_pc_proof = `http://localhost:3000/uploads/${file[0]?.[0]?.q_pc_proof}`;
  const file_invoice_public = `http://localhost:3000/uploads/${file[0]?.[0]?.invoice_public}`;
  const file_accepted = `http://localhost:3000/uploads/${file[0]?.[0]?.accepted}`;
  const file_copy_article = `http://localhost:3000/uploads/${file[0]?.[0]?.copy_article}`;

  res.json({
    message: "Get File Successfully",
    file_pc_proof,
    file_q_pc_proof,
    file_invoice_public,
    file_accepted,
    file_copy_article,
  });
});
exports.router = router;
