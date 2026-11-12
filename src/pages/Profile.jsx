import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  deleteImage,
  getProfileByUsername,
  getProfileStats,
  listUserComments,
  MAX_IMAGE_SIZE,
  updateProfile,
  uploadImage,
} from '../lib/api';
import { useAppData } from '../context/AppDataContext';
import Markdown from '../components/Markdown';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { compactNumber, friendlyError, timeAgo } from '../lib/utils';
import Feed from '../components/Feed';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { IconCake, IconEdit, IconImage, IconStar } from '../components/Icons';
import NotFound from './NotFound';

export default function Profile() {
  const { username } = useParams();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);

  const { saved } = useAppData();
  const [profile, setProfile] = useState(undefined);
  const [stats, setStats] = useState({ post_karma: 0, comment_karma: 0 });
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(undefined);
    setEditing(false);
    setTab('posts');
    getProfileByUsername(username)
      .then((p) => {
        setProfile(p);
        if (p) getProfileStats(p.id).then(setStats).catch(() => {});
      })
      .catch(() => setProfile(null));
  }, [username]);

  if (profile === undefined) return <Spinner center />;
  if (profile === null) return <NotFound message={`L'utilisateur u/${username} n'existe pas.`} />;

  const isMe = user?.id === profile.id;
  const joined = new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const save = async (fields) => {
    setBusy(true);
    try {
      const updated = await updateProfile(profile.id, fields);
      setProfile(updated);
      refreshProfile();
      return updated;
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const saveBio = async (e) => {
    e.preventDefault();
    if (await save({ bio: bio.trim() || null })) {
      setEditing(false);
      toast.success('Profil mis à jour.');
    }
  };

  const changeAvatar = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choisis une image.');
    if (file.size > MAX_IMAGE_SIZE) return toast.error('Image trop lourde (5 Mo maximum).');
    setBusy(true);
    try {
      const url = await uploadImage(file, user.id);
      const old = profile.avatar_url;
      if (await save({ avatar_url: url })) {
        if (old) await deleteImage(old);
        toast.success('Photo de profil mise à jour.');
      }
    } catch (err) {
      toast.error(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-main">
        <div className="profile-tabs">
          <button className={`feed-tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>
            Posts
          </button>
          <button className={`feed-tab ${tab === 'comments' ? 'active' : ''}`} onClick={() => setTab('comments')}>
            Commentaires
          </button>
          {isMe && (
            <button className={`feed-tab ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>
              Sauvegardés
            </button>
          )}
        </div>

        {tab === 'posts' && (
          <Feed
            filters={{ authorId: profile.id }}
            defaultSort="new"
            empty={<div className="card empty">u/{profile.username} n'a encore rien publié.</div>}
          />
        )}
        {tab === 'comments' && <UserComments authorId={profile.id} username={profile.username} />}
        {tab === 'saved' && isMe && (
          <Feed
            filters={{ postIds: [...saved].sort((a, b) => a - b) }}
            defaultSort="new"
            showSort={false}
            empty={
              <div className="card empty">
                <h3>Aucun post sauvegardé</h3>
                <p className="muted">Clique sur « Sauvegarder » sous un post pour le retrouver ici.</p>
              </div>
            }
          />
        )}
      </div>

      <aside className="page-aside">
        <div className="card profile-card">
          <div className="about-banner" />
          <div className="profile-avatar">
            <Avatar name={profile.username} url={profile.avatar_url} size={84} />
            {isMe && (
              <>
                <button
                  className="icon-btn avatar-edit"
                  onClick={() => fileInput.current?.click()}
                  disabled={busy}
                  aria-label="Changer la photo de profil"
                  title="Changer la photo"
                >
                  {busy ? <Spinner small /> : <IconImage size={16} />}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  hidden
                  onChange={(e) => {
                    changeAvatar(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
              </>
            )}
          </div>
          <div className="about-body">
            <h2>u/{profile.username}</h2>
            <div className="stats-row">
              <div>
                <strong className="with-icon">
                  <IconStar size={14} /> {compactNumber(stats.post_karma + stats.comment_karma)}
                </strong>
                <small className="muted">Karma</small>
              </div>
              <div>
                <strong className="with-icon">
                  <IconCake size={14} /> {joined}
                </strong>
                <small className="muted">Inscription</small>
              </div>
            </div>
            <p className="muted small">
              {compactNumber(stats.post_karma)} karma de posts · {compactNumber(stats.comment_karma)} karma de commentaires
            </p>

            {editing ? (
              <form onSubmit={saveBio} className="form">
                <textarea
                  rows={4}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Parle un peu de toi…"
                  autoFocus
                />
                <small className="muted">{300 - bio.length} caractères restants</small>
                <div className="row row-end">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                    Annuler
                  </button>
                  <button className="btn btn-primary btn-sm" disabled={busy}>
                    Enregistrer
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="pre-wrap">{profile.bio || (isMe ? 'Ajoute une bio pour te présenter.' : 'Pas de bio.')}</p>
                {isMe && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setBio(profile.bio || '');
                      setEditing(true);
                    }}
                  >
                    <IconEdit size={16} /> Modifier ma bio
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

/** Onglet « Commentaires » du profil */
function UserComments({ authorId, username }) {
  const [list, setList] = useState(null);

  useEffect(() => {
    setList(null);
    listUserComments(authorId)
      .then(setList)
      .catch(() => setList([]));
  }, [authorId]);

  if (list === null) return <Spinner center />;
  if (list.length === 0) return <div className="card empty">u/{username} n'a encore rien commenté.</div>;

  return (
    <div className="feed">
      {list.map((c) => (
        <Link key={c.id} to={`/r/${c.subreddit_name}/post/${c.post_id}`} className="card user-comment">
          <p className="small muted">
            <strong className="user-link">{username}</strong> a commenté{' '}
            <span className="user-comment-post">{c.post_title}</span> · r/{c.subreddit_name} · {timeAgo(c.created_at)}
          </p>
          <Markdown text={c.content} className="comment-text" />
          <p className="small muted">{c.score} point{Math.abs(c.score) > 1 ? 's' : ''}</p>
        </Link>
      ))}
    </div>
  );
}
