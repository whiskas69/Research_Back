const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/getConditionPC", async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT * FROM ConditionPC
            ORDER BY condition_id DESC
            LIMIT 1;`);
        console.log("ConditionPC result:", result);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching ConditionPC:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }   
}
);

router.get("/getConditionCF", async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT * FROM ConditionCF
            ORDER BY condition_id DESC
            LIMIT 1;`);
        console.log("ConditionCF result:", result);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching ConditionCF:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }   
});

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

router.post("/ConditionCF", async (req, res) => {
    const condition = req.body;

    try {
        const result = await db.query(
            `INSERT INTO ConditionPC (
            maxLeave, workTimeYears, journalYears, qualityScoreSJR, qualityScoreCIF, qualityScoreCORE, expense100ASEAN
            ,expense100Asia, expense100EuropeAmericaAustraliaAfrica, expense50ASEAN, expense50Asia, expense50EuropeAmericaAustraliaAfrica)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                condition.maxLeave || null,
                condition.workTimeYears || null,
                condition.journalYears || null,
                condition.qualityScoreSJR || null,
                condition.qualityScoreCIF || null,
                condition.qualityScoreCORE || null,
                condition.expense100ASEAN || null,
                condition.expense100Asia || null,
                condition.expense100EuropeAmericaAustraliaAfrica || null,
                condition.expense50ASEAN || null,
                condition.expense50Asia || null,
                condition.expense50EuropeAmericaAustraliaAfrica || null
            ]
        );

        console.log("ConditionPC result:", result);
        res.status(200).json({ message: "Data inserted successfully", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: "Error inserting data", error: error.message });
    }
});


exports.router = router;