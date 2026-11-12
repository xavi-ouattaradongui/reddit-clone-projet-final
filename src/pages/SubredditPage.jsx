import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteSubreddit, getSubredditByName } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { compactNumber, friendlyError } from '../lib/utils';
import Feed from '../components/Feed';
import Spinner from '../components/Spinner';
import Markdown from '../components/Markdown';
import JoinButton from '../components/JoinButton';
import { SubIcon } from '../components/Avatar';
import { IconCake, IconEdit, IconPlus, IconTrash } from '../components/Icons';
import NotFound from './NotFound';

export default function SubredditPage() {
  const { name } = useParams();
  const { user } = useAuth();
  const { subreddits, reloadSubreddits } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();
  const [fetched, setFetched] = useState(undefined); // undefined = chargement, null = introuvable

  useEffect(() => {
    setFetched(undefined);
    getSubredditByName(name)
      .then(setFetched)
      .catch(() => setFetched(null));
  }, [name]);

  if (fetched === undefined) return <Spinner center />;
  if (fetched === null) return <NotFound message={`La communauté r/${name} n'existe pas.`} />;

  // Version « vivante » (nombre de membres mis à jour quand on rejoint / quitte)
  const live = subreddits.find((s) => s.id === fetched.id);
  const sub = { ...fetched, member_count: live?.member_count ?? fetched.member_count };
  const isOwner = user && sub.created_by === user.id;
  const created = new Date(sub.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const remove = async () => {
    if (!window.confirm(`Supprimer r/${sub.name} et TOUS ses posts ? C'est définitif.`)) return;
    try {
      await deleteSubreddit(sub.id);
      reloadSubreddits();
      toast.success(`r/${sub.name} a été supprimée.`);
      navigate('/');
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <>
      <div className="sub-header">
        <div
          className="sub-banner"
          style={sub.banner_url ? { backgroundImage: `url("${sub.banner_url}")` } : undefined}
        />
        <div className="sub-header-inner">
          <SubIcon name={sub.name} url={sub.icon_url} size={80} />
          <div className="sub-header-title">
            <h1>r/{sub.name}</h1>
            <span className="muted">{compactNumber(sub.member_count)} membre{sub.member_count > 1 ? 's' : ''}</span>
          </div>
          <div className="sub-header-actions">
            {user && (
              <Link to={`/submit?r=${encodeURIComponent(sub.name)}`} className="btn btn-outline">
                <IconPlus size={18} /> Créer un post
              </Link>
            )}
            <JoinButton sub={sub} />
          </div>
        </div>
      </div>

      <div className="page">
        <div className="page-main">
          <Feed
            filters={{ subredditId: sub.id }}
            hideSubreddit
            empty={
              <div className="card empty">
                <h3>Cette communauté est encore vide</h3>
                <p className="muted">Lance la première discussion !</p>
                {user && (
                  <Link to={`/submit?r=${encodeURIComponent(sub.name)}`} className="btn btn-primary">
                    Créer un post
                  </Link>
                )}
              </div>
            }
          />
        </div>

        <aside className="page-aside">
          <div className="card side-card">
            <h3 className="side-card-title">À propos de la communauté</h3>
            <p className="pre-wrap">{sub.description || 'Pas encore de description.'}</p>
            <p className="muted small with-icon">
              <IconCake size={16} /> Créée le {created}
              {sub.creator_username && (
                <>
                  {' '}par <Link to={`/u/${sub.creator_username}`}>u/{sub.creator_username}</Link>
                </>
              )}
            </p>
            <div className="stats-row">
              <div>
                <strong>{compactNumber(sub.member_count)}</strong>
                <small className="muted">Membres</small>
              </div>
              <div>
                <strong>{compactNumber(sub.post_count)}</strong>
                <small className="muted">Posts</small>
              </div>
            </div>
            {user && (
              <Link to={`/submit?r=${encodeURIComponent(sub.name)}`} className="btn btn-primary btn-block">
                Créer un post
              </Link>
            )}
          </div>

          {sub.rules && (
            <div className="card side-card">
              <h3 className="side-card-title">Règles de r/{sub.name}</h3>
              <Markdown text={sub.rules} className="rules" />
            </div>
          )}

          {isOwner && (
            <div className="card side-card">
              <h3 className="side-card-title">Modération</h3>
              <div className="row">
                <Link to={`/r/${sub.name}/edit`} className="btn btn-outline btn-sm">
                  <IconEdit size={16} /> Modifier
                </Link>
                <button className="btn btn-danger btn-sm" onClick={remove}>
                  <IconTrash size={16} /> Supprimer
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
