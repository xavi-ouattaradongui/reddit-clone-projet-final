import { Link } from 'react-router-dom';
import Feed from '../components/Feed';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, profile } = useAuth();

  return (
    <div className="page">
      <div className="page-main">
        <Feed
          empty={
            <div className="card empty">
              <h3>Rien à lire pour l'instant</h3>
              <p className="muted">Sois la première personne à publier quelque chose !</p>
              {user && <Link to="/submit" className="btn btn-primary">Créer un post</Link>}
            </div>
          }
        />
      </div>

      <aside className="page-aside">
        <div className="card about-card">
          <div className="about-banner" />
          <div className="about-body">
            <h3>{user ? `Salut ${profile?.username ?? ''} 👋` : 'Bienvenue sur ザビ21_3'}</h3>
            <p className="muted">
              Rejoins des communautés, partage des posts et des images, vote et discute avec les autres.
            </p>
            {user ? (
              <div className="stack">
                <Link to="/submit" className="btn btn-primary btn-block">Créer un post</Link>
                <Link to="/communities/new" className="btn btn-ghost btn-block">Créer une communauté</Link>
              </div>
            ) : (
              <div className="stack">
                <Link to="/register" className="btn btn-primary btn-block">Créer un compte</Link>
                <Link to="/login" className="btn btn-ghost btn-block">Se connecter</Link>
              </div>
            )}
          </div>
        </div>
        <p className="muted small footer-note">ザビ21_3 · Projet réalisé par OUATTARA Dongui &amp; HOVOR Fara</p>
      </aside>
    </div>
  );
}
