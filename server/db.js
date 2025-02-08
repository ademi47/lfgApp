const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: "localhost",
  user: "u561042160_lfgadmin",
  password: "206#iCf!mk",
  database: "u561042160_lfgapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Add these options for better debugging
  debug: true,
  trace: true,
});

// Test connection
pool
  .getConnection()
  .then((connection) => {
    console.log("Successfully connected to database");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

module.exports = pool;
