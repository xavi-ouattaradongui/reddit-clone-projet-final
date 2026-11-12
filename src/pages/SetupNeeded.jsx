/** Affiché quand les variables d'environnement Supabase sont absentes */
export default function SetupNeeded() {
  return (
    <div className="auth-page">
      <div className="card auth-card setup">
        <h1>Configuration requise</h1>
        <p>
          Le site n'est pas encore relié à Supabase. Crée un fichier <code>.env.local</code> à la racine du projet
          avec :
        </p>
        <pre>
          VITE_SUPABASE_URL=https://xxxx.supabase.co{'\n'}VITE_SUPABASE_ANON_KEY=ta-cle-anon
        </pre>
        <p className="muted small">
          Puis relance <code>npm run dev</code>. Sur Vercel, ajoute ces deux variables dans
          <em> Settings → Environment Variables</em> et redéploie. Tout est expliqué dans le README.
        </p>
      </div>
    </div>
  );
}
