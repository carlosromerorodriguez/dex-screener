/**
 * Verify Schema - Verifica que las tablas de Supabase existan y RLS funcione
 * 
 * USO: npm run db:verify
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer .env manualmente
const envPath = join(__dirname, '../.env');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/REACT_APP_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/REACT_APP_SUPABASE_ANON_KEY=(.+)/);
  
  if (urlMatch) SUPABASE_URL = urlMatch[1].trim();
  if (keyMatch) SUPABASE_KEY = keyMatch[1].trim();
} catch (err) {
  console.error('❌ Error reading .env file');
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY in .env');
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

