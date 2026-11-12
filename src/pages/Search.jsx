import { useSearchParams } from 'react-router-dom';
import Feed from '../components/Feed';

export default function Search() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();

  return (
    <div className="page page-narrow">
      <div className="page-main">
        <h1 className="page-title">
          Résultats pour « {q} »
        </h1>
        <Feed
          filters={{ search: q }}
          empty={
            <div className="card empty">
              <h3>Aucun résultat</h3>
              <p className="muted">Essaie avec d'autres mots-clés.</p>
            </div>
          }
        />
      </div>
    </div>
  );
}
