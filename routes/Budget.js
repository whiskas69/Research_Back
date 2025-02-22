const express = require("express");
const db = require("../config.js");

router = express.Router();

router.post('/budget', async (req, res) => {
    console.log("in post Budget")
    const data = req.body;
    try {
        const [result] = await db.query(
          "INSERT INTO Budget (type, conf_id, pageC_id, budget_year, total_amount, num_expenses_approved, total_amount_approved, remaining_credit_limit, money_confer, total_remaining_credit_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [data.type, data.conf_id || null, data.pageC_id || null, data.budget_year, data.total_amount, data.num_expenses_approved, 
            data.total_amount_approved, data.remaining_credit_limit, data.money_confer, data.total_remaining_credit_limit]
        );
        const [updateForm] = await db.query(
          `UPDATE Form SET form_type = ?, pageC_id = ?, form_status = ? WHERE pageC_id = ?`,
          [data.type, data.pageC_id, data.form_status, data.pageC_id]
        );
        console.log("update: ", updateForm);
        console.log(data)
        res.status(201).json({ message: "Budget created successfully!", id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/budgets", async (req, res) => {
    try {
      const [budgets] = await db.query("SELECT * FROM Budget");
      res.status(200).json(budgets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});


exports.router = router;