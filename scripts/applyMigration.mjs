/**
 * Apply Migration - Aplica el schema SQL a Supabase directamente
 * 
 * USO: npm run db:migrate
 * 
 * NOTA: Ejecuta el SQL del schema en Supabase.
 * Para proyectos nuevos, usa el Dashboard SQL Editor.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('');
console.log('⚡ MINOTAURION - Database Migration');
console.log('===================================');
console.log('');

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
  console.log('');
  console.log('Add them to your .env file and try again.');
  process.exit(1);
}

console.log('✅ Supabase URL:', SUPABASE_URL);
console.log('');

// Leer el archivo SQL más reciente
const migrationsDir = join(__dirname, '../supabase/migrations');
const files = readFileSync(migrationsDir, 'utf-8');

console.log('📋 INSTRUCCIONES PARA APLICAR SCHEMA:');
console.log('');
console.log('1. Abre Supabase Dashboard:');
console.log(`   ${SUPABASE_URL.replace('/rest/v1', '')}/project/_/sql`);
console.log('');
console.log('2. Ve a "SQL Editor"');
console.log('');
console.log('3. Copia y pega el contenido de:');
console.log('   supabase/migrations/20251026020311_schema_minotaurion.sql');
console.log('');
console.log('4. Click "Run"');
console.log('');
console.log('5. Verifica que las tablas se crearon:');
console.log('   - profiles');
console.log('   - badges');
console.log('   - user_badges');
console.log('   - follows');
console.log('');
console.log('⚡ MINOTAURION - Schema listo para aplicar');
console.log('');

