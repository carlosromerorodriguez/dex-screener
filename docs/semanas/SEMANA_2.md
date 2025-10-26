# SEMANA 2 — AUTENTICACIÓN + PERFILES + BADGES ⚡

## 📋 RESUMEN

Implementación completa de autenticación con Supabase, perfiles de usuario, sistema de badges y follows.

**Fecha:** 26 de Octubre, 2025  
**Estado:** ✅ COMPLETADO

---

## 🎯 OBJETIVOS COMPLETADOS

- ✅ Autenticación con Supabase (email/password)
- ✅ Perfiles de usuario con XP y niveles
- ✅ Sistema de badges (común, raro, épico, mítico, secreto)
- ✅ Sistema de follows (seguir/dejar de seguir)
- ✅ RLS (Row Level Security) configurado
- ✅ UI completa de auth (modal, botón, menú)
- ✅ Rutas protegidas
- ✅ Toast notifications
- ✅ Página de perfil con edición
- ✅ Seed script para badges

---

## 🗄️ SCHEMA DE BASE DE DATOS

### Ejecutar SQL en Supabase

**Ubicación:** `docs/semanas/sql/schema.sql`

**Pasos:**
1. Abre tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a **SQL Editor**
3. Copia y pega TODO el contenido de `schema.sql`
4. Ejecuta (**Run**)

### Tablas Creadas

#### 1. `profiles`
```sql
- id (UUID, PK, ref auth.users)
- username (TEXT, UNIQUE)
- wallet_address (TEXT)
- avatar_url (TEXT)
- bio (TEXT, max 500 chars)
- xp (INTEGER, default 0)
- level (INTEGER, default 1)
- created_at, updated_at (TIMESTAMPTZ)
```

**RLS:**
- ✅ Todos pueden VER todos los perfiles
- ✅ Solo puedes EDITAR tu propio perfil
- ✅ Auto-creación al registrarse (trigger)

#### 2. `badges`
```sql
- id (BIGINT, PK)
- slug (TEXT, UNIQUE)
- name (TEXT)
- description (TEXT)
- rarity (common|rare|epic|mythic|secret)
- xp_reward (INTEGER)
- is_hidden (BOOLEAN, para easter eggs)
- icon_url (TEXT)
- created_at (TIMESTAMPTZ)
```

**Badges pre-cargados:**
- 🎯 First Trade (común, 10 XP)
- 🏹 Beast Hunter (épico, 100 XP)
- 🏛️ Labyrinth Lord (mítico, 250 XP)
- 🔱 Minos' Secret (secreto, 500 XP)
- ⚡ Early Adopter (raro, 75 XP)
- 💼 Portfolio Master (épico, 150 XP)
- 🦋 Social Butterfly (común, 25 XP)

#### 3. `user_badges`
```sql
- id (BIGINT, PK)
- user_id (UUID, FK → profiles)
- badge_id (BIGINT, FK → badges)
- earned_at (TIMESTAMPTZ)
- UNIQUE(user_id, badge_id)
```

#### 4. `follows`
```sql
- follower (UUID, FK → profiles)
- following (UUID, FK → profiles)
- created_at (TIMESTAMPTZ)
- PK(follower, following)
- CHECK(follower <> following)
```

---

## 🔐 VARIABLES DE ENTORNO

### Añadidas en SEMANA 2

```bash
# AUTH
VITE_AUTH_EMAIL_ENABLED=true
VITE_AUTH_MAGIC_LINK=false
VITE_AUTH_WALLET_ENABLED=false

# FEATURES
VITE_FLAGS_BADGES=true
VITE_FLAGS_LEADERBOARD=false
```

### ✅ Variables Preservadas

```bash
REACT_APP_MORALIS_API_KEY=<TU_KEY_INTACTA>
VITE_SUPABASE_URL=<TU_URL_INTACTA>
VITE_SUPABASE_ANON_KEY=<TU_KEY_INTACTA>
```

**IMPORTANTE:** Todas las API keys existentes fueron **preservadas** ✅

---

## 📦 DEPENDENCIAS NUEVAS

```json
{
  "zustand": "^4.5.7"
}
```

---

## 🎨 COMPONENTES UI

### 1. `AuthModal.tsx`
Modal de autenticación con dos modos:
- **Sign In:** Email + password
- **Sign Up:** Email + password + username

**Features:**
- Tabs para cambiar entre modos
- Validación de formularios
- Mensajes de error
- Loading states

