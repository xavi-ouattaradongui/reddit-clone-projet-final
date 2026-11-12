const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
const UNITS = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

/** « il y a 3 heures », « hier », « à l'instant »… */
export function timeAgo(date) {
  const seconds = Math.round((new Date(date).getTime() - Date.now()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

/** 1 234 → « 1,2 k » */
export function compactNumber(n) {
  return new Intl.NumberFormat('fr', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function plural(n, singular, pluralForm = singular + 's') {
  return `${compactNumber(n)} ${Math.abs(n) > 1 ? pluralForm : singular}`;
}

/** Traduit les erreurs Supabase les plus courantes en messages lisibles. */
export function friendlyError(error) {
  if (!error) return 'Une erreur inconnue est survenue.';
  const msg = (error.message || String(error)).toLowerCase();
  const code = error.code;

  if (msg.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (msg.includes('email not confirmed')) return 'Confirme ton adresse email (regarde ta boîte mail) avant de te connecter.';
  if (msg.includes('user already registered')) return 'Un compte existe déjà avec cet email.';
  if (msg.includes('password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (msg.includes('failed to fetch') || msg.includes('network')) return 'Impossible de joindre le serveur. Vérifie ta connexion.';
  if (code === '23505') return 'Ce nom est déjà pris.';
  if (code === '23514') return 'Une des valeurs saisies n’est pas valide.';
  if (code === '42501' || msg.includes('row-level security')) return "Tu n'as pas le droit de faire ça.";
  if (msg.includes('exceeded the maximum allowed size') || msg.includes('payload too large')) return 'Image trop lourde (5 Mo maximum).';
  return error.message || 'Une erreur est survenue.';
}
