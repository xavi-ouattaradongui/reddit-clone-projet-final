import { useState } from 'react';
import { Link } from 'react-router-dom';
import Feed from '../components/Feed';
import TopCommunities from '../components/TopCommunities';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { IconHome, IconTrendUp } from '../components/Icons';

export default function Home() {
  const { user, profile } = useAuth();
  const { joined } = useAppData();
  const hasJoined = user && joined.size > 0;
  const [tab, setTab] = useState(null); // null = choix automatique
  const current = tab ?? (hasJoined ? 'home' : 'popular');

  const filters = current === 'home' ? { subredditIds: [...joined].sort((a, b) => a - b) } : {};

  return (
    <div className="page">
      <div className="page-main">
        {user && (
          <div className="feed-tabs">
            <button className={`feed-tab ${current === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
              <IconHome size={18} /> Mon fil
            </button>
            <button className={`feed-tab ${current === 'popular' ? 'active' : ''}`} onClick={() => setTab('popular')}>
              <IconTrendUp size={18} /> Populaire
            </button>
          </div>
        )}

        <Feed
          filters={filters}
          empty={
            current === 'home' ? (
              <div className="card empty">
                <h3>Ton fil est vide</h3>
                <p className="muted">Rejoins des communautés pour voir leurs posts ici.</p>
                <Link to="/communities" className="btn btn-primary">Explorer les communautés</Link>
              </div>
            ) : (
              <div className="card empty">
                <h3>Rien à lire pour l'instant</h3>
                <p className="muted">Sois la première personne à publier quelque chose !</p>
                {user && <Link to="/submit" className="btn btn-primary">Créer un post</Link>}
              </div>
            )
          }
        />
      </div>

      <aside className="page-aside">
        <div className="card about-card">
          <div className="about-banner" />
          <div className="about-body">
            <div className="home-title">
              <img src="/logo.svg" alt="" />
              <h3>{user ? `Salut ${profile?.username ?? ''} 👋` : 'Accueil'}</h3>
            </div>
            <p className="muted">
              Ta page d'accueil personnalisée sur ザビ21_3. Rejoins des communautés, partage, vote et discute.
            </p>
            {user ? (
              <div className="stack">
                <Link to="/submit" className="btn btn-primary btn-block">Créer un post</Link>
                <Link to="/communities/new" className="btn btn-outline btn-block">Créer une communauté</Link>
              </div>
            ) : (
              <div className="stack">
                <Link to="/register" className="btn btn-primary btn-block">Créer un compte</Link>
                <Link to="/login" className="btn btn-outline btn-block">Se connecter</Link>
              </div>
            )}
          </div>
        </div>
        <TopCommunities />
        <p className="muted small footer-note">ザビ21_3 · Projet réalisé par OUATTARA Dongui &amp; HOVOR Fara</p>
      </aside>
    </div>
  );
}