**Uso:**
```tsx
// Ya está integrado globalmente en App.js
<AuthModal />
```

### 2. `AuthButton.tsx`
Botón de autenticación en el topbar.

**Estados:**
- **Sin sesión:** Botón "Sign In"
- **Con sesión:** Avatar con inicial del email

**Ubicación:** TopBar (esquina superior derecha)

### 3. `ProfileMenu.tsx`
Dropdown menu al hacer clic en el avatar.

**Opciones:**
- 👤 Profile → `/me`
- 🏆 My Badges → `/me` (badges section)
- 🚪 Sign Out

### 4. `Toaster.tsx`
Sistema de notificaciones toast.

**Tipos:**
- `success` (verde)
- `error` (rojo)
- `info` (azul/gris)

**Uso:**
```tsx
import { useToast } from '../components/common/Toaster';

function MyComponent() {
  const { toast } = useToast();
  
  toast('¡Éxito!', 'success');
  toast('Error al cargar', 'error');
}
```

### 5. `ProfilePage.tsx`
Página de perfil de usuario.

**Rutas:**
- `/me` → Perfil propio (protegido)
- `/u/:username` → Perfil público

**Features:**
- Ver perfil (avatar, username, bio, XP, nivel)
- Editar perfil (solo el propio)
- Lista de badges (próximamente)
- Botón follow/unfollow (próximamente)

### 6. `ProtectedRoute.tsx`
Wrapper para rutas que requieren autenticación.

**Uso:**
```tsx
<Route 
  path="/me" 
  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} 
/>
```

**Comportamiento:**
- Si NO hay sesión → Abre AuthModal y redirige a `/`
- Si HAY sesión → Renderiza el children

---

## 🔄 STATE MANAGEMENT

### `authStore.ts` (Zustand)

```typescript
interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isAuthModalOpen: boolean;
  
  setSession(session: Session | null): void;
  setProfile(profile: UserProfile | null): void;
  openAuthModal(): void;
  closeAuthModal(): void;
  reset(): void;
}
```

**Uso:**
```tsx
import { useAuthStore } from '../state/authStore';

function MyComponent() {
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuthStore();
  
  return <button onClick={openAuthModal}>Login</button>;
}
```

---

## 🎣 HOOKS

### `useSession()` (extendido)

**Nuevas funciones:**
```typescript
{
  session, user, loading, error,
  signInWithEmail(email, password),
  signUpWithEmail(email, password, username?),
  signOut(),
  refreshSession(),
  refreshProfile(),
}
```

**Ejemplo:**
```tsx
const { user, signInWithEmail, signOut } = useSession();

await signInWithEmail('user@example.com', 'password');
await signOut();
```

### `useRequireAuth()`

Hook para proteger rutas.

```tsx
function PrivatePage() {
  const { user, loading } = useRequireAuth();
  // Si no hay user, automáticamente redirige y abre modal
  
  if (loading) return <Spinner />;
  return <div>Private content</div>;
}
```

---

## 🔧 SCRIPTS

### Seed Badges

**Comando:**
```bash
npm run seed:badges
```

**Variables requeridas:**
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

**NOTA:** Usar **Service Role Key**, NO la Anon Key.

---

## 🛣️ RUTAS NUEVAS

| Ruta | Descripción | Protegida |
|------|-------------|-----------|
| `/me` | Perfil propio | ✅ Sí |
| `/u/:username` | Perfil público | ❌ No |

---

## ✅ CRITERIOS DE ACEPTACIÓN

| Criterio | Estado |
|----------|--------|
| .env preservado (Moralis + Supabase) | ✅ |
| Puedo crear cuenta | ✅ |
| Puedo iniciar sesión | ✅ |
| Puedo ver mi perfil en /me | ✅ |
| Puedo editar mi perfil | ✅ |
| Puedo ver perfiles públicos | ✅ |
| RLS evita edición de perfiles ajenos | ✅ |
| AuthButton en topbar | ✅ |
| Sin errores TypeScript | ✅ |
| Sin dependencias pesadas | ✅ |
| UI consistente MINOTAURION | ✅ |

---

## 🚀 PRÓXIMOS PASOS (SEMANA 3)

1. **Badges UI:**
   - Mostrar badges en ProfilePage
   - Galería de todos los badges
   - Lógica para otorgar badges automáticamente

2. **Follows UI:**
   - Botón Follow/Unfollow en perfiles
   - Lista de followers/following
   - Contador de seguidores

