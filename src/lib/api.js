// Toutes les requêtes vers Supabase sont regroupées ici.
// Chaque fonction lève une erreur si Supabase en renvoie une.
import { supabase } from './supabase';

const BUCKET = 'post-images';
export const PAGE_SIZE = 15;

function check({ data, error }) {
  if (error) throw error;
  return data;
}

/** Échappe % et _ pour une recherche « exacte insensible à la casse » avec ilike */
const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => '\\' + c);

/** Nettoie un texte de recherche pour le filtre .or() de PostgREST */
const cleanSearch = (s) => s.replace(/[,()*%\\]/g, ' ').trim();

/* ------------------------------------------------------------------ */
/* Profils                                                             */
/* ------------------------------------------------------------------ */

export async function getProfileById(id) {
  return check(await supabase.from('profiles').select('*').eq('id', id).maybeSingle());
}

export async function getProfileByUsername(username) {
  return check(
    await supabase.from('profiles').select('*').ilike('username', escapeLike(username)).maybeSingle(),
  );
}

export async function updateProfile(id, fields) {
  return check(await supabase.from('profiles').update(fields).eq('id', id).select().single());
}

export async function isUsernameAvailable(name) {
  return check(await supabase.rpc('username_available', { name }));
}

/* ------------------------------------------------------------------ */
/* Communautés                                                         */
/* ------------------------------------------------------------------ */

export async function listSubreddits() {
  return check(await supabase.from('subreddits').select('*').order('name'));
}

export async function getSubredditByName(name) {
  return check(
    await supabase
      .from('subreddits')
      .select('*, creator:profiles(username)')
      .ilike('name', escapeLike(name))
      .maybeSingle(),
  );
}

export async function createSubreddit({ name, description, userId }) {
  return check(
    await supabase
      .from('subreddits')
      .insert({ name, description, created_by: userId })
      .select()
      .single(),
  );
}

export async function updateSubreddit(id, { name, description }) {
  return check(
    await supabase.from('subreddits').update({ name, description }).eq('id', id).select().single(),
  );
}

export async function deleteSubreddit(id) {
  check(await supabase.from('subreddits').delete().eq('id', id));
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

/**
 * Liste des posts (vue post_feed).
 * @param {object} o
 * @param {'new'|'top'} [o.sort]
 * @param {number} [o.subredditId]
 * @param {string} [o.authorId]
 * @param {string} [o.search]
 * @param {number} [o.page] – commence à 0
 */
export async function listPosts({ sort = 'new', subredditId, authorId, search, page = 0 } = {}) {
  let q = supabase.from('post_feed').select('*');
  if (subredditId) q = q.eq('subreddit_id', subredditId);
  if (authorId) q = q.eq('author_id', authorId);
  const s = search && cleanSearch(search);
  if (s) q = q.or(`title.ilike.%${s}%,content.ilike.%${s}%`);
  if (sort === 'top') q = q.order('score', { ascending: false });
  q = q.order('created_at', { ascending: false }).order('id', { ascending: false });
  q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  return check(await q);
}

export async function getPost(id) {
  return check(await supabase.from('post_feed').select('*').eq('id', id).maybeSingle());
}

export async function createPost({ subredditId, title, content, imageUrl, userId }) {
  return check(
    await supabase
      .from('posts')
      .insert({
        subreddit_id: subredditId,
        title,
        content: content || null,
        image_url: imageUrl || null,
        author_id: userId,
      })
      .select()
      .single(),
  );
}

export async function updatePost(id, { title, content, imageUrl }) {
  return check(
    await supabase
      .from('posts')
      .update({ title, content: content || null, image_url: imageUrl || null })
      .eq('id', id)
      .select()
      .single(),
  );
}

export async function deletePost(post) {
  check(await supabase.from('posts').delete().eq('id', post.id));
  if (post.image_url) await deleteImage(post.image_url);
}

/* ------------------------------------------------------------------ */
/* Images (Supabase Storage)                                           */
/* ------------------------------------------------------------------ */

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export async function uploadImage(file, userId) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  check(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type }));
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Supprime une image du bucket à partir de son URL publique (silencieux si échec). */
export async function deleteImage(publicUrl) {
  const marker = `/object/public/${BUCKET}/`;
  const i = publicUrl.indexOf(marker);
  if (i === -1) return;
  const path = decodeURIComponent(publicUrl.slice(i + marker.length));
  await supabase.storage.from(BUCKET).remove([path]);
}

/* ------------------------------------------------------------------ */
/* Commentaires                                                        */
/* ------------------------------------------------------------------ */

export async function listComments(postId) {
  return check(
    await supabase
      .from('comments')
      .select('*, author:profiles(username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  );
}

export async function addComment({ postId, content, userId }) {
  return check(
    await supabase
      .from('comments')
      .insert({ post_id: postId, content, author_id: userId })
      .select('*, author:profiles(username, avatar_url)')
      .single(),
  );
}

export async function deleteComment(id) {
  check(await supabase.from('comments').delete().eq('id', id));
}

/* ------------------------------------------------------------------ */
/* Votes                                                               */
/* ------------------------------------------------------------------ */

/** Renvoie { [postId]: 1 | -1 } pour l'utilisateur connecté */
export async function getMyVotes(postIds, userId) {
  if (!userId || postIds.length === 0) return {};
  const rows = check(
    await supabase.from('votes').select('post_id, value').eq('user_id', userId).in('post_id', postIds),
  );
  return Object.fromEntries(rows.map((r) => [r.post_id, r.value]));
}

/** value = 1, -1 ou 0 (retirer son vote) */
export async function setVote(postId, userId, value) {
  if (value === 0) {
    check(await supabase.from('votes').delete().eq('post_id', postId).eq('user_id', userId));
  } else {
    check(
      await supabase
        .from('votes')
        .upsert({ post_id: postId, user_id: userId, value }, { onConflict: 'post_id,user_id' }),
    );
  }
}
