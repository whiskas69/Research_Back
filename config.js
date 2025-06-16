const mysql = require('mysql2/promise');

const pool = mysql.createPool({
<<<<<<< HEAD
  // host: 'mysql', password: 'wine1234', //server
  host: 'localhost',
=======
  host: 'mysql',
>>>>>>> cd9f0c0 (save local changes)
  user: 'root',
  password: 'wine1234',//อย่าลืมแก้
  charset: 'utf8mb4',
  database: 'ResearchAdministration',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
