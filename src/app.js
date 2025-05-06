require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./database');
// SDK do Azure Blob Storage e agendador cron
const { BlobServiceClient } = require('@azure/storage-blob');
const cron = require('node-cron');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Azure Blob Storage
const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const containerName = process.env.AZURE_CONTAINER_NAME || 'result-json';
const containerClient = blobServiceClient.getContainerClient(containerName);

// Função genérica para exportar uma view ao Blob
async function exportViewToBlob(viewName, blobFileName) {
  try {
    const promisePool = pool.promise();
    const [rows] = await promisePool.query(`SELECT * FROM ${viewName}`);
    const jsonData = JSON.stringify(rows, null, 2);
    const blockBlobClient = containerClient.getBlockBlobClient(blobFileName);
    await blockBlobClient.upload(jsonData, Buffer.byteLength(jsonData), {
      overwrite: true
    });
    console.log(`Exportada view ${viewName} para blob ${blobFileName}`);
  } catch (error) {
    console.error(`Erro ao exportar view ${viewName}:`, error);
  }
}

// Agendamento diário: todo dia à meia-noite (UTC ou conforme SERVER_TIMEZONE)
cron.schedule(
  '0 0 * * *',
  async () => {
    console.log('Iniciando job de exportação diária');
    await exportViewToBlob(
      'ZI_VW_ANALISE_CAMPANHAS_2025',
      'analise_campanhas_2025.json'
    );
    await exportViewToBlob(
      'ZI_VW_ANALISE_CAMPANHAS_2024',
      'analise_campanhas_2024.json'
    );
    console.log('Job de exportação diária concluído');
  },
  {
    timezone: process.env.SERVER_TIMEZONE || 'UTC'
  }
);

// Endpoints existentes (paginação em 2025)
app.get('/api/analise_campanhas', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;
    const promisePool = pool.promise();

    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM ZI_VW_ANALISE_CAMPANHAS_2025`
    );
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const [rows] = await promisePool.query(
      `
      SELECT *
      FROM ZI_VW_ANALISE_CAMPANHAS_2025
      LIMIT ? OFFSET ?
    `,
      [pageSize, offset]
    );

    res.json({ page, pageSize, totalRecords, totalPages, data: rows });
  } catch (error) {
    console.error('Erro na consulta de campanhas 2025:', error);
    res.status(500).json({ error: 'Erro ao buscar dados 2025' });
  }
});

// Endpoints existentes (paginação em 2024)
app.get('/api/analise_campanhas_2024', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;
    const promisePool = pool.promise();

    const [countResult] = await promisePool.query(
      `SELECT COUNT(*) AS total FROM ZI_VW_ANALISE_CAMPANHAS_2024`
    );
    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const [rows] = await promisePool.query(
      `
      SELECT *
      FROM ZI_VW_ANALISE_CAMPANHAS_2024
      LIMIT ? OFFSET ?
    `,
      [pageSize, offset]
    );

    res.json({ page, pageSize, totalRecords, totalPages, data: rows });
  } catch (error) {
    console.error('Erro na consulta de campanhas 2024:', error);
    res.status(500).json({ error: 'Erro ao buscar dados 2024' });
  }
});

module.exports = app;