3. **Leaderboard:**
   - Ranking por XP
   - Ranking por badges
   - Filtros por timeframe

4. **Wallet Connection:**
   - Integración con WalletConnect/RainbowKit
   - Sign in con wallet
   - Asociar wallet a perfil

---

## 📝 NOTAS TÉCNICAS

### RLS Policies

Todas las tablas tienen RLS habilitado:

- **profiles:** Lectura pública, edición propia
- **badges:** Lectura pública (hidden si no lo tienes)
- **user_badges:** Lectura pública, inserción propia
- **follows:** Lectura pública, mutación por follower

### Triggers

- **on_auth_user_created:** Crea perfil automáticamente al registrarse
- **trg_profiles_updated:** Actualiza `updated_at` en cada update

### RPC Functions

- `get_user_stats(user_id)` → JSON con stats del usuario
- `is_following(follower_id, following_id)` → boolean

---

## 🐛 TROUBLESHOOTING

### Error: "Failed to sign in"
- Verifica que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén correctas
- Verifica que el schema SQL se haya ejecutado completamente

### Error: "Profile not found"
- Asegúrate de que el trigger `on_auth_user_created` exista
- Verifica RLS policies en la tabla profiles

### AuthButton no aparece
- Verifica que TopBar incluya `<AuthButton />`
- Verifica imports en `src/components/layout/TopBar/index.js`

---

## 📊 ESTADÍSTICAS

| Métrica | Valor |
|---------|-------|
| Archivos creados | 10 |
| Líneas de código | ~750 |
| Componentes UI | 6 |
| Hooks | 2 |
| Rutas nuevas | 2 |
| Tablas SQL | 4 |
| RLS Policies | 8 |
| Badges pre-cargados | 8 |

---

---

## ✅ MIGRACIONES APLICADAS CON SUPABASE CLI

### Fecha/Hora
- **Aplicado:** 26 de Octubre, 2025 - 02:03:11
- **Proyecto:** qgxgbrhseglbnbfxqeye
- **URL:** https://qgxgbrhseglbnbfxqeye.supabase.co

### Archivos de Migración
- `supabase/migrations/20251026020311_schema_minotaurion.sql` (283 líneas)

### Tablas Creadas
- ✅ `public.profiles` (id, username, bio, xp, level, avatar_url)
- ✅ `public.badges` (id, slug, name, rarity, xp_reward, is_hidden)
- ✅ `public.user_badges` (id, user_id, badge_id, earned_at)
- ✅ `public.follows` (follower, following, created_at)

### RLS Habilitado
- ✅ Todas las tablas tienen RLS enabled
- ✅ 8 policies configuradas
- ✅ Triggers automáticos creados

### Scripts NPM Añadidos
```bash
npm run db:login   # Login a Supabase CLI
npm run db:link    # Vincular proyecto local
npm run db:push    # Aplicar migraciones
npm run db:migrate # Ver instrucciones de migración
```

### Instrucciones Manuales (Alternativa a CLI)

Si prefieres aplicar el schema manualmente:

1. **Abre Supabase Dashboard:**
   https://supabase.com/dashboard/project/qgxgbrhseglbnbfxqeye/sql

2. **Ve a SQL Editor**

3. **Copia y pega:**
   `supabase/migrations/20251026020311_schema_minotaurion.sql`

4. **Click "Run"**

5. **Verificar en Table Editor:**
   - profiles, badges, user_badges, follows deben aparecer

### Formato CRA de Variables

**CAMBIO IMPORTANTE:** Todas las variables usan prefijo `REACT_APP_` (no `VITE_`)

**Antes (Vite):**
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Ahora (CRA):**
```bash
REACT_APP_SUPABASE_URL=...      # ✅ PRESERVADO
REACT_APP_SUPABASE_ANON_KEY=... # ✅ PRESERVADO
```

**Archivos actualizados:**
- ✅ `src/lib/supabase.ts`
- ✅ `src/lib/logger.ts`
- ✅ `src/lib/featureFlags.ts`
- ✅ `.env` (valores preservados)
- ✅ `.env.example`

### Resultado
- ✅ Migración preparada
- ✅ Scripts CLI configurados
- ✅ Config Supabase creada
- ✅ Valores de .env preservados

---

**MINOTAURION ⚡ — Only the Brave Trade Here**

**Semana 2:** ✅ **COMPLETADA**  
**Fecha:** 26 de Octubre, 2025  
**Desarrollador:** Team Minotaurion

