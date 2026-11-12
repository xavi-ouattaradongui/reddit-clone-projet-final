import { Link, useNavigate } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import PostMeta from './PostMeta';
import PostActions from './PostActions';
import { stripMarkdown } from './Markdown';
import { IconExternal, IconLink } from './Icons';
import { domainOf } from '../lib/utils';

/** Un post dans une liste (accueil, communauté, profil, recherche) — mise en page façon Reddit */
export default function PostCard({ post, myVote, onVote, hideSubreddit = false }) {
  const navigate = useNavigate();
  const url = `/r/${post.subreddit_name}/post/${post.id}`;

  // Toute la carte est cliquable, sauf les liens et boutons qu'elle contient
  const open = (e) => {
    if (e.target.closest('a, button, input, textarea')) return;
    navigate(url);
  };

  const excerpt = post.content ? stripMarkdown(post.content) : '';

  return (
    <article className="card post-card" onClick={open}>
      <div className="post-side">
        <VoteButtons postId={post.id} score={post.score} myVote={myVote} onChange={onVote} vertical />
      </div>

      <div className="post-main">
        <PostMeta post={post} hideSubreddit={hideSubreddit} />

        <div className="post-headline">
          <div className="post-headline-text">
            <h2 className="post-title">
              <Link to={url}>{post.title}</Link>
            </h2>
            {post.url && (
              <a className="post-domain" href={post.url} target="_blank" rel="noopener noreferrer nofollow">
                {domainOf(post.url)} <IconExternal size={12} />
              </a>
            )}
          </div>
          {post.url && !post.image_url && (
            <a className="link-thumb" href={post.url} target="_blank" rel="noopener noreferrer nofollow" aria-label="Ouvrir le lien">
              <IconLink size={22} />
            </a>
          )}
        </div>

        {post.image_url ? (
          <div className="post-image">
            <img src={post.image_url} alt="" loading="lazy" />
          </div>
        ) : (
          excerpt && <p className="post-excerpt">{excerpt}</p>
        )}

        <PostActions post={post} myVote={myVote} onVote={onVote} />
      </div>
    </article>
  );
}
