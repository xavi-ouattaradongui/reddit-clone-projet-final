import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { createPost, deleteImage, getPost, updatePost, uploadImage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import ImagePicker from '../components/ImagePicker';
import Spinner from '../components/Spinner';
import NotFound from './NotFound';

/** Création (/submit?r=nom) et modification (/post/:postId/edit) d'un post */
export default function PostEditor() {
  const { postId } = useParams();
  const isEdit = Boolean(postId);
  const [params] = useSearchParams();
  const { subreddits } = useOutletContext();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState(isEdit ? undefined : null);
  const [subName, setSubName] = useState(params.get('r') || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null); // { file } ou { url }
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
          setSubName(p.subreddit_name);
        }
      })
      .catch(() => setPost(null));
  }, [isEdit, postId]);

  if (isEdit && post === undefined) return <Spinner center />;
  if (isEdit && post === null) return <NotFound message="Ce post n'existe pas." />;
  if (isEdit && post.author_id !== user.id) return <Navigate to={`/r/${post.subreddit_name}/post/${post.id}`} replace />;

  const selectedSub = subreddits.find((s) => s.name.toLowerCase() === subName.toLowerCase());

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isEdit && !selectedSub) return setError('Choisis une communauté.');
    if (!title.trim()) return setError('Le titre est obligatoire.');
    if (!content.trim() && !image) return setError('Ajoute un texte ou une image.');

    setBusy(true);
    let uploadedUrl = null;
    try {
      let imageUrl = image?.url || null;
      if (image?.file) {
        uploadedUrl = await uploadImage(image.file, user.id);
        imageUrl = uploadedUrl;
      }

      if (isEdit) {
        await updatePost(post.id, { title: title.trim(), content: content.trim(), imageUrl });
        // L'ancienne image a été remplacée ou retirée : on la supprime du stockage
        if (post.image_url && post.image_url !== imageUrl) await deleteImage(post.image_url);
        toast.success('Post modifié.');
        navigate(`/r/${post.subreddit_name}/post/${post.id}`);
      } else {
        const created = await createPost({
          subredditId: selectedSub.id,
          title: title.trim(),
          content: content.trim(),
          imageUrl,
          userId: user.id,
        });
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
          <form className="card form form-card" onSubmit={submit}>
            {error && <div className="notice notice-error">{error}</div>}

            <label className="field">
              <span>Communauté</span>
              {isEdit ? (
                <input value={`r/${post.subreddit_name}`} disabled />
              ) : (
                <select value={selectedSub?.name || ''} onChange={(e) => setSubName(e.target.value)} required>
                  <option value="" disabled>
                    Choisir une communauté…
                  </option>
                  {subreddits.map((s) => (
                    <option key={s.id} value={s.name}>
                      r/{s.name}
                    </option>
                  ))}
                </select>
              )}
            </label>

            <label className="field">
              <span>Titre</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} required autoFocus={!isEdit} />
              <small className="muted">{300 - title.length} caractères restants</small>
            </label>

            <label className="field">
              <span>Texte <em className="muted">(facultatif si tu ajoutes une image)</em></span>
              <textarea rows={8} value={content} onChange={(e) => setContent(e.target.value)} maxLength={40000} />
            </label>

            <div className="field">
              <span>Image <em className="muted">(facultatif)</em></span>
              <ImagePicker value={image} onChange={setImage} onError={setError} />
            </div>

            <div className="row row-end">
              <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                Annuler
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? <Spinner small /> : isEdit ? 'Enregistrer' : 'Publier'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
