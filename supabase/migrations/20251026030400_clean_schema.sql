-- ============================================================================
-- CLEAN SLATE: DROP & RECREATE TODAS LAS TABLAS (SOLANA WALLET-FIRST)
-- ============================================================================
-- Este script elimina completamente el schema anterior y lo recrea desde cero
-- con wallet_address como PK y estructura compatible con SIWS
-- ============================================================================

-- PASO 1: ELIMINAR TODAS LAS POLICIES (si existen)
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_wallet ON public.profiles;
DROP POLICY IF EXISTS profiles_update_wallet ON public.profiles;

DROP POLICY IF EXISTS badges_select_public ON public.badges;

DROP POLICY IF EXISTS user_badges_select_all ON public.user_badges;
DROP POLICY IF EXISTS user_badges_select_own ON public.user_badges;
DROP POLICY IF EXISTS user_badges_insert_own ON public.user_badges;
DROP POLICY IF EXISTS user_badges_insert_any ON public.user_badges;

DROP POLICY IF EXISTS follows_select_public ON public.follows;
DROP POLICY IF EXISTS follows_mutate_by_follower ON public.follows;
DROP POLICY IF EXISTS follows_select_all ON public.follows;
DROP POLICY IF EXISTS follows_insert_own ON public.follows;
DROP POLICY IF EXISTS follows_insert_any ON public.follows;
DROP POLICY IF EXISTS follows_delete_own ON public.follows;
DROP POLICY IF EXISTS follows_delete_any ON public.follows;

-- PASO 2: ELIMINAR TRIGGERS
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASO 3: ELIMINAR FUNCIONES
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_following(uuid, uuid) CASCADE;

-- PASO 4: ELIMINAR TABLAS (en orden correcto para foreign keys)
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.badges CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- PASO 5: CREAR TABLA PROFILES (wallet_address como PK)
CREATE TABLE public.profiles (
  wallet_address TEXT PRIMARY KEY,
  id UUID,  -- Opcional (auth.users reference si se usa)
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- PASO 6: CREAR TABLA BADGES
CREATE TABLE public.badges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'mythic', 'secret')) NOT NULL DEFAULT 'common',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  icon_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.badges(rarity);

-- PASO 7: CREAR TABLA USER_BADGES (referenciando wallet_address)
CREATE TABLE public.user_badges (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_wallet_address TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  badge_id BIGINT NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE (user_wallet_address, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON public.user_badges(badge_id);

-- PASO 8: CREAR TABLA FOLLOWS (referenciando wallet_address)
CREATE TABLE public.follows (
  follower_wallet TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  following_wallet TEXT NOT NULL REFERENCES public.profiles(wallet_address) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (follower_wallet, following_wallet),
  CHECK (follower_wallet <> following_wallet)  -- No puede seguirse a sí mismo
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_wallet);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_wallet);

-- PASO 9: CREAR FUNCIÓN UPDATE_TIMESTAMP
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- PASO 10: CREAR TRIGGER UPDATE_TIMESTAMP
CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PASO 11: HABILITAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- PASO 12: CREAR POLICIES
-- Profiles
CREATE POLICY profiles_select_all
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY profiles_insert_wallet
ON public.profiles FOR INSERT
WITH CHECK (wallet_address IS NOT NULL AND char_length(wallet_address) > 0);

CREATE POLICY profiles_update_wallet
ON public.profiles FOR UPDATE
USING (wallet_address IS NOT NULL)
WITH CHECK (wallet_address IS NOT NULL);

-- Badges
CREATE POLICY badges_select_public
ON public.badges FOR SELECT
USING (NOT is_hidden OR EXISTS (
  SELECT 1 FROM public.user_badges 
  WHERE user_badges.badge_id = badges.id 
  AND user_badges.user_wallet_address IS NOT NULL
));

-- User Badges
CREATE POLICY user_badges_select_all
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY user_badges_insert_any
ON public.user_badges FOR INSERT
WITH CHECK (user_wallet_address IS NOT NULL);

-- Follows
CREATE POLICY follows_select_all
ON public.follows FOR SELECT
USING (true);

CREATE POLICY follows_insert_any
ON public.follows FOR INSERT
WITH CHECK (follower_wallet IS NOT NULL AND following_wallet IS NOT NULL);

CREATE POLICY follows_delete_any
ON public.follows FOR DELETE
USING (true);

-- PASO 13: INSERTAR DATOS INICIALES (BADGES)
INSERT INTO public.badges (slug, name, description, rarity, xp_reward, icon_url)
VALUES
  ('first-trade', 'First Trade', 'Made your first trade on MINOTAURION', 'common', 10, NULL),
  ('beast-hunter', 'Beast Hunter', 'Discovered 10 trending tokens before they pumped', 'rare', 50, NULL),
  ('diamond-hands', 'Diamond Hands', 'Held a position for over 30 days', 'epic', 100, NULL),
  ('labyrinth-lord', 'Labyrinth Lord', 'Navigated the market maze successfully 50 times', 'mythic', 250, NULL),
  ('minos-secret', 'Minos'' Secret', 'Discovered the hidden easter egg...', 'secret', 500, NULL),
  ('early-adopter', 'Early Adopter', 'Joined MINOTAURION in the first 100 users', 'rare', 75, NULL),
  ('portfolio-master', 'Portfolio Master', 'Managed a portfolio worth over $10k', 'epic', 150, NULL),
  ('social-butterfly', 'Social Butterfly', 'Made 50 connections in the community', 'common', 25, NULL)
ON CONFLICT (slug) DO NOTHING;

-- PASO 14: VERIFICACIÓN FINAL
SELECT 
  '✅ Schema limpio creado exitosamente!' AS message,
  (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
  (SELECT COUNT(*) FROM public.badges) AS total_badges,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') AS profiles_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'badges') AS badges_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_badges') AS user_badges_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'follows') AS follows_policies;

