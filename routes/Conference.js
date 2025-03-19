const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const Joi = require("joi");
const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const uploadDocuments = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const dir = "uploads";
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      cb(null, dir);
    },
    filename: function (req, file, cb) {
      cb(null, DateTime.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: function (req, file, cb) {
    let acceptFile = false
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
        acceptFile = true
      } else {
        acceptFile = false
      }
    }

    if (!acceptFile) {
      const message = `Fields ${file.fieldname} wrong type (${file.mimetype})`
      !req.invalidFiles ? req.invalidFiles = [message] : req.invalidFiles.push(message)
    }

    cb(null, acceptFile)
  },
});

const today = DateTime.now();

const ConferSchema = Joi.object({
  user_id: Joi.number().integer().required(),
  conf_times: Joi.number().integer().greater(0).required(),
  conf_days: Joi.date().iso().max(today.toISODate()).required(),

  trav_dateStart: Joi.date().iso().greater(today.toISODate()).required(),
  trav_dateEnd: Joi.date().iso().min(Joi.ref("trav_dateStart")).required(), //test ก่อนนะ
  conf_research: Joi.string().required(),
  conf_name: Joi.string().required(),
  country_conf: Joi.any().valid("ณ ต่างประเทศ", "ภายในประเทศ").required(),
  location: Joi.string().required(),
  meeting_date: Joi.date().iso().min(Joi.ref("trav_dateStart")).max(Joi.ref("trav_dateEnd")).required(),
  meeting_venue: Joi.string().required(),
  date_submit_organizer: Joi.date().iso().max(today.toISODate()).required(), //กำหนดให้ส่งก่อนยื่น
  argument_date_review: Joi.date().iso().greater(Joi.ref("date_submit_organizer")).required(),
  last_day_register: Joi.date().iso().greater(Joi.ref("date_submit_organizer")).greater(Joi.ref("argument_date_review")).greater(today.toISODate()).required(),

  meeting_type: Joi.any().valid("คณะจัด ไม่อยู่scopus", "อยู่ในscopus").required(),
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

  presenter_type: Joi.any().valid("First Author", "Corresponding Author").required(),

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
  date_published_journals: Joi.number().integer().min(today.year - 2).max(today.year).allow(null, ""),
});

