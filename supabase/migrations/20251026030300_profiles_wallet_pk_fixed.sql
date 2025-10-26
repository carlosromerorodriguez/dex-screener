-- ============================================================================
-- PROFILES: Cambiar PK de id a wallet_address (con CASCADE)
-- ============================================================================
-- Maneja las foreign keys de user_badges, follows y badges correctamente
-- ============================================================================

-- PASO 1: Eliminar TODAS las policies de TODAS las tablas
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

-- PASO 2: Eliminar foreign keys de tablas dependientes
ALTER TABLE public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey CASCADE;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_fkey CASCADE;
ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_following_fkey CASCADE;

-- PASO 3: Renombrar columnas en tablas dependientes
ALTER TABLE public.user_badges RENAME COLUMN user_id TO user_wallet_address;
ALTER TABLE public.follows RENAME COLUMN follower TO follower_wallet;
ALTER TABLE public.follows RENAME COLUMN following TO following_wallet;

-- PASO 4: Cambiar tipo de columnas a TEXT
ALTER TABLE public.user_badges ALTER COLUMN user_wallet_address TYPE TEXT;
ALTER TABLE public.follows ALTER COLUMN follower_wallet TYPE TEXT;
ALTER TABLE public.follows ALTER COLUMN following_wallet TYPE TEXT;

-- PASO 5: Eliminar PK antigua de profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

-- PASO 6: Hacer wallet_address NOT NULL y PK en profiles
ALTER TABLE public.profiles ALTER COLUMN wallet_address SET NOT NULL;
ALTER TABLE public.profiles ADD PRIMARY KEY (wallet_address);

-- PASO 7: id ahora es opcional
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- PASO 8: Recrear foreign keys apuntando a wallet_address
ALTER TABLE public.user_badges 
  ADD CONSTRAINT user_badges_wallet_fkey 
  FOREIGN KEY (user_wallet_address) 
  REFERENCES public.profiles(wallet_address) 
  ON DELETE CASCADE;

ALTER TABLE public.follows 
  ADD CONSTRAINT follows_follower_fkey 
  FOREIGN KEY (follower_wallet) 
  REFERENCES public.profiles(wallet_address) 
  ON DELETE CASCADE;

ALTER TABLE public.follows 
  ADD CONSTRAINT follows_following_fkey 
  FOREIGN KEY (following_wallet) 
  REFERENCES public.profiles(wallet_address) 
  ON DELETE CASCADE;

-- PASO 9: Recrear policies
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

-- Verificación final
SELECT 
  'Schema actualizado: profiles PK = wallet_address' as message,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') as profiles_policies,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'badges') as badges_policies,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'user_badges') as user_badges_policies,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'follows') as follows_policies;
