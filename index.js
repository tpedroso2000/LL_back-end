// index.js
require('dotenv').config();
const app = require('./src/app');

const port = process.env.APP_PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
