-- ============================================================================
-- MINOTAURION ⚡ - SUPABASE SCHEMA (SEMANA 2)
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Abre tu proyecto Supabase: https://supabase.com/dashboard
-- 2. Ve a SQL Editor
-- 3. Copia y pega TODO este archivo
-- 4. Ejecuta (Run)
-- 
-- NOTA: Este script es idempotente (se puede ejecutar múltiples veces)
-- ============================================================================

-- Habilitar extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================================
-- TABLA: PROFILES
-- ============================================================================
-- Perfil de usuario (1 fila por usuario autenticado)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  wallet_address text,
  avatar_url text,
  bio text,
  xp integer not null default 0,
  level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Constraints
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 30),
  constraint bio_length check (char_length(bio) <= 500)
);

-- Índices para búsquedas rápidas
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_wallet on public.profiles(wallet_address);

-- ============================================================================
-- TABLA: BADGES
-- ============================================================================
-- Catálogo de insignias/logros disponibles

create table if not exists public.badges (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  description text,
  rarity text check (rarity in ('common', 'rare', 'epic', 'mythic', 'secret')) not null default 'common',
  xp_reward integer not null default 0,
  is_hidden boolean not null default false,
  icon_url text,
  created_at timestamptz not null default now(),
  
  -- Constraints
  constraint slug_format check (slug ~ '^[a-z0-9-]+$')
);

-- Índice para búsquedas por rarity
create index if not exists idx_badges_rarity on public.badges(rarity);

-- ============================================================================
-- TABLA: USER_BADGES
-- ============================================================================
-- Relación muchos-a-muchos: usuarios y sus badges ganados

create table if not exists public.user_badges (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id bigint not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  
  -- Un usuario no puede tener el mismo badge dos veces
  unique (user_id, badge_id)
);

-- Índices para queries rápidas
create index if not exists idx_user_badges_user on public.user_badges(user_id);
create index if not exists idx_user_badges_badge on public.user_badges(badge_id);

-- ============================================================================
-- TABLA: FOLLOWS
-- ============================================================================
-- Sistema de seguimiento entre usuarios

create table if not exists public.follows (
  follower uuid not null references public.profiles(id) on delete cascade,
  following uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  
  -- Primary key compuesta
  primary key (follower, following),
  
  -- Un usuario no puede seguirse a sí mismo
  check (follower <> following)
);

-- Índices para queries de followers/following
create index if not exists idx_follows_follower on public.follows(follower);
create index if not exists idx_follows_following on public.follows(following);

-- ============================================================================
-- FUNCIÓN: ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para profiles
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNCIÓN: CREAR PERFIL AUTOMÁTICAMENTE AL REGISTRARSE
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    'user_' || substr(new.id::text, 1, 8)  -- username temporal
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger para crear perfil automáticamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
alter table public.profiles enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.follows enable row level security;

-- ============================================================================
-- POLÍTICAS: PROFILES
-- ============================================================================

-- Lectura: Todos pueden ver todos los perfiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" 
on public.profiles for select 
using (true);

-- Inserción: Solo puede crear su propio perfil
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" 
on public.profiles for insert 
with check (auth.uid() = id);

-- Actualización: Solo puede actualizar su propio perfil
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" 
on public.profiles for update 
using (auth.uid() = id);

-- ============================================================================
-- POLÍTICAS: BADGES
-- ============================================================================

-- Lectura: Todos pueden ver badges públicos
drop policy if exists "badges_select_public" on public.badges;
create policy "badges_select_public" 
on public.badges for select 
using (not is_hidden or exists (
  select 1 from public.user_badges 
  where user_badges.badge_id = badges.id 
  and user_badges.user_id = auth.uid()
));

-- ============================================================================
-- POLÍTICAS: USER_BADGES
-- ============================================================================

-- Lectura: Todos pueden ver badges de todos los usuarios
drop policy if exists "user_badges_select_all" on public.user_badges;
create policy "user_badges_select_all" 
on public.user_badges for select 
using (true);

-- Inserción: Solo usuarios autenticados pueden ganar badges
-- NOTA: En producción, esto debería ser una función edge o trigger
drop policy if exists "user_badges_insert_own" on public.user_badges;
create policy "user_badges_insert_own" 
on public.user_badges for insert 
with check (auth.uid() = user_id);

-- ============================================================================
-- POLÍTICAS: FOLLOWS
-- ============================================================================

-- Lectura: Todos pueden ver quién sigue a quién
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all" 
on public.follows for select 
using (true);

-- Inserción: Solo puedes seguir si eres el follower
drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own" 
on public.follows for insert 
with check (auth.uid() = follower);

-- Eliminación: Solo puedes dejar de seguir si eres el follower
drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own" 
on public.follows for delete 
using (auth.uid() = follower);

-- ============================================================================
-- FUNCIONES RPC PARA EL CLIENTE
-- ============================================================================

-- Obtener estadísticas de un usuario
create or replace function public.get_user_stats(user_id uuid)
returns json language sql stable as $$
  select json_build_object(
    'total_badges', (select count(*) from public.user_badges where user_badges.user_id = get_user_stats.user_id),
    'total_followers', (select count(*) from public.follows where follows.following = get_user_stats.user_id),
    'total_following', (select count(*) from public.follows where follows.follower = get_user_stats.user_id),
    'xp', (select xp from public.profiles where id = get_user_stats.user_id),
    'level', (select level from public.profiles where id = get_user_stats.user_id)
  );
$$;

-- Verificar si un usuario sigue a otro
create or replace function public.is_following(follower_id uuid, following_id uuid)
returns boolean language sql stable as $$
  select exists(
    select 1 from public.follows 
    where follower = follower_id 
    and following = following_id
  );
$$;

-- ============================================================================
-- DATOS INICIALES: BADGES DE EJEMPLO
-- ============================================================================

-- Solo insertar si la tabla está vacía
insert into public.badges (slug, name, description, rarity, xp_reward, icon_url)
select * from (values
  ('first-trade', 'First Trade', 'Made your first trade on MINOTAURION', 'common', 10, null),
  ('beast-hunter', 'Beast Hunter', 'Discovered 10 trending tokens before they pumped', 'rare', 50, null),
  ('diamond-hands', 'Diamond Hands', 'Held a position for over 30 days', 'epic', 100, null),
  ('labyrinth-lord', 'Labyrinth Lord', 'Navigated the market maze successfully 50 times', 'mythic', 250, null),
  ('minos-secret', 'Minos'' Secret', 'Discovered the hidden easter egg...', 'secret', 500, null),
  ('early-adopter', 'Early Adopter', 'Joined MINOTAURION in the first 100 users', 'rare', 75, null),
  ('portfolio-master', 'Portfolio Master', 'Managed a portfolio worth over $10k', 'epic', 150, null),
  ('social-butterfly', 'Social Butterfly', 'Made 50 connections in the community', 'common', 25, null)
) as data(slug, name, description, rarity, xp_reward, icon_url)
where not exists (select 1 from public.badges limit 1);

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================

-- Verificación: Contar tablas creadas
select 
  'Schema creado exitosamente!' as message,
  (select count(*) from public.profiles) as total_profiles,
  (select count(*) from public.badges) as total_badges;

