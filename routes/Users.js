const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { DateTime } = require("luxon");

const db = require("../config.js");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, DateTime.now() + path.extname(file.originalname));
  },
});

const fileFilter = function (req, file, cb) {
  if (file.mimetype == "image/png") {
    cb(null, true);
  } else {
    req.errorMessage = "นามสกุลของไฟล์ไม่ใช่ png";
    cb(null, false);
  }
};

const upload = multer({ storage, fileFilter });

router.put("/uploadSignature", upload.single("user_signature"), async (req, res) => {
  if (req.errorMessage) {
    return res.status(422).json({ message: req.errorMessage });
  }

  const { user_id } = req.body;
  const signatureFile = req.file;

  const check = await db.query(
    "SELECT user_signature FROM Users WHERE user_id = ?",
    [user_id]
  );

  console.log("check,", check[0]);

  if (check[0].user_signature == "" || check[0].user_signature == null) {
    try {
      await db.query("UPDATE Users SET user_signature = ? WHERE user_id = ?", [signatureFile.filename, user_id]);

      return res.status(200).json({ message: "Upload Success" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(400).json({ message: "has signature" });
  }
}
);

router.get("/mySignature", async (req, res) => {
  const { user_id } = req.query;

  console.log(user_id)

  const signature = await db.query(
    "SELECT user_signature FROM Users WHERE user_id = ?", [user_id]
  );

  console.log(signature)

  console.log("i", signature[0]?.[0]?.user_signature);

  const fileUrl = `http://localhost:3002/uploads/${signature[0][0].user_signature}`

  res.json({ message: 'Get File successfully', fileUrl });
});

router.post("/user", async (req, res) => {
  console.log("in post user");
  const data = req.body;
  console.log("data",data)
  try {
    const [result] = await db.query(
      `INSERT INTO Users (
      user_role, user_nameth, user_nameeng, user_email, user_moneyCF, user_positionth, 
      user_positioneng, user_startwork, user_year,user_confer
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_role,
        data.user_nameth,
        data.user_nameeng,
        data.user_email,
        data.user_moneyCF || null,
        data.user_positionth || null,
        data.user_positioneng || null,
        data.user_startwork,
        data.user_year,
        0,
      ]
    );
    console.log(result);
    res
      .status(201)
      .json({ message: "user created successfully!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log(err.message);
  }
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await db.query("SELECT * FROM Users");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [user] = await db.query("SELECT * FROM Users WHERE user_id = ?", [
      id,
    ]);
    if (user.length === 0) {
      return res.status(404).json({ message: "userID not found" });
    }
    console.log("Get UserId: ", user[0]);
    res.status(200).json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//ขอแก้ทีหลัง
router.put("/updateRoles", async (req, res) => {
  const { userUpdates } = req.body;

  console.log("Received userUpdates:", userUpdates);

  if (!Array.isArray(userUpdates) || userUpdates.length === 0) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    const queries = userUpdates.map(({ id, value }) => {
      const isMoney = !isNaN(value) && String(value).trim() !== "";
      const field = isMoney ? "user_moneyCF" : "user_role";

      console.log(`📝 Processing update for user_id: ${id} -> ${field}: ${value}`);

      return new Promise((resolve, reject) => {
        db.query(
          `UPDATE Users SET ${field} = ? WHERE user_id = ?`,
          [value, id],
          (err, result) => {
            if (err) {
              console.error(`❌ DB Update Error for user_id ${id}:`, err);
              reject(err);
            } else if (result.affectedRows === 0) {
              console.warn(`⚠️ No rows updated for user_id ${id}`);
              resolve(result); // หรือ reject ขึ้นอยู่กับความต้องการ
            } else {
              console.log(`✅ Updated ${field} for user_id ${id}`);
              resolve(result);
            }
          }
        );
      });
    });

    console.log("addtodatabsela:");
    console.log("✅ All updates successful, sending response...");
    res.status(200).json({ success: true, message: "User data updated successfully" });
    // const results = await Promise.allSettled(queries);
    // console.log("results:", results); // ตรวจสอบว่าสามารถแสดงผลได้

    // const errors = results.filter(result => result.status === 'rejected');

    // if (errors.length > 0) {
    //   console.error("❌ Some updates failed:", errors);
    //   return res.status(500).json({ error: "Some updates failed", details: errors });
    // }

  } catch (err) {
    console.error("❌ Error updating roles:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/userSignat/:id", (req, res) => {
  console.log("delete userSignat")
  const id = req.params.id;
  db.query("UPDATE Users SET user_signature = null WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(200).json({ message: "Record deleted successfully!" });
  });
  res.status(200).json({ success: true, message: "User data updated successfully" });
});

router.delete("/user/:id", (req, res) => {
  console.log("delete")
  const id = req.params.id;
  db.query("DELETE FROM Users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(200).json({ message: "Record deleted successfully!" });
  });
  res.status(200).json({ success: true, message: "User data updated successfully" });
});

exports.router = router;
