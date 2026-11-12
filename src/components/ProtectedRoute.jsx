import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/** Redirige vers /login (puis revient ici après connexion) si personne n'est connecté */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const context = useOutletContext(); // transmet { subreddits, … } du Layout aux pages protégées

  if (loading) return <Spinner center />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet context={context} />;
}
