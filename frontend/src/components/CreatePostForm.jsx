import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/CreatePostForm.css";


function CreatePostForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [subreddits, setSubreddits] = useState([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  console.log(JSON.parse(localStorage.getItem("user")).id);

  useEffect(() => {
    const fetchSubreddits = async () => {
      try {
        const res = await axios.get("http://localhost:1337/api/subreddits");
        setSubreddits(res.data.data);
      } catch (err) {
        console.error("Erreur lors du chargement des subreddits", err);
      }
    };
    fetchSubreddits();
  }, []);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const uploadImage = async (file, token) => {
    const formData = new FormData();
    formData.append("files", file);

    const res = await axios.post("http://localhost:1337/api/upload", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data[0].id;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !content || !selectedSubreddit ) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    const slug = generateSlug(title);
    const token = localStorage.getItem("jwt");

    try {
      let imageId = null;
      if (image) {
        imageId = await uploadImage(image, token);
      }

      console.log("Image ID:", imageId);

      const postData = {
        data: {
          title,
          content,
          subreddit: selectedSubreddit, 
          slug,
          image: imageId, 
        },
      };

      console.log("Post data:", postData); // Vérifiez les données du post avant l'envoi

      const res = await axios.post("http://localhost:1337/api/posts", postData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTitle("");
      setContent("");
      setImage(null);
      setSelectedSubreddit("");
      setError(null);
      setSuccess(true)

    } catch (err) {
      console.error("Erreur lors de la création du post", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(`Erreur : ${err.response.data.error.message}`); // Affiche le message d'erreur de l'API
      } else {
        setError("Une erreur est survenue. Veuillez réessayer.");
      }
      setSuccess(false);
    }
  };

  return (

    <div className="create-post-container">
      <h2>Créer un nouveau post</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Sélectionnez un subreddit</label>
          <select
            value={selectedSubreddit}
            onChange={(e) => setSelectedSubreddit(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          >
            <option value="">Choisir un subreddit</option>
            {subreddits.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: "100%", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ width: "100%", height: "100px", marginBottom: "10px" }}
          />
        </div>

        <div>
          <label>Image (optionnelle)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ marginBottom: "10px" }}
          />
        </div>
        <button type="submit">Créer le post</button>
      </form>

      {success && (
        <div className="success-message" >
          ✅ Post créé avec succès !<br />
          <a href="/home">← Retour à l'accueil</a>
        </div>
      )}
    </div>
  );
}

export default CreatePostForm;



