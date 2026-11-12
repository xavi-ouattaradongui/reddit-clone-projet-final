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

const TOP_RANGES = { day: 1, week: 7, month: 30, year: 365 };

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

export async function getProfileStats(id) {
  return (
    check(await supabase.from('profile_stats').select('*').eq('id', id).maybeSingle()) || {
      post_karma: 0,
      comment_karma: 0,
    }
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

/** Toutes les communautés, avec nombre de membres et de posts */
export async function listSubreddits({ orderBy = 'name' } = {}) {
  let q = supabase.from('subreddit_stats').select('*');
  q = orderBy === 'members' ? q.order('member_count', { ascending: false }).order('name') : q.order('name');
  return check(await q);
}

export async function getSubredditByName(name) {
  const sub = check(
    await supabase.from('subreddit_stats').select('*').ilike('name', escapeLike(name)).maybeSingle(),
  );
  if (sub?.created_by) {
    const creator = await getProfileById(sub.created_by).catch(() => null);
    sub.creator_username = creator?.username ?? null;
  }
  return sub;
}

export async function createSubreddit({ name, description, rules, iconUrl, bannerUrl, userId }) {
  return check(
    await supabase
      .from('subreddits')
      .insert({ name, description, rules, icon_url: iconUrl, banner_url: bannerUrl, created_by: userId })
      .select()
      .single(),
  );
}

export async function updateSubreddit(id, { name, description, rules, iconUrl, bannerUrl }) {
  return check(
    await supabase
      .from('subreddits')
      .update({ name, description, rules, icon_url: iconUrl, banner_url: bannerUrl })
      .eq('id', id)
      .select()
      .single(),
  );
}

export async function deleteSubreddit(id) {
  check(await supabase.from('subreddits').delete().eq('id', id));
}

/* ------------------------------------------------------------------ */
/* Adhésions (rejoindre / quitter)                                     */
/* ------------------------------------------------------------------ */

/** Identifiants des communautés rejointes par l'utilisateur */
export async function getMyMemberships(userId) {
  if (!userId) return [];
  const rows = check(await supabase.from('memberships').select('subreddit_id').eq('user_id', userId));
  return rows.map((r) => r.subreddit_id);
}

export async function joinSubreddit(subredditId, userId) {
  check(await supabase.from('memberships').insert({ subreddit_id: subredditId, user_id: userId }));
}

export async function leaveSubreddit(subredditId, userId) {
  check(await supabase.from('memberships').delete().eq('subreddit_id', subredditId).eq('user_id', userId));
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

/**
 * Liste des posts (vue post_feed).
 * @param {object} o
 * @param {'hot'|'new'|'top'} [o.sort]
 * @param {'day'|'week'|'month'|'year'|'all'} [o.range]  – pour le tri « top »
 * @param {number} [o.subredditId]
 * @param {number[]} [o.subredditIds]  – fil personnalisé (communautés rejointes)
 * @param {number[]} [o.postIds]       – posts sauvegardés
 * @param {string} [o.authorId]
 * @param {string} [o.search]
 * @param {number} [o.page] – commence à 0
 */
export async function listPosts({
  sort = 'hot',
  range = 'all',
  subredditId,
  subredditIds,
  postIds,
  authorId,
  search,
  page = 0,
} = {}) {
  let q = supabase.from('post_feed').select('*');
  if (subredditId) q = q.eq('subreddit_id', subredditId);
  if (subredditIds) q = q.in('subreddit_id', subredditIds.length ? subredditIds : [-1]);
  if (postIds) q = q.in('id', postIds.length ? postIds : [-1]);
  if (authorId) q = q.eq('author_id', authorId);
  const s = search && cleanSearch(search);
  if (s) q = q.or(`title.ilike.%${s}%,content.ilike.%${s}%`);

  if (sort === 'top') {
    if (TOP_RANGES[range]) {
      const since = new Date(Date.now() - TOP_RANGES[range] * 86400000).toISOString();
      q = q.gte('created_at', since);
    }
    q = q.order('score', { ascending: false });
  } else if (sort === 'hot') {
    q = q.order('hot', { ascending: false });
  }
  q = q.order('created_at', { ascending: false }).order('id', { ascending: false });
  q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  return check(await q);
}

export async function getPost(id) {
  return check(await supabase.from('post_feed').select('*').eq('id', id).maybeSingle());
}

export async function createPost({ subredditId, title, content, imageUrl, url, userId }) {
  return check(
    await supabase
      .from('posts')
      .insert({
        subreddit_id: subredditId,
        title,
        content: content || null,
        image_url: imageUrl || null,
        url: url || null,
        author_id: userId,
      })
      .select()
      .single(),
  );
}

export async function updatePost(id, { title, content, imageUrl, url }) {
  return check(
    await supabase
      .from('posts')
      .update({ title, content: content || null, image_url: imageUrl || null, url: url || null })
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
/* Posts sauvegardés                                                   */
/* ------------------------------------------------------------------ */

/** Ids des posts sauvegardés, du plus récent au plus ancien */
export async function getSavedPostIds(userId) {
  if (!userId) return [];
  const rows = check(
    await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  );
  return rows.map((r) => r.post_id);
}

export async function setSaved(postId, userId, saved) {
  if (saved) {
    check(
      await supabase
        .from('saved_posts')
        .upsert({ post_id: postId, user_id: userId }, { onConflict: 'user_id,post_id' }),
    );
  } else {
    check(await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', userId));
  }
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
      .from('comment_feed')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
  );
}

/** Derniers commentaires d'un utilisateur (onglet du profil) */
export async function listUserComments(authorId) {
  return check(
    await supabase
      .from('comment_feed')
      .select('*')
      .eq('author_id', authorId)
      .eq('deleted', false)
      .order('created_at', { ascending: false })
      .limit(50),
  );
}

async function getComment(id) {
  return check(await supabase.from('comment_feed').select('*').eq('id', id).single());
}

export async function addComment({ postId, parentId = null, content, userId }) {
  const row = check(
    await supabase
      .from('comments')
      .insert({ post_id: postId, parent_id: parentId, content, author_id: userId })
      .select('id')
      .single(),
  );
  return getComment(row.id);
}

export async function updateComment(id, content) {
  check(await supabase.from('comments').update({ content }).eq('id', id));
  return getComment(id);
}

/**
 * Supprime un commentaire. S'il a des réponses, on le garde comme « [supprimé] »
 * pour ne pas casser la discussion (comme sur Reddit).
 */
export async function deleteComment(id, hasReplies) {
  if (hasReplies) {
    check(await supabase.from('comments').update({ deleted: true }).eq('id', id));
    return getComment(id);
  }
  check(await supabase.from('comments').delete().eq('id', id));
  return null;
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

/** Renvoie { [commentId]: 1 | -1 } */
export async function getMyCommentVotes(commentIds, userId) {
  if (!userId || commentIds.length === 0) return {};
  const rows = check(
    await supabase
      .from('comment_votes')
      .select('comment_id, value')
      .eq('user_id', userId)
      .in('comment_id', commentIds),
  );
  return Object.fromEntries(rows.map((r) => [r.comment_id, r.value]));
}

export async function setCommentVote(commentId, userId, value) {
  if (value === 0) {
    check(await supabase.from('comment_votes').delete().eq('comment_id', commentId).eq('user_id', userId));
  } else {
    check(
      await supabase
        .from('comment_votes')
        .upsert({ comment_id: commentId, user_id: userId, value }, { onConflict: 'comment_id,user_id' }),
    );
  }
}
