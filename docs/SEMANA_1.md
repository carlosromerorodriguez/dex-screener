# SEMANA 1 — BASE SÓLIDA DE MINOTAURION ⚡

## 📋 RESUMEN

Convertir el repo base (React + Moralis) en una app robusta lista para escalar.

**Fecha:** 26 de Octubre, 2025  
**Estado:** ✅ COMPLETADO

---

## 🎯 OBJETIVOS CUMPLIDOS

- ✅ Gestión avanzada de `.env` con preservación de valores
- ✅ Cliente Moralis tipado con retry/backoff
- ✅ Wrapper HTTP con rate limiting
- ✅ Supabase inicial con auth y perfiles
- ✅ Control de errores con ErrorBoundary
- ✅ Utilidades (logger, numbers, time, featureFlags)
- ✅ Hooks para React (useSession, useProfile)
- ✅ Theming estable y sidebar persistente

---

## 📂 ESTRUCTURA CREADA

```
src/
├── lib/                        # Librerías core
│   ├── logger.ts              # Sistema de logging
│   ├── numbers.ts             # Formateo de números
│   ├── time.ts                # Utilidades de tiempo
│   ├── featureFlags.ts        # Control de características
│   ├── http.ts                # Cliente HTTP con ky
│   ├── moralisClient.ts       # Cliente tipado para Moralis
│   └── supabase.ts            # Cliente para Supabase
│
├── hooks/                      # React hooks personalizados
│   ├── useSession.ts          # Hook para sesión de usuario
│   └── useProfile.ts          # Hook para perfil de usuario
│
└── components/
    └── common/
        └── ErrorBoundary.tsx  # Componente para capturar errores

docs/
└── SEMANA_1.md                # Esta documentación
```

---

## 🔐 POLÍTICA DE `.env` (IMPORTANTE)

### ⚠️ REGLA DE ORO

**NUNCA borrar valores existentes con contenido en el `.env`**

### ✅ Permitido
- Modificar comentarios
- Añadir nuevas variables
- Cambiar valores vacíos (`KEY=`)
- Reorganizar estructura

### ❌ PROHIBIDO
- Borrar/sobrescribir valores con contenido (`KEY=valor_existente`)
- Eliminar API keys configuradas

### Proceso Implementado

```bash
# 1. Backup del .env
cp .env .env.backup

# 2. Extraer valores existentes
grep -E '^[A-Z0-9_]+=.+$' .env > /tmp/.env.preserve

# 3. Preservar valores en nueva versión
# (Los valores existentes se mantienen)
```

---

## 🔑 VARIABLES DE ENTORNO

### `.env` (Archivo Local)

```bash
# ================================
# MINOTAURION ⚡ - Environment Variables
# ================================

# APP CONFIGURATION
VITE_APP_NAME=MINOTAURION
VITE_LOG_LEVEL=info

# MORALIS API (REQUIRED) ✅ PRESERVADO
REACT_APP_MORALIS_API_KEY=eyJhbGci...

# SUPABASE
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# FEATURE FLAGS
VITE_FEATURE_SOCIAL=false
VITE_FEATURE_TRADING=false
VITE_FEATURE_BADGES=false
VITE_FEATURE_STREAMING=false
```

### Variables Activas

| Variable | Valor | Estado |
|----------|-------|--------|
| `REACT_APP_MORALIS_API_KEY` | ✅ Configurada | PRESERVADA |
| `VITE_SUPABASE_URL` | ⏳ Pendiente | Por configurar |
| `VITE_SUPABASE_ANON_KEY` | ⏳ Pendiente | Por configurar |
| `VITE_FEATURE_*` | false | Deshabilitadas |

---

## 📚 LIBRERÍAS IMPLEMENTADAS

### 1. Logger (`src/lib/logger.ts`)

Sistema de logging centralizado con niveles configurables.

**Características:**
- Niveles: debug, info, warn, error
- Timestamps automáticos
- Formato consistente con emojis
- Deshabilitado en producción (excepto errors)

**Uso:**
```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: '123' });
logger.error('API call failed', error);
logger.debug('Token data', tokenData);
```

---

### 2. Numbers (`src/lib/numbers.ts`)

Utilidades para formateo de números y precios.

**Funciones:**
- `formatPrice(price)` - Formatea precios en USD
- `formatNumber(num)` - Formatea con sufijos K/M/B
- `formatUSD(num)` - Formatea con $ y sufijos
- `formatPercentage(value)` - Formatea porcentajes
- `formatTokenAmount(amount)` - Formatea cantidades de tokens

