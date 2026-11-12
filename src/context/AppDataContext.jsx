import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import {
  getMyMemberships,
  getSavedPostIds,
  joinSubreddit,
  leaveSubreddit,
  listSubreddits,
  setSaved,
} from '../lib/api';
import { friendlyError } from '../lib/utils';

/**
 * Données partagées par toute l'application :
 * - la liste des communautés (avec nombre de membres)
 * - les communautés rejointes par l'utilisateur
 * - ses posts sauvegardés
 */
const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [subreddits, setSubreddits] = useState([]);
  const [joined, setJoined] = useState(() => new Set());
  const [saved, setSavedIds] = useState(() => new Set());

  const reloadSubreddits = useCallback(() => {
    return listSubreddits()
      .then(setSubreddits)
      .catch(() => setSubreddits([]));
  }, []);

  useEffect(() => {
    reloadSubreddits();
  }, [reloadSubreddits]);

  // Recharge adhésions et sauvegardes quand l'utilisateur change
  useEffect(() => {
    if (!user) {
      setJoined(new Set());
      setSavedIds(new Set());
      return;
    }
    getMyMemberships(user.id).then((ids) => setJoined(new Set(ids))).catch(() => {});
    getSavedPostIds(user.id).then((ids) => setSavedIds(new Set(ids))).catch(() => {});
  }, [user]);

  const requireLogin = useCallback(() => {
    if (user) return false;
    navigate('/login');
    return true;
  }, [user, navigate]);

  /** Rejoindre / quitter une communauté (mise à jour immédiate, annulée en cas d'erreur) */
  const toggleJoin = useCallback(
    async (sub) => {
      if (requireLogin()) return;
      const isMember = joined.has(sub.id);
      const delta = isMember ? -1 : 1;
      const apply = (member, d) => {
        setJoined((s) => {
          const n = new Set(s);
          member ? n.add(sub.id) : n.delete(sub.id);
          return n;
        });
        setSubreddits((list) =>
          list.map((s) => (s.id === sub.id ? { ...s, member_count: s.member_count + d } : s)),
        );
      };
      apply(!isMember, delta);
      try {
        if (isMember) await leaveSubreddit(sub.id, user.id);
        else await joinSubreddit(sub.id, user.id);
        if (!isMember) toast.success(`Tu as rejoint r/${sub.name}`);
      } catch (err) {
        apply(isMember, -delta);
        toast.error(friendlyError(err));
      }
    },
    [joined, user, requireLogin, toast],
  );

  /** Sauvegarder / retirer un post des sauvegardes */
  const toggleSave = useCallback(
    async (postId) => {
      if (requireLogin()) return;
      const isSaved = saved.has(postId);
      const apply = (on) =>
        setSavedIds((s) => {
          const n = new Set(s);
          on ? n.add(postId) : n.delete(postId);
          return n;
        });
      apply(!isSaved);
      try {
        await setSaved(postId, user.id, !isSaved);
        toast.success(isSaved ? 'Retiré des sauvegardes' : 'Post sauvegardé');
      } catch (err) {
        apply(isSaved);
        toast.error(friendlyError(err));
      }
    },
    [saved, user, requireLogin, toast],
  );

  const value = useMemo(
    () => ({ subreddits, reloadSubreddits, joined, toggleJoin, saved, toggleSave }),
    [subreddits, reloadSubreddits, joined, toggleJoin, saved, toggleSave],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData doit être utilisé dans <AppDataProvider>');
  return ctx;
}
