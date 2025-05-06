// src/database.js
require('dotenv').config();
const mysql = require('mysql2');

// Cria um pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Exporta o pool para ser utilizado no app
module.exports = { pool };
