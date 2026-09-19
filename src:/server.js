// ====================================
// SERVIDOR BACKEND - PROVAC
// ====================================
// Este es el "corazón" de la app
// Aquí recibimos datos de la app móvil
// y los guardamos en la base de datos

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Crear app Express
const app = express();

// Middleware (preparar datos que recibimos)
app.use(cors());
app.use(express.json());

// ====================================
// RUTA DE PRUEBA (para ver si funciona)
// ====================================
app.get('/api/test', (req, res) => {
  res.json({
    mensaje: '¡Backend de PROVAC funcionando! ✅',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// ====================================
// RUTA DE SALUD (verifica si está vivo)
// ====================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ====================================
// PUERTO Y SERVIDOR
// ====================================
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