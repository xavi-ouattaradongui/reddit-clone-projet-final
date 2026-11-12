import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { SubIcon } from './Avatar';
import { IconHome, IconPlus, IconUsers } from './Icons';
import { listSubreddits } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user } = useAuth();
  const [subreddits, setSubreddits] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const reloadSubreddits = useCallback(() => {
    listSubreddits().then(setSubreddits).catch(() => setSubreddits([]));
  }, []);

  useEffect(reloadSubreddits, [reloadSubreddits]);
  // Ferme le menu mobile à chaque changement de page
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <>
      <Navbar onMenu={() => setMenuOpen((o) => !o)} />
      <div className="shell">
        <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
          <nav className="side-nav">
            <NavLink to="/" end className="side-link">
              <IconHome /> Accueil
            </NavLink>
            <NavLink to="/communities" end className="side-link">
              <IconUsers /> Toutes les communautés
            </NavLink>
          </nav>

          <div className="side-section">
            <div className="side-title">Communautés</div>
            {user && (
              <NavLink to="/communities/new" className="side-link">
                <IconPlus /> Créer une communauté
              </NavLink>
            )}
            {subreddits.map((s) => (
              <NavLink key={s.id} to={`/r/${s.name}`} className="side-link">
                <SubIcon name={s.name} size={24} /> r/{s.name}
              </NavLink>
            ))}
            {subreddits.length === 0 && <p className="muted small side-empty">Aucune communauté pour l'instant.</p>}
          </div>
        </aside>
        {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

        <main className="content">
          <Outlet context={{ subreddits, reloadSubreddits }} />
        </main>
      </div>
    </>
  );
}
