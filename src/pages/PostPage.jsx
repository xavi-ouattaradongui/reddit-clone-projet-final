import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deletePost, getMyVotes, getPost } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { compactNumber, domainOf, friendlyError } from '../lib/utils';
import VoteButtons from '../components/VoteButtons';
import PostMeta from '../components/PostMeta';
import PostActions from '../components/PostActions';
import Comments from '../components/Comments';
import Markdown from '../components/Markdown';
import JoinButton from '../components/JoinButton';
import Spinner from '../components/Spinner';
import { SubIcon } from '../components/Avatar';
import { IconArrowLeft, IconExternal } from '../components/Icons';
import NotFound from './NotFound';

export default function PostPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const { subreddits } = useAppData();
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
  const sub = subreddits.find((s) => s.id === post.subreddit_id);

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

  const onVote = (value, score) => {
    setMyVote(value);
    setPost((p) => ({ ...p, score }));
  };

  return (
    <div className="page">
      <div className="page-main">
        <Link to={`/r/${post.subreddit_name}`} className="back-link">
          <IconArrowLeft size={18} /> r/{post.subreddit_name}
        </Link>

        <article className="card post-card post-full">
          <div className="post-side">
            <VoteButtons postId={post.id} score={post.score} myVote={myVote} onChange={onVote} vertical />
          </div>
          <div className="post-main">
            <PostMeta post={post} />
            <h1 className="post-title-lg">{post.title}</h1>

            {post.url && (
              <a className="link-preview" href={post.url} target="_blank" rel="noopener noreferrer nofollow">
                <span className="link-preview-domain">{domainOf(post.url)}</span>
                <span className="link-preview-url">{post.url}</span>
                <IconExternal size={16} />
              </a>
            )}
            {post.content && <Markdown text={post.content} className="post-body" />}
            {post.image_url && (
              <a href={post.image_url} target="_blank" rel="noreferrer" className="post-image post-image-full">
                <img src={post.image_url} alt="" />
              </a>
            )}

            <PostActions
              post={post}
              myVote={myVote}
              onVote={onVote}
              onEdit={isAuthor ? true : undefined}
              onDelete={isAuthor ? remove : undefined}
            />
          </div>
        </article>

        <Comments postId={post.id} onCountChange={(n) => setPost((p) => ({ ...p, comment_count: n }))} />
      </div>

      <aside className="page-aside">
        {sub && (
          <div className="card about-card">
            <div
              className="about-banner"
              style={sub.banner_url ? { backgroundImage: `url("${sub.banner_url}")` } : undefined}
            />
            <div className="about-body">
              <Link to={`/r/${sub.name}`} className="sub-link sub-link-lg">
                <SubIcon name={sub.name} url={sub.icon_url} size={40} /> r/{sub.name}
              </Link>
              <p className="muted">{sub.description || 'Pas de description.'}</p>
              <div className="stats-row">
                <div>
                  <strong>{compactNumber(sub.member_count)}</strong>
                  <small className="muted">Membres</small>
                </div>
                <div>
                  <strong>{compactNumber(sub.post_count)}</strong>
                  <small className="muted">Posts</small>
                </div>
              </div>
              <JoinButton sub={sub} />
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
