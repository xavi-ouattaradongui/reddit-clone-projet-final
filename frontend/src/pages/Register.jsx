import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:1337/api/auth/local/register', {
        username,
        email,
        password,
      });
      localStorage.setItem('jwt', res.data.jwt);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      alert("Erreur à l'inscription.");
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      {/* Colonne de gauche avec l'image */}
      <div className="register-left">
        <img src="/ザビ.21_3.png" alt="Logo" />
      </div>

      {/* Colonne de droite avec l'image*/}
      <div className="register-container">
        <h2>Inscription</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">S'inscrire</button>
        </form>
        <p>
          Déjà un compte ? <Link to="/login">Connexion</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;