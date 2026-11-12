import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError } from '../lib/utils';
import AuthLayout from '../components/AuthLayout';
import Spinner from '../components/Spinner';

export default function Login() {
  const { user, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user && !busy) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      toast.success('Content de te revoir !');
      navigate(from, { replace: true });
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Connexion" subtitle="Content de te revoir 👋">
      <form onSubmit={submit} className="form">
        {error && <div className="notice notice-error">{error}</div>}
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Spinner small /> : 'Se connecter'}
        </button>
      </form>
      <p className="auth-switch">
        Pas encore de compte ? <Link to="/register" state={location.state}>Inscris-toi</Link>
      </p>
    </AuthLayout>
  );
}
