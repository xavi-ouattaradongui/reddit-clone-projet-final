import { Link, useOutletContext } from 'react-router-dom';
import { SubIcon } from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { IconPlus } from '../components/Icons';

export default function Communities() {
  const { subreddits } = useOutletContext();
  const { user } = useAuth();

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <div className="title-row">
          <h1 className="page-title">Communautés</h1>
          {user && (
            <Link to="/communities/new" className="btn btn-primary">
              <IconPlus size={18} /> Créer
            </Link>
          )}
        </div>

        {subreddits.length === 0 ? (
          <div className="card empty">Aucune communauté pour l'instant.</div>
        ) : (
          <div className="community-grid">
            {subreddits.map((s) => (
              <Link key={s.id} to={`/r/${s.name}`} className="card community-card">
                <SubIcon name={s.name} size={44} />
                <div>
                  <strong>r/{s.name}</strong>
                  <p className="muted small clamp-2">{s.description || 'Pas de description.'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
