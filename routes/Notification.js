const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_notification", async (req, res) => {
  try {
    const [Notification] = await db.query("SELECT * FROM Notification");
    res.status(200).json(Notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/notification/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [mynotification] = await db.query(
      `
        SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.is_read, n.date_update, f.form_type, f.form_status, u.user_nameth
        FROM notification n
        LEFT JOIN form f ON n.form_id = f.form_id
        LEFT JOIN users u ON n.user_id = u.user_id
        WHERE n.user_id = ?
        ORDER BY n.date_update DESC;`,
      [id]
    );

    console.log("mynotification ", mynotification);
    res.status(200).json(mynotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/status_notification/:status", async (req, res) => {
  const { status } = req.params; //ฝ่ายบริหารงานวิจัย, ฝ่ายวิจัย, ฝ่ายวิชาการ, ฝ่ายบริหาร

  try {
    const [mynotification] = await db.query(
      `
        SELECT n.noti_id, n.user_id, n.form_id, n.name_form, n.is_read, n.date_update, f.form_type, f.form_status, u.user_nameth
        FROM notification n
        LEFT JOIN form f ON n.form_id = f.form_id
        LEFT JOIN users u ON n.user_id = u.user_id
        WHERE f.form_status = ?
        ORDER BY n.date_update DESC;`,
      [status]
    );

    console.log("mynotification ", mynotification);
    res.status(200).json(mynotification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update is_read by id
router.put("/update_is_read/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [update_is_read] = await db.query(
      "UPDATE Notification SET is_read = true WHERE user_id = ?",
      [id]
    );

    console.log("update_is_read", update_is_read);
    res.status(200).json(update_is_read);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

exports.router = router;
