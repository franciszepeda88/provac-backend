const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'tu-secreto-jwt-cambiar-en-produccion';

// ============================================
// 🔐 MIDDLEWARE - Verificar JWT
// ============================================

const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// ============================================
// 🔐 AUTENTICACIÓN
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nombre, rol } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Email, contraseña y nombre requeridos' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          nombre,
          rol: rol || 'technician'
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mensaje: '✅ Usuario registrado correctamente',
      usuario: data[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    if (error || users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      mensaje: '✅ Login exitoso',
      token,
      usuario: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 📋 LEVANTAMIENTOS CRUD
// ============================================

// CREAR levantamiento: POST /api/levantamientos
app.post('/api/levantamientos', verificarToken, async (req, res) => {
  try {
    const { cliente_nombre, banda_tipo, banda_ancho, banda_largo, accesorios, notas } = req.body;
    const user_id = req.usuario.id;

    const { data, error } = await supabase
      .from('levantamientos')
      .insert([
        {
          user_id,
          cliente_nombre,
          banda_tipo,
          banda_ancho,
          banda_largo,
          accesorios,
          notas
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mensaje: '✅ Levantamiento creado',
      levantamiento: data[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OBTENER mis levantamientos: GET /api/levantamientos
app.get('/api/levantamientos', verificarToken, async (req, res) => {
  try {
    const user_id = req.usuario.id;
    const rol = req.usuario.rol;

    let query = supabase.from('levantamientos').select('*');

    // Si es technician, ve solo sus datos
    // Si es admin, ve TODOS
    if (rol === 'technician') {
      query = query.eq('user_id', user_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mensaje: '✅ Levantamientos obtenidos',
      cantidad: data.length,
      levantamientos: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ACTUALIZAR levantamiento: PUT /api/levantamientos/:id
app.put('/api/levantamientos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.usuario.id;
    const { cliente_nombre, banda_tipo, banda_ancho, banda_largo, accesorios, notas } = req.body;

    // Verificar que sea el propietario o admin
    const { data: levantamiento } = await supabase
      .from('levantamientos')
      .select('*')
      .eq('id', id)
      .single();

    if (!levantamiento) {
      return res.status(404).json({ error: 'Levantamiento no encontrado' });
    }

    if (levantamiento.user_id !== user_id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { data, error } = await supabase
      .from('levantamientos')
      .update({
        cliente_nombre,
        banda_tipo,
        banda_ancho,
        banda_largo,
        accesorios,
        notas,
        updated_at: new Date()
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mensaje: '✅ Levantamiento actualizado',
      levantamiento: data[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ELIMINAR levantamiento: DELETE /api/levantamientos/:id
app.delete('/api/levantamientos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.usuario.id;

    // Verificar propiedad
    const { data: levantamiento } = await supabase
      .from('levantamientos')
      .select('*')
      .eq('id', id)
      .single();

    if (!levantamiento) {
      return res.status(404).json({ error: 'Levantamiento no encontrado' });
    }

    if (levantamiento.user_id !== user_id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { error } = await supabase
      .from('levantamientos')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mensaje: '✅ Levantamiento eliminado'
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 🧪 TESTS
// ============================================

app.get('/api/test', (req, res) => {
  res.json({
    mensaje: '¡Backend de PROVAC funcionando! ✅',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 PROVAC Backend Ejecutándose       ║
║  URL: http://localhost:${PORT}            ║
║  Auth: POST /api/auth/login            ║
║  Levantamientos: GET /api/levantamientos ║
╚════════════════════════════════════════╝
  `);
});
