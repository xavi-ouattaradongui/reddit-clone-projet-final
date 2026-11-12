import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createPost, deleteImage, getPost, updatePost, uploadImage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import ImagePicker from '../components/ImagePicker';
import Markdown from '../components/Markdown';
import Spinner from '../components/Spinner';
import { IconImage, IconLink, IconText } from '../components/Icons';
import NotFound from './NotFound';

const TYPES = [
  ['text', IconText, 'Texte'],
  ['image', IconImage, 'Image'],
  ['link', IconLink, 'Lien'],
];

/** Création (/submit?r=nom) et modification (/post/:postId/edit) d'un post */
export default function PostEditor() {
  const { postId } = useParams();
  const isEdit = Boolean(postId);
  const [params] = useSearchParams();
  const { subreddits, joined } = useAppData();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(isEdit ? undefined : null);
  const [type, setType] = useState('text');
  const [subName, setSubName] = useState(params.get('r') || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null); // { file } ou { url }
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getPost(postId)
      .then((p) => {
        setPost(p);
        if (p) {
          setTitle(p.title);
          setContent(p.content || '');
          setImage(p.image_url ? { url: p.image_url } : null);
          setUrl(p.url || '');
          setSubName(p.subreddit_name);
          setType(p.url ? 'link' : p.image_url ? 'image' : 'text');
        }
      })
      .catch(() => setPost(null));
  }, [isEdit, postId]);

  if (isEdit && post === undefined) return <Spinner center />;
  if (isEdit && post === null) return <NotFound message="Ce post n'existe pas." />;
  if (isEdit && post.author_id !== user.id) return <Navigate to={`/r/${post.subreddit_name}/post/${post.id}`} replace />;

  const selectedSub = subreddits.find((s) => s.name.toLowerCase() === subName.toLowerCase());
  // Les communautés rejointes en premier dans la liste
  const options = [...subreddits].sort((a, b) => Number(joined.has(b.id)) - Number(joined.has(a.id)) || a.name.localeCompare(b.name));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEdit && !selectedSub) return setError('Choisis une communauté.');
    if (!title.trim()) return setError('Le titre est obligatoire.');
    if (type === 'image' && !image) return setError('Ajoute une image.');
    if (type === 'link') {
      try {
        const u = new URL(url.trim());
        if (!/^https?:$/.test(u.protocol)) throw new Error();
      } catch {
        return setError('Le lien doit commencer par http:// ou https://');
      }
    }

    setBusy(true);
    let uploadedUrl = null;
    try {
      let imageUrl = null;
      if (type === 'image') {
        imageUrl = image.url || null;
        if (image.file) {
          uploadedUrl = await uploadImage(image.file, user.id);
          imageUrl = uploadedUrl;
        }
      }
      const fields = {
        title: title.trim(),
        content: type === 'image' ? '' : content.trim(),
        imageUrl,
        url: type === 'link' ? url.trim() : null,
      };

      if (isEdit) {
        await updatePost(post.id, fields);
        // L'ancienne image a été remplacée ou retirée : on la supprime du stockage
        if (post.image_url && post.image_url !== imageUrl) await deleteImage(post.image_url);
        toast.success('Post modifié.');
        navigate(`/r/${post.subreddit_name}/post/${post.id}`);
      } else {
        const created = await createPost({ ...fields, subredditId: selectedSub.id, userId: user.id });
        toast.success('Post publié !');
        navigate(`/r/${selectedSub.name}/post/${created.id}`);
      }
    } catch (err) {
      if (uploadedUrl) await deleteImage(uploadedUrl);
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <h1 className="page-title">{isEdit ? 'Modifier le post' : 'Créer un post'}</h1>

        {!isEdit && subreddits.length === 0 ? (
          <div className="card empty">
            <h3>Il n'y a encore aucune communauté</h3>
            <p className="muted">Crée d'abord une communauté pour pouvoir y publier.</p>
            <Link to="/communities/new" className="btn btn-primary">Créer une communauté</Link>
          </div>
        ) : (
          <>
            {isEdit ? (
              <p className="muted">dans r/{post.subreddit_name}</p>
            ) : (
              <select
                className="sub-select"
                value={selectedSub?.name || ''}
                onChange={(e) => setSubName(e.target.value)}
                aria-label="Communauté"
              >
                <option value="" disabled>
                  Choisir une communauté…
                </option>
                {options.map((s) => (
                  <option key={s.id} value={s.name}>
                    r/{s.name}
                    {joined.has(s.id) ? ' ★' : ''}
                  </option>
                ))}
              </select>
            )}

            <form className="card editor-card" onSubmit={submit}>
              <div className="type-tabs" role="tablist">
                {TYPES.map(([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={type === key}
                    className={`type-tab ${type === key ? 'active' : ''}`}
                    onClick={() => setType(key)}
                  >
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>

              <div className="form form-card">
                {error && <div className="notice notice-error">{error}</div>}

                <label className="field">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={300}
                    placeholder="Titre"
                    aria-label="Titre"
                    required
                    autoFocus={!isEdit}
                    className="title-input"
                  />
                  <small className="muted counter">{title.length}/300</small>
                </label>

                {type === 'text' && (
                  <div className="field">
                    <div className="md-toolbar">
                      <button type="button" className={`link-btn ${!preview ? 'active' : ''}`} onClick={() => setPreview(false)}>
                        Écrire
                      </button>
                      <button type="button" className={`link-btn ${preview ? 'active' : ''}`} onClick={() => setPreview(true)}>
                        Aperçu
                      </button>
                      <small className="muted">Markdown : **gras**, *italique*, [lien](https://…), - liste, &gt; citation</small>
                    </div>
                    {preview ? (
                      <div className="md-preview">
                        {content.trim() ? <Markdown text={content} /> : <p className="muted">Rien à afficher.</p>}
                      </div>
                    ) : (
                      <textarea
                        rows={9}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        maxLength={40000}
                        placeholder="Texte (facultatif)"
                        aria-label="Texte"
                      />
                    )}
                  </div>
                )}

                {type === 'image' && <ImagePicker value={image} onChange={setImage} onError={setError} />}

                {type === 'link' && (
                  <label className="field">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://…"
                      aria-label="Lien"
                      required
                    />
                  </label>
                )}

                <div className="row row-end">
                  <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                    Annuler
                  </button>
                  <button className="btn btn-primary" disabled={busy}>
                    {busy ? <Spinner small /> : isEdit ? 'Enregistrer' : 'Publier'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
