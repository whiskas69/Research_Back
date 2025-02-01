const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/form', async (req, res) => {
    console.log("in post formss")
    const data = req.body;
    try {
        const [result] = await db.query(
          "INSERT INTO Form (form_type, conf_id, pageC_id, kris_id, form_status, form_money) VALUES (?, ?, ?, ?, ?, ?)",
          [data.form_type, data.conf_id || null, data.pageC_id || null, data.kris_id || null, data.form_status, data.form_money]
        );
        console.log(data)
        res.status(201).json({ message: "Form created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/formsOffice", async (req, res) => {
  try {
    const [forms] = await db.query("SELECT * FROM Form WHERE form_status = 'ตรวจสอบ'");
    console.log(forms);

    let confer = [];
    let pageC = [];
    let kris = [];

    if (forms.length > 0) {
      for (let i = 0; i < forms.length; i++) {
        if (forms[i].conf_id != null) {
          console.log("1", forms[i]);
          const [conferData] = await db.query("SELECT user_id FROM Conference WHERE conf_id = ?", [forms[i].conf_id]);

          if (conferData.length > 0) {
            const [nameC] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [conferData[0].user_id]);
            confer.push(nameC[0]); // Push only the first element of the result
            console.log("Confer Data:", nameC[0]);
          }
        }

        if (forms[i].pageC_id != null) {
          console.log("form", forms[i])
          console.log("Page 2", forms[i]);
          const [pageCData] = await db.query("SELECT user_id FROM Page_Charge WHERE pageC_id = ?", [forms[i].pageC_id]);
          const [nameP] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [pageCData[0].user_id]);
          console.log("nameP", nameP)

          // forms.push(nameP[0])
          // console.log("forms", forms)

          newC = []
          newC.push(forms[i].pageC_id, nameP[0])
          console.log("newD", newC)
          //[PC_id , nameP]
          // pageC.push(nameP[0])
          pageC.push(newC)

          // console.log("pageC", pageC)

          // if (pageCData.length > 0) {
          //   const [nameP] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [pageCData[0].user_id]);
          //   pageC.push(nameP[0]); // Push only the first element
          //   console.log("Page Charge Data:", nameP[0]);
          // }
        }

        if (forms[i].kris_id != null) {
          console.log("3", forms[i]);
          const [krisData] = await db.query("SELECT user_id FROM Research_KRIS WHERE kris_id = ?", [forms[i].kris_id]);
          const [nameK] = await db.query("SELECT user_id, user_nameth, user_nameeng FROM Users WHERE user_id = ?", [krisData[0].user_id]);
          console.log("nameK", nameK)

          newK = []
          newK.push(forms[i].kris_id, nameK[0])
          console.log("32323", newK)
          kris.push(newK)


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
      kris: kris
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.router = router;