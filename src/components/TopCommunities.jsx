import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { SubIcon } from './Avatar';
import JoinButton from './JoinButton';
import { plural } from '../lib/utils';

/** Encadré « Communautés populaires » (classées par nombre de membres) */
export default function TopCommunities({ limit = 5 }) {
  const { subreddits } = useAppData();
  const top = [...subreddits].sort((a, b) => b.member_count - a.member_count || a.name.localeCompare(b.name)).slice(0, limit);
  if (top.length === 0) return null;

  return (
    <div className="card side-card top-communities">
      <h3>Communautés populaires</h3>
      <ol>
        {top.map((s, i) => (
          <li key={s.id}>
            <span className="rank">{i + 1}</span>
            <SubIcon name={s.name} url={s.icon_url} size={32} />
            <Link to={`/r/${s.name}`} className="top-name">
              <strong>r/{s.name}</strong>
              <small className="muted">{plural(s.member_count, 'membre')}</small>
            </Link>
            <JoinButton sub={s} small />
          </li>
        ))}
      </ol>
      <Link to="/communities" className="btn btn-ghost btn-block btn-sm">
        Voir toutes les communautés
      </Link>
    </div>
  );
}
