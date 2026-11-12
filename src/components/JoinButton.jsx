import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';

/** Bouton « Rejoindre » / « Membre » (devient « Quitter » au survol) */
export default function JoinButton({ sub, small = false }) {
  const { joined, toggleJoin } = useAppData();
  const [hover, setHover] = useState(false);
  const isMember = joined.has(sub.id);

  return (
    <button
      className={`btn ${isMember ? 'btn-outline' : 'btn-primary'} ${small ? 'btn-sm' : ''} join-btn`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleJoin(sub);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-pressed={isMember}
    >
      {isMember ? (hover ? 'Quitter' : 'Membre') : 'Rejoindre'}
    </button>
  );
}
