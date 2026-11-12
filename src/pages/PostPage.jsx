import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePost, getMyVotes, getPost } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { friendlyError, timeAgo } from '../lib/utils';
import VoteButtons from '../components/VoteButtons';
import Comments from '../components/Comments';
import Spinner from '../components/Spinner';
import { SubIcon } from '../components/Avatar';
import { IconArrowLeft, IconEdit, IconTrash } from '../components/Icons';
import NotFound from './NotFound';

export default function PostPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(undefined);
  const [myVote, setMyVote] = useState(0);

  useEffect(() => {
    setPost(undefined);
    getPost(postId)
      .then(setPost)
      .catch(() => setPost(null));
  }, [postId]);

  useEffect(() => {
    if (!user || !post) return setMyVote(0);
    getMyVotes([post.id], user.id).then((v) => setMyVote(v[post.id] || 0)).catch(() => {});
  }, [user, post?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (post === undefined) return <Spinner center />;
  if (post === null) return <NotFound message="Ce post n'existe pas ou a été supprimé." />;

  const isAuthor = user && post.author_id === user.id;

  const remove = async () => {
    if (!window.confirm('Supprimer ce post ? C’est définitif.')) return;
    try {
      await deletePost(post);
      toast.success('Post supprimé.');
      navigate(`/r/${post.subreddit_name}`);
    } catch (err) {
      toast.error(friendlyError(err));
    }
  };

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <Link to={`/r/${post.subreddit_name}`} className="back-link">
          <IconArrowLeft size={18} /> r/{post.subreddit_name}
        </Link>

        <article className="card post-full">
          <header className="post-meta">
            <Link to={`/r/${post.subreddit_name}`} className="sub-link">
              <SubIcon name={post.subreddit_name} size={22} /> r/{post.subreddit_name}
            </Link>
            <span className="dot">•</span>
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
            {post.updated_at && <span className="muted">(modifié)</span>}
          </header>

          <h1 className="post-title-lg">{post.title}</h1>
          {post.content && <div className="post-body pre-wrap">{post.content}</div>}
          {post.image_url && (
            <a href={post.image_url} target="_blank" rel="noreferrer" className="post-image post-image-full">
              <img src={post.image_url} alt="" />
            </a>
          )}

          <footer className="post-actions">
            <VoteButtons
              postId={post.id}
              score={post.score}
              myVote={myVote}
              onChange={(value, score) => {
                setMyVote(value);
                setPost((p) => ({ ...p, score }));
              }}
            />
            {isAuthor && (
              <>
                <Link to={`/post/${post.id}/edit`} className="pill">
                  <IconEdit size={16} /> Modifier
                </Link>
                <button className="pill pill-danger" onClick={remove}>
                  <IconTrash size={16} /> Supprimer
                </button>
              </>
            )}
          </footer>
        </article>

        <Comments postId={post.id} onCountChange={(n) => setPost((p) => ({ ...p, comment_count: n }))} />
      </div>
    </div>
  );
}
