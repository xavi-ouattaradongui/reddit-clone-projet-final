-- =====================================================================
--  ザビ21_3 — schéma de la base de données Supabase
--  À exécuter UNE FOIS dans Supabase : SQL Editor → New query → coller → Run
--  Le script peut être relancé sans erreur (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILS (un profil public par compte)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique
              check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  bio         text check (char_length(bio) <= 300),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Création automatique du profil à l'inscription
-- (le pseudo est envoyé dans les métadonnées par le frontend)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Permet au formulaire d'inscription de vérifier si un pseudo est libre
create or replace function public.username_available(name text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;

-- ---------------------------------------------------------------------
-- 2. COMMUNAUTÉS (subreddits)
-- ---------------------------------------------------------------------
create table if not exists public.subreddits (
  id           bigint generated always as identity primary key,
  name         text not null check (name ~ '^[A-Za-z0-9_]{3,21}$'),
  description  text check (char_length(description) <= 500),
  created_by   uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now()
);
create unique index if not exists subreddits_name_lower_idx on public.subreddits (lower(name));

-- ---------------------------------------------------------------------
-- 3. POSTS (texte et/ou image)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id            bigint generated always as identity primary key,
  subreddit_id  bigint not null references public.subreddits (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null default auth.uid(),
  title         text not null check (char_length(title) between 1 and 300),
  content       text check (char_length(content) <= 40000),
  image_url     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
create index if not exists posts_subreddit_idx on public.posts (subreddit_id, created_at desc);
create index if not exists posts_author_idx    on public.posts (author_id);

-- ---------------------------------------------------------------------
-- 4. COMMENTAIRES
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null default auth.uid(),
  content     text not null check (char_length(content) between 1 and 10000),
  created_at  timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- ---------------------------------------------------------------------
-- 5. VOTES (+1 / -1, un vote par personne et par post)
-- ---------------------------------------------------------------------
create table if not exists public.votes (
  post_id  bigint not null references public.posts (id) on delete cascade,
  user_id  uuid   not null references public.profiles (id) on delete cascade default auth.uid(),
  value    smallint not null check (value in (-1, 1)),
  primary key (post_id, user_id)
);

-- Date de modification automatique des posts
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update of title, content, image_url on public.posts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. VUE « fil d'actualité » : post + auteur + communauté + score + nb de commentaires
-- ---------------------------------------------------------------------
create or replace view public.post_feed
with (security_invoker = true) as
select
  p.id,
  p.title,
  p.content,
  p.image_url,
  p.created_at,
  p.updated_at,
  p.subreddit_id,
  s.name                                                        as subreddit_name,
  p.author_id,
  pr.username                                                   as author_username,
  pr.avatar_url                                                 as author_avatar_url,
  coalesce((select sum(v.value) from public.votes v where v.post_id = p.id), 0)::int  as score,
  (select count(*) from public.comments c where c.post_id = p.id)::int              as comment_count
from public.posts p
join public.subreddits s on s.id = p.subreddit_id
left join public.profiles pr on pr.id = p.author_id;

-- ---------------------------------------------------------------------
-- 7. SÉCURITÉ (Row Level Security)
--    Tout le monde peut lire. Il faut être connecté pour écrire.
--    On ne peut modifier / supprimer que ce qu'on a créé.
-- ---------------------------------------------------------------------
alter table public.profiles   enable row level security;
alter table public.subreddits enable row level security;
alter table public.posts      enable row level security;
alter table public.comments   enable row level security;
alter table public.votes      enable row level security;

-- profiles
drop policy if exists "profiles lisibles par tous"  on public.profiles;
drop policy if exists "profil modifiable par son propriétaire" on public.profiles;
create policy "profiles lisibles par tous" on public.profiles
  for select using (true);
create policy "profil modifiable par son propriétaire" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- subreddits
drop policy if exists "subreddits lisibles par tous"   on public.subreddits;
drop policy if exists "subreddits créés par un connecté" on public.subreddits;
drop policy if exists "subreddits modifiables par le créateur" on public.subreddits;
drop policy if exists "subreddits supprimables par le créateur" on public.subreddits;
create policy "subreddits lisibles par tous" on public.subreddits
  for select using (true);
create policy "subreddits créés par un connecté" on public.subreddits
  for insert to authenticated with check (created_by = auth.uid());
create policy "subreddits modifiables par le créateur" on public.subreddits
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "subreddits supprimables par le créateur" on public.subreddits
  for delete to authenticated using (created_by = auth.uid());

-- posts
drop policy if exists "posts lisibles par tous"    on public.posts;
drop policy if exists "posts créés par un connecté" on public.posts;
drop policy if exists "posts modifiables par l'auteur" on public.posts;
drop policy if exists "posts supprimables par l'auteur" on public.posts;
create policy "posts lisibles par tous" on public.posts
  for select using (true);
create policy "posts créés par un connecté" on public.posts
  for insert to authenticated with check (author_id = auth.uid());
create policy "posts modifiables par l'auteur" on public.posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts supprimables par l'auteur" on public.posts
  for delete to authenticated using (author_id = auth.uid());

-- comments
drop policy if exists "commentaires lisibles par tous"    on public.comments;
drop policy if exists "commentaires créés par un connecté" on public.comments;
drop policy if exists "commentaires supprimables par l'auteur" on public.comments;
create policy "commentaires lisibles par tous" on public.comments
  for select using (true);
create policy "commentaires créés par un connecté" on public.comments
  for insert to authenticated with check (author_id = auth.uid());
create policy "commentaires supprimables par l'auteur" on public.comments
  for delete to authenticated using (author_id = auth.uid());

-- votes
drop policy if exists "votes lisibles par tous" on public.votes;
drop policy if exists "vote ajouté par soi"     on public.votes;
drop policy if exists "vote modifié par soi"    on public.votes;
drop policy if exists "vote retiré par soi"     on public.votes;
create policy "votes lisibles par tous" on public.votes
  for select using (true);
create policy "vote ajouté par soi" on public.votes
  for insert to authenticated with check (user_id = auth.uid());
create policy "vote modifié par soi" on public.votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vote retiré par soi" on public.votes
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8. STOCKAGE DES IMAGES (bucket public « post-images »)
--    Chaque utilisateur envoie ses fichiers dans un dossier à son id.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "images lisibles par tous"       on storage.objects;
drop policy if exists "images envoyées dans son dossier" on storage.objects;
drop policy if exists "images supprimées de son dossier" on storage.objects;
create policy "images lisibles par tous" on storage.objects
  for select using (bucket_id = 'post-images');
create policy "images envoyées dans son dossier" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "images supprimées de son dossier" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = auth.uid()::text);
