import { Link, useNavigate } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { SubIcon } from './Avatar';
import { IconComment } from './Icons';
import { plural, timeAgo } from '../lib/utils';

/** Un post dans une liste (fil d'accueil, communauté, profil, recherche) */
export default function PostCard({ post, myVote, onVote, hideSubreddit = false }) {
  const navigate = useNavigate();
  const url = `/r/${post.subreddit_name}/post/${post.id}`;

  // Toute la carte est cliquable, sauf les liens et boutons qu'elle contient
  const open = (e) => {
    if (e.target.closest('a, button')) return;
    navigate(url);
  };

  return (
    <article className="card post-card" onClick={open}>
      <header className="post-meta">
        {!hideSubreddit && (
          <>
            <Link to={`/r/${post.subreddit_name}`} className="sub-link">
              <SubIcon name={post.subreddit_name} size={22} />
              r/{post.subreddit_name}
            </Link>
            <span className="dot">•</span>
          </>
        )}
        <span>
          par{' '}
          {post.author_username ? (
            <Link to={`/u/${post.author_username}`}>u/{post.author_username}</Link>
          ) : (
            <em>[supprimé]</em>
          )}
        </span>
        <span className="dot">•</span>
        <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString('fr-FR')}>
          {timeAgo(post.created_at)}
        </time>
      </header>

      <h2 className="post-title">
        <Link to={url}>{post.title}</Link>
      </h2>

      {post.image_url ? (
        <div className="post-image">
          <img src={post.image_url} alt="" loading="lazy" />
        </div>
      ) : (
        post.content && <p className="post-excerpt">{post.content}</p>
      )}

      <footer className="post-actions">
        <VoteButtons postId={post.id} score={post.score} myVote={myVote} onChange={onVote} />
        <Link to={url} className="pill">
          <IconComment size={18} /> {plural(post.comment_count, 'commentaire')}
        </Link>
      </footer>
    </article>
  );
}
