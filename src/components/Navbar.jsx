import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../lib/useTheme';
import Avatar from './Avatar';
import { IconLogout, IconMenu, IconMoon, IconPlus, IconSearch, IconSun, IconUser } from './Icons';

export default function Navbar({ onMenu }) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Ferme le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const logout = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <header className="navbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Menu">
        <IconMenu />
      </button>

      <Link to="/" className="brand">
        <img src="/logo.svg" alt="" />
        <span>
          ザビ<b>21_3</b>
        </span>
      </Link>

      <form className="search" onSubmit={onSearch} role="search">
        <IconSearch size={18} />
        <input
          type="search"
          placeholder="Rechercher des posts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher"
        />
      </form>

      <div className="nav-actions">
        <button className="icon-btn" onClick={toggle} aria-label="Changer de thème" title="Changer de thème">
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>

        {user ? (
          <>
            <Link to="/submit" className="btn btn-ghost hide-sm">
              <IconPlus size={18} /> Créer
            </Link>
            <div className="user-menu" ref={menuRef}>
              <button className="user-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                <Avatar name={profile?.username} url={profile?.avatar_url} size={30} />
                <span className="hide-sm">{profile?.username}</span>
              </button>
              {open && (
                <div className="dropdown" role="menu">
                  <Link to={`/u/${profile?.username}`} onClick={() => setOpen(false)} role="menuitem">
                    <IconUser size={18} /> Mon profil
                  </Link>
                  <Link to="/submit" onClick={() => setOpen(false)} role="menuitem">
                    <IconPlus size={18} /> Créer un post
                  </Link>
                  <button onClick={logout} role="menuitem">
                    <IconLogout size={18} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">Connexion</Link>
            <Link to="/register" className="btn btn-primary hide-sm">Inscription</Link>
          </>
        )}
      </div>
    </header>
  );
}
