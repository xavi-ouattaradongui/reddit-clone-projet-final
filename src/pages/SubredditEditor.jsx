import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { createSubreddit, deleteImage, getSubredditByName, updateSubreddit, uploadImage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import ImagePicker from '../components/ImagePicker';
import Spinner from '../components/Spinner';
import NotFound from './NotFound';

const NAME_RE = /^[A-Za-z0-9_]{3,21}$/;

/** Création (/communities/new) et modification (/r/:name/edit) d'une communauté */
export default function SubredditEditor() {
  const { name: editName } = useParams();
  const isEdit = Boolean(editName);
  const { user } = useAuth();
  const { reloadSubreddits } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();

  const [sub, setSub] = useState(isEdit ? undefined : null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [icon, setIcon] = useState(null); // { file } ou { url }
  const [banner, setBanner] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getSubredditByName(editName)
      .then((s) => {
        setSub(s);
        if (s) {
          setName(s.name);
          setDescription(s.description || '');
          setRules(s.rules || '');
          setIcon(s.icon_url ? { url: s.icon_url } : null);
          setBanner(s.banner_url ? { url: s.banner_url } : null);
        }
      })
      .catch(() => setSub(null));
  }, [isEdit, editName]);

  if (isEdit && sub === undefined) return <Spinner center />;
  if (isEdit && sub === null) return <NotFound message="Cette communauté n'existe pas." />;
  if (isEdit && sub.created_by !== user.id) return <Navigate to={`/r/${sub.name}`} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const n = name.trim();
    if (!NAME_RE.test(n)) return setError('Le nom doit faire 3 à 21 caractères : lettres, chiffres ou _ (pas d’espace).');
    setBusy(true);
    const uploaded = [];
    try {
      const resolve = async (img) => {
        if (!img) return null;
        if (img.url) return img.url;
        const url = await uploadImage(img.file, user.id);
        uploaded.push(url);
        return url;
      };
      const fields = {
        name: n,
        description: description.trim() || null,
        rules: rules.trim() || null,
        iconUrl: await resolve(icon),
        bannerUrl: await resolve(banner),
      };
      const saved = isEdit
        ? await updateSubreddit(sub.id, fields)
        : await createSubreddit({ ...fields, userId: user.id });

      // Anciennes images remplacées ou retirées
      if (isEdit) {
        if (sub.icon_url && sub.icon_url !== fields.iconUrl) deleteImage(sub.icon_url);
        if (sub.banner_url && sub.banner_url !== fields.bannerUrl) deleteImage(sub.banner_url);
      }
      await reloadSubreddits();
      toast.success(isEdit ? 'Communauté mise à jour.' : `r/${saved.name} est née 🎉`);
      navigate(`/r/${saved.name}`);
    } catch (err) {
      uploaded.forEach((u) => deleteImage(u));
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <h1 className="page-title">{isEdit ? `Modifier r/${sub.name}` : 'Créer une communauté'}</h1>
        <form className="card form form-card" onSubmit={submit}>
          {error && <div className="notice notice-error">{error}</div>}
          <label className="field">
            <span>Nom</span>
            <div className="input-prefix">
              <span>r/</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={21} required autoFocus />
            </div>
            <small className="muted">3 à 21 caractères : lettres, chiffres ou _. {21 - name.length} restants.</small>
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle cette communauté ?"
            />
            <small className="muted">{500 - description.length} caractères restants</small>
          </label>
          <label className="field">
            <span>
              Règles <em className="muted">(facultatif, Markdown accepté)</em>
            </span>
            <textarea
              rows={4}
              maxLength={2000}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder={'1. Reste respectueux\n2. Pas de spam\n3. Reste dans le sujet'}
            />
          </label>
          <div className="two-cols">
            <div className="field">
              <span>
                Icône <em className="muted">(carrée)</em>
              </span>
              <ImagePicker value={icon} onChange={setIcon} onError={setError} compact />
            </div>
            <div className="field">
              <span>
                Bannière <em className="muted">(large)</em>
              </span>
              <ImagePicker value={banner} onChange={setBanner} onError={setError} compact />
            </div>
          </div>
          <div className="row row-end">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Annuler
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? <Spinner small /> : isEdit ? 'Enregistrer' : 'Créer la communauté'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
