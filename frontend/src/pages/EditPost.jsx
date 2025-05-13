import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/EditPost.css";

function EditPost() {
  const { documentId } = useParams();
  const [postId, setPostId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [subreddits, setSubreddits] = useState([]);
  const [selectedSubreddit, setSelectedSubreddit] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!documentId) {
      console.error("documentId is undefined. Check the URL parameters.");
      navigate("/home");
      return;
    }

    const jwt = localStorage.getItem("jwt");
    if (!jwt) return;

    // Fetch subreddits
    axios
      .get("http://localhost:1337/api/subreddits", {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      .then((res) => {
        const subData = res.data.data.map((sub) => ({
          id: sub.id,
          name: sub.name,
        }));
        setSubreddits(subData);
      })
      .catch((err) => console.error("Error loading subreddits:", err));

    // Fetch post details
    axios
      .get(`http://localhost:1337/api/posts/${documentId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      .then((res) => {
        const post = res.data.data;
        if (!post) {
          console.error("Post not found.");
          return;
        }

        setPostId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setSelectedSubreddit(post.subreddit?.id || null);
        setImage(post.image?.data?.url || null);
        setLoaded(true);
      })
      .catch((err) => console.error("Error loading post:", err));
  }, [documentId, navigate]);

  const uploadImage = async (file, token) => {
    const formData = new FormData();
    formData.append("files", file);

    const res = await axios.post("http://localhost:1337/api/upload", formData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data[0].id;
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleReplacePost = async (e) => {
    e.preventDefault();
    const jwt = localStorage.getItem("jwt");

    if (!title || !content || !selectedSubreddit) {
      alert("Tous les champs sont requis.");
      return;
    }

    const slug = generateSlug(title);

    try {
      if (!postId) {
        alert("Erreur : postId manquant.");
        return;
      }

      let imageId = null;
      if (image instanceof File) {
        imageId = await uploadImage(image, jwt);
      }

      const updatedPostData = {
        data: {
          title,
          content,
          subreddit: selectedSubreddit,
          slug,
          ...(imageId && { image: imageId }),
        },
      };

      const updateResponse = await axios.put(
        `http://localhost:1337/api/posts/${documentId}`,
        updatedPostData,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (updateResponse.status === 200) {
        setSuccess(true);
      } else {
        alert("Erreur lors de la mise à jour du post.");
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  if (!loaded) return <p>Loading...</p>;

  return (
    <div className="edit-post-container">
      <h2>Modifier le Post</h2>
      {success ? (
        <div className="success-message">
          ✅ Post mis à jour avec succès !<br />
          <a href="/home">← Retour à l'accueil</a>
        </div>
      ) : (
        <form onSubmit={handleReplacePost}>
          <label>Sélectionner un Subreddit</label>
          <select
            value={selectedSubreddit || ""}
            onChange={(e) => setSelectedSubreddit(e.target.value)}
            required
          >
            <option value="" disabled>
              Sélectionner un subreddit
            </option>
            {subreddits.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Contenu</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <label>Image (optionnelle)</label>
          <input type="file" onChange={(e) => setImage(e.target.files[0])} />

          <button type="submit">Mettre à jour le post</button>
        </form>
      )}
    </div>
  );
}

export default EditPost;
