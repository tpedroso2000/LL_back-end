// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');               // <--- Importa o pacote cors
const { pool } = require('./database');     // pool criado com require('mysql2')

const app = express();

// Habilita o CORS para todas as origens (para produção, configure de forma mais restritiva)
app.use(cors());

// Middleware para interpretar JSON
app.use(express.json());

app.get('/api/analise_campanhas', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;

    // Utilize pool.promise() para obter a interface promise
    const promisePool = pool.promise();

    // Conta o total de registros
    const [countResult] = await promisePool.query(`
      SELECT COUNT(*) AS total 
      FROM ZI_VW_ANALISE_CAMPANHAS_2025 
    `);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Busca os dados com paginação
    const query = `
      SELECT * 
      FROM ZI_VW_ANALISE_CAMPANHAS_2025
      LIMIT ? OFFSET ?
    `;
    const [rows] = await promisePool.query(query, [pageSize, offset]);

    res.json({
      page,
      pageSize,
      totalRecords,
      totalPages,
      data: rows
    });
  } catch (error) {
    console.error('Erro na consulta de pagamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

module.exports = app;

app.get('/api/analise_campanhas_2024', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;

    // Usa a interface promise do pool
    const promisePool = pool.promise();

    // Conta o total de registros na view de 2024
    const [countResult] = await promisePool.query(`
      SELECT COUNT(*) AS total 
      FROM ZI_VW_ANALISE_CAMPANHAS_2024
    `);
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Busca os dados da view de 2024 com paginação
    const query = `
      SELECT * 
      FROM ZI_VW_ANALISE_CAMPANHAS_2024
      LIMIT ? OFFSET ?
    `;
    const [rows] = await promisePool.query(query, [pageSize, offset]);

    res.json({
      page,
      pageSize,
      totalRecords,
      totalPages,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao buscar dados 2024:', error);
    res.status(500).json({ error: 'Erro ao buscar dados 2024' });
  }
});