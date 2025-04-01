const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/budget', async (req, res) => {
  console.log("in post Budget")
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Budget (user_id, form_id, budget_year, Page_Charge_amount, Conference_amount, 
      num_expenses_approved, total_amount_approved, remaining_credit_limit, amount_approval, 
      total_remaining_credit_limit) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.user_id, data.form_id, data.budget_year, data.Page_Charge_amount || null, data.Conference_amount || null, data.num_expenses_approved,
      data.total_amount_approved, data.remaining_credit_limit, data.amount_approval, data.total_remaining_credit_limit]
    );
    const [updateForm] = await db.query(
      `UPDATE Form SET form_status = ? WHERE form_id = ?`,
      [data.form_status, data.form_id]
    );
    console.log("update: ", updateForm);
    const [formType]  = await db.query(
      `SELECT conf_id, pageC_id FROM Form WHERE form_id = ?`,
      [data.form_id]
    );
    if(formType[0].pageC_id){
      console.log('in if pc')
      const [pc]  = await db.query(
        `SELECT user_id FROM Page_Charge WHERE pageC_id = ?`,
        [formType[0].pageC_id]
      );
      const [user]  = await db.query(
        `SELECT user_moneyPC FROM Users WHERE user_id = ?`,
        [pc[0].user_id]
      );
      const moneyPC = parseFloat(user[0].user_moneyPC) + parseFloat(data.amount_approval)
      const [updateMoneyPC] = await db.query(
        `UPDATE Users SET user_moneyPC = ? WHERE user_id = ?`,
        [moneyPC, pc[0].user_id]
      );
      console.log("success ja", updateMoneyPC)
    }else if(formType[0].conf_id){
      console.log('in if confer')
      const [confer]  = await db.query(
        `SELECT user_id FROM Conference WHERE conf_id = ?`,
        [formType[0].conf_id]
      );
      const [user]  = await db.query(
        `SELECT user_moneyCF FROM Users WHERE user_id = ?`,
        [confer[0].user_id]
      );
      const moneyConfer = parseFloat(user[0].user_moneyCF) - parseFloat(data.amount_approval)
      const [updateMoneyConfer] = await db.query(
        `UPDATE Users SET user_moneyCF = ? WHERE user_id = ?`,
        [moneyConfer, confer[0].user_id]
      );
      console.log("success ja", updateMoneyConfer)
    }
    console.log(data)
    res.status(201).json({ message: "Budget created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});

router.get("/budgetsPC", async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT 
      COUNT(b.budget_id) AS total_budgets,
      COUNT(CASE 
        WHEN f.form_type = '%Page_Charge%' 
        THEN 1 
    END) AS numapproved,

      SUM(CASE 
        WHEN f.form_type = '%Page_Charge%' 
        AND f.form_status IN ('รองคณบดี', 'คณบดี', 'รออนุมัติ', 'อนุมัติ')
        THEN b.amount_approval
    END) AS totalapproved
      FROM Budget b
      JOIN Form f ON f.form_id = b.form_id
      `
    );
    console.log("budgets PC", budgets)
    res.status(200).json(budgets[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budgetsConfer", async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT 
    COUNT(b.budget_id) AS total_budgets, 
    COUNT(CASE WHEN f.form_type = 'Conference' THEN 1 END) AS numapproved,
    SUM(CASE WHEN f.form_type = 'Conference' 
             AND f.form_status IN ('รองคณบดี', 'คณบดี', 'รออนุมัติ', 'อนุมัติ') 
             THEN b.amount_approval 
        END) AS totalapproved
    FROM budget b
    JOIN form f ON b.form_id = f.form_id;
      `
    );
    console.log("budgets CONFER", budgets)
    res.status(200).json(budgets[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/pageCharge/:id", async (req, res) => {
  const { id } = req.params;
  console.log("budget/pageCharge/id", id)
  try {
    const [find_id] = await db.query(
      "SELECT form_id FROM Form WHERE pageC_id = ?",
      [id]
    );
    console.log("Get find_id budget pc: ", find_id[0]);
    const [pageC] = await db.query(
      "SELECT * FROM Budget WHERE form_id = ?",
      [find_id[0].form_id]
    );
    console.log("Query result:", pageC);

    if (pageC.length === 0) {
      return res.status(404).json({ message: "pageC_id not found" });
    }
    res.status(200).json(pageC[0]);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/conference/:id", async (req, res) => {
  const { id } = req.params;
  console.log("budget/conference/id", id)
  try {
    const [find_id] = await db.query(
      "SELECT form_id FROM Form WHERE conf_id = ?",
      [id]
    );
    console.log("Get find_id budget: ", find_id[0]);
    const [conf] = await db.query(
      "SELECT * FROM Budget WHERE form_id = ?",
      [find_id[0].form_id]
    );
    console.log("Get conf budget: ", conf[0]);
    if (conf.length === 0) {
      return res.status(404).json({ message: "conf_id not found" });
    }
    console.log("Get conf kub: ", conf[0]);
    res.status(200).json(conf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;