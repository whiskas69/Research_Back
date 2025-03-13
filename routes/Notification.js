const express = require("express");
const db = require("../config.js");

router = express.Router();

router.get("/notiAll", async (req, res) => {
    console.log("in post forms");
    try {
        const [notis] = await db.query(
            "SELECT * FROM Notification"
        ) 
        console.log("get, ", notis[0]);
        res.status(200).json(notis);
    }catch (err) {
        res.status(500).json({ error: err.message });
      }
})

exports.router = router; 