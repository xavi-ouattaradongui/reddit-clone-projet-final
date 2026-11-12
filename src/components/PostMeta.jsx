import { Link } from 'react-router-dom';
import { SubIcon } from './Avatar';
import { timeAgo } from '../lib/utils';

/** « r/dev • Posté par u/xavi il y a 3 h (modifié) » */
export default function PostMeta({ post, hideSubreddit = false }) {
  return (
    <header className="post-meta">
      {!hideSubreddit && (
        <>
          <Link to={`/r/${post.subreddit_name}`} className="sub-link">
            <SubIcon name={post.subreddit_name} url={post.subreddit_icon_url} size={20} />
            r/{post.subreddit_name}
          </Link>
          <span className="dot">•</span>
        </>
      )}
      <span>
        Posté par{' '}
        {post.author_username ? (
          <Link to={`/u/${post.author_username}`} className="user-link">
            u/{post.author_username}
          </Link>
        ) : (
          <em>[supprimé]</em>
        )}{' '}
        <time dateTime={post.created_at} title={new Date(post.created_at).toLocaleString('fr-FR')}>
          {timeAgo(post.created_at)}
        </time>
      </span>
      {post.updated_at && <span className="muted">(modifié)</span>}
    </header>
  );
}
