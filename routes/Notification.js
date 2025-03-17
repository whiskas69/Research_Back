const express = require("express");
const db = require("../config.js");

router = express.Router();

router.get("/notiAll", async (req, res) => {
    console.log("in post notiAll");
    try {
        let data = [];
        const [notis] = await db.query(
            "SELECT * FROM Notification"
        )
        if (notis.length > 0) {
            for (let i = 0; i < notis.length; i++) {
                const [userName] = await db.query(
                    "SELECT user_id, user_nameth FROM Users WHERE user_id = ?",
                    [notis[i].user_id]
                )
                if (userName.length > 0) {
                    data.push({
                        ...notis[i],
                        user_nameth: userName[0].user_nameth,
                    });
                }
            }
        }
        console.log("Final data:", data);
        return res.status(200).json({ data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

exports.router = router; 