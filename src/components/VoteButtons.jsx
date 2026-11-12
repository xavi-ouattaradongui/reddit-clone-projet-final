import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setVote } from '../lib/api';
import { compactNumber, friendlyError } from '../lib/utils';
import { IconDown, IconUp } from './Icons';

/**
 * Boutons +1 / -1 avec mise à jour optimiste (le score change tout de suite,
 * et revient en arrière si la requête échoue).
 */
export default function VoteButtons({ postId, score, myVote = 0, onChange, vertical = false }) {
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
    const newScore = score - myVote + next;
    onChange?.(next, newScore);
    setBusy(true);
    try {
      await setVote(postId, user.id, next);
    } catch (err) {
      onChange?.(myVote, score);
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const state = myVote === 1 ? 'up' : myVote === -1 ? 'down' : '';
  return (
    <div className={`votes ${vertical ? 'votes-vertical' : ''} ${state}`}>
      <button className="vote vote-up" onClick={(e) => vote(e, 1)} aria-label="Vote positif" aria-pressed={myVote === 1}>
        <IconUp size={18} />
      </button>
      <span className="score">{compactNumber(score)}</span>
      <button className="vote vote-down" onClick={(e) => vote(e, -1)} aria-label="Vote négatif" aria-pressed={myVote === -1}>
        <IconDown size={18} />
      </button>
    </div>
  );
}
