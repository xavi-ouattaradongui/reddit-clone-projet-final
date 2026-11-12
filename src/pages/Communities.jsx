import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SubIcon } from '../components/Avatar';
import JoinButton from '../components/JoinButton';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { IconPlus, IconSearch } from '../components/Icons';
import { plural } from '../lib/utils';

export default function Communities() {
  const { subreddits } = useAppData();
  const { user } = useAuth();
  const [q, setQ] = useState('');

  const list = subreddits
    .filter((s) => (s.name + ' ' + (s.description || '')).toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => b.member_count - a.member_count || a.name.localeCompare(b.name));

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <div className="title-row">
          <h1 className="page-title">Explorer les communautés</h1>
          {user && (
            <Link to="/communities/new" className="btn btn-primary">
              <IconPlus size={18} /> Créer
            </Link>
          )}
        </div>

        <label className="search search-inline">
          <IconSearch size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer les communautés…" />
        </label>

        {list.length === 0 ? (
          <div className="card empty">Aucune communauté trouvée.</div>
        ) : (
          <div className="community-grid">
            {list.map((s) => (
              <Link key={s.id} to={`/r/${s.name}`} className="card community-card">
                <SubIcon name={s.name} url={s.icon_url} size={48} />
                <div className="community-info">
                  <strong>r/{s.name}</strong>
                  <small className="muted">
                    {plural(s.member_count, 'membre')} · {plural(s.post_count, 'post')}
                  </small>
                  <p className="muted small clamp-2">{s.description || 'Pas de description.'}</p>
                </div>
                <JoinButton sub={s} small />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
