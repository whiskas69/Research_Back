const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  // host: 'mysql', password: 'wine1234', //server
  host: 'localhost', //ใช้ localhost แทน
  user: 'root',
  password: 'root',//อย่าลืมแก้
  database: 'ResearchAdministration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
