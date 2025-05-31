const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.post("/ConditionPC", async (req, res) => {
    const condition = req.body;

    try {
        const result = await db.query(
            `INSERT INTO ConditionPC (
            natureAmount, mdpiQuartile1, mdpiQuartile2, otherQuartile1, otherQuartile2, otherQuartile3, otherQuartile4)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                condition.natureAmount || null,
                condition.mdpiQuartile1 || null,
                condition.mdpiQuartile2 || null,
                condition.otherQuartile1 || null,
                condition.otherQuartile2 || null,
                condition.otherQuartile3 || null,
                condition.otherQuartile4 || null
            ]
        );

        console.log("ConditionPC result:", result);
        res.status(200).json({ message: "Data inserted successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Error inserting data", error: error.message });
    }
});

exports.router = router;