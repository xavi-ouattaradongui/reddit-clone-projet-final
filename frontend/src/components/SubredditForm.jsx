import { useState } from "react";
import axios from "axios";
import "../styles/SubredditForm.css"
import api from "../services/api";

function SubredditForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");
    const subredditName = `r/${name}`;

    try {
      await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/subreddits",
        {
          data: {
            name: subredditName,
            description,
            slug: name,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      setSuccess(true);
      setName("");
      setDescription("");
    } catch (err) {
      console.error("Erreur création subreddit :", err);
    }
  };

  return (
    <div className="subreddit-form-container">
      <h2>Créer un Subreddit</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom du subreddit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
       
        <button type="submit">Créer</button>
      </form>
      {success && (
        <div className="success-message">
          ✅ Subreddit créé avec succès !<br />
          <a href="/home">← Retour à l'accueil</a>
        </div>
      )}
    </div>
  );
}

export default SubredditForm;

