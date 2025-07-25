const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const { DateTime } = require("luxon");
const baseURL = require("dotenv").config();

const db = require("../config.js");
const sendEmail = require("../middleware/mailer.js");

const router = express.Router();

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
    let acceptedFile = false;
    if (
      file.fieldname === "pc_proof" ||
      file.fieldname === "q_pc_proof" ||
      file.fieldname === "invoice_public" ||
      file.fieldname === "accepted" ||
      file.fieldname === "copy_article" ||
      file.fieldname === "upload_article"
    ) {
      if (file.mimetype === "application/pdf") {
        acceptedFile = true;
      } else {
        acceptedFile = false;
      }
    }

    if (!acceptedFile) {
      const message = `Field ${file.fieldname} wrong file type. Only PDFs are allowed.`;

      !req.invalidFiles
        ? (req.invalidFiles = [message])
        : req.invalidFiles.push(message);
    }

    cb(null, acceptedFile);
  },
});

const today = DateTime.now();

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
  user_id: Joi.number().integer().required(),
  pageC_times: Joi.number().integer().greater(0).required(),
  conf_days: Joi.date().iso().max(today.toISODate()).required(),

  journal_name: Joi.string().required(),
  quality_journal: Joi.alternatives()
    .try(
      Joi.string().custom(parseJsonArray),
      Joi.array().items(Joi.string().valid("ISI", "SJR", "Scopus", "nature"))
    )
    .required(),

  pc_isi_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().integer().max(new Date().getFullYear()).required(),
    otherwise: Joi.forbidden(),
  }),

  pc_sjr_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().integer().max(new Date().getFullYear()).required(),
    otherwise: Joi.forbidden(),
  }),

  pc_scopus_year: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().integer().max(new Date().getFullYear()).required(),
    otherwise: Joi.forbidden(),
  }),

  impact_factor: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().greater(0).required(),
    otherwise: Joi.forbidden(),
  }),

  sjr_score: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().greater(0).required(),
    otherwise: Joi.forbidden(),
  }),

  cite_score: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().greater(0).required(),
    otherwise: Joi.forbidden(),
  }),

  qt_isi: Joi.alternatives().conditional("quality_journal", {
    is: Joi.array().has("ISI"),
    then: Joi.number().valid(1, 2, 3, 4).required(),
    otherwise: Joi.forbidden(),
  }),

  qt_sjr: Joi.when("quality_journal", {
    is: Joi.array().has("SJR"),
    then: Joi.number().valid(1, 2, 3, 4).required(),
    otherwise: Joi.forbidden(),
  }),

  qt_scopus: Joi.when("quality_journal", {
    is: Joi.array().has("Scopus"),
    then: Joi.number().valid(1, 2, 3, 4).required(),
    otherwise: Joi.forbidden(),
  }),

  support_limit: Joi.number()
    .valid(10000, 20000, 30000, 40000, 60000, 70000)
    .required(),

  article_title: Joi.string().required(),

  num_co_researchers: Joi.number().integer(),

  name_co_researchers: Joi.string(),

  course_co_researchers: Joi.string(),

  vol_journal: Joi.number().integer().min(new Date().getFullYear()),

  issue_journal: Joi.number().integer(),

  year: Joi.number().integer().min(new Date().getFullYear()),

  ISSN_ISBN: Joi.string(),

  submission_date: Joi.date().max(today).required(),

  date_review_announce: Joi.date().min(Joi.ref("submission_date")).required(),

  final_date: Joi.date().min(today).required(),

  article_research_ject: Joi.string().allow(null),

  research_type: Joi.string()
    .valid("basic", "applied", "research&development", "other")
    .when("article_research_ject", { is: Joi.exist(), then: Joi.required() }),

  research_type2: Joi.string().when("research_type", {
    is: "other",
    then: Joi.required(),
  }),

  name_funding_source: Joi.string().when("article_research_ject", {
    is: Joi.exist(),
    then: Joi.required(),
  }),

  budget_limit: Joi.number().when("article_research_ject", {
    is: Joi.exist(),
    then: Joi.required(),
  }),

  annual: Joi.number()
    .integer()
    .max(new Date().getFullYear())
    .when("article_research_ject", { is: Joi.exist(), then: Joi.required() }),

  presenter_type: Joi.string()
    .valid("First Author", "Corresponding Author")
    .required(),

  request_support: Joi.number().required(),
});

//inset to database
router.post(
  "/page_charge",
  uploadDocuments.fields([
    { name: "pc_proof" },
    { name: "q_pc_proof" },
    { name: "invoice_public" },
    { name: "accepted" },
    { name: "copy_article" },
    { name: "upload_article" },
  ]),
  async (req, res) => {
    const requiredFiles = ["pc_proof", "q_pc_proof", "copy_article", "invoice_public", "upload_article"];
    const missingFiles = requiredFiles.filter((field) => !req.files[field]);

    console.log("all data", req.body)
    //check dataError and missingFiles
    try {
      //check missingFiles
      if (missingFiles.length > 0) {
        console.log(`กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`);
        return res.status(400).json({
          error: `กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`,
        });
      }

      await pageChargeSchema.validate(req.body, { abortEarly: false });
    } catch (error) {
      console.log("error", error);
      return res
        .status(400)
        .json({ error: error.details.map((err) => err.message) });
    }

    const pageChargeData = req.body;
    const pageChargeFiles = req.files;
    console.log("pageChargeData", pageChargeData)

    const database = await db.getConnection();
    await database.beginTransaction(); //start transaction

    try {
      //query insert to Page_Charge
      const query = `INSERT INTO Page_Charge (
        user_id, pageC_times, pageC_days, journal_name, quality_journal,
        pc_isi_year, pc_sjr_year, pc_scopus_year, impact_factor, sjr_score,
        cite_score, qt_isi, qt_sjr, qt_scopus, support_limit, article_title,
        num_co_researchers, name_co_researchers, course_co_researchers,
        vol_journal, issue_journal, month, year, ISSN_ISBN, submission_date,
        date_review_announce, final_date, article_research_ject, research_type,
        research_type2, name_funding_source, budget_limit, annual, presenter_type,
        request_support)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      //insert to Page_Charge
      const [pagec_result] = await database.query(query, [
        pageChargeData.user_id,
        pageChargeData.pageC_times,
        pageChargeData.pageC_days,
        pageChargeData.journal_name,
        JSON.stringify(pageChargeData.quality_journal),
        pageChargeData.pc_isi_year || null,
        pageChargeData.pc_sjr_year || null,
        pageChargeData.pc_scopus_year || null,
        pageChargeData.impact_factor || null,
        pageChargeData.sjr_score || null,
        pageChargeData.cite_score || null,
        pageChargeData.qt_isi || null,
        pageChargeData.qt_sjr || null,
        pageChargeData.qt_scopus || null,
        pageChargeData.support_limit,
        pageChargeData.article_title,
        pageChargeData.num_co_researchers || null,
        JSON.stringify(pageChargeData.name_co_researchers || null),
        JSON.stringify(pageChargeData.course_co_researchers || null),
        pageChargeData.vol_journal,
        pageChargeData.issue_journal,
        pageChargeData.month,
        pageChargeData.year,
        pageChargeData.ISSN_ISBN,
        pageChargeData.submission_date,
        pageChargeData.date_review_announce,
        pageChargeData.final_date,
        pageChargeData.article_research_ject || null,
        pageChargeData.research_type || null,
        pageChargeData.research_type2 || null,
        pageChargeData.name_funding_source || null,
        pageChargeData.budget_limit || null,
        pageChargeData.annual || null,
        pageChargeData.presenter_type,
        pageChargeData.request_support,
      ]);

      const pageCId = pagec_result.insertId;

      //data for File_pdf
      const fileData = {
        type: "Page_Charge",
        pageC_id: pageCId,
        pc_proof: pageChargeFiles.pc_proof?.[0]?.filename,
        q_pc_proof: pageChargeFiles.q_pc_proof?.[0]?.filename,
        invoice_public: pageChargeFiles.invoice_public?.[0]?.filename,
        accepted: pageChargeFiles.accepted?.[0]?.filename || null,
        copy_article: pageChargeFiles.copy_article?.[0]?.filename,
        upload_article: pageChargeFiles.upload_article?.[0]?.filename
      };

      //insert to File_pdf
      const [file_result] = await database.query(
        "INSERT INTO File_pdf SET ?",
        fileData
      );
      console.log("file_result", file_result);

      //data for Form
      const formData = {
        form_type: "Page_Charge",
        pageC_id: pageCId,
        form_status: "research",
      };

      //insert to Form
      const [form_result] = await database.query(
        "INSERT INTO Form SET ?",
        formData
      );
      console.log("form_result", form_result);

      //insert data to Notification
      const [notification_result] = await database.query(
        `INSERT INTO Notification (
          user_id, form_id, name_form)
          VALUES (?, ?, ?)`,
        [
          pageChargeData.user_id,
          form_result.insertId,
          pageChargeData.article_title
        ]
      );
      console.log("notification_result", notification_result);

      const getuser = await database.query(
        `SELECT user_nameth FROM Users WHERE user_id = ?`,
        [pageChargeData.user_id]
      );
      console.log("getuser", getuser[0][0]);

      await database.commit(); //commit transaction

       //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการส่งแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์บทความวิจัย"
    const message = `
      มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก ${getuser[0][0].user_nameth} บทความ: ${pageChargeData.journal_name} กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

      res.status(200).json({ success: true, message: "Success" });
    } catch (error) {
      database.rollback(); //rollback transaction
      console.error("Error inserting into database:", error);
      res.status(500).json({ error: error.message });
    } finally {
      database.release(); //release connection
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
      "SELECT journal_name, article_title FROM Page_Charge WHERE pageC_id = ? ",
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
    { name: "upload_article" },
  ]),
  async (req, res) => {
    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ error: req.invalidFiles });
    }

    const data = req.body;
    console.log("ddddddd", data);
    console.log("ddddddd", data.q_pc_proof);

    try {
      const files = req.files;

      if (!files) {
        throw new Error("No files received.");
      }

      const fileData = {
        q_pc_proof: files.q_pc_proof?.[0]?.filename || data.q_pc_proof,
        invoice_public:
          files.invoice_public?.[0]?.filename || data.invoice_public,
        accepted: files.accepted?.[0]?.filename || data.accepted,
        copy_article: files.copy_article?.[0]?.filename || data.copy_article,
        upload_article: files.upload_article?.[0]?.filename || data.upload_article,
      };

      console.log("ddd", fileData);

      const update = await db.query(
        `UPDATE File_pdf SET q_pc_proof = ?, invoice_public = ?, accepted = ?, copy_article = ?, upload_article = ? WHERE pageC_id = ?`,
        [
          fileData.q_pc_proof,
          fileData.invoice_public,
          fileData.accepted,
          fileData.copy_article,
          fileData.upload_article,
          data.pageC_id,
        ]
      );

      const [updateForm_result] = await db.query(
        "UPDATE Form SET form_status = ? WHERE pageC_id = ?",
        ["research", data.pageC_id]
      );

      console.log("updateForm_result :", updateForm_result);

      //get pageC_id
      const [getID] = await db.query(
        "SELECT form_id FROM Form WHERE pageC_id = ?",
        [data.pageC_id]
      );
      console.log("GetID : ", getID);

      console.log("✅ Update successful:", update);
      res.json({ success: true, message: "อัปเดตข้อมูลสำเร็จ" });
    } catch (error) {
      console.error("❌ Error updating database:", error.message);
      res.status(500).json({ success: false, message: "เกิดข้อผิดพลาด" });
    }
  }
);

router.put("/editedFormPageChage/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const editDataJson = updates.edit_data

    const setClause = editDataJson.map(item => {
        const value = Array.isArray(item.newValue)
          ? JSON.stringify(item.newValue)
          : item.newValue;
        // escape single quotes เพื่อกัน syntax error ใน SQL
        const safeValue = typeof value === 'string' ? value.replace(/'/g, "''") : value;

        return `${item.field} = '${safeValue}'`;
      }).join(", ");
      
    const sql = await db.query(`UPDATE Page_Charge SET ${setClause} WHERE pageC_id = ${id};`)

    const allEditString = JSON.stringify(updates.edit_data);
    const [updateOfficeEditetForm] = await db.query(
      `UPDATE Form SET edit_data = ?, editor = ?, professor_reedit = ? WHERE pageC_id = ?`,
      [allEditString, updates.editor, updates.professor_reedit, id]
    )

    const [findID] = await db.query(
      `SELECT form_id FROM Form  WHERE pageC_id = ?`,
      [id]
    )

    const [updateNoti_result] = await db.query(
      `UPDATE Notification SET date_update = CURRENT_DATE  WHERE form_id = ?`, 
      [findID[0].form_id]
    )

    if (
      updates.professor_reedit === "false" ||
      updates.professor_reedit === null ||
      updates.professor_reedit === ""
    ) {
      //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการแก้ไขแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ของคุณ"
    const message = `
      แบบฟอร์มบทความ: ${getuser[0].journal_name} มีการแก้ไข กรุณาเข้าสู่ระบบเพื่อตรวจสอบข้อมูลและยืนยันเพื่อดำเนินการต่อไป
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);

      console.log("Email sent successfully");
    } else if (updates.professor_reedit === "true") {

      //send email to user
    const recipients = ["64070075@it.kmitl.ac.th"]; //getuser[0].user_email
    const subject =
      "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการแก้ไขแบบฟอร์มขอรับการสนับสนุนการตีพิมพ์ของคุณ"
    const message = `
      แบบฟอร์มบทความ: ${getuser[0].journal_name} มีการแก้ไข กรุณาเข้าสู่ระบบเพื่อตรวจสอบข้อมูลและยืนยันเพื่อดำเนินการต่อไป
      กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`;

    await sendEmail(recipients, subject, message);
    }

    res.status(200).json({ success: true, message: "Success" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

router.get("/getFilepage_c", async (req, res) => {
  const { pageC_id } = req.query;

  const file = await db.query(
    `SELECT pc_proof, q_pc_proof, invoice_public, accepted, copy_article, upload_article FROM File_pdf WHERE pageC_id = ?`,
    [pageC_id]
  );

  const url = baseURL.parsed.VITE_API_BASE_URL;

  const file_pc_proof = `${url}/uploads/${file[0]?.[0]?.pc_proof}`;
  const file_q_pc_proof = `${url}/uploads/${file[0]?.[0]?.q_pc_proof}`;
  const file_invoice_public = `${url}/uploads/${file[0]?.[0]?.invoice_public}`;
  const file_accepted = `${url}/uploads/${file[0]?.[0]?.accepted}`;
  const file_copy_article = `${url}/uploads/${file[0]?.[0]?.copy_article}`;
  const file_upload_article = `${url}/uploads/${file[0]?.[0]?.upload_article}`;

  res.json({
    message: "Get File Successfully",
    file_pc_proof,
    file_q_pc_proof,
    file_invoice_public,
    file_accepted,
    file_copy_article,
    file_upload_article,
  });
});
exports.router = router;