**Uso:**
```typescript
import { formatPrice, formatUSD } from '@/lib/numbers';

formatPrice(0.00000123);    // "$0.00000123"
formatUSD(1500000);         // "$1.50M"
formatPercentage(5.25);     // "+5.25%"
```

---

### 3. Time (`src/lib/time.ts`)

Utilidades para manejo de fechas y tiempo.

**Funciones:**
- `formatTimeAgo(date)` - "hace 5m", "2h ago"
- `formatDate(date)` - "26 Oct 2025"
- `formatDuration(seconds)` - "2h 30m 45s"
- `now()` - Timestamp Unix actual
- `sleep(ms)` - Async delay
- `retryWithBackoff(fn)` - Retry con backoff exponencial

**Uso:**
```typescript
import { formatTimeAgo, sleep } from '@/lib/time';

formatTimeAgo(new Date());  // "ahora"
await sleep(1000);          // Espera 1 segundo
```

---

### 4. Feature Flags (`src/lib/featureFlags.ts`)

Control de características con variables de entorno.

**Características:**
- Activar/desactivar features sin deploy
- A/B testing
- Rollouts graduales
- Dark launches

**Uso:**
```typescript
import { featureFlags } from '@/lib/featureFlags';

if (featureFlags.isEnabled('trading')) {
  return <TradingInterface />;
}

// En desarrollo, puedes toggle temporalmente
featureFlags.enable('badges');  // Solo en DEV
```

---

### 5. HTTP Client (`src/lib/http.ts`)

Wrapper sobre ky con retry, rate limiting y logging.

**Características:**
- Retry automático con backoff exponencial
- Rate limiting configurable
- Logging de requests
- Timeout configurables
- Interceptores de error

**Uso:**
```typescript
import { http } from '@/lib/http';

// GET simple
const data = await http.get('/api/tokens');

// POST con body
const result = await http.post('/api/tokens', { name: 'PEPE' });

// Cliente con headers custom
const apiClient = http.extend({
  headers: {
    'Authorization': 'Bearer token'
  }
});

// Rate limiting
http.setRateLimit({ maxRequests: 10, perMs: 1000 });
```

---

### 6. Moralis Client (`src/lib/moralisClient.ts`)

Cliente tipado para Moralis API con todos los endpoints.

**Características:**
- Endpoints tipados con TypeScript
- Retry automático
- Rate limiting (25 req/s)
- Validación de respuestas
- Support para EVM y Solana

**Endpoints Disponibles:**
- `getTrendingTokens(chain?)`
- `searchTokens(query, chains?)`
- `getTokenMetadata(address, chain)`
- `getTokenPairs(address, chain)`
- `getPairStats(pairAddress, chain)`
- `getPairSwaps(pairAddress, chain)`
- `getPairSnipers(pairAddress, chain)`
- `getTokenHolders(address, chain)`
- `getWalletNetWorth(address, chains)`
- `getPumpFunNewTokens(limit)`
- `getPumpFunBondingTokens(limit)`
- `getPumpFunGraduatedTokens(limit)`

**Uso:**
```typescript
import { moralis } from '@/lib/moralisClient';

// Trending tokens
const tokens = await moralis.getTrendingTokens('0x1');

// Token pairs
const pairs = await moralis.getTokenPairs(tokenAddress, '0x1');

// Pump.fun tokens
const newTokens = await moralis.getPumpFunNewTokens(100);
```

---

### 7. Supabase Client (`src/lib/supabase.ts`)

Cliente para autenticación y base de datos.

**Características:**
- Auth (email/password + wallet futuro)
- Perfiles de usuario
- Badges y achievements
- Real-time subscriptions

**Métodos:**
- `signInWithEmail(email, password)`
- `signUpWithEmail(email, password, username?)`
- `signOut()`
- `getProfile(userId)`
- `upsertProfile(profile)`
- `getAllBadges()`
- `getUserBadges(userId)`
- `awardBadge(userId, badgeId)`

**Uso:**
```typescript
import { supabase } from '@/lib/supabase';

// Sign in
const { user } = await supabase.signInWithEmail(email, password);

// Get profile
const profile = await supabase.getProfile(userId);

// Update profile
await supabase.upsertProfile({ id: userId, username: 'minotaur' });
```

---

## 🎣 HOOKS DE REACT

### `useSession()`

Hook para gestionar sesión de usuario.

