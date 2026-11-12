import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { addComment, deleteComment, listComments } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError, plural, timeAgo } from '../lib/utils';
import Avatar from './Avatar';
import Spinner from './Spinner';
import { IconTrash } from './Icons';

export default function Comments({ postId, onCountChange }) {
  const { user, profile } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listComments(postId)
      .then(setComments)
      .catch((err) => {
        setComments([]);
        toast.error(friendlyError(err));
      });
  }, [postId, toast]);

  const update = (list) => {
    setComments(list);
    onCountChange?.(list.length);
  };

  const submit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setBusy(true);
    try {
      const c = await addComment({ postId, content, userId: user.id });
      update([...comments, c]);
      setText('');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await deleteComment(id);
      update(comments.filter((c) => c.id !== id));
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <section className="card comments">
      <h2 className="comments-title">{comments ? plural(comments.length, 'commentaire') : 'Commentaires'}</h2>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <Avatar name={profile?.username} url={profile?.avatar_url} size={32} />
          <div className="comment-form-body">
            <textarea
              rows={3}
              placeholder="Qu'en penses-tu ?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={10000}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
              }}
            />
            <div className="row row-end">
              <small className="muted hide-sm">⌘ + Entrée pour envoyer</small>
              <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()}>
                {busy ? <Spinner small /> : 'Commenter'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="notice">
          <Link to="/login" state={{ from: location.pathname }}>Connecte-toi</Link> pour participer à la discussion.
        </div>
      )}

      {comments === null ? (
        <Spinner center />
      ) : comments.length === 0 ? (
        <p className="muted empty-comments">Aucun commentaire. Lance la discussion !</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment">
              <Avatar name={c.author?.username} url={c.author?.avatar_url} size={32} />
              <div className="comment-body">
                <div className="comment-meta">
                  {c.author ? <Link to={`/u/${c.author.username}`}>u/{c.author.username}</Link> : <em>[supprimé]</em>}
                  <span className="dot">•</span>
                  <time className="muted" dateTime={c.created_at}>{timeAgo(c.created_at)}</time>
                  {user && c.author_id === user.id && (
                    <button className="link-btn danger" onClick={() => remove(c.id)} aria-label="Supprimer le commentaire">
                      <IconTrash size={14} />
                    </button>
                  )}
                </div>
                <p className="pre-wrap">{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
