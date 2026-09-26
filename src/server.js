const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Permitir fotos en base64
app.use(express.urlencoded({ limit: '50mb' }));

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

// Requiere además que el usuario autenticado sea admin (usar después de verificarToken)
const verificarAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo un administrador puede realizar esta acción' });
  }
  next();
};

// ============================================
// 🔐 AUTENTICACIÓN
// ============================================

app.post('/api/auth/register', verificarToken, verificarAdmin, async (req, res) => {
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

// LISTAR usuarios (solo admin): GET /api/usuarios
// No devuelve el hash de la contraseña.
app.get('/api/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, nombre, rol, created_at, reset_solicitado_en')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ mensaje: '✅ Usuarios obtenidos', usuarios: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// EDITAR datos de un usuario (solo admin): PUT /api/usuarios/:id
// Permite cambiar nombre, correo y rol. No toca la contraseña.
app.put('/api/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    if (!nombre || !email) {
      return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
    }
    if (rol && rol !== 'admin' && rol !== 'technician') {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const { error } = await supabase
      .from('users')
      .update({ nombre, email, ...(rol ? { rol } : {}) })
      .eq('id', id);

    if (error) {
      if (error.message && error.message.toLowerCase().includes('duplicate')) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
      }
      return res.status(400).json({ error: error.message });
    }

    res.json({ mensaje: '✅ Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RESTABLECER contraseña de un usuario (solo admin): PUT /api/usuarios/:id/reset-password
// No requiere correo/SMTP: el admin define la nueva contraseña directamente
// y se la comunica al técnico por el medio que prefiera.
app.put('/api/usuarios/:id/reset-password', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword, reset_solicitado_en: null })
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ mensaje: '✅ Contraseña actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SOLICITAR RESTABLECIMIENTO de contraseña (público, sin login): POST /api/auth/solicitar-reset
// No hay servicio de correo configurado todavía, así que esto NO envía ningún email:
// marca la solicitud para que el admin la vea en el panel de Usuarios y le comparta
// la nueva contraseña al técnico por el medio que prefiera (WhatsApp, en persona, etc).
app.post('/api/auth/solicitar-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (email) {
      await supabase
        .from('users')
        .update({ reset_solicitado_en: new Date() })
        .eq('email', email);
    }
    // Respuesta genérica siempre, exista o no el correo, para no revelar qué
    // correos están registrados.
    res.json({ mensaje: 'Si el correo existe, tu solicitud fue registrada.' });
  } catch (err) {
    // Aun si algo falla, no delatamos detalles al cliente no autenticado.
    res.json({ mensaje: 'Si el correo existe, tu solicitud fue registrada.' });
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
// Estructura flexible: campos comunes como columnas, el resto en "datos" (JSON)
app.post('/api/levantamientos', verificarToken, async (req, res) => {
  try {
    const {
      tipo_banda,
      folio,
      cliente_nombre,
      ubicacion,
      estado,
      fotos,
      firma_tecnico,
      firma_cliente,
      datos
    } = req.body;
    const user_id = req.usuario.id;

    if (!tipo_banda || !cliente_nombre) {
      return res.status(400).json({ error: 'Faltan campos requeridos (tipo_banda, cliente_nombre)' });
    }

    // Generar folio automatico (correlativo LEV-00001, LEV-00002, ...)
    let folioFinal = folio;
    if (!folioFinal || folioFinal === 'AUTO') {
      const { data: folioData, error: folioError } = await supabase.rpc('siguiente_folio');
      if (folioError) {
        console.error('❌ Error generando folio automático al guardar (rpc siguiente_folio):', folioError.message);
      }
      folioFinal = folioError ? '' : folioData;
    }

    const { data, error } = await supabase
      .from('levantamientos')
      .insert([
        {
          user_id,
          tipo_banda,
          folio: folioFinal,
          cliente_nombre,
          ubicacion: ubicacion || '',
          estado: estado || 'borrador',
          fotos: fotos || [],
          firma_tecnico: firma_tecnico || '',
          firma_cliente: firma_cliente || '',
          datos: datos || {}
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

// SIGUIENTE FOLIO: GET /api/folio/siguiente
// Reserva y devuelve el siguiente folio correlativo (LEV-00001, LEV-00002, ...)
// para que el técnico lo vea de inmediato al abrir un levantamiento nuevo,
// en vez de ver solo el texto "AUTO" hasta que guarda.
app.get('/api/folio/siguiente', verificarToken, async (req, res) => {
  try {
    const { data: folioData, error: folioError } = await supabase.rpc('siguiente_folio');
    if (folioError) {
      console.error('❌ Error en /api/folio/siguiente (rpc siguiente_folio):', folioError.message);
      return res.status(400).json({ error: folioError.message });
    }
    res.json({ folio: folioData });
  } catch (err) {
    console.error('❌ Error en /api/folio/siguiente:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// OBTENER levantamientos: GET /api/levantamientos
app.get('/api/levantamientos', verificarToken, async (req, res) => {
  try {
    const user_id = req.usuario.id;
    const rol = req.usuario.rol;

    // La lista NO incluye fotos ni firmas: son imágenes en base64 y son el peso real
    // de cada registro. Se piden aparte, solo cuando se abre el detalle de un
    // levantamiento (GET /api/levantamientos/:id), para que la lista cargue rápido.
    let query = supabase
      .from('levantamientos')
      .select('id, user_id, tipo_banda, folio, cliente_nombre, ubicacion, estado, datos, created_at, updated_at');

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

// OBTENER UN levantamiento completo (con fotos y firmas): GET /api/levantamientos/:id
app.get('/api/levantamientos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.usuario.id;
    const rol = req.usuario.rol;

    const { data, error } = await supabase
      .from('levantamientos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Levantamiento no encontrado' });
    }

    if (rol === 'technician' && data.user_id !== user_id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    res.json({
      mensaje: '✅ Levantamiento obtenido',
      levantamiento: data
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
    const updateData = req.body;

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

    updateData.updated_at = new Date();

    const { data, error } = await supabase
      .from('levantamientos')
      .update(updateData)
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
// Solo el rol admin puede borrar (limpieza de datos). Los técnicos, aunque sean
// dueños del registro, no pueden eliminar levantamientos desde ningún lado.
app.delete('/api/levantamientos/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ error: 'Solo un administrador puede eliminar levantamientos' });
    }

    const { data: levantamiento } = await supabase
      .from('levantamientos')
      .select('*')
      .eq('id', id)
      .single();

    if (!levantamiento) {
      return res.status(404).json({ error: 'Levantamiento no encontrado' });
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
    version: '2.0.0 - Con soporte para fotos, firmas y condición',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// ============================================
// 🚀 INICIAR SERVIDOR
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║  🚀 PROVAC Backend v2.0 Ejecutándose  ║
║  URL: http://192.168.0.27:${PORT}            ║
║  Auth: POST /api/auth/login            ║
║  Levantamientos: GET /api/levantamientos ║
║  Fotos: Soportadas en base64           ║
║  Firmas: Soportadas                    ║
╚════════════════════════════════════════╝
  `);
});
