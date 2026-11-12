import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { deleteImage, getProfileByUsername, MAX_IMAGE_SIZE, updateProfile, uploadImage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import Feed from '../components/Feed';
import Avatar from '../components/Avatar';
import Spinner from '../components/Spinner';
import { IconEdit, IconImage } from '../components/Icons';
import NotFound from './NotFound';

export default function Profile() {
  const { username } = useParams();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const fileInput = useRef(null);

  const [profile, setProfile] = useState(undefined);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProfile(undefined);
    setEditing(false);
    getProfileByUsername(username)
      .then(setProfile)
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
        <h1 className="page-title">Posts de u/{profile.username}</h1>
        <Feed
          filters={{ authorId: profile.id }}
          empty={<div className="card empty">u/{profile.username} n'a encore rien publié.</div>}
        />
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
            <p className="muted small">Membre depuis {joined}</p>

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
