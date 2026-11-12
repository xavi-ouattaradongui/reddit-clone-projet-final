import { Link } from 'react-router-dom';
import { IconArrowLeft } from './Icons';

/** Mise en page des écrans Connexion / Inscription : visuel à gauche, formulaire à droite */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <img src="/logo.jpg" alt="ザビ21_3" />
        <p>Partage. Vote. Discute.</p>
      </div>
      <div className="auth-panel">
        <Link to="/" className="back-link">
          <IconArrowLeft size={18} /> Retour au site
        </Link>
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="muted">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}
