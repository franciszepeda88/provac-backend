require('dotenv').config();
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const hash = await bcrypt.hash('provac2026', 10);

  // Actualiza contraseña de los 3 usuarios existentes a "provac2026"
  const { data, error } = await supabase
    .from('users')
    .update({ password: hash })
    .in('email', ['tecnico@provac.com', 'tech1@provac.com', 'admin@provac.com'])
    .select();

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('Usuarios actualizados:', data.map(u => u.email));
  }
  process.exit();
}

run();
