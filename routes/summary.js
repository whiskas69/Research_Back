const express = require("express");
const db = require("../config.js");

const router = express.Router();

router.get("/all_summary_conference", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
    u.user_nameth,
    c.conf_research,
    c.conf_name,
    c.name_co_researchers,
    c.location,
    c.meeting_type,
    c.quality_meeting,
    c.time_of_leave,
    c.trav_dateStart,
    c.trav_dateEnd,
    f.form_status,
    b.withdraw,
    COALESCE(c.total_amount, 0) AS total_amount,
    COALESCE(c.inter_expenses, 0) AS inter_expenses,
    COALESCE(c.total_room, 0) AS total_room,
    COALESCE(c.total_allowance, 0) AS total_allowance,
    COALESCE(c.domestic_expenses, 0) + COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) AS total_other, 
    COALESCE(c.all_money, 0) AS all_money,
    COALESCE(b.amount_approval, 0) AS amount_approval
    FROM Conference c
    JOIN Users u ON c.user_id = u.user_id
    LEFT JOIN Form f ON c.conf_id = f.conf_id
    LEFT JOIN Budget b ON f.form_id = b.form_id
    WHERE f.form_status = "approve"
    AND b.budget_year = YEAR(CURDATE()) + 543;`
    );
console.log("Summary confer", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all_summary_page_charge", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
    p.pageC_id,
    u.user_nameth,
    p.name_co_researchers,
    p.article_title,
    p.journal_name,
    p.quality_journal,
    p.qt_isi,
    p.qt_sjr,
    p.qt_scopus,
    p.month,
    p.year,
    p.date_review_announce,
    f.form_status,
    b.withdraw,
    b.budget_year
FROM Page_Charge p
JOIN Users u ON p.user_id = u.user_id
LEFT JOIN Form f ON p.pageC_id = f.pageC_id
LEFT JOIN Budget b ON f.form_id = b.form_id
WHERE f.form_status = "approve";
`
    );

    const [count] = await db.query(
      `SELECT b.budget_year,
      COUNT(CASE
        WHEN p.quality_journal LIKE '%Nature%' THEN 1 
        END) AS count_nature,
      SUM(CASE 
        WHEN p.quality_journal LIKE '%Nature%' THEN b.amount_approval 
        ELSE 0 
        END) AS money_nature,

      COUNT(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 1 OR p.qt_sjr = 1 OR p.qt_scopus = 1) THEN 1 
        END) AS count_qt_1,
      SUM(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 1 OR p.qt_sjr = 1 OR p.qt_scopus = 1) THEN b.amount_approval 
        ELSE 0 
        END) AS money_qt_1,

      COUNT(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 2 OR p.qt_sjr = 2 OR p.qt_scopus = 2) 
        AND NOT (p.qt_isi = 1 OR p.qt_sjr = 1 OR p.qt_scopus = 1) THEN 1 
        END) AS count_qt_2,
      SUM(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 2 OR p.qt_sjr = 2 OR p.qt_scopus = 2) 
        AND NOT (p.qt_isi = 1 OR p.qt_sjr = 1 OR p.qt_scopus = 1) THEN b.amount_approval 
        ELSE 0 
        END) AS money_qt_2,

      COUNT(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 3 OR p.qt_sjr = 3 OR p.qt_scopus = 3) 
        AND NOT (p.qt_isi IN (1,2) OR p.qt_sjr IN (1,2) OR p.qt_scopus IN (1,2)) THEN 1 
        END) AS count_qt_3,
      SUM(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 3 OR p.qt_sjr = 3 OR p.qt_scopus = 3) 
        AND NOT (p.qt_isi IN (1,2) OR p.qt_sjr IN (1,2) OR p.qt_scopus IN (1,2)) THEN b.amount_approval 
        ELSE 0 
        END) AS money_qt_3,

      COUNT(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 4 OR p.qt_sjr = 4 OR p.qt_scopus = 4) 
        AND NOT (p.qt_isi IN (1,2,3) OR p.qt_sjr IN (1,2,3) OR p.qt_scopus IN (1,2,3)) THEN 1 
        END) AS count_qt_4,
      SUM(CASE 
        WHEN p.quality_journal NOT LIKE '%Nature%' 
        AND (p.qt_isi = 4 OR p.qt_sjr = 4 OR p.qt_scopus = 4) 
        AND NOT (p.qt_isi IN (1,2,3) OR p.qt_sjr IN (1,2,3) OR p.qt_scopus IN (1,2,3)) THEN b.amount_approval 
        ELSE 0 
        END) AS money_qt_4
    
      FROM Page_Charge p
      JOIN Form f ON p.pageC_id = f.pageC_id
      JOIN Budget b ON f.form_id = b.form_id
      WHERE f.form_status = 'approve'
      GROUP BY b.budget_year
      ORDER BY b.budget_year DESC;`
    );
    console.log("count", count);
    console.log("Summary pc", Summary);
    res.status(200).json([Summary, count]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all_summary_kris", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
        k.kris_id,
        u.user_nameth,
        k.name_research_th,
        k.research_cluster,
        k.res_cluster_other,
        k.res_standard,
        k.res_standard_trade,
        k.year,
        k.project_periodStart,
        k.project_periodEnd,
        f.form_status
        FROM Research_KRIS k
        JOIN Users u ON k.user_id = u.user_id
        LEFT JOIN Form f ON k.kris_id = f.kris_id
        WHERE f.form_status = "approve";`
    );
    console.log("Summary krid", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/remainingConference", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
      b.budget_id,
      f.form_id,
      b.Conference_amount,
      b.total_remaining_credit_limit,
      f.form_type
      FROM Budget b
      JOIN Form f ON b.form_id = f.form_id
      WHERE f.form_status = "approve"
      AND f.form_type = "Conference"
      ORDER BY b.budget_id DESC
      LIMIT 1;`
    );
    console.log("remainingConference", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/remainingPc", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
      b.budget_id,
      f.form_id,
      b.Page_Charge_amount,
      b.total_remaining_credit_limit,
      f.form_type
      FROM Budget b
      JOIN Form f ON b.form_id = f.form_id
      WHERE f.form_status = "approve"
      AND f.form_type = "Page_Charge"
      ORDER BY b.budget_id DESC
      LIMIT 1;`
    );
    console.log("remainingPc", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT form_type, COUNT(*) AS total_count
      FROM Form
      WHERE form_status = 'approve'
      AND form_type IN ('Conference', 'Page_Charge', 'Research_KRIS')
      GROUP BY form_type;`
    );
    console.log("count", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_withdraw", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT
      c.withdraw,
      COUNT(c.conf_id) AS total_withdraws,
      SUM(COALESCE(c.total_amount, 0)) AS total_registration,
      SUM(
        COALESCE(c.domestic_expenses, 0) +
        COALESCE(c.overseas_expenses, 0) +
        COALESCE(c.airplane_tax, 0)
      ) AS total_other,
      SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,  -- Fixed here
      SUM(COALESCE(c.total_room, 0)) AS total_room,
      SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
      SUM(
        COALESCE(c.total_amount, 0) +
        COALESCE(c.domestic_expenses, 0) +
        COALESCE(c.overseas_expenses, 0) +
        COALESCE(c.airplane_tax, 0) +
        COALESCE(c.inter_expenses, 0) +
        COALESCE(c.total_room, 0) +
        COALESCE(c.total_allowance, 0)
      ) AS all_total
FROM Conference c
JOIN Form f ON c.conf_id = f.conf_id
WHERE f.form_status = 'approve'
AND c.country_conf = 'abroad'
GROUP BY c.withdraw
ORDER BY c.withdraw;`
    );
    console.log("count_confer_withdraw", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_country", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT c.location, c.withdraw, c.country_conf,
      SUM(COALESCE(c.total_amount, 0)) AS total_registration,
      SUM(
        COALESCE(c.domestic_expenses, 0) +
        COALESCE(c.overseas_expenses, 0) +
        COALESCE(c.airplane_tax, 0)) AS total_other,
      SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,
      SUM(COALESCE(c.total_room, 0)) AS total_room,
      SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
      SUM(
        COALESCE(c.total_amount, 0) + COALESCE(c.domestic_expenses, 0) +
        COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) +
        COALESCE(c.inter_expenses, 0) + COALESCE(c.total_room, 0) +
        COALESCE(c.total_allowance, 0)) AS all_total,
      SUM(COALESCE(b.amount_approval, 0)) AS total_amount_approval,
      COUNT(*) AS total_count,
    
      CASE 
        WHEN c.country_conf = "abroad" THEN 
            CASE 
                WHEN c.location IN ('ลาว', 'กัมพูชา', 'อินโดนีเซีย', 'เมียนมาร์', 'มาเลเซีย', 'เวียดนาม', 'ฟิลิปปินส์') THEN 'SEA'
                WHEN c.location IN ('บรูไน', 'สิงคโปร์', 'ญี่ปุ่น', 'เกาหลีใต้', 'ไต้หวัน', 'จีน', 'ฮ่องกง', 'อินเดีย', 'ศรีลังกา', 'ปากีสถาน', 'บังกลาเทศ', 'เนปาล', 'ภูฏาน', 'มัลดีฟส์', 'มองโกเลีย', 'คาซัคสถาน', 'อุซเบกิสถาน', 'เติร์กเมนิสถาน', 'คีร์กีซสถาน', 'ทาจิกิสถาน') THEN 'ASIA'
                ELSE 'EUA'
            END
        ELSE 'ในประเทศ'
      END AS region_category
    
      FROM Conference c
      JOIN Form f ON c.conf_id = f.conf_id
      LEFT JOIN Budget b ON f.form_id = b.form_id
      WHERE f.form_status = "approve"
      GROUP BY region_category, c.location, c.withdraw, c.country_conf
      ORDER BY region_category ASC, c.location ASC;`
    );

    // จัดกลุ่มข้อมูลตาม region_category
    const groupedSummary = Summary.reduce((acc, row) => {
      const { region_category, ...data } = row;

      if (!acc[region_category]) {
        acc[region_category] = { count: 0, data: [] };
      }

      acc[region_category].count += 1;
      acc[region_category].data.push(data);

      return acc;
    }, {});
    console.log("count_confer_country", Summary)
    res.status(200).json(groupedSummary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count_confer_thai", async (req, res) => {
  try {
    const [Summary] = await db.query(
      `SELECT c.location, c.country_conf,
      SUM(COALESCE(c.total_amount, 0)) AS total_registration,
      SUM(
          COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) +
          COALESCE(c.airplane_tax, 0)
      ) AS total_other,
      SUM(COALESCE(c.inter_expenses, 0)) AS total_ticket,
      SUM(COALESCE(c.total_room, 0)) AS total_room,
      SUM(COALESCE(c.total_allowance, 0)) AS total_allowance,
      SUM(
          COALESCE(c.total_amount, 0) + COALESCE(c.domestic_expenses, 0) +
          COALESCE(c.overseas_expenses, 0) + COALESCE(c.airplane_tax, 0) +
          COALESCE(c.inter_expenses, 0) + COALESCE(c.total_room, 0) +
          COALESCE(c.total_allowance, 0)
      ) AS all_total,
      SUM(COALESCE(b.amount_approval, 0)) AS total_amount_approval,
      COUNT(*) AS total_count

    FROM Conference c
    JOIN Form f ON c.conf_id = f.conf_id
    LEFT JOIN Budget b ON f.form_id = b.form_id
    WHERE f.form_status = "approve" and c.country_conf = "domestic"
    GROUP BY c.location, c.country_conf
    ORDER BY c.location ASC;
`
    );
console.log("count_confer_thai", Summary)
    res.status(200).json(Summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/eachyears", async (req, res) => {
  const [Summary] = await db.query(
    `SELECT 
    b.budget_year,
    SUM(CASE WHEN f.form_type = 'Conference' THEN 1 ELSE 0 END) AS total_conferences,
    SUM(CASE WHEN f.form_type = 'Page_Charge' THEN 1 ELSE 0 END) AS total_pagecharge,
    SUM(CASE WHEN f.form_type = 'Page_Charge' THEN b.amount_approval ELSE 0 END) AS total_pagecharge_amount, 
    SUM(CASE WHEN f.form_type = 'Conference' THEN b.amount_approval ELSE 0 END) AS total_conference_amount 
FROM Budget b
LEFT JOIN Form f ON b.form_id = f.form_id
WHERE b.budget_year >= (YEAR(CURRENT_DATE) - 3) 
AND f.form_status = "approve"
GROUP BY b.budget_year
ORDER BY b.budget_year DESC;
`
  );
console.log("eachyears", Summary)
  res.status(200).json(Summary);
});

router.get("/money_user", async (req, res) => {
  const [Summary] = await db.query(
    `SELECT 
    u.user_nameth,
    u.user_role,
    u.user_moneyPC,
    u.user_moneyCF,
    COALESCE(SUM(CASE WHEN f.form_type = 'Conference' THEN b.amount_approval ELSE 0 END), 0) AS total_conference,
    COALESCE(SUM(CASE WHEN f.form_type = 'Page_Charge' THEN b.amount_approval ELSE 0 END), 0) AS total_pc
FROM Users u
LEFT JOIN Budget b ON b.user_id = u.user_id AND b.budget_year = YEAR(CURDATE()) + 543
LEFT JOIN Form f ON f.form_id = b.form_id AND f.form_status = 'approve'
GROUP BY u.user_id
ORDER BY u.user_nameth;
`
  );
console.log("money_user", Summary)
  res.status(200).json(Summary);
});

router.get("/all_sum", async (req, res) => {
  const [rows] = await db.query(`
    SELECT
  y.budget_year,
  t.form_type,
  IFNULL(COUNT(b.budget_id), 0) AS total_forms_approved,
  IFNULL(COUNT(DISTINCT b.user_id), 0) AS total_users_approved,
  IFNULL(FORMAT(SUM(b.amount_approval), 2), '0.00') AS total_amount_approved
FROM
  (SELECT DISTINCT budget_year FROM budget) AS y
  CROSS JOIN
  (SELECT DISTINCT form_type FROM form) AS t
  LEFT JOIN (
    SELECT * FROM form WHERE form_status = 'approve'
  ) AS f ON f.form_type = t.form_type
  LEFT JOIN budget b ON b.form_id = f.form_id AND b.budget_year = y.budget_year
GROUP BY
  y.budget_year,
  t.form_type
ORDER BY
  y.budget_year, t.form_type;
  `);

  const allFormTypes = ["Conference", "Page_Charge"]; // ฟอร์มที่ต้องมีเสมอ

  const grouped = rows.reduce((acc, row) => {
    const year = row.budget_year;
    if (!acc[year]) {
      acc[year] = {
        budget_year: year,
        forms: [],
      };
    }

    acc[year].forms.push({
      form_type: row.form_type,
      total_forms_approved: Number(row.total_forms_approved),
      total_users_approved: Number(row.total_users_approved),
      total_amount_approved: row.total_amount_approved,
    });

    return acc;
  }, {});

  // 🔧 เติม form_type ที่ขาด
  Object.values(grouped).forEach((group) => {
    const existingTypes = group.forms.map((f) => f.form_type);
    allFormTypes.forEach((type) => {
      if (!existingTypes.includes(type)) {
        group.forms.push({
          form_type: type,
          total_forms_approved: 0,
          total_users_approved: 0,
          total_amount_approved: "0.00",
        });
      }
    });

    // จัดเรียง form_type
    group.forms.sort(
      (a, b) =>
        allFormTypes.indexOf(a.form_type) - allFormTypes.indexOf(b.form_type)
    );
  });

  const finalResult = Object.values(grouped);
  
  console.log("all_sum", finalResult);
  res.status(200).json(finalResult);
});

exports.router = router;
