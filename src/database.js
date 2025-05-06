// src/database.js
require('dotenv').config();
const sql = require('mssql');

// Constrói a configuração a partir da string no .env
const config = {
  connectionString: process.env.DB_CONN_STR,
  options: {
    encrypt: true,            // use true se você estiver no Azure
    trustServerCertificate: true  // ajuste conforme seu ambiente
  }
};

// Cria um pool único e exporta a promessa de conexão
const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('✅ Conectado ao SQL Server');
    return pool;
  })
  .catch(err => {
    console.error('❌ Falha ao conectar no SQL Server:', err);
    throw err;
  });

module.exports = { sql, poolPromise };
