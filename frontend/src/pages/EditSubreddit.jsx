// src/pages/EditSubreddit.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/EditSubreddit.css"; 

function EditSubreddit() {
  const { id } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (!jwt || !id) {
      console.error("JWT or ID is missing.");
      return;
    }

    axios
      .get(`http://localhost:1337/api/subreddits/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      .then((res) => {
        if (!res.data || !res.data.data) {
          console.error("No data found for this subreddit.");
          return;
        }
        const data = res.data.data.attributes;
        setName(data?.name || ""); 
        setDescription(data?.description || ""); 
        setLoaded(true);
      })
      .catch((err) => console.error("Error loading subreddit:", err));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");
    const subredditName = `r/${name}`;

    if (!id) {
      alert("Error: Subreddit ID not found.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:1337/api/subreddits/${id}`,
        {
          data: {
            name: subredditName,
            description,
          },
        },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      setSuccess(true); 
    } catch (err) {
      console.error("Error updating subreddit:", err);
    }
  };

  if (!loaded) return <p>Loading...</p>;

  return (
    <div className="subreddit-form-container">
      <div >
        <h2>Edit Subreddit</h2>
        {success ? (
          <div className="success-message">
            ✅ Subreddit créer avec succès <br />
            <a href="/home">← Retour a la page d'accueil</a>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
              <input
                type="text"
                placeholder="Nom du subreddit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            <button type="submit">Modifier</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default EditSubreddit;
