import { Link } from 'react-router-dom';

export default function NotFound({ message = "Cette page n'existe pas (ou plus)." }) {
  return (
    <div className="card empty not-found">
      <h1>404</h1>
      <p className="muted">{message}</p>
      <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
    </div>
  );
}
