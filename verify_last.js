require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('levantamientos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('ERROR:', error);
  } else if (!data || data.length === 0) {
    console.log('No hay levantamientos guardados todavía.');
  } else {
    console.log(JSON.stringify(data[0], null, 2));
  }
  process.exit();
}

run();
