import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { createSubreddit, getSubredditByName, updateSubreddit } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import Spinner from '../components/Spinner';
import NotFound from './NotFound';

const NAME_RE = /^[A-Za-z0-9_]{3,21}$/;

/** Création (/communities/new) et modification (/r/:name/edit) d'une communauté */
export default function SubredditEditor() {
  const { name: editName } = useParams();
  const isEdit = Boolean(editName);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { reloadSubreddits } = useOutletContext();

  const [sub, setSub] = useState(isEdit ? undefined : null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
    try {
      const saved = isEdit
        ? await updateSubreddit(sub.id, { name: n, description: description.trim() || null })
        : await createSubreddit({ name: n, description: description.trim() || null, userId: user.id });
      reloadSubreddits();
      toast.success(isEdit ? 'Communauté mise à jour.' : `r/${saved.name} est née 🎉`);
      navigate(`/r/${saved.name}`);
    } catch (err) {
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
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle cette communauté ?"
            />
            <small className="muted">{500 - description.length} caractères restants</small>
          </label>
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
