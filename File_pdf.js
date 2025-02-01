const express = require("express");
const multer = require('multer');
const db = require("../config.js");
const fs = require("fs");
const path = require("path");

router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads' //สร้างโฟเดอร์ 'uploads'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    cb(null, dir)
  },
  filename: function (req, file, cd) {
    cd(null, Date.now() + path.extname(file.originalname))
  }
})

const fileFilter = function (req, file, cd) {
  if (file.mimetype == 'image/png' || file.mimetype == 'image/jpeg') {
    cd(null, true)
  } else {
    req.errorMessage = 'File is not a valid image!'
    cd(null, false)
  }
}

const upload = multer({ storage, fileFilter })

router.post('/pdf', upload.single('img'), (req, res) => {
  console.log('wineeee')
  console.log(req.file)
  if (req.errorMessage) {
    return res.status(422).json({ message: req.errorMessage })
  }
  return res.status(200).json({ message: 'img uploaded successfully' })

});

const uploadDocument1s = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype == 'application/pdf') {
      cb(null, true)
    } else {
      !req.invalidFiles ? req.invalidFiles = [file.originalname] : req.invalidFiles.push(file.originalname)
      cb(null, false)
    }
  }
})

router.post('/pdf-multi', uploadDocument1s.array('documents'), (req, res) => {
  console.log('whiskas')
  console.log(req.files)

  if (req.invalidFiles) {
    return res.status(200).json({
      warning: true,
      message: 'Some doc did not uploaded duw to wrong type: ' + req.invalidFiles.join(', ')
    })
  }

  return res.status(200).json({
    warning: false,
    message: 'Docs uploaded successfully'
  })

});

const uploadDocuments = multer({
  storage,
  fileFilter: function (req, file, cb) {
    let acceptFile = true
    console.log('file: ', file)
    if (file.fieldname == 'kris_file' && file.fieldname == 'full_page' && file.fieldname == 'ac_for_claim' && file.fieldname == 'q_proof' &&
      file.fieldname == 'call_for_paper' && file.fieldname == 'fee_receipt' && file.fieldname == 'fx_rate_document' && file.fieldname == 'conf_proof' &&
      file.fieldname == 'Pc_proof' && file.fieldname == 'q_pc_proof' && file.fieldname == 'Invoice' && file.fieldname == 'accepted') {
      if (file.mimetype == 'application/pdf') {
        acceptFile = true
      }
    } 
    //ติดเงื่อนไขที่ ถ้าไม่ใช่ pdf จะไม่สามารถแอดได้
    else if (!acceptFile){
      const message = `Field ${file.fieldname} wrong type (${file.mimetype})`
      !req.invalidFiles ? req.invalidFiles = [message] : req.invalidFiles.push(message)
    }

    cb(null, acceptFile)
  }
})

const fields = [
  { name: 'kris_file' },
  { name: 'full_page' },
  { name: 'ac_for_claim' },
  { name: 'q_proof' },
  { name: 'call_for_paper' },
  { name: 'fee_receipt' },
  { name: 'fx_rate_document' },
  { name: 'conf_proof' },
  { name: 'Pc_proof' },
  { name: 'q_pc_proof' },
  { name: 'Invoice' },
  { name: 'accepted' }, 
]

router.post('/fields-multi', uploadDocuments.fields(fields), async (req, res) => {
  console.log('whiskas')
  console.log('file123: ', req.files)
  console.log('body123: ', req.body)

  const data = req.body;
  const files = req.files;
  if (!files) {
    return res.status(400).json({ message: "Please upload a file" });
  }
  
  try {
      const [result] = await db.query(
        "INSERT INTO File_pdf SET ?",
        [data.type, data.conf_id || null, data.pageC_id || null, data.kris_id || null, 
          files.kris_file || null, files.full_page || null, files.ac_for_claim || null, files.q_proof || null,
          files.call_for_paper || null, files.fee_receipt || null, files.fx_rate_document || null, files.conf_proof || null,
          files.Pc_proof || null, files.q_pc_proof || null, files.Invoice || null, files.accepted || null,
        ]

      );
      console.log('data: ',data)
      res.status(201).json({ message: "Score created successfully!", id: result.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
      console.log(err.message);
  }

  // const { type, conf_id, pageC_id, kris_id } = req.body;
  // const files = req.files;

  if (req.invalidFiles) {
    return res.status(200).json({
      warning: true,
      message: 'Some doc did not uploaded duw to wrong type: ' + req.invalidFiles.join(', ')
    })
  }

  return res.status(200).json({
    warning: false,
    message: 'Docs uploaded successfully'
  })

});

// router.post('/pdf', async (req, res) => {
//     console.log("in post File_pdf")
//     const data = req.body;
//     try {
//         const [result] = await db.query(
//           "INSERT INTO File_pdf () VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
//           []
//         );
//         console.log(data)
//         res.status(201).json({ message: "Score created successfully!", id: result.insertId });
//       } catch (err) {
//         res.status(500).json({ error: err.message });
//         console.log(err.message);
//     }
// });


router.get("/allpdf", async (req, res) => {
  try {
    const [allpdf] = await db.query("SELECT * FROM File_pdf");
    res.status(200).json(allpdf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


exports.router = router;