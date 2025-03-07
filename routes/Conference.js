const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

const country = require("./Country.json");

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
    { name: "other_file" },
  ]),
  async (req, res) => {
    console.log("in post conference");
    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ errors: req.invalidFiles });
    }
    try {
      // Handle database insertion for Page_Charge
      const data = req.body;
      console.log("data", data);
      console.log("User ID:", data.user_id);

      const query = `INSERT INTO Conference (
      user_id, conf_times, conf_days, trav_dateStart, trav_dateEnd, conf_research, conf_name,
      meeting_date, meeting_venue, date_submit_organizer, argument_date_review, last_day_register,
      meeting_type, quality_meeting, presenter_type, time_of_leave, location_1, wos_2_leave, name_2_leave,
      withdraw, wd_100_quality, wd_name_100, country_conf, num_register_articles, regist_amount_1_article, total_amount,
      domestic_expenses, overseas_expenses, travel_country, inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
      num_travel_days, daily_allowance,total_allowance, all_money, doc_submit_date)
      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;
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
        data.location_1 || null,
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
        data.doc_submit_date,
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
        score_type,
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

      const { type, date_published_journals, other_name } = req.body;
      // Insert uploaded file data into the database
      const files = req.files;
      console.log("files", req.files);
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
  console.log("in get conference");
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
    const [conf] = await db.query("SELECT * FROM File_pdf WHERE conf_id = ?", [id,]);

    const [infoConf] = await db.query("select conf_research, conf_name FROM conference WHERE conf_id = ?",[id]);

    res.status(200).json({
      form: form[0],
      conf: conf[0],
      confer_name: infoConf[0].conf_name,
      name: infoConf[0].conf_research,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์" });
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

const scoreStandard = (typeScore, total) => {
  if (typeScore == "SJR") {
    console.log("typeScore", typeScore);

    if (total >= 4) {
      console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", total);
      result =
        "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
    } else {
      result = "สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
      // res.status(200).json({ message: "ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" });
    }
  } else if (typeScore == "CIF") {
    console.log("typeScore", typeScore);
    if (total >= 9.38) {
      console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", total);
      result =
        "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
    } else {
      result = "สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
      // res.status(200).json({ message: "ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" });
    }
  } else if (typeScore == "CORE") {
    console.log("typeScore", typeScore);
    if (total == "A" || total == "A*") {
      console.log("ดีมากคับ ไม่คิดค่าลงทะเบียน: ", total);
      result =
        "ไม่คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
    } else {
      result = "สามารถเบิกได้ตามเงื่อนไขในประกาศสถาบัน";
      // res.status(200).json({ message: "ระดับมาตรฐาน คิดค่าลงทะเบียนรวมกับวงเงินสนับสนุน" });
    }
  } else {
    res.status(500).json({ error: "ไม่พบ typeScore ในเงื่อนไข" });
  }
}

const checkWithdraw = (half_full ,withdraw_100, wd_name_100, file_full_100) =>{
  let withdraw = ""
  if (half_full == "50%") {
    withdraw = "50%";
    console.log("withdraw", withdraw);
    return withdraw;
  } else if (half_full == "100%") {
    if (
      withdraw_100 == "WoS-Q1" ||
      withdraw_100 == "WoS-Q2" ||
      withdraw_100 == "WoS-Q3" ||
      withdraw_100 == "SJR-Q1" ||
      withdraw_100 == "SJR-Q2"
    ) {
      if (wd_name_100 != null || wd_name_100 != "") {
        console.log("wd_name_100", wd_name_100);
        console.log("withdraw", withdraw);
        if (file_full_100 != null || file_full_100 != "") {
          withdraw = "100%";
          return withdraw;
        }
      } else {
        console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");

        res
          .status(200)
          .json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
      }
    }
  }
}

const getMaxExpense = (countryName) => {
  let maxExpense = 0;
    // 20K 40K 60K
    for (const category in country) {
      // console.log("countryName",countryName)
      const data = country[category];
      // console.log("data",data)
      // เช็คว่าประเทศอยู่ใน array ของ 'countries' หรือไม่
      if (Array.isArray(data.countries) && data.countries.includes(countryName)) {
        console.log("เช็คว่าประเทศอยู่ใน array ของ 'countries' หรือไม่")
        maxExpense = data.max_expense;
        break; // ออกจาก loop เมื่อเจอข้อมูล
      }
    }
    console.log("maxExpense",maxExpense)
    return maxExpense;
  }

router.get("/confer/calc/:id", async (req, res) => {
  const { id } = req.params;
  console.log("confer id", id);
  // console.log("country", country.Asia_20000.countries)
  // console.log("country", country)
  try {
    const confer = await db.query(
      `SELECT * FROM conference WHERE conf_id = ?`,
      [id]
    );
    const score = await db.query(`SELECT * FROM score WHERE conf_id = ?`, [id]);
    const file = await db.query(`SELECT * FROM file_pdf WHERE conf_id = ?`, [
      id,
    ]);

    const Author = confer[0][0].presenter_type;
    const In_Out_Country = confer[0][0].location_1;
    const In_Out_Scopus = confer[0][0].meeting_type;
    const Leave = confer[0][0].time_of_leave;
    const Sec_Leave = confer[0][0].wos_2_leave;
    const Sec_Leave_name = confer[0][0].name_2_leave;

    //ต้องเรียกมาจากตาราง officers_opinion_conf
    const year_work = false; //check เป็นพนักงานสถาบันที่ปฏิบัติงานมาแล้วไม่เกิน 3 ปีนับตั้งแต่วันบรรจุและยังไม่เคยลาเข้าร่วมประชุมทางวิชาการ ณ ต่างประเทศ
    const nameCountry = "ออสเตรีย"; // เรียกชื่อประเทศที่จารจะไป ยังไม่ได้สร้างในดาต้าเบส

    const score_type = score[0][0].score_type;
    const total_score = score[0][0].score_result;
    let result = "";

    const half_full = confer[0][0].withdraw
    const withdraw_100 = confer[0][0].wd_100_quality;
    const wd_name_100 = confer[0][0].wd_name_100;
    const file_full_100 = file[0][0].published_journals;
    // if 50 or 100
    let withdraw = checkWithdraw(half_full,withdraw_100, wd_name_100, file_full_100);
    console.log("ค่า withdraw:", withdraw);
    // if score
    scoreStandard(score_type, total_score);

    let maxExpense = getMaxExpense(nameCountry);
    console.log("ค่า max_expense:", maxExpense);

    // if all
    if (Author == "First Author" || Author == "Corresponding Author") {
      console.log("Author", Author);

      //ส่วนในประเทศ
      if (In_Out_Country == "ในประเทศ") {
        console.log("In_Out_Country", In_Out_Country);

        //ได้รับการสนับสนุนจากคณะ
        if (In_Out_Scopus == "คณะจัด ไม่อยู่scopus") {
          console.log("In_Out_Scopus", In_Out_Scopus);

          return result;
          //ทำตามเกณฑ์ปกติ
        } else if (In_Out_Scopus == "อยู่ในscopus") {
          console.log("In_Out_Scopus", In_Out_Scopus);

          //ลาได้มากสุด 2 ครั้ง
          if (Leave < 3 && Leave != 0) {
            console.log("Leave", Leave);
            console.log("สมมติว่ามีเรื่องตีพิม ตีพิมพ์เรื่องเต็มใน Proceeding");

            return result;
          } else {
            console.log("can't go confer");

            res
              .status(200)
              .json({
                message:
                  "ไม่สามารถขอรับการสนับสนุนได้ เนื่องจากไปครบ 2 ครั้งแล้ว",
              });
          }
        }
      }
      //ส่วนต่างประเทศ
      else if (In_Out_Country == "ต่างประเทศ") {
        console.log("In_Out_Country", In_Out_Country);

        //ได้รับการสนับสนุนจากคณะ
        if (In_Out_Scopus == "คณะจัด ไม่อยู่scopus") {
          console.log("In_Out_Scopus", In_Out_Scopus);

          //เข้า loop ดูว่าเบิกได้เท่าไหร่
          //ถ้าเช้ค 50 100 befor year_work 
          //check เวลาการทำงานและเคยไปประชุมไหม
          if (year_work == true) {
            //ไม่เคยไป และทำงานไม่ถึง 3 ปี
            //เบิก 50 ทันที
          } else {
            //เคยไป หรือ ทำงานเกิน 3 ปี
            //ต้องพิจารณาอีกทีว่า 50/ 100
          }
        }
        //ทำตามเกณฑ์ปกติ
        else if (In_Out_Scopus == "อยู่ในscopus") {
          console.log("In_Out_Scopus", In_Out_Scopus);

          //ลาตามเกณฑ์ปกติ
          if (Leave == 1) {
            console.log("Leave", Leave);
            //เข้า loop ดูว่าเบิกได้เท่าไหร่
            //check เวลาการทำงานและเคยไปประชุมไหม
            if (year_work == true) {
              //ไม่เคยไป และทำงานไม่ถึง 3 ปี
              //เบิก 50 ทันที
            } else {
              //เคยไป หรือ ทำงานเกิน 3 ปี
              //ต้องพิจารณาอีกทีว่า 50/ 100
            }
          }
          //ลาเกินเกณฑ์
          else if (Leave == 2) {
            console.log("Leave", Leave);

            //มีบทความข้อเพิ่ม
            if (Sec_Leave == "WoS-Q1" || Sec_Leave == "WoS-Q2") {
              console.log("Sec_Leave", Sec_Leave);

              //check ว่าได้แนบชื่อมาด้วย
              if (Sec_Leave_name != null || Sec_Leave_name != "") {
                console.log("Sec_Leave_name", Sec_Leave_name);

                //เข้า loop ดูว่าเบิกได้เท่าไหร่
                //check เวลาการทำงานและเคยไปประชุมไหม
                if (year_work == true) {
                  //ไม่เคยไป และทำงานไม่ถึง 3 ปี
                  //เบิก 50 ทันที
                } else {
                  //เคยไป หรือ ทำงานเกิน 3 ปี
                  //ต้องพิจารณาอีกทีว่า 50/ 100
                }
              } else {
                console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");

                res
                  .status(200)
                  .json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
              }
            }
            // ไม่มี
            else {
              console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");

              res
                .status(200)
                .json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
            }
          }
        }
        // else {
        //   console.log("ไม่ตรงเงื่อนไขการขอรับการสนับสนุน");

        //   res.status(200).json({ message: "ไม่ตรงเงื่อนไขการขอรับการสนับสนุน" });
        // }
      }
      res.status(200).json({ message: result });
    } else {
      console.log(
        "ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก"
      );

      res
        .status(200)
        .json({
          message:
            "ไม่ตรงเงื่อนไขการขอรับการสนับสนุนเรื่องผู้นำเสนอ หรือผู้วิจัยหลัก",
        });
    }
  } catch (err) {
    res.status(500).json({ error789: err.message });
  }
});

exports.router = router;
