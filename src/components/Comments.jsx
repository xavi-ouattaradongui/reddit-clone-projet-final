import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { addComment, deleteComment, getMyCommentVotes, listComments, updateComment } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError, plural, timeAgo } from '../lib/utils';
import Avatar from './Avatar';
import Markdown from './Markdown';
import Spinner from './Spinner';
import VoteButtons from './VoteButtons';
import { IconEdit, IconReply, IconTrash } from './Icons';

const SORTS = [
  ['best', 'Meilleurs'],
  ['new', 'Récents'],
  ['old', 'Anciens'],
];

const comparators = {
  best: (a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at),
  new: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  old: (a, b) => new Date(a.created_at) - new Date(b.created_at),
};

/** Section commentaires d'un post : fil de discussion avec réponses imbriquées */
export default function Comments({ postId, onCountChange }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [comments, setComments] = useState(null);
  const [votes, setVotes] = useState({});
  const [sort, setSort] = useState('best');

  useEffect(() => {
    let cancelled = false;
    listComments(postId)
      .then(async (list) => {
        const v = await getMyCommentVotes(list.map((c) => c.id), user?.id);
        if (cancelled) return;
        setComments(list);
        setVotes(v);
      })
      .catch((err) => {
        if (cancelled) return;
        setComments([]);
        toast.error(friendlyError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [postId, user?.id, toast]);

  // Arbre : { [parentId|'root']: [enfants triés] }
  const tree = useMemo(() => {
    const map = {};
    for (const c of comments || []) (map[c.parent_id ?? 'root'] ||= []).push(c);
    for (const k in map) map[k].sort(comparators[sort]);
    return map;
  }, [comments, sort]);

  const update = (fn) => {
    setComments((list) => {
      const next = fn(list);
      onCountChange?.(next.filter((c) => !c.deleted).length);
      return next;
    });
  };

  const actions = {
    tree,
    votes,
    user,
    onVote: (id) => (value, score) => {
      setVotes((v) => ({ ...v, [id]: value }));
      setComments((list) => list.map((c) => (c.id === id ? { ...c, score } : c)));
    },
    reply: async (parentId, content) => {
      const c = await addComment({ postId, parentId, content, userId: user.id });
      update((list) => [...list, c]);
    },
    edit: async (id, content) => {
      const c = await updateComment(id, content);
      update((list) => list.map((x) => (x.id === id ? c : x)));
    },
    remove: async (comment) => {
      if (!window.confirm('Supprimer ce commentaire ?')) return;
      try {
        const hasReplies = Boolean(tree[comment.id]?.length);
        const c = await deleteComment(comment.id, hasReplies);
        update((list) => (c ? list.map((x) => (x.id === c.id ? c : x)) : list.filter((x) => x.id !== comment.id)));
      } catch (err) {
        toast.error(friendlyError(err));
      }
    },
  };

  const count = comments ? comments.filter((c) => !c.deleted).length : 0;

  return (
    <section className="card comments">
      {user ? (
        <div className="comment-root-form">
          <p className="small muted">
            Commenter en tant que <Link to={`/u/${profile?.username || ''}`}>u/{profile?.username}</Link>
          </p>
          <CommentForm onSubmit={(text) => actions.reply(null, text)} placeholder="Qu'en penses-tu ?" submitLabel="Commenter" />
        </div>
      ) : (
        <div className="notice login-to-comment">
          <span>Connecte-toi pour participer à la discussion.</span>
          <span className="row">
            <Link to="/login" state={{ from: location.pathname }} className="btn btn-outline btn-sm">
              Connexion
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Inscription
            </Link>
          </span>
        </div>
      )}

      <div className="comments-head">
        <h2 className="comments-title">{comments ? plural(count, 'commentaire') : 'Commentaires'}</h2>
        <label className="small muted">
          Trier par{' '}
          <select className="range-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>

      {comments === null ? (
        <Spinner center />
      ) : !tree.root?.length ? (
        <div className="empty-comments">
          <p>
            <strong>Aucun commentaire pour l'instant</strong>
          </p>
          <p className="muted">Lance la discussion !</p>
        </div>
      ) : (
        <ul className="comment-list">
          {tree.root.map((c) => (
            <CommentItem key={c.id} comment={c} depth={0} {...actions} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** Un commentaire et ses réponses (récursif) */
function CommentItem({ comment: c, depth, tree, votes, user, onVote, reply, edit, remove }) {
  const toast = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const children = tree[c.id] || [];
  const isMine = user && c.author_id === user.id && !c.deleted;

  const run = async (fn, done) => {
    try {
      await fn();
      done();
    } catch (err) {
      toast.error(friendlyError(err));
      throw err;
    }
  };

  return (
    <li className={`comment ${collapsed ? 'collapsed' : ''}`}>
      <div className="comment-gutter">
        {c.deleted ? (
          <span className="avatar avatar-deleted" style={{ width: 28, height: 28 }} />
        ) : (
          <Avatar name={c.author_username} url={c.author_avatar_url} size={28} />
        )}
        {!collapsed && (
          <button className="thread-line" onClick={() => setCollapsed(true)} aria-label="Replier la discussion" />
        )}
      </div>

      <div className="comment-body">
        <div className="comment-meta">
          {c.deleted ? (
            <em className="muted">[supprimé]</em>
          ) : (
            <Link to={`/u/${c.author_username}`} className="user-link">
              {c.author_username}
            </Link>
          )}
          <span className="dot">•</span>
          <time className="muted" dateTime={c.created_at} title={new Date(c.created_at).toLocaleString('fr-FR')}>
            {timeAgo(c.created_at)}
          </time>
          {c.updated_at && !c.deleted && <span className="muted">(modifié)</span>}
          {collapsed && (
            <button className="link-btn expand" onClick={() => setCollapsed(false)}>
              [+] {children.length > 0 ? plural(children.length, 'réponse') : 'afficher'}
            </button>
          )}
        </div>

        {!collapsed && (
          <>
            {editing ? (
              <CommentForm
                initial={c.content}
                submitLabel="Enregistrer"
                onCancel={() => setEditing(false)}
                onSubmit={(text) => run(() => edit(c.id, text), () => setEditing(false))}
                autoFocus
              />
            ) : c.deleted ? (
              <p className="muted comment-deleted">[Ce commentaire a été supprimé]</p>
            ) : (
              <Markdown text={c.content} className="comment-text" />
            )}

            {!editing && !c.deleted && (
              <div className="comment-actions">
                <VoteButtons commentId={c.id} score={c.score} myVote={votes[c.id] || 0} onChange={onVote(c.id)} size="sm" />
                {user && (
                  <button className="action action-sm" onClick={() => setReplying((r) => !r)}>
                    <IconReply size={16} /> Répondre
                  </button>
                )}
                {isMine && (
                  <>
                    <button className="action action-sm" onClick={() => setEditing(true)}>
                      <IconEdit size={16} /> Modifier
                    </button>
                    <button className="action action-sm action-danger" onClick={() => remove(c)}>
                      <IconTrash size={16} /> Supprimer
                    </button>
                  </>
                )}
              </div>
            )}

            {replying && (
              <CommentForm
                placeholder={`Répondre à ${c.author_username}…`}
                submitLabel="Répondre"
                onCancel={() => setReplying(false)}
                onSubmit={(text) => run(() => reply(c.id, text), () => setReplying(false))}
                autoFocus
              />
            )}

            {children.length > 0 && (
              <ul className={`comment-list replies ${depth >= 6 ? 'flat' : ''}`}>
                {children.map((child) => (
                  <CommentItem
                    key={child.id}
                    comment={child}
                    depth={depth + 1}
                    {...{ tree, votes, user, onVote, reply, edit, remove }}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** Zone de saisie d'un commentaire (nouveau, réponse ou modification) */
function CommentForm({ onSubmit, onCancel, initial = '', placeholder, submitLabel, autoFocus = false }) {
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      await onSubmit(content);
      setText('');
    } catch {
      /* l'erreur est déjà affichée */
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={submit}>
      <textarea
        rows={3}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={10000}
        autoFocus={autoFocus}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
          if (e.key === 'Escape') onCancel?.();
        }}
      />
      <div className="comment-form-bar">
        <small className="muted hide-sm">Markdown accepté · ⌘ + Entrée pour envoyer</small>
        <span className="row">
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              Annuler
            </button>
          )}
          <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
            {busy ? <Spinner small /> : submitLabel}
          </button>
        </span>
      </div>
    </form>
  );
}
