import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isUsernameAvailable } from '../lib/api';
import { friendlyError } from '../lib/utils';
import AuthLayout from '../components/AuthLayout';
import Spinner from '../components/Spinner';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Register() {
  const { user, signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');

  if (user && !busy) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const name = username.trim();
    if (!USERNAME_RE.test(name)) {
      return setError('Le pseudo doit faire 3 à 20 caractères : lettres, chiffres ou _ uniquement.');
    }
    if (password.length < 6) return setError('Le mot de passe doit faire au moins 6 caractères.');

    setBusy(true);
    try {
      if (!(await isUsernameAvailable(name))) {
        setBusy(false);
        return setError('Ce pseudo est déjà pris.');
      }
      const { needsConfirmation } = await signUp({ email: email.trim(), password, username: name });
      if (needsConfirmation) {
        setSentTo(email.trim());
        setBusy(false);
      } else {
        toast.success('Bienvenue ' + name + ' !');
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout title="Vérifie tes emails 📬">
        <p>
          On a envoyé un lien de confirmation à <strong>{sentTo}</strong>. Clique dessus pour activer ton compte,
          puis connecte-toi.
        </p>
        <Link to="/login" className="btn btn-primary btn-block">Aller à la connexion</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Inscription" subtitle="Rejoins la communauté en 30 secondes">
      <form onSubmit={submit} className="form">
        {error && <div className="notice notice-error">{error}</div>}
        <label className="field">
          <span>Pseudo</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            maxLength={20}
            required
            autoFocus
          />
          <small className="muted">3 à 20 caractères : lettres, chiffres ou _</small>
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Mot de passe</span>
          <input
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <small className="muted">6 caractères minimum</small>
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? <Spinner small /> : "S'inscrire"}
        </button>
      </form>
      <p className="auth-switch">
        Déjà un compte ? <Link to="/login">Connecte-toi</Link>
      </p>
    </AuthLayout>
  );
}
