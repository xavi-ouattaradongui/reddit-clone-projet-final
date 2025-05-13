import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import { useRef } from "react";

function Home() {
  const [user, setUser] = useState(null);
  const [subreddits, setSubreddits] = useState([]);
  const [posts, setPosts] = useState([]);
  const [commentText, setCommentText] = useState("");
  const postRefs = useRef({}); 

  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setUser({ token: storedToken });
      fetchSubreddits(storedToken);
      fetchPosts(storedToken);
    } else {
      window.location.href = "/login";
    }
  }, []);
  const scrollToPost = (slug) => {
    if (postRefs.current[slug]) {
      postRefs.current[slug].scrollIntoView({ behavior: "smooth" });  
    }
  };

  const fetchSubreddits = async (token) => {
    try {
      const res = await axios.get("http://localhost:1337/api/subreddits", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cleanData = res.data.data.map((sub) => ({
        id: sub.id,
        name: sub.name,
        description: sub.description,
        slug: sub.slug,
        documentId: sub.documentId,
      }));
      setSubreddits(cleanData);
    } catch (err) {
      console.error("Erreur lors du chargement des subreddits :", err);
    }
  };

  const fetchPosts = async (token) => {
    try {
      const res = await axios.get(
        "http://localhost:1337/api/posts?populate[image]=true&populate[user]=true&populate[comments][populate]=user&populate[subreddit]=true",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const cleanPosts = res.data.data.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        image: post.image?.url || null,
        subreddit: post.subreddit ? post.subreddit.name : "Aucun",
        documentId: post.documentId,
        slug: post.slug,
        comments: post.comments || [],
        user: post.user ? post.user.username : "Anonyme",
         
      }));
      setPosts(cleanPosts);
    } catch (err) {
      console.error("Erreur chargement des posts :", err);
    }
  };

  const handleDeletePost = async (documentId) => {
    if (!window.confirm("Supprimer ce post ?")) return;
    try {
      await axios.delete(`http://localhost:1337/api/posts/${documentId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post.documentId !== documentId)
      );
    } catch (err) {
      console.error("Erreur suppression post :", err);
    }
  };

  const handleDeleteSubreddit = async (documentId) => {
    if (!window.confirm("Supprimer ce subreddit ?")) return;
    try {
      await axios.delete(`http://localhost:1337/api/subreddits/${documentId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSubreddits((prevSubreddits) =>
        prevSubreddits.filter((sub) => sub.documentId !== documentId)
      );
    } catch (err) {
      console.error("Erreur suppression subreddit :", err);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const token = user.token;
      const meRes = await axios.get("http://localhost:1337/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = meRes.data.id;

      const commentData = {
        data: {
          content: commentText,
          post: {"connect" : [postId]},
          user: {"connect" : [userId]}
        },
      };

      const res = await axios.post(
        "http://localhost:1337/api/comments",
        commentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCommentText("");
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.documentId === postId
            ? {
                ...post,
                comments: [
                  ...post.comments,
                  {
                    content: commentText,
                    user: { username: meRes.data.username, id: userId },
                    id: res.data.data.id,
                  },
                ],
              }
            : post
        )
      );
    } catch (err) {
      console.error("Erreur lors de l'envoi du commentaire :", err);
      if (err.response) {
        alert(`Erreur : ${err.response.data.error.message}`);
      }
    }
  };
   

  return (
    <div>
      <Navbar onSelectPost={scrollToPost}/>
      <div className="home-container">
        {/* Sidebar Left */}
        <div className="home-sidebar1">
          <div className="card1">
            <h3>Subreddit</h3>
            {subreddits.length === 0 ? (
              <p>(Affiche les subreddit ici)</p>
            ) : (
              subreddits.map((sub) => (
                <div key={sub.id} className="subreddit-item">
                  <p>{sub.name}</p>
                  <div>
                    <Link to={`/edit-subreddit/${sub.documentId}`}>✏ Éditer</Link>
                    <button
                      onClick={() => handleDeleteSubreddit(sub.documentId)}
                      style={{ color: "red" }}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Posts Section */}
        <div className="home-posts">
          <h2>Bienvenue sur votre page d'accueil !</h2>
          {posts.length === 0 ? (
            <p>Aucun post pour l'instant.</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} ref={(el) => (postRefs.current[post.slug] = el)} className="post">
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                     <p><strong>{post.subreddit}</strong></p>
                     <p>{post.user}</p>
                 </div>
                <h4>{post.title}</h4>
                <p style={{ wordWrap: "break-word", whiteSpace: "normal" }}>{post.content?.slice(0, 100)}</p>
                {post.image && (
                  <img
                    src={`http://localhost:1337${post.image}`}
                    alt="post"
                  />
                )}
                <div style={{ marginTop: "10px" }}>
                  <Link to={`/edit-post/${post.documentId}`} style={{ marginLeft: "10px" }}>
                    ✏ Éditer
                  </Link>
                  <button
                    onClick={() => handleDeletePost(post.documentId)}
                    style={{ color: "red", marginLeft: "10px" }}
                  >
                    🗑 Supprimer
                  </button>
                </div>

                <div className="post-comments">
                <textarea
                    placeholder="Ajouter un commentaire..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                  />
                  <button onClick={() => handleCommentSubmit(post.documentId)}>
                    Commenter
                  </button>
                  <h5>Commentaires</h5>
                  {post.comments.length === 0 ? (
                    <p>Aucun commentaire pour l'instant.</p>
                  ) : (
                    post.comments.map((comment) => (
                      <div key={comment.id}>
                        <strong>{comment.user?.username || "Anonyme"} :</strong>
                        <p>{comment.content}</p>
                      </div>
                    ))
                  )}
                  
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Right */}
        <div className="home-sidebar">
          <div className="card">
            <h3>Home</h3>
            <Link to="/create-post">Créer un Poste</Link>
            <Link to="/create-subreddit">Créer un Subreddit</Link>
            <p style={{ marginTop: "10px" }}>
              Votre page d'accueil personnelle. Venez ici pour échanger
              avec vos communautés préférées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;








