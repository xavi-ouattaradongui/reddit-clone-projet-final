-- =====================================================================
--  ザビ21_3 — fonctionnalités « Reddit » (v2.1)
--  À exécuter APRÈS schema.sql, dans Supabase : SQL Editor → coller → Run
--  Peut être relancé sans risque (idempotent). Ne supprime aucune donnée.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. POSTS « LIEN » (en plus de texte / image)
-- ---------------------------------------------------------------------
alter table public.posts add column if not exists url text
  check (url is null or url ~* '^https?://');

-- ---------------------------------------------------------------------
-- 2. COMMUNAUTÉS : icône, bannière, règles + MEMBRES
-- ---------------------------------------------------------------------
alter table public.subreddits add column if not exists icon_url   text;
alter table public.subreddits add column if not exists banner_url text;
alter table public.subreddits add column if not exists rules      text
  check (char_length(rules) <= 2000);

create table if not exists public.memberships (
  subreddit_id bigint not null references public.subreddits (id) on delete cascade,
  user_id      uuid   not null references public.profiles (id) on delete cascade default auth.uid(),
  created_at   timestamptz not null default now(),
  primary key (subreddit_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships (user_id);

-- Le créateur rejoint automatiquement sa communauté
create or replace function public.join_own_subreddit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.memberships (subreddit_id, user_id)
    values (new.id, new.created_by) on conflict do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists subreddits_join_creator on public.subreddits;
create trigger subreddits_join_creator
  after insert on public.subreddits
  for each row execute function public.join_own_subreddit();

-- ---------------------------------------------------------------------
-- 3. COMMENTAIRES EN FIL : réponses, modification, suppression « douce »
-- ---------------------------------------------------------------------
alter table public.comments add column if not exists parent_id bigint
  references public.comments (id) on delete cascade;
alter table public.comments add column if not exists updated_at timestamptz;
alter table public.comments add column if not exists deleted boolean not null default false;
create index if not exists comments_parent_idx on public.comments (parent_id);

drop trigger if exists comments_touch_updated_at on public.comments;
create trigger comments_touch_updated_at
  before update of content on public.comments
  for each row execute function public.touch_updated_at();

-- Votes sur les commentaires
create table if not exists public.comment_votes (
  comment_id bigint not null references public.comments (id) on delete cascade,
  user_id    uuid   not null references public.profiles (id) on delete cascade default auth.uid(),
  value      smallint not null check (value in (-1, 1)),
  primary key (comment_id, user_id)
);

-- ---------------------------------------------------------------------
-- 4. POSTS SAUVEGARDÉS (visibles uniquement par leur propriétaire)
-- ---------------------------------------------------------------------
create table if not exists public.saved_posts (
  user_id    uuid   not null references public.profiles (id) on delete cascade default auth.uid(),
  post_id    bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---------------------------------------------------------------------
-- 5. VUES
-- ---------------------------------------------------------------------
-- Fil de posts : on la recrée pour ajouter le lien, l'icône et le score « hot »
drop view if exists public.post_feed;
create view public.post_feed
with (security_invoker = true) as
select
  p.id,
  p.title,
  p.content,
  p.image_url,
  p.url,
  p.created_at,
  p.updated_at,
  p.subreddit_id,
  s.name        as subreddit_name,
  s.icon_url    as subreddit_icon_url,
  p.author_id,
  pr.username   as author_username,
  pr.avatar_url as author_avatar_url,
  st.score,
  st.comment_count,
  -- Algorithme « hot » de Reddit : le score compte de façon logarithmique,
  -- et chaque tranche de 12,5 h d'ancienneté vaut un facteur 10 de votes.
  round((sign(st.score) * log(greatest(abs(st.score), 1))
         + extract(epoch from p.created_at) / 45000)::numeric, 7) as hot
from public.posts p
join public.subreddits s on s.id = p.subreddit_id
left join public.profiles pr on pr.id = p.author_id
cross join lateral (
  select
    coalesce((select sum(v.value) from public.votes v where v.post_id = p.id), 0)::int as score,
    (select count(*) from public.comments c where c.post_id = p.id and not c.deleted)::int as comment_count
) st;

-- Commentaires avec auteur et score
create or replace view public.comment_feed
with (security_invoker = true) as
select
  c.id,
  c.post_id,
  c.parent_id,
  case when c.deleted then null else c.content end as content,
  c.deleted,
  c.created_at,
  c.updated_at,
  c.author_id,
  case when c.deleted then null else pr.username end   as author_username,
  case when c.deleted then null else pr.avatar_url end as author_avatar_url,
  coalesce((select sum(v.value) from public.comment_votes v where v.comment_id = c.id), 0)::int as score,
  p.title as post_title,
  s.name  as subreddit_name
from public.comments c
join public.posts p on p.id = c.post_id
join public.subreddits s on s.id = p.subreddit_id
left join public.profiles pr on pr.id = c.author_id;

-- Communautés avec nombre de membres et de posts
create or replace view public.subreddit_stats
with (security_invoker = true) as
select
  s.*,
  (select count(*) from public.memberships m where m.subreddit_id = s.id)::int as member_count,
  (select count(*) from public.posts p where p.subreddit_id = s.id)::int       as post_count
from public.subreddits s;

-- Karma des utilisateurs
create or replace view public.profile_stats
with (security_invoker = true) as
select
  pr.id,
  coalesce((select sum(v.value) from public.votes v
            join public.posts p on p.id = v.post_id
            where p.author_id = pr.id), 0)::int as post_karma,
  coalesce((select sum(v.value) from public.comment_votes v
            join public.comments c on c.id = v.comment_id
            where c.author_id = pr.id), 0)::int as comment_karma
from public.profiles pr;

-- ---------------------------------------------------------------------
-- 6. SÉCURITÉ (RLS)
-- ---------------------------------------------------------------------
alter table public.memberships   enable row level security;
alter table public.comment_votes enable row level security;
alter table public.saved_posts   enable row level security;

-- memberships : tout le monde voit qui est membre, chacun gère les siennes
drop policy if exists "membres visibles par tous" on public.memberships;
drop policy if exists "rejoindre soi-même"        on public.memberships;
drop policy if exists "quitter soi-même"          on public.memberships;
create policy "membres visibles par tous" on public.memberships
  for select using (true);
create policy "rejoindre soi-même" on public.memberships
  for insert to authenticated with check (user_id = auth.uid());
create policy "quitter soi-même" on public.memberships
  for delete to authenticated using (user_id = auth.uid());

-- comment_votes
drop policy if exists "votes commentaires lisibles"  on public.comment_votes;
drop policy if exists "vote commentaire ajouté"      on public.comment_votes;
drop policy if exists "vote commentaire modifié"     on public.comment_votes;
drop policy if exists "vote commentaire retiré"      on public.comment_votes;
create policy "votes commentaires lisibles" on public.comment_votes
  for select using (true);
create policy "vote commentaire ajouté" on public.comment_votes
  for insert to authenticated with check (user_id = auth.uid());
create policy "vote commentaire modifié" on public.comment_votes
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "vote commentaire retiré" on public.comment_votes
  for delete to authenticated using (user_id = auth.uid());

-- saved_posts : privé
drop policy if exists "sauvegardes privées"      on public.saved_posts;
drop policy if exists "sauvegarder soi-même"     on public.saved_posts;
drop policy if exists "désauvegarder soi-même"   on public.saved_posts;
create policy "sauvegardes privées" on public.saved_posts
  for select to authenticated using (user_id = auth.uid());
create policy "sauvegarder soi-même" on public.saved_posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "désauvegarder soi-même" on public.saved_posts
  for delete to authenticated using (user_id = auth.uid());

-- comments : l'auteur peut maintenant modifier son commentaire
drop policy if exists "commentaires modifiables par l'auteur" on public.comments;
create policy "commentaires modifiables par l'auteur" on public.comments
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Les nouvelles tables et vues sont accessibles via l'API
grant select on public.post_feed, public.comment_feed, public.subreddit_stats, public.profile_stats
  to anon, authenticated;
grant select on public.memberships, public.comment_votes to anon;
grant select, insert, update, delete on public.memberships, public.comment_votes, public.saved_posts
  to authenticated;

-- ---------------------------------------------------------------------
-- 7. Les créateurs existants deviennent membres de leurs communautés
-- ---------------------------------------------------------------------
insert into public.memberships (subreddit_id, user_id)
select id, created_by from public.subreddits where created_by is not null
on conflict do nothing;
