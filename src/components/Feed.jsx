import { useCallback, useEffect, useState } from 'react';
import { listPosts, getMyVotes, PAGE_SIZE } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../lib/utils';
import PostCard from './PostCard';
import Spinner from './Spinner';
import { IconClock, IconFlame, IconTrendUp } from './Icons';

const RANGES = [
  ['day', "Aujourd'hui"],
  ['week', 'Cette semaine'],
  ['month', 'Ce mois-ci'],
  ['year', 'Cette année'],
  ['all', 'Depuis toujours'],
];

/**
 * Liste de posts paginée avec tri « Hot » / « Nouveaux » / « Top ».
 * filters : { subredditId?, subredditIds?, postIds?, authorId?, search? }
 */
export default function Feed({ filters = {}, hideSubreddit = false, empty, defaultSort = 'hot', showSort = true }) {
  const { user } = useAuth();
  const [sort, setSort] = useState(defaultSort);
  const [range, setRange] = useState('week');
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Les tableaux changent d'identité à chaque rendu : on compare leur contenu
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(
    async (pageToLoad) => {
      const rows = await listPosts({ ...JSON.parse(filtersKey), sort, range, page: pageToLoad });
      const myVotes = await getMyVotes(rows.map((p) => p.id), user?.id);
      return { rows, myVotes };
    },
    [filtersKey, sort, range, user?.id],
  );

  // (Re)chargement complet quand le tri ou les filtres changent
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    load(0)
      .then(({ rows, myVotes }) => {
        if (cancelled) return;
        setPosts(rows);
        setVotes(myVotes);
        setPage(0);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch((err) => !cancelled && setError(friendlyError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { rows, myVotes } = await load(page + 1);
      setPosts((p) => {
        const known = new Set(p.map((x) => x.id));
        return [...p, ...rows.filter((r) => !known.has(r.id))];
      });
      setVotes((v) => ({ ...v, ...myVotes }));
      setPage((n) => n + 1);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const onVote = (postId) => (value, score) => {
    setVotes((v) => ({ ...v, [postId]: value }));
    setPosts((list) => list.map((p) => (p.id === postId ? { ...p, score } : p)));
  };

  const tab = (key, Icon, label) => (
    <button className={`pill ${sort === key ? 'active' : ''}`} onClick={() => setSort(key)} aria-pressed={sort === key}>
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <section className="feed">
      {showSort && (
        <div className="sort-bar card">
          {tab('hot', IconFlame, 'Hot')}
          {tab('new', IconClock, 'Nouveaux')}
          {tab('top', IconTrendUp, 'Top')}
          {sort === 'top' && (
            <select className="range-select" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Période">
              {RANGES.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <Spinner center />
      ) : error ? (
        <div className="card notice notice-error">{error}</div>
      ) : posts.length === 0 ? (
        empty || <div className="card empty">Aucun post pour le moment.</div>
      ) : (
        <>
          {posts.map((p) => (
            <PostCard key={p.id} post={p} myVote={votes[p.id] || 0} onVote={onVote(p.id)} hideSubreddit={hideSubreddit} />
          ))}
          {hasMore && (
            <button className="btn btn-ghost load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <Spinner small /> : 'Charger plus'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
