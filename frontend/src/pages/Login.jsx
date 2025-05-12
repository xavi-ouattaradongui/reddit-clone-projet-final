import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";

function Login({ setUser }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:1337/api/auth/local", {
        identifier,
        password,
      });
      localStorage.setItem("jwt", res.data.jwt);
      setUser({ token: res.data.jwt });
      navigate("/home");
    } catch (err) {
      alert("Échec de la connexion.");
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      {/* Left column with the image */}
      <div className="login-left">
        <img src="/ザビ.21_3.png" alt="Logo" />
      </div>

      {/* Right column with the form */}
      <div className="login-container">
        <h2>Connexion</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email ou nom d'utilisateur"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Se connecter</button>
        </form>
        <p>
          Pas encore de compte ? <Link to="/register">Inscription</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;



