import { Link } from 'react-router-dom';
import VoteButtons from './VoteButtons';
import { IconBookmark, IconComment, IconEdit, IconShare, IconTrash } from './Icons';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { plural, shareLink } from '../lib/utils';

/**
 * Barre d'actions sous un post : (votes sur mobile), commentaires, partager, sauvegarder,
 * et modifier / supprimer pour l'auteur sur la page du post.
 */
export default function PostActions({ post, myVote, onVote, showVotes = 'mobile', onEdit, onDelete }) {
  const { saved, toggleSave } = useAppData();
  const toast = useToast();
  const path = `/r/${post.subreddit_name}/post/${post.id}`;
  const isSaved = saved.has(post.id);

  const share = async (e) => {
    e.stopPropagation();
    try {
      if (await shareLink(path, post.title)) toast.success('Lien copié dans le presse-papier');
    } catch {
      toast.error('Impossible de copier le lien.');
    }
  };

  return (
    <footer className="post-actions">
      {showVotes && (
        <span className={showVotes === 'mobile' ? 'mobile-only' : ''}>
          <VoteButtons postId={post.id} score={post.score} myVote={myVote} onChange={onVote} />
        </span>
      )}
      <Link to={path} className="action">
        <IconComment size={18} /> {plural(post.comment_count, 'commentaire')}
      </Link>
      <button className="action" onClick={share}>
        <IconShare size={18} /> Partager
      </button>
      <button
        className={`action ${isSaved ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSave(post.id);
        }}
        aria-pressed={isSaved}
      >
        <IconBookmark size={18} fill={isSaved ? 'currentColor' : 'none'} /> {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
      </button>
      {onEdit && (
        <Link to={`/post/${post.id}/edit`} className="action">
          <IconEdit size={18} /> Modifier
        </Link>
      )}
      {onDelete && (
        <button className="action action-danger" onClick={onDelete}>
          <IconTrash size={18} /> Supprimer
        </button>
      )}
    </footer>
  );
}
