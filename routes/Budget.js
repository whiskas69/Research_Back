const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/budget', async (req, res) => {
  console.log("in post Budget")
  const data = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Budget (form_id, budget_year, total_amount, num_expenses_approved, total_amount_approved, remaining_credit_limit, amount_approval, total_remaining_credit_limit) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.form_id, data.budget_year, data.total_amount, data.num_expenses_approved,
      data.total_amount_approved, data.remaining_credit_limit, data.amount_approval, data.total_remaining_credit_limit]
    );
    const [updateForm] = await db.query(
      `UPDATE Form SET form_status = ? WHERE form_id = ?`,
      [data.form_status, data.form_id]
    );
    console.log("update: ", updateForm);
    console.log(data)
    res.status(201).json({ message: "Budget created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});

router.get("/sumConfer/budgetsYear", async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT * FROM Budget`);
    console.log("budgets", budgets)

    res.status(200).json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/budget/pageCharge/:id", async (req, res) => {
  console.log("Fetching pageCharge data...");
  const { id } = req.params;
  try {
    const [pageC] = await db.query(
      `SELECT b.*, COALESCE(f.form_money, 0) AS form_money FROM Budget AS b LEFT JOIN Form AS f ON b.pageC_id = f.pageC_id WHERE b.pageC_id = ?`,
      [id]
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
  try {
    const [conf] = await db.query(
      "SELECT * FROM Budget WHERE conf_id = ?",
      [id]
    );
    if (conf.length === 0) {
      return res.status(404).json({ message: "conf_id not found" });
    }
    console.log("Get conf: ", conf[0]);
    res.status(200).json(conf[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;