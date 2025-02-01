const express = require("express");
const db = require("../config.js");

router = express.Router();
//data แก้ date ของดาต้าเบส
router.post('/conference', async (req, res) => {
    console.log("in post conference")
    const {
      user_id,
      conf_times,
      conf_days,
      trav_date,
      conf_research,
      conf_name,
      date_of_conf,
      meeting_venue,
      dat_article_submission,
      date_announce_article,
      last_day_register,
      meeting_type,
      quality_meeting,
      presenter_type,
      time_of_leave,
      wos_2_leave,
      name_2_leave,
      withdraw,
      wd_100_quality,
      wd_name_100,
      country_conf,
      num_register_articles,
      regist_amount_1_article,
      total_amount,
      domestic_expenses,
      overseas_expenses,
      travel_country,
      inter_expenses,
      airplane_tax,
      num_days_room,
      room_cost_per_night,
      total_room,
      num_travel_days,
      daily_allowance,
      total_allowance,
      all_money,
      user_signature,
      doc_submission_date,
    } = req.body;
    try {
      const query = `
      INSERT INTO Conference (
        user_id, conf_times, conf_days, trav_date, conf_research, conf_name,
        date_of_conf, meeting_venue, dat_article_submission, date_announce_article,
        last_day_register, meeting_type, quality_meeting, presenter_type,
        time_of_leave, wos_2_leave, name_2_leave, withdraw, wd_100_quality,
        wd_name_100, country_conf, num_register_articles, regist_amount_1_article,
        total_amount, domestic_expenses, overseas_expenses, travel_country,
        inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
        num_travel_days, daily_allowance, total_allowance, all_money, user_signature,
        doc_submission_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;
        console.log("data",req.body)
        const [result] = await db.query(query, [
          user_id, conf_times, conf_days, trav_date, conf_research, conf_name,
          date_of_conf, meeting_venue, dat_article_submission, date_announce_article,
          last_day_register, meeting_type, quality_meeting, presenter_type,
          time_of_leave, wos_2_leave, name_2_leave, withdraw, wd_100_quality,
          wd_name_100, country_conf, num_register_articles, regist_amount_1_article,
          total_amount, domestic_expenses, overseas_expenses, travel_country,
          inter_expenses, airplane_tax, num_days_room, room_cost_per_night, total_room,
          num_travel_days, daily_allowance, total_allowance, all_money, user_signature,
          doc_submission_date,
        ]);
        res.status(201).json({ message: 'Conference entry created', conf_id: result.insertId });
      } catch (err) {
        res.status(500).json({ error: err.message });
        console.log(err.message);
    }
});

router.get("/conferences", async (req, res) => {
  console.log("in get conference")
  try {
    const [conferences] = await db.query('SELECT * FROM Conference');
    res.status(200).json(conferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/conferences/:id', async (req, res) => {
  console.log("in Update conference")

  const { id } = req.params;
  const updates = req.body;
  try {
    const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    const query = `UPDATE Conference SET ${fields} WHERE conf_id = ?`;
    const [result] = await db.query(query, [...values, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Conference not found' });
    }
    res.status(200).json({ message: 'Conference updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
exports.router = router;