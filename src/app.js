require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Uso do driver mssql com poolPromise
const { sql, poolPromise } = require('./database');
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

// Função para exportar view ao Blob
async function exportViewToBlob(viewName, blobFileName) {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT * FROM ${viewName}`);
    const rows = result.recordset;
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

// Agendamento diário (meia-noite) para exportação das views
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

// Endpoint para 2025 com paginação SQL Server
app.get('/api/analise_campanhas', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;

    const pool = await poolPromise;

    const countResult = await pool.request()
      .query(`SELECT COUNT(*) AS total FROM ZI_VW_ANALISE_CAMPANHAS_2025`);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const dataResult = await pool.request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(
        `SELECT *
         FROM ZI_VW_ANALISE_CAMPANHAS_2025
         ORDER BY (SELECT NULL)
         OFFSET @offset ROWS
         FETCH NEXT @pageSize ROWS ONLY`
      );

    res.json({ page, pageSize, totalRecords, totalPages, data: dataResult.recordset });
  } catch (error) {
    console.error('Erro na consulta de campanhas 2025:', error);
    res.status(500).json({ error: 'Erro ao buscar dados 2025' });
  }
});

// Endpoint para 2024 com paginação SQL Server
app.get('/api/analise_campanhas_2024', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 100;
    const offset = (page - 1) * pageSize;

    const pool = await poolPromise;

    const countResult = await pool.request()
      .query(`SELECT COUNT(*) AS total FROM ZI_VW_ANALISE_CAMPANHAS_2024`);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / pageSize);

    const dataResult = await pool.request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, pageSize)
      .query(
        `SELECT *
         FROM ZI_VW_ANALISE_CAMPANHAS_2024
         ORDER BY (SELECT NULL)
         OFFSET @offset ROWS
         FETCH NEXT @pageSize ROWS ONLY`
      );

    res.json({ page, pageSize, totalRecords, totalPages, data: dataResult.recordset });
  } catch (error) {
    console.error('Erro na consulta de campanhas 2024:', error);
    res.status(500).json({ error: 'Erro ao buscar dados 2024' });
  }
});

module.exports = app;
