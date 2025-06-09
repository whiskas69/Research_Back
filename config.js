const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: '10.0.15.37',
  user: 'root',
  password: 'wine1234',//อย่าลืมแก้
  database: 'ResearchAdministration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;