import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { SubIcon } from './Avatar';
import { IconHome, IconPlus, IconTrendUp, IconUsers } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function Layout() {
  const { user } = useAuth();
  const { subreddits, joined } = useAppData();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const mine = subreddits.filter((s) => joined.has(s.id));
  const others = subreddits.filter((s) => !joined.has(s.id));

  const subLink = (s) => (
    <NavLink key={s.id} to={`/r/${s.name}`} className="side-link">
      <SubIcon name={s.name} url={s.icon_url} size={24} /> r/{s.name}
    </NavLink>
  );

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
              <IconUsers /> Explorer
            </NavLink>
          </nav>

          {user && (
            <div className="side-section">
              <div className="side-title">Mes communautés</div>
              <NavLink to="/communities/new" className="side-link">
                <IconPlus /> Créer une communauté
              </NavLink>
              {mine.map(subLink)}
              {mine.length === 0 && <p className="muted small side-empty">Tu n'as rejoint aucune communauté.</p>}
            </div>
          )}

          {others.length > 0 && (
            <div className="side-section">
              <div className="side-title">
                <IconTrendUp size={14} /> {user ? 'À découvrir' : 'Communautés'}
              </div>
              {others.map(subLink)}
            </div>
          )}
        </aside>
        {menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

        <main className="content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