**Retorna:**
- `session` - Sesión actual
- `user` - Usuario actual
- `loading` - Estado de carga
- `error` - Error si existe
- `signOut()` - Función para cerrar sesión
- `refreshSession()` - Refrescar sesión

**Uso:**
```typescript
import { useSession } from '@/hooks/useSession';

function MyComponent() {
  const { session, user, loading, signOut } = useSession();
  
  if (loading) return <Spinner />;
  if (!user) return <Login />;
  
  return <div>Welcome {user.email}</div>;
}
```

---

### `useProfile()`

Hook para gestionar perfil de usuario.

**Retorna:**
- `profile` - Perfil del usuario
- `loading` - Estado de carga
- `error` - Error si existe
- `updateProfile(updates)` - Actualizar perfil
- `refreshProfile()` - Refrescar perfil

**Uso:**
```typescript
import { useProfile } from '@/hooks/useProfile';

function ProfileCard() {
  const { profile, loading, updateProfile } = useProfile();
  
  if (loading) return <Spinner />;
  if (!profile) return <CreateProfile />;
  
  return (
    <div>
      <h1>{profile.username}</h1>
      <p>Level {profile.level} - {profile.total_xp} XP</p>
    </div>
  );
}
```

---

## 🛡️ ERROR BOUNDARY

Componente para capturar errores globales de React.

**Características:**
- UI de fallback personalizada
- Logging automático
- Reset manual
- Stack trace en desarrollo

**Uso:**
```typescript
import ErrorBoundary from '@/components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

---

## 🗄️ SUPABASE SCHEMA (SQL Inicial)

### Tabla: `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  twitter TEXT,
  telegram TEXT,
  discord TEXT,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Tabla: `badges`

```sql
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER DEFAULT 0,
  criteria JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);
```

### Tabla: `user_badges`

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);
```

---

## 📦 DEPENDENCIAS AÑADIDAS

```json
{
  "dependencies": {
    "ky": "^1.7.3",
    "@supabase/supabase-js": "^2.46.1"
  }
}
```

---

## ✅ CHECKLIST SEMANA 1

- ✅ `.env` y `.env.example` actualizados sin borrar claves existentes
- ✅ `/src/lib/` con logger, numbers, time, featureFlags, http, moralisClient, supabase
- ✅ Theming global estable (sidebar fijo + UI coherente)
- ✅ Supabase inicial (auth + tablas mínimas)
- ✅ Hooks `useSession()` y `useProfile()`
- ✅ `ErrorBoundary` global
- ✅ Documentación completa en `docs/SEMANA_1.md`

---

## 🚀 PRÓXIMOS PASOS (SEMANA 2)

1. **QA Tools:**
   - ESLint + Prettier
   - Husky + lint-staged
   - GitHub Actions CI/CD

2. **Testing:**
   - Jest configuración
   - Tests unitarios para utils
   - Tests de integración para hooks

3. **Supabase Setup:**
   - Crear proyecto en Supabase
   - Ejecutar SQL migrations
   - Configurar RLS policies
   - Configurar variables VITE_SUPABASE_*

4. **Features:**
   - Implementar login/signup UI
   - Profile page
   - Badges system
   - Leaderboards

---

## 📝 NOTAS IMPORTANTES

### Preservación de `.env`

El archivo `.env` contiene la API key de Moralis configurada y funcionando. Esta clave ha sido **preservada** durante todas las actualizaciones. Nunca se sobrescribe automáticamente.

### Feature Flags

Todos los features avanzados están **deshabilitados** por defecto:
- Social: `false`
- Trading: `false`
- Badges: `false`
- Streaming: `false`

Se activarán gradualmente en próximas semanas.

### Moralis Rate Limit

El cliente está configurado con rate limiting de **25 req/s** (free tier de Moralis). Si necesitas más, actualiza el plan o ajusta el rate limit en `moralisClient.ts`.

---

## 🐛 DEBUGGING

### Logs en Consola

```bash
# Ver logs de la app
[timestamp] ℹ️ INFO: MoralisClient initialized
[timestamp] 🔍 DEBUG: HTTP GET /tokens/trending
[timestamp] ⚠️ WARN: Supabase not configured
```

### Error Handling

Todos los errores se logean automáticamente con:
- Timestamp
- Stack trace (en desarrollo)
- Contexto adicional
- Emoji visual para rápida identificación

---

**MINOTAURION ⚡ — Base Sólida Establecida**  
*Only the Brave Trade Here*

**Desarrollador:** Team Minotaurion  
**Fecha:** 26 de Octubre, 2025

