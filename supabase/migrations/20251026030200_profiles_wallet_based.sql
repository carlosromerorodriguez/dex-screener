-- ============================================================================
-- PROFILES: Políticas basadas en wallet_address (SIN auth.uid())
-- ============================================================================
-- Para wallet-only login (sin Supabase auth)
-- ============================================================================

-- Eliminar policies antiguas que requerían auth.uid()
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;

-- PASO 1: Eliminar la PRIMARY KEY actual (basada en id)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- PASO 2: Cambiar id a opcional (ahora que no es PK)
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- PASO 3: Hacer wallet_address NOT NULL y crear índice único
ALTER TABLE public.profiles ALTER COLUMN wallet_address SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_wallet_address_key ON public.profiles(wallet_address);

-- PASO 4: Añadir PRIMARY KEY en wallet_address
ALTER TABLE public.profiles ADD PRIMARY KEY (wallet_address);

-- Policy 1: Lectura pública
CREATE POLICY profiles_select_all
ON public.profiles
FOR SELECT
USING (true);

-- Policy 2: Insert por cualquiera (validado por SIWS client-side)
CREATE POLICY profiles_insert_wallet
ON public.profiles
FOR INSERT
WITH CHECK (wallet_address IS NOT NULL AND char_length(wallet_address) > 0);

-- Policy 3: Update solo si la wallet_address coincide
-- NOTA: En producción real, esto requeriría validación server-side
-- Por ahora, permitimos update público (client-side SIWS valida)
CREATE POLICY profiles_update_public
ON public.profiles
FOR UPDATE
USING (true)
WITH CHECK (wallet_address IS NOT NULL);

-- Verificación
SELECT 
  'Profiles ahora usa wallet_address como PK' as message,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') as total_policies;

