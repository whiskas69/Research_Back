const express = require("express");
const db = require("../config.js");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const authenticate = require("../middleware/authenticate.js");

router = express.Router();

//check ว่าชื่อให้มาเป็นภาษาอังกฤษ หรือไทย
function detectLanguage(text) {
  let isThai = false;
  let isEnglish = false;

  for (let char of text) {
    const code = char.charCodeAt(0);

    if (code >= 0x0e00 && code <= 0x0e7f) {
      isThai = true;
    } else if (
      (code >= 0x0041 && code <= 0x005a) || // ตัวพิมพ์ใหญ่
      (code >= 0x0061 && code <= 0x007a) // ตัวพิมพ์เล็ก
    ) {
      isEnglish = true;
    }
  }

  if (isThai) {
    return "Thai";
  } else if (isEnglish) {
    return "Eng";
  }
}

router.post("/auth", async (req, res) => {
  try {
    // get the code from fronted
    const code = req.headers.authorization;

    console.log("Auth", code);

    if (!code)
      return res.status(400).json({ message: "Missing authorization code" });
    // console.log("Authorization Code:", code);

    //Exchange the authorization code for an access token
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: "postmessage",
      grant_type: "authorization_code",
    });

    const accessToken = response.data.access_token;
    // console.log("Access Token:", accessToken);

    //Fetch user details using the access token
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const userDetails = userResponse.data;
    console.log("User Details :", userDetails);

    //ตรวจสอบในฐานข้อมูลว่ามีผู้ใช้อยู่หรือไม่
    let [rows] = await db.query("SELECT * FROM users WHERE user_email = ?", [
      userDetails.email,
    ]);

    //เช็คแล้วไม่มี user นี้ในฐานข้อมูลให้เพิ่มเข้าฐานข้อมูล
    if (rows.length === 0) {
      const id = Math.floor(1000 + Math.random() * 9000);

      //check name for save in database
      if (detectLanguage(userDetails.given_name) === "Thai") {
        console.log("thai");
        const [result] = await db.query(
          "INSERT INTO users (user_id, user_role, user_nameth, user_nameeng, user_email, user_signature, user_money, user_position)VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            "professor",
            userDetails.name,
            "",
            userDetails.email,
            "",
            20000,
            "",
          ]
        );

        rows = [
          {
            user_id: id,
            user_email: userDetails.email,
            user_role: "professor",
            user_name: userDetails.name,
          },
        ];
      } else if (detectLanguage(userDetails.given_name) === "Eng") {
        console.log("eng");
        const [result] = await db.query(
          "INSERT INTO users (user_id, user_role, user_nameth, user_nameeng, user_email, user_signature, user_money, user_position)VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            "professor",
            "",
            userDetails.name,
            userDetails.email,
            "",
            20000,
            "",
          ]
        );

        rows = [
          {
            user_id: id,
            user_email: userDetails.email,
            user_role: "professor",
          },
        ];
      }
    }

    const user = rows[0];

    //create JWT Token
    const token = jwt.sign(
      { userId: user.user_id, email: user.user_email, role: user.user_role },
      process.env.SECRET_KEY,
      { expiresIn: "1h" } //อายุของ Token
    );

    //setting Secure Cookie (httpOnly Protect attack XSS)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // ต้องเป็น true ถ้าใช้ HTTPS
      sameSite: "Lax",
      maxAge: 3600000, // 1 hour
    });

    //Process user details and perform necessary actions
    res.status(200).json({ message: "Authentication successful", userDetails });
  } catch (error) {
    console.log("Error saving code:", error);
    res.status(500).json({ message: "Failed to save code" });
  }
});

//check status login
router.get("/me", authenticate, async (req, res) => {
  console.log("Cookie received: ", req.cookie);

  if (!req.user) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      req.user.userId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user data" });
  }
});

//clear Cookie
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged out successfully" });
  console.log("Logout success");
});

exports.router = router;
