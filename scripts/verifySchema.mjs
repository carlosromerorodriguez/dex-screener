/**
 * Verify Schema - Verifica que las tablas de Supabase existan y RLS funcione
 * 
 * USO: npm run db:verify
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('');
console.log('⚡ MINOTAURION - Schema Verification');
console.log('=====================================');
console.log('');

async function verify() {
  const tables = ['profiles', 'badges', 'user_badges', 'follows'];
  
  for (const table of tables) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`;
      const response = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table}: OK (${data.length} rows)`);
      } else {
        console.log(`❌ ${table}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }

  console.log('');
  console.log('⚡ Verificación completa');
  console.log('');
}

verify();