//data แก้ date ของดาต้าเบส
router.post("/conference", uploadDocuments.fields([
    { name: "full_page" },
    { name: "published_journals" },
    { name: "q_proof" },
    { name: "call_for_paper" },
    { name: "accepted" },
    { name: "fee_receipt" },
    { name: "fx_rate_document" },
    { name: "conf_proof" },
  ]), async (req, res) => {
    const files = req.files;
    const data = req.body;

    console.log('req', data);
    console.log('file', files)

    const requiredFiles = ["full_page", "call_for_paper", "fee_receipt", "fx_rate_document", "conf_proof"]
    const missingFiles = requiredFiles.filter((fields) => !req.files[fields]);

    if (missingFiles.length > 0) {
      console.log(`กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`);
      return res.status(400).json({
        error: `กรุณาอัปโหลดไฟล์: ${missingFiles.join(", ")}`,
      });
    }

    if (req.invalidFiles) {
      return res.status(200).json({
        message: "Some documents did not uploaded: " + req.invalidFiles.join(", ")
      })
    }

    const { error } = ConferSchema.validate(req.body, {
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

      const query = `INSERT INTO Conference (
      user_id, conf_times, conf_days, trav_dateStart, trav_dateEnd, conf_research, conf_name,
      meeting_date, meeting_venue, date_submit_organizer, argument_date_review, last_day_register,
      meeting_type, quality_meeting, presenter_type, time_of_leave, location, wos_2_leave, name_2_leave,
      withdraw, wd_100_quality, wd_name_100, country_conf, num_register_articles, regist_amount_1_article, total_amount,
      domestic_expenses, overseas_expenses, travel_country, inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
      num_travel_days, daily_allowance,total_allowance, all_money)
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
      const [result] = await db.query(query, [
        data.user_id,
        data.conf_times,
        data.conf_days,
        data.trav_dateStart,
        data.trav_dateEnd,
        data.conf_research,
        data.conf_name,
        data.meeting_date,
        data.meeting_venue,
        data.date_submit_organizer,
        data.argument_date_review,
        data.last_day_register,
        data.meeting_type,
        data.quality_meeting,
        data.presenter_type,
        data.time_of_leave,
        data.location || null,
        data.wos_2_leave || null,
        data.name_2_leave || null,
        data.withdraw || null,
        data.wd_100_quality || null,
        data.wd_name_100 || null,
        data.country_conf,
        data.num_register_articles,
        data.regist_amount_1_article,
        data.total_amount,
        data.domestic_expenses || null,
        data.overseas_expenses || null,
        data.travel_country || null,
        data.inter_expenses || null,
        data.airplane_tax || null,
        data.num_days_room || null,
        data.room_cost_per_night || null,
        data.total_room || null,
        data.num_travel_days || null,
        data.daily_allowance || null,
        data.total_allowance || null,
        data.all_money,
      ]);

      const confId = result.insertId;

      console.log("conferID: ", confId);

      const {
        score_type,
        sjr_score,
        sjr_year,
        hindex_score,
        hindex_year,
        Citation,
        score_result,
        core_rank,
      } = req.body;

      const scoreData = {
        conf_id: confId,
        score_type: score_type || null,
        sjr_score: sjr_score || null,
        sjr_year: sjr_year || null,
        hindex_score: hindex_score || null,
        hindex_year: hindex_year || null,
        Citation: Citation || null,
        score_result: score_result || null,
        core_rank: core_rank || null,
      };

      console.log("Score data to insert:", scoreData);
      await db.query("INSERT INTO Score SET ?", scoreData);

      console.log("files", req.files);

      const fileData = {
        type: "Conference",
        conf_id: confId,
        full_page: files?.full_page?.[0]?.filename,
        published_journals: files?.published_journals?.[0]?.filename || null,
        q_proof: files?.q_proof?.[0]?.filename || null,
        call_for_paper: files?.call_for_paper?.[0]?.filename,
        accepted: files?.accepted?.[0]?.filename || null,
        fee_receipt: files?.fee_receipt?.[0]?.filename,
        fx_rate_document: files?.fx_rate_document?.[0]?.filename,
        conf_proof: files?.conf_proof?.[0]?.filename,
      };

      console.log("File data to insert:", fileData);
      await db.query("INSERT INTO File_pdf SET ?", fileData);

      //เพิ่มเข้าตาราง Form
      const formData = {
        form_type: "Conference",
        conf_id: confId,
        form_status: "ฝ่ายบริหารทรัพยากรบุคคล",
      };
      console.log("formData data to insert:", formData);
      await db.query("INSERT INTO Form SET ?", formData);

      res.status(201).json({
        message: "Conference entry created",
        conf_id: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
      console.log(err.message);
    }
  }
);

router.get("/conferences", async (req, res) => {
  try {
    const [conferences] = await db.query("SELECT * FROM Conference");
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

router.put("/conference/:id", async (req, res) => {
  console.log("in Update conference");

  const { id } = req.params;
  const updates = req.body;
  try {
    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);
    const query = `UPDATE Conference SET ${fields} WHERE conf_id = ?`;
    const [result] = await db.query(query, [...values, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Conference not found" });
    }
    res.status(200).json({ message: "Conference updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
      "select conf_research, conf_name FROM conference WHERE conf_id = ?",
      [id]
    );

    res.status(200).json({
      form: form[0],
      conf: conf[0],
      confer_name: infoConf[0].conf_name,
      name: infoConf[0].conf_research,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดโปรดลองใหม่อีกครั้ง" });
  }
});

//update
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
    `SELECT full_page, published_journals, accepted, q_proof, call_for_paper, fee_receipt, fx_rate_document, conf_proof FROM file_pdf WHERE conf_id = ?`,
    [conf_id]
  );

  console.log("file", file);

  const file_full_page = `http://localhost:3000/uploads/${file[0]?.[0]?.full_page}`;
  const file_published_journals = `http://localhost:3000/uploads/${file[0]?.[0]?.published_journals}`;
  const file_accepted = `http://localhost:3000/uploads/${file[0]?.[0]?.accepted}`;
  const file_q_proof = `http://localhost:3000/uploads/${file[0]?.[0]?.q_proof}`;
  const file_call_for_paper = `http://localhost:3000/uploads/${file[0]?.[0]?.call_for_paper}`;
  const file_fee_receipt = `http://localhost:3000/uploads/${file[0]?.[0]?.fee_receipt}`;
  const file_fx_rate_document = `http://localhost:3000/uploads/${file[0]?.[0]?.fx_rate_document}`;
  const file_conf_proof = `http://localhost:3000/uploads/${file[0]?.[0]?.conf_proof}`;

  res.json({
    message: "Get File Successfully",
    file_full_page,
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
