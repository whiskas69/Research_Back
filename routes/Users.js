const express = require("express");
const multer = require("multer");
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
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

router = express.Router();

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
        const data = await db.query(
          "UPDATE Users SET user_signature = ? WHERE user_id = ?",
          [signatureFile.filename, user_id]
        );

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

  const fileUrl = `http://localhost:3000/uploads/${signature[0][0].user_signature}`

  res.json({ message: 'Get File successfully', fileUrl });
});

router.post("/user", async (req, res) => {
  const data = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO Users (user_role, user_nameth, user_nameeng, user_email, user_signature, user_money, user_position) VALUES (?, ?, ?, ?, ?, ?,?)",
      [
        data.user_role,
        data.user_nameth || null,
        data.user_nameeng || null,
        data.user_email,
        data.user_signature || null,
        data.user_money || null,
        data.user_position,
      ]
    );
    console.log(data);
    res
      .status(201)
      .json({ message: "User created successfully!", id: result.insertId });
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

router.delete("/user/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM Users WHERE user_id = ?", [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(200).json({ message: "Record deleted successfully!" });
  });
});

exports.router = router;
