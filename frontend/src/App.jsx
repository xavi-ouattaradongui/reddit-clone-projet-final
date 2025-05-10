import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import CreateSubreddit from "./pages/CreateSubreddit";
import EditSubreddit from "./pages/EditSubreddit";
import CreatePost from "./pages/CreatePost"; // Ajouter le chemin pour CreatePost
import EditPost from "./pages/EditPost"; // Ajouter le chemin pour EditPost


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setUser({ token: storedToken });
    }
  }, []);

  // ✅ Fonction utilitaire pour vérifier si l'utilisateur est authentifié
  function isAuthenticated() {
    return !!localStorage.getItem("jwt");
  }

  return (
    <Router>
      <Routes>
        {/* Redirection de base vers login ou home */}
        <Route path="/" element={<Navigate to={isAuthenticated() ? "/home" : "/login"} />} />

        {/* Authentification */}
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/register" element={<Register />} />

        {/* Pages protégées */}
        <Route path="/home" element={isAuthenticated() ? <Home /> : <Navigate to="/login" />} />
        <Route path="/create-subreddit" element={isAuthenticated() ? <CreateSubreddit /> : <Navigate to="/login" />} />
        <Route path="/edit-subreddit/:id" element={isAuthenticated() ? <EditSubreddit /> : <Navigate to="/login" />} />
        <Route path="/create-post" element={isAuthenticated() ? <CreatePost /> : <Navigate to="/login" />} /> {/* Ajout de la route pour CreatePost */}
        <Route path="/edit-post/:documentId" element={isAuthenticated() ? <EditPost /> : <Navigate to="/login" />} /> {/* Ajout de la route pour EditPost */}
      </Routes>
    </Router>
  );
}

export default App;







