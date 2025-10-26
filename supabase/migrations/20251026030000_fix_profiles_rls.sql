-- ============================================================================
-- FIX: Profiles RLS Policies para permitir upsert correcto
-- ============================================================================
-- Problema: El INSERT/UPDATE fallaba porque el id no coincidía con auth.uid()
-- Solución: Políticas que permiten upsert usando id = auth.uid()
-- ============================================================================

-- Asegurar que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar policies antiguas si existen
DROP POLICY IF EXISTS profiles_select_all ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;

-- Policy 1: Lectura pública (todos pueden ver perfiles)
CREATE POLICY profiles_select_all
ON public.profiles
FOR SELECT
USING (true);

-- Policy 2: Insert propio (IMPORTANTE: id debe ser auth.uid())
CREATE POLICY profiles_insert_own
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Update propio
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verificación
SELECT 
  'Profiles RLS policies updated successfully' as message,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'profiles') as total_policies;

