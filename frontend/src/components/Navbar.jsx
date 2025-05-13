import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Navbar.css";

function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    navigate("/login");
  };

  // Recherche de posts
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length > 0) {
        try {
          const res = await axios.get(`http://localhost:1337/api/posts?filters[slug][$containsi]=${query}`);
          setResults(res.data.data);
        } catch (err) {
          console.error("Erreur lors de la recherche :", err);
        }
      } else {
        setResults([]);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Récupération de l'utilisateur connecté
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("jwt");
      if (token) {
        try {
          const res = await axios.get("http://localhost:1337/api/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setUser(res.data);
        } catch (err) {
          console.error("Erreur lors de la récupération de l'utilisateur :", err);
        }
      }
    };

    fetchUser();
  }, []);

  const handleSelect = (slug) => {
    setQuery("");
    setResults([]);
    if (onSelectPost) {
      onSelectPost(slug);  // Appeler la fonction scrollToPost
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo">
          <img src="/ザビ.21_3.png" alt="Logo" className="navbar-logo-img" />
        </Link>
      </div>

      <div className="navbar-center">
        <div className="navbar-search-container">
          <input
            type="text"
            placeholder="Rechercher un post..."
            className="navbar-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="search-results">
              {results.map((post) => (
                <li key={post.id} onClick={() => handleSelect(post.slug)}>
                  {post.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {user && <span className="navbar-username"><img src="/avatar-default-icon.png" alt="icon" className="navbar-user-icon" /> {user.username}</span>}
        <button onClick={handleLogout} className="navbar-logout">
          Déconnexion
        </button>
      </div>
    </nav>
  );
}

export default Navbar;


