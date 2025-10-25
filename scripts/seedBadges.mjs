/**
 * Seed Badges - Script para sembrar badges iniciales en Supabase
 * 
 * USO: node scripts/seedBadges.mjs
 * 
 * VARIABLES REQUERIDAS:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (NO usar anon key)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const badges = [
  {
    slug: 'first-trade',
    name: 'First Trade',
    description: 'Made your first trade on MINOTAURION',
    rarity: 'common',
    xp_reward: 10,
  },
  {
    slug: 'beast-hunter',
    name: 'Beast Hunter',
    description: 'Discovered 10 trending tokens before they pumped',
    rarity: 'epic',
    xp_reward: 100,
  },
  {
    slug: 'labyrinth-lord',
    name: 'Labyrinth Lord',
    description: 'Navigated the market maze successfully 50 times',
    rarity: 'mythic',
    xp_reward: 250,
  },
  {
    slug: 'minos-secret',
    name: "Minos' Secret",
    description: 'Discovered the hidden easter egg...',
    rarity: 'secret',
    xp_reward: 500,
    is_hidden: true,
  },
];

async function seed() {
  console.log('🌱 Seeding badges...');

  const { data, error } = await supabase
    .from('badges')
    .upsert(badges, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Seeded ${data.length} badges`);
  data.forEach((b) => console.log(`   - ${b.name} (${b.rarity})`));
}

seed();

