import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Login.css";
import api from "../services/api";


function Login({ setUser }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(import.meta.env.VITE_BACKEND_URL + "/api/auth/local", {
        identifier,
        password,
      });
      console.log(res.data);
      localStorage.setItem("jwt", res.data.jwt);
      localStorage.setItem("user", JSON.stringify(res.data.user)); // Stocker l'ID de l'utilisateur
      setUser({ token: res.data.jwt });
      navigate("/home");
    } catch (err) {
      alert("Échec de la connexion.");
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <img src="/ザビ.21_3.png" alt="Logo" />
      </div>
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



