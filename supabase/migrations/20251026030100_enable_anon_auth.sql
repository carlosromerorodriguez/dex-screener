-- ============================================================================
-- Habilitar autenticación anónima en Supabase
-- ============================================================================
-- NOTA: Esto también se puede hacer desde el Dashboard:
-- Authentication → Providers → Anonymous → Enable
-- ============================================================================

-- Este archivo es solo referencia
-- Ejecuta esto en Supabase Dashboard → Project Settings → Authentication:
-- 1. Ve a "Auth Providers"
-- 2. Encuentra "Anonymous sign-ins"
-- 3. Toggle ON

-- Verificación de que está habilitado:
-- SELECT * FROM auth.config WHERE name = 'enable_anonymous_sign_ins';

SELECT 'Anonymous auth debe habilitarse desde Dashboard' as message;
SELECT 'Authentication → Providers → Anonymous → Enable' as instructions;

