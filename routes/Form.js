const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post("/form", async (req, res) => {
  console.log("in post formss");
  const data = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO Form (form_type, conf_id, pageC_id, kris_id, form_status, form_money) VALUES (?, ?, ?, ?, ?, ?)",
      [
        data.form_type,
        data.conf_id || null,
        data.pageC_id || null,
        data.kris_id || null,
        data.form_status,
        data.form_money,
      ]
    );
    console.log(data);
    res
      .status(201)
      .json({ message: "Form created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});

router.get("/formsOffice", async (req, res) => {
  try {
    const [forms] = await db.query(
      "SELECT * FROM Form WHERE form_status = 'ตรวจสอบ'"
    );
    // console.log(forms);

    let confer = [];
    let pageC = [];
    let kris = [];

    if (forms.length > 0) {
      for (let i = 0; i < forms.length; i++) {
        if (forms[i].conf_id != null) {
          console.log("1", forms[i]);
          const [conferData] = await db.query(
            "SELECT user_id FROM Conference WHERE conf_id = ?",
            [forms[i].conf_id]
          );
          const [nameC] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [conferData[0].user_id]
          );
          console.log("nameC", nameC);

          newC = [];
          newC.push(forms[i].conf_id, nameC[0]);
          console.log("900", newC);
          confer.push(newC);
        }

        if (forms[i].pageC_id != null) {
          // console.log("form", forms[i])
          console.log("Page 2", forms[i]);
          const [pageCData] = await db.query(
            "SELECT user_id FROM Page_Charge WHERE pageC_id = ?",
            [forms[i].pageC_id]
          );
          const [nameP] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [pageCData[0].user_id]
          );
          console.log("nameP", nameP);

          // forms.push(nameP[0])
          // console.log("forms", forms)

          newC = [];
          newC.push(forms[i].pageC_id, nameP[0]);
          console.log("newD", newC);
          //[PC_id , nameP]
          // pageC.push(nameP[0])
          pageC.push(newC);

          // console.log("pageC", pageC)

          // if (pageCData.length > 0) {
          //   const [nameP] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [pageCData[0].user_id]);
          //   pageC.push(nameP[0]); // Push only the first element
          //   console.log("Page Charge Data:", nameP[0]);
          // }
        }

        if (forms[i].kris_id != null) {
          console.log("3", forms[i]);
          const [krisData] = await db.query(
            "SELECT user_id FROM Research_KRIS WHERE kris_id = ?",
            [forms[i].kris_id]
          );
          const [nameK] = await db.query(
            "SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?",
            [krisData[0].user_id]
          );
          console.log("nameK", nameK);

          newK = [];
          newK.push(forms[i].kris_id, nameK[0]);
          console.log("32323", newK);
          kris.push(newK);

          // if (krisData.length > 0) {
          //   const [nameK] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [krisData[0].user_id]);
          //   kris.push(nameK[0]); // Push only the first element
          //   console.log("KRIS Data:", nameK[0]);
          // }
        }
      }
    }

    return res.send({
      forms: forms,
      confer: confer,
      pageC: pageC,
      kris: kris,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/form/:id", async (req, res) => {
  const { id } = req.params;

  console.log("id: ", id);

  try {
    console.log("ki ");

    const [form] = await db.query(
      `SELECT f.form_id, f.form_type, f.conf_id, f.pageC_id, f.kris_id, f.form_status, f.form_money
      ,COALESCE(k.user_id, c.user_id, p.user_id) AS user_id
      ,COALESCE(k.name_research_th, c.conf_research, p.article_title) AS article_title 
      ,COALESCE(c.conf_name, p.journal_name) AS article_name
      FROM form f
      LEFT JOIN research_kris k ON f.kris_id = k.kris_id
      LEFT JOIN conference c ON f.conf_id = c.conf_id
      LEFT JOIN page_charge p ON f.pageC_id = p.pageC_id
      WHERE COALESCE(k.user_id, c.user_id, p.user_id) = ?
      ORDER BY f.form_id DESC`, 
      [id]
    );

    if (form.length === 0) {
      return res.status(404).json({ message: "has not data" });
    }

    console.log("get, ", form);
    console.log("get, ", form[0]);

    res.status(200).json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/allForms", async (req, res) => {
  console.log("allForms");
  try {
    const [form] = await db.query("SELECT * FROM Form");
    res.status(200).json(form);
  } catch (err) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/form/confer/:id", async (req, res) => {
  //get conf_id
  const { id } = req.params;

  if (id == null || id == "") {
    res.status(500).json("ไม่มีแบบฟอร์มนี้");
  }

  try {
    const [form] = await db.query("SELECT * FROM Form WHERE conf_id = ?", [id]);
    const [conf] = await db.query("SELECT * FROM File_pdf WHERE conf_id = ?", [
      id,
    ]);

    res.status(200).json({
      form: form[0],
      conf: conf[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




exports.router = router;
