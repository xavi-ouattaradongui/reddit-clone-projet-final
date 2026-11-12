import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { deleteSubreddit, getSubredditByName } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError, timeAgo } from '../lib/utils';
import Feed from '../components/Feed';
import Spinner from '../components/Spinner';
import { SubIcon } from '../components/Avatar';
import { IconEdit, IconPlus, IconTrash } from '../components/Icons';
import NotFound from './NotFound';

export default function SubredditPage() {
  const { name } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { reloadSubreddits } = useOutletContext();
  const [sub, setSub] = useState(undefined); // undefined = chargement, null = introuvable

  useEffect(() => {
    setSub(undefined);
    getSubredditByName(name)
      .then(setSub)
      .catch(() => setSub(null));
  }, [name]);

  if (sub === undefined) return <Spinner center />;
  if (sub === null) return <NotFound message={`La communauté r/${name} n'existe pas.`} />;

  const isOwner = user && sub.created_by === user.id;

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
      <div className="sub-header card">
        <div className="sub-banner" />
        <div className="sub-header-body">
          <SubIcon name={sub.name} size={64} />
          <div className="sub-header-title">
            <h1>r/{sub.name}</h1>
          </div>
          <div className="sub-header-actions">
            {user && (
              <Link to={`/submit?r=${encodeURIComponent(sub.name)}`} className="btn btn-primary">
                <IconPlus size={18} /> Créer un post
              </Link>
            )}
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
            <h3>À propos de r/{sub.name}</h3>
            <p className="pre-wrap">{sub.description || 'Pas encore de description.'}</p>
            <p className="muted small">
              Créée {timeAgo(sub.created_at)}
              {sub.creator?.username && (
                <>
                  {' '}par <Link to={`/u/${sub.creator.username}`}>u/{sub.creator.username}</Link>
                </>
              )}
            </p>
            {isOwner && (
              <div className="row">
                <Link to={`/r/${sub.name}/edit`} className="btn btn-ghost btn-sm">
                  <IconEdit size={16} /> Modifier
                </Link>
                <button className="btn btn-danger btn-sm" onClick={remove}>
                  <IconTrash size={16} /> Supprimer
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
