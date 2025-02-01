const express = require("express");
const multer = require('multer');
const db = require("../config.js");
const fs = require("fs");
const path = require("path");
const upload = multer({ dest: "uploads/" });

router = express.Router();


// data
//เพิ่มชื่อผู้ใช้ ไทย กะ อิ้ง
router.put('/profileupdate', async (req, res) => {
  const data = req.body;

  console.log("data : ", data);
  try {
    const [update] = await db.query("UPDATE users SET user_nameth = ?, user_nameeng = ?, user_position = ? WHERE user_id = ?",
      [data.user_nameth, data.user_nameeng, data.user_position, data.user_id]
    );
  
    console.log("update : ", update);
  
    res.status(200).json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
});

router.put('/signatureupdate', upload.single("user_signature"), async (req, res) => {
  const data = req.body;
  console.log(req.file)
  console.log("data : ", data);
  try {
    
    const { user_id } = req.body;
    const signatureFile = req.file; // This is the uploaded file

    console.log("Received User ID:", user_id);
    console.log("Received File:", signatureFile);
    console.log("Received File:", signatureFile.filename);
    
    await db.query("UPDATE Users SET user_signature = ? WHERE user_id = ?", [
      signatureFile.filename,
      user_id,
    ]);
    // const files = req.files;
    // const data = {
    //   user_signature: files?.user_signature?.[0]?.filename
    // }
    // const update = await db.query("UPDATE users SET user_signature = ? WHERE user_id = ?", 
    //   data.user_signature, data.user_id
    // );
  
    console.log("update : ", update);
  
    res.status(200).json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
});
router.post('/user', async (req, res) => {
  console.log("in post user")
  const data = req.body;
  try {
    const [result] = await db.query(
      "INSERT INTO Users (user_role, user_nameth, user_nameeng, user_email, user_signature, user_money, user_position) VALUES (?, ?, ?, ?, ?, ?,?)",
      [data.user_role, data.user_nameth || null, data.user_nameeng || null, data.user_email,
      data.user_signature || null, data.user_money || null, data.user_position]
    );
    console.log(data)
    res.status(201).json({ message: "User created successfully!", id: result.insertId });
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
    const [user] = await db.query('SELECT * FROM Users WHERE user_id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'userID not found' });
    }
    console.log('Get UserId: ' ,user[0])
    res.status(200).json(user[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/user/:id', (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM Users WHERE user_id = ?', [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.status(200).json({ message: 'Record deleted successfully!' });
  });
});

exports.router = router;