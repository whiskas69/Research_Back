const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_notification", async (req, res) => {
    try {
        const [Notification] = await db.query("SELECT * FROM Notification");
        res.status(200).json(Notification);
    } catch (error) {
        res.status(500).json({ error : error.message });
    }
})

router.get("/notification/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const [mynotification] = await db.query(`
            SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.date_update, f.form_type, f.form_status, u.user_nameth
            FROM notification n
            LEFT JOIN form f ON n.form_id = f.form_id
            LEFT JOIN users u ON n.user_id = u.user_id
            WHERE n.user_id = ?
            ORDER BY n.date_update DESC;`, [id]);

        console.log('mynotification ', mynotification);
        res.status(200).json(mynotification);
    } catch (error) {
        res.status(500).json({ error : error.message });
    }
})

exports.router = router;