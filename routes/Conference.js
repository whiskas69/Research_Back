const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Joi = require("joi");
const { DateTime } = require("luxon");

const db = require("../config.js");
const createTransporter = require("../middleware/mailer.js");

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
      file.fieldname == "full_page" ||
      file.fieldname == "published_journals" ||
      file.fieldname == "q_proof" ||
      file.fieldname == "call_for_paper" ||
      file.fieldname == "accepted" ||
      file.fieldname == "fee_receipt" ||
      file.fieldname == "fx_rate_document" ||
      file.fieldname == "conf_proof"
    ) {
      if (file.mimetype === "application/pdf") {
        acceptedFile = true;
      } else {
        acceptedFile = false;
      }
    }

    if (!acceptedFile) {
      const message = `Fields ${file.fieldname} wrong type (${file.mimetype})`;
      !req.invalidFiles
        ? (req.invalidFiles = [message])
        : req.invalidFiles.push(message);
    }

    cb(null, acceptedFile);
  },
});

const today = DateTime.now();

//validation
const ConferSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  conf_times: Joi.number().integer().greater(0).required(),
  conf_days: Joi.date().iso().max(today.toISODate()).required(),

  trav_dateStart: Joi.date().iso().greater(today.toISODate()).required(),
  trav_dateEnd: Joi.date().iso().min(Joi.ref("trav_dateStart")).required(), //test ก่อนนะ
  conf_research: Joi.string().required(),
  conf_name: Joi.string().required(),
  num_co_researchers: Joi.number().integer(),
  name_co_researchers: Joi.string(),
  course_co_researchers: Joi.string(),
  country_conf: Joi.any().valid("ณ ต่างประเทศ", "ภายในประเทศ").required(),
  location: Joi.string().required(),
  meeting_date: Joi.date()
    .iso()
    .min(Joi.ref("trav_dateStart"))
    .max(Joi.ref("trav_dateEnd"))
    .required(),
  meeting_venue: Joi.string().required(),
  date_submit_organizer: Joi.date().iso().max(today.toISODate()).required(), //กำหนดให้ส่งก่อนยื่น
  argument_date_review: Joi.date()
    .iso()
    .greater(Joi.ref("date_submit_organizer"))
    .required(),
  last_day_register: Joi.date()
    .iso()
    .greater(Joi.ref("date_submit_organizer"))
    .greater(Joi.ref("argument_date_review"))
    .greater(today.toISODate())
    .required(),

  meeting_type: Joi.any()
    .valid("คณะจัด ไม่อยู่scopus", "อยู่ในscopus")
    .required(),
  quality_meeting: Joi.any().when("meeting_type", {
    is: "อยู่ในscopus",
    then: Joi.any().valid("มาตรฐาน", "ดีมาก").required(),
    otherwise: Joi.any().allow(null, ""),
  }),

  score_type: Joi.any().when("quality_meeting", {
    is: "ดีมาก",
    then: Joi.any().valid("SJR", "CIF", "CORE").required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  sjr_score: Joi.any().when("score_type", {
    is: "SJR",
    then: Joi.number().precision(2).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  sjr_year: Joi.any().when("score_type", {
    is: "SJR",
    then: Joi.number().integer().max(today.year).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  hindex_score: Joi.any().when("score_type", {
    is: Joi.any().valid("SJR", "CIF"),
    then: Joi.number().precision(2).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  hindex_year: Joi.any().when("score_type", {
    is: "SJR",
    then: Joi.number().integer().valid(Joi.ref("sjr_year")).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  Citation: Joi.any().when("score_type", {
    is: "CIF",
    then: Joi.number().precision(2).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  score_result: Joi.any().when("score_type", {
    is: Joi.any().valid("CIF", "SJR"),
    then: Joi.number().precision(2).required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  core_rank: Joi.any().when("score_type", {
    is: "CORE",
    then: Joi.string().valid("A", "A*").required(),
    otherwise: Joi.any().allow(null, ""),
  }),

  presenter_type: Joi.any()
    .valid("First Author", "Corresponding Author")
    .required(),

  time_of_leave: Joi.any().valid("1", "2").required(),
  wos_2_leave: Joi.any().when(
    Joi.object({
      time_of_leave: Joi.valid("2"),
      country_conf: Joi.valid("ณ ต่างประเทศ"),
    }),
    {
      then: Joi.any().valid("WoS-Q1", "WoS-Q2").required(),
      otherwise: Joi.any().allow(null, ""),
    }
  ),
  name_2_leave: Joi.any().when(
    Joi.object({
      time_of_leave: Joi.valid("2"),
      country_conf: Joi.valid("ณ ต่างประเทศ"),
    }),
    {
      then: Joi.string().required(),
      otherwise: Joi.any().allow(null, ""),
    }
  ),
  withdraw: Joi.any().when("country_conf", {
    is: "ณ ต่างประเทศ",
    then: Joi.any().valid("50%", "100%").required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  wd_100_quality: Joi.any().when("withdraw", {
    is: "100%",
    then: Joi.any()
      .valid("WoS-Q1", "WoS-Q2", "WoS-Q3", "SJR-Q1", "SJR-Q2")
      .required(),
    otherwise: Joi.any().allow(null, ""),
  }),
  wd_name_100: Joi.any().when("withdraw", {
    is: "100%",
    then: Joi.string().required(),
    otherwise: Joi.any().allow(null, ""),
  }),

  num_register_articles: Joi.number().integer().invalid(0).required(),
  regist_amount_1_article: Joi.number().precision(2).invalid(0).required(),
  total_amount: Joi.number().precision(2).invalid(0).required(),
  domestic_expenses: Joi.number().precision(2).allow(null, ""),
  overseas_expenses: Joi.number().precision(2).allow(null, ""),
  travel_country: Joi.string().allow(null, ""),
  inter_expenses: Joi.number().precision(2).allow(null, ""),
  airplane_tax: Joi.number().precision(2).allow(null, ""),
  num_days_room: Joi.number().integer().allow(null, ""),
  room_cost_per_night: Joi.number().precision(2).allow(null, ""),
  total_room: Joi.number().precision(2).allow(null, ""),
  num_travel_days: Joi.number().invalid(0).integer().allow(null, ""),
  daily_allowance: Joi.number().invalid(0).precision(2).allow(null, ""),
  total_allowance: Joi.number().invalid(0).precision(2).allow(null, ""),
  all_money: Joi.number().invalid(0).precision(2).allow(null, ""),
  date_published_journals: Joi.number()
    .integer()
    .min(today.year - 2)
    .max(today.year)
    .allow(null, ""),
});

//insert data to db
router.post(
  "/conference",
  uploadDocuments.fields([
    { name: "full_page" },
    { name: "published_journals" },
    { name: "q_proof" },
    { name: "call_for_paper" },
    { name: "accepted" },
    { name: "fee_receipt" },
    { name: "fx_rate_document" },
    { name: "conf_proof" },
  ]),
  async (req, res) => {
    const requiredFiles = [
      "full_page",
      "call_for_paper",
      "fee_receipt",
      "fx_rate_document",
      "conf_proof",
    ];

    const missingFiles = requiredFiles.filter((fields) => !req.files[fields]);

    //check dataError and missingFiles
    try {
      //check missing files
      if (missingFiles.length > 0) {
        console.log(`กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`);
        return res.status(400).json({
          error: `กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`,
        });
      }

      //check ConferSchema
      await ConferSchema.validate(req.body, { abortEarly: false });
    } catch (error) {
      console.log("error", error);
      return res
        .status(400)
        .json({ error: error.details.map((err) => err.message) });
    }

    const conferenceFile = req.files;
    const conferenceData = req.body;

    const database = await db.getConnection();
    await database.beginTransaction(); //start transaction

    console.log("conferdata : ", conferenceData);

    try {
      //query insert data to Conference
      const query = `INSERT INTO Conference (
        user_id, conf_times, conf_days, trav_dateStart, trav_dateEnd, conf_research,
        num_co_researchers, name_co_researchers, course_co_researchers, conf_name,
        meeting_date, meeting_venue, date_submit_organizer, argument_date_review, last_day_register,
        meeting_type, quality_meeting, presenter_type, time_of_leave, location, wos_2_leave, name_2_leave,
        withdraw, wd_100_quality, wd_name_100, country_conf, num_register_articles, regist_amount_1_article, total_amount,
        domestic_expenses, overseas_expenses, travel_country, inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
        num_travel_days, daily_allowance,total_allowance, all_money)
        VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

      //insert data to Conference
      const [conference_result] = await database.query(query, [
        conferenceData.user_id,
        conferenceData.conf_times,
        conferenceData.conf_days,
        conferenceData.trav_dateStart,
        conferenceData.trav_dateEnd,
        conferenceData.conf_research,
        conferenceData.num_co_researchers || null,
        JSON.stringify(conferenceData.name_co_researchers || null),
        JSON.stringify(conferenceData.course_co_researchers || null),
        conferenceData.conf_name,
        conferenceData.meeting_date,
        conferenceData.meeting_venue,
        conferenceData.date_submit_organizer,
        conferenceData.argument_date_review,
        conferenceData.last_day_register,
        conferenceData.meeting_type,
        conferenceData.quality_meeting,
        conferenceData.presenter_type,
        conferenceData.time_of_leave,
        conferenceData.location || null,
        conferenceData.wos_2_leave || null,
        conferenceData.name_2_leave || null,
        conferenceData.withdraw || null,
        conferenceData.wd_100_quality || null,
        conferenceData.wd_name_100 || null,
        conferenceData.country_conf,
        conferenceData.num_register_articles,
        conferenceData.regist_amount_1_article,
        conferenceData.total_amount,
        conferenceData.domestic_expenses || null,
        conferenceData.overseas_expenses || null,
        conferenceData.travel_country || null,
        conferenceData.inter_expenses || null,
        conferenceData.airplane_tax || null,
        conferenceData.num_days_room || null,
        conferenceData.room_cost_per_night || null,
        conferenceData.total_room || null,
        conferenceData.num_travel_days || null,
        conferenceData.daily_allowance || null,
        conferenceData.total_allowance || null,
        conferenceData.all_money,
      ]);

      const confId = conference_result.insertId;

      // data for score
      const scoreData = {
        conf_id: confId,
        score_type: conferenceData.score_type || null,
        sjr_score: conferenceData.sjr_score || null,
        sjr_year: conferenceData.sjr_year || null,
        hindex_score: conferenceData.hindex_score || null,
        hindex_year: conferenceData.hindex_year || null,
        Citation: conferenceData.Citation || null,
        score_result: conferenceData.score_result || null,
        core_rank: conferenceData.core_rank || null,
      };
      //insert data to Score
      const [score_result] = await database.query("INSERT INTO Score SET ?", [
        scoreData,
      ]);

      console.log("score_result", score_result);
      //data for File_pdf
      const fileData = {
        type: "Conference",
        conf_id: confId,
        full_page: conferenceFile.full_page[0].filename,
        date_published_journals: conferenceData.date_published_journals || null,
        published_journals:
          conferenceFile.published_journals?.[0]?.filename ?? null,
        q_proof: conferenceFile.q_proof?.[0]?.filename ?? null,
        call_for_paper: conferenceFile.call_for_paper[0].filename,
        accepted: conferenceFile.accepted[0].filename || null,
        fee_receipt: conferenceFile.fee_receipt[0].filename,
        fx_rate_document: conferenceFile.fx_rate_document[0].filename,
        conf_proof: conferenceFile.conf_proof[0].filename,
      };
      console.log("fileData", fileData);
      //insert data to File_pdf
      const [file_result] = await database.query("INSERT INTO File_pdf SET ?", [
        fileData,
      ]);
      console.log("file_result", file_result);

      //data for Form
      const formData = {
        form_type: "Conference",
        conf_id: confId,
        form_status: "ฝ่ายบริหารทรัพยากรบุคคล",
      };

      //insert data to Form
      const [form_result] = await database.query("INSERT INTO Form SET ?", [
        formData,
      ]);
      console.log("form_result", form_result);

      //insert data to Notification
      const [notification_result] = await database.query(
        `INSERT INTO Notification (
        user_id, form_id, name_form, is_read)
        VALUES (?, ?, ?, ?)`,
        [
          conferenceData.user_id,
          form_result.insertId,
          conferenceData.conf_research,
          false,
        ]
      );
      console.log("notification_result", notification_result);

      const getuser = await database.query(
        `SELECT user_nameth FROM Users WHERE user_id = ?`,
        [conferenceData.user_id]
      );
      console.log("getuser", getuser[0][0]);

      await database.commit(); //commit transaction

      //send email to user
      const transporter = createTransporter();
      const mailOptions = {
        form: `"ระบบสนับสนุนงานบริหารงานวิจัย" <${process.env.EMAIL_USER}>`,
        to: "64070105@kmitl.ac.th", //edit mail
        subject: "แจ้งเตือนจากระบบสนับสนุนงานวิจัย มีการส่งแบบฟอร์มขอรับการสนับสนุนเข้าร่วมประชุม",
        text: `มีการส่งแบบฟอร์มขอรับการสนับสนุนจาก ${getuser[0][0].user_nameth} งานวิจัย: ${conferenceData.conf_name} กำลังรอการอนุมัติและตรวจสอบ โปรดเข้าสู่ระบบสนับสนุนงานบริหารงานวิจัยเพื่อทำการอนุมัติและตรวจสอบข้อมูล
        กรุณาอย่าตอบกลับอีเมลนี้ เนื่องจากเป็นระบบอัตโนมัติที่ไม่สามารถตอบกลับได้`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:", info.response);
      } catch (error) {
        console.error("Error sending email:", error);
      }

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

//get all data from database conference
router.get("/conferences", async (req, res) => {
  try {
    const [conferences] = await db.query("SELECT * FROM Conference");
    res.status(200).json(conferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//get data by id
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

router.put("/editFormConfer/:id", async (req, res) => {
  console.log("editFormConfer in id:", req.params)
  const { id } = req.params;
  const updates = req.body;
  const editDataJson = req.body.edit_data
  console.log("12345", updates)
  console.log("12345", editDataJson)
  try {
    console.log("12345")
    if (updates.conf_id) {
      console.log("in conf_id")


      const setClause = editDataJson.map(item => `${item.field} = '${item.newValue}'`).join(", ")
      console.log("in conf_id setClause", setClause)
      const sql = await db.query(`UPDATE Conference SET ${setClause} WHERE conf_id = ${id};`)

      console.log("789", sql);

      const [updateOfficeEditForm] = await db.query(
        `UPDATE Form SET edit_data = ? WHERE conf_id = ?`,
        [editDataJson, id]
      )
      console.log("updateOpi_result :", updateOfficeEditForm);
      
    //score_type ENUM('SJR', 'CIF', 'CORE'),
    // sjr_score DECIMAL(10,2),
    // sjr_year INT,
    // hindex_score DECIMAL(10,2),
    // hindex_year INT,
    // Citation DECIMAL(10,2),
    // score_result DECIMAL(10,2),
    // core_rank VARCHAR(255),


      res.status(200).json({ success: true, message: "Success" });
    }


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
})

//status page
router.get("/form/confer/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(401).json({ error: "ไม่มีแบบฟอร์มนี้" });
  }

  try {
    const [form] = await db.query("SELECT * FROM Form WHERE conf_id = ?", [id]);
    const [conf] = await db.query("SELECT * FROM File_pdf WHERE conf_id = ?", [
      id,
    ]);

    const [infoConf] = await db.query(
      "select conf_research, conf_name, withdraw FROM Conference WHERE conf_id = ?",
      [id]
    );

    res.status(200).json({
      form: form[0],
      conf: conf[0],
      confer_name: infoConf[0].conf_name,
      name: infoConf[0].conf_research,
      withdraw: infoConf[0].withdraw,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดโปรดลองใหม่อีกครั้ง" });
  }
});

//update file to db
router.put(
  "/updateFileConf",
  uploadDocuments.fields([
    { name: "published_journals" },
    { name: "accepted" },
    { name: "q_proof" },
    { name: "call_for_paper" },
    { name: "fee_receipt" },
    { name: "fx_rate_document" },
    { name: "conf_proof" },
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
        published_journals: files.published_journals?.[0]?.filename || null,
        accepted: files.accepted?.[0]?.filename || null,
        q_proof: files.q_proof?.[0]?.filename || null,
        call_for_paper: files.call_for_paper?.[0]?.filename || null,
        fee_receipt: files.fee_receipt?.[0]?.filename || null,
        fx_rate_document: files.fx_rate_document?.[0]?.filename || null,
        conf_proof: files.conf_proof?.[0]?.filename || null,
      };

      const update = await db.query(
        `UPDATE File_pdf SET published_journals = ?, accepted = ?, q_proof = ?, call_for_paper = ?, fee_receipt = ?, fx_rate_document = ?, conf_proof = ? WHERE conf_id = ?`,
        [
          fileData.published_journals,
          fileData.accepted,
          fileData.q_proof,
          fileData.call_for_paper,
          fileData.fee_receipt,
          fileData.fx_rate_document,
          fileData.conf_proof,
          data.conf_id,
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

router.get("/getFileConf", async (req, res) => {
  const { conf_id } = req.query;

  const file = await db.query(
    `SELECT full_page, date_published_journals, published_journals, accepted, q_proof, call_for_paper, fee_receipt, fx_rate_document, conf_proof FROM File_pdf WHERE conf_id = ?`,
    [conf_id]
  );

  console.log("file", file);

  const file_full_page = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.full_page}`;
  const date_published_journals = file[0][0].date_published_journals;
  const file_published_journals = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.published_journals}`;
  const file_accepted = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.accepted}`;
  const file_q_proof = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.q_proof}`;
  const file_call_for_paper = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.call_for_paper}`;
  const file_fee_receipt = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.fee_receipt}`;
  const file_fx_rate_document = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.fx_rate_document}`;
  const file_conf_proof = `http://10.0.15.37:3002/uploads/${file[0]?.[0]?.conf_proof}`;

  res.json({
    message: "Get File Successfully",
    file_full_page,
    date_published_journals,
    file_published_journals,
    file_accepted,
    file_q_proof,
    file_call_for_paper,
    file_fee_receipt,
    file_fx_rate_document,
    file_conf_proof,
  });
});

exports.router = router;
