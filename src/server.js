const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({
    mensaje: '¡Backend de PROVAC funcionando! ✅',
    version: '1.0.0',
    timestamp: new Date()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 PROVAC Backend Ejecutándose       ║
║  URL: http://localhost:${PORT}           ║
║  API: http://localhost:${PORT}/api/test  ║
╚════════════════════════════════════════╝
  `);
});
