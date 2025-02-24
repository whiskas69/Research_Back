const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const fs = require("fs");
const path = require("path");
const { error } = require("console");

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

//data
// post page_charge + file PDF
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
    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ errors: req.invalidFiles });
    }

    try {
      console.log("in post PC");
      // Handle database insertion for Page_Charge
      const data = req.body;
      console.log("data", data);
      const query = `
      INSERT INTO Page_Charge (
        user_id, pageC_times, pageC_days, journal_name, quality_journal,
        pc_isi_year, pc_sjr_year, pc_scopus_year, impact_factor, sjr_score,
        cite_score, support_limit, article_title, vol_journal, issue_journal,
        month, year, ISSN_ISBN, submission_date, date_review_announce,
        final_date, article_research_ject, research_type, research_type2,
        name_funding_source, budget_limit, annual, presenter_type, request_support,doc_submit_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
      const [result] = await db.query(query, [
        data.user_id,
        data.pageC_times,
        data.pageC_days,
        data.journal_name,
        data.quality_journal,
        data.pc_isi_year || null,
        data.pc_sjr_year || null,
        data.pc_scopus_year || null,
        data.impact_factor || null,
        data.sjr_score || null,
        data.cite_score || null,
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
        data.article_research_ject,
        data.research_type,
        data.research_type2 || null,
        data.name_funding_source,
        data.budget_limit,
        data.annual,
        data.presenter_type,
        data.request_support,
        data.doc_submit_date,
      ]);

      const pageCId = result.insertId;
      console.log("pcID: ", pageCId);

      //ลืมใส่ มีช่อง input ด้วย
      const { type, quartile_order } = req.body;
      // Insert uploaded file data into the database
      const files = req.files;
      console.log("filesss", req.files);
      const fileData = {
        type,
        pageC_id: pageCId,
        pc_proof: files?.pc_proof?.[0]?.filename || null,
        quartile_order,
        q_pc_proof: files?.q_pc_proof?.[0]?.filename || null,
        invoice_public: files?.invoice_public?.[0]?.filename || null,
        accepted: files?.accepted?.[0]?.filename || null,
        copy_article: files?.copy_article?.[0]?.filename || null,
      };
      console.log("File data to insert:", fileData);
      await db.query("INSERT INTO File_pdf SET ?", fileData);

      //ดพิ่มเข้าตาราง Form
      const formData = {
        form_type: type,
        pageC_id: pageCId,
        form_status: req.body.form_status,
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

router.get("/page_charge/calc/:id", async (req, res) => {
  const { id } = req.params;
  let withdrawn = 0; //เงืนที่เบิกได้
  let quartile = "";

  try {
    const [page_charge] = await db.query(
      "SELECT * FROM Page_Charge WHERE pageC_id = ?",
      [id]
    );

    if (!page_charge.length) {
      return res.status(404).json({ message: "page_charge not found" });
    }

    const money_request = page_charge[0].request_support;
    const quality_journal = page_charge[0].quality_journal;
    const journal_name = page_charge[0].journal_name;
    const impact_factor = page_charge[0].impact_factor;
    const sjr_score = page_charge[0].sjr_score;
    const cite_score = page_charge[0].cite_score;

    //check quartile
    if (sjr_score >= 16) {
      quartile = 1;
    } else if (sjr_score >= 8) {
      quartile = 2;
    } else if (sjr_score >= 4) {
      quartile = 3;
    } else if (sjr_score >= 2) {
      quartile = 4;
    }

    console.log("Get page_charge: ", page_charge[0]);

    for (let i = 0; i < quality_journal.length; i++) {
      console.log("checking journal", quality_journal[i]);

      if (quality_journal[i] === "nature") {
        console.log("Journal is 'nature'");

        withdrawn = money_request < 70000 ? money_request : 70000;

        // if (money_request < 70000) {
        //   console.log("requested less than 70000");

        //   withdrawn = money_request;
        // } else if (money_request >= 70000) {
        //   console.log("requested more than or equal 70000");

        //   withdrawn = 70000;
        // }
        break; //ออกจาก loop
      } else {
        const keyword = ["mdpi", "frontiers", "hindawi"];

        const filterword = journal_name
          .split(" ")
          .filter((word) => word.includes(keyword));

        if (filterword.length > 0) {
          console.log("have filterword: ", filterword);
          console.log(quartile);

          if (quartile == 1) {
            withdrawn = money_request < 60000 ? money_request : 60000;
            // if (money_request >= 60000) {
            //   withdrawn = 60000;
            // } else {
            //   withdrawn = money_request;
            // }
          } else if (quartile == 2) {
            withdrawn = money_request >= 40000 ? 40000 : money_request;
            // if (money_request >= 40000) {
            //   withdrawn = 40000;
            // } else {
            //   withdrawn = money_request;
            // }
          }
        } else {
          console.log("don't have filterword");
          if (quartile == 1) {
            withdrawn = money_request >= 60000 ? 60000 : money_request;
            // if (money_request >= 60000) {
            //   withdrawn = 60000;
            // } else {
            //   withdrawn = money_request;
            // }
          } else if (quartile == 2) {
            withdrawn = money_request >= 40000 ? 40000 : money_request;
            // if (money_request >= 40000) {
            //   withdrawn = 40000;
            // } else {
            //   withdrawn = money_request;
            // }
          } else if (quartile == 3) {
            withdrawn = money_request < 30000 ? money_request : 30000;
            // if (money_request >= 30000) {
            //   withdrawn = 30000;
            // } else {
            //   withdrawn = money_request;
            // }
          } else if (quartile == 4) {
            withdrawn = money_request < 20000 ? money_request : 20000;
            // if (money_request >= 20000) {
            //   withdrawn = 20000;
            // } else {
            //   withdrawn = money_request;
            // }
          }
        }
      }
    }

    console.log("Final withdrawn:", withdrawn);
    res.status(200).json({ ...page_charge[0], withdrawn });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update pc_file
router.put(
  "/page_charge/:id",
  uploadDocuments.fields([
    { name: "pc_proof" },
    { name: "q_pc_proof" },
    { name: "invoice_public" },
    { name: "accepted" },
    { name: "copy_article" },
  ]),
  async (req, res) => {
    const data = req.body;

    if (req.invalidFiles && req.invalidFiles.length > 0) {
      return res.status(400).json({ error: req.invalidFiles });
    }

    console.log("data, ", data)

    // try {
    //   const update = await db.query(
    //     `UPDATE File_pdf 
    //      SET pc_proof = ?, q_pc_proof = ?, invoice_public = ?, accepted = ?, copy_article = ? 
    //      WHERE pageC_id = ?`,
    //     [data.pc_proof, data.q_pc_proof, data.invoice_public, data.accepted, data.copy_article, id]
    //   );
      
    //   console.log("up, ", update);
      
    //   res.status(200).json(update);
    // } catch (error) {
    //   res.status(500).json*{ error: error.message };
    // }
  }
);

// Get page_charge:  {
//   pageC_id: 1,
//   user_id: 1,
//   pageC_times: 2,
//   pageC_days: 2025-01-03T17:00:00.000Z,
//   journal_name: 'wine',
//   quality_journal: [ 'ISI', 'nature' ],
//   pc_isi_year: 3,
//   pc_sjr_year: null,
//   pc_scopus_year: null,
//   impact_factor: 3,
//   sjr_score: null,
//   cite_score: null,
//   support_limit: 60000,
//   article_title: 'peee',
//   vol_journal: 3,
//   issue_journal: 2,
//   month: 3,
//   year: 2,
//   ISSN_ISBN: '3',
//   submission_date: 2025-01-06T17:00:00.000Z,
//   date_review_announce: 2025-01-07T17:00:00.000Z,
//   final_date: 2024-12-31T17:00:00.000Z,
//   article_research_ject: '',
//   research_type: 'วิจัยประยุกต์',
//   research_type2: null,
//   name_funding_source: 'ieoeiwoldclwpo',
//   budget_limit: 23456,
//   annual: 3333,
//   presenter_type: 'First Author',
//   request_support: 90000,
//   doc_submit_date: 2025-01-28T17:00:00.000Z
// }
exports.router = router;
