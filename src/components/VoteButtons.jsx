import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setCommentVote, setVote } from '../lib/api';
import { compactNumber, friendlyError } from '../lib/utils';
import { IconDown, IconUp } from './Icons';

/**
 * Flèches de vote avec mise à jour optimiste (le score change tout de suite,
 * et revient en arrière si la requête échoue).
 * Passe postId OU commentId.
 */
export default function VoteButtons({ postId, commentId, score, myVote = 0, onChange, vertical = false, size = 'md' }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const vote = async (e, value) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (busy) return;

    const next = myVote === value ? 0 : value;
    onChange?.(next, score - myVote + next);
    setBusy(true);
    try {
      if (commentId) await setCommentVote(commentId, user.id, next);
      else await setVote(postId, user.id, next);
    } catch (err) {
      onChange?.(myVote, score);
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const state = myVote === 1 ? 'up' : myVote === -1 ? 'down' : '';
  const iconSize = size === 'sm' ? 16 : 20;
  return (
    <div className={`votes ${vertical ? 'votes-vertical' : ''} votes-${size} ${state}`}>
      <button className="vote vote-up" onClick={(e) => vote(e, 1)} aria-label="Vote positif" aria-pressed={myVote === 1}>
        <IconUp size={iconSize} strokeWidth={2.4} />
      </button>
      <span className="score">{score === 0 && !vertical && size === 'md' ? 'Voter' : compactNumber(score)}</span>
      <button className="vote vote-down" onClick={(e) => vote(e, -1)} aria-label="Vote négatif" aria-pressed={myVote === -1}>
        <IconDown size={iconSize} strokeWidth={2.4} />
      </button>
    </div>
  );
}
