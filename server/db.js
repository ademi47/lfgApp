const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: "127.0.0.1", // Hardcode IPv4
  user: "u561042160_lfgadmin",
  password: "206#iCf!mk",
  database: "u561042160_lfgapp",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
