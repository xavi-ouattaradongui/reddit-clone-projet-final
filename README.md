<div align="center">

<img src="public/logo.svg" width="72" alt="logo" />

# ザビ21_3

**Un clone de Reddit moderne : communautés, posts texte et image, votes et commentaires.**

React 19 · Vite · Supabase (PostgreSQL, Auth, Storage) · déployé sur Vercel

**🌐 Site en ligne : [zthread.vercel.app](https://zthread.vercel.app)**

</div>

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Installation en local](#installation-en-local)
- [Déploiement sur Vercel](#déploiement-sur-vercel)
- [Base de données](#base-de-données)
- [Équipe](#équipe)

## Fonctionnalités

**Comptes**
- Inscription avec pseudo, connexion et déconnexion (Supabase Auth)
- Profil public `/u/pseudo` : photo, bio, date d'inscription, liste des posts
- Modification de sa photo de profil et de sa bio

**Communautés**
- Création, modification et suppression d'une communauté (seulement par son créateur)
- Page de chaque communauté `/r/nom` avec son fil de posts
- Annuaire de toutes les communautés

**Posts**
- Création d'un post avec un texte, une image (glisser-déposer, 5 Mo max) ou les deux
- Modification et suppression par l'auteur (l'image est aussi supprimée du stockage)
- Votes positifs et négatifs, avec mise à jour immédiate du score
- Pagination (« Charger plus »)
- Recherche plein texte dans les titres et le contenu

**Commentaires**
- Fils de discussion : répondre à un commentaire, réponses imbriquées, replier un fil
- Votes sur les commentaires, tri Meilleurs / Récents / Anciens
- Modification et suppression (un commentaire qui a des réponses devient « [supprimé] »)

**Façon Reddit**
- Rejoindre / quitter une communauté, nombre de membres, onglet « Mon fil » avec ses communautés
- Icône, bannière et règles pour chaque communauté
- Tri Hot (algorithme de Reddit) / Nouveaux / Top (jour, semaine, mois, année, toujours)
- Posts Texte, Image ou Lien ; texte en Markdown avec aperçu
- Karma sur le profil, onglets Posts / Commentaires / Sauvegardés
- Sauvegarder un post, copier le lien pour le partager
- Encadré « Communautés populaires »

**Interface**
- Mise en page façon Reddit (votes à gauche, barre latérale), thème clair et sombre (mémorisé)
- Responsive : menu latéral escamotable sur mobile
- Messages d'erreur clairs en français, notifications au lieu des `alert()`
- Lecture possible sans compte, écriture réservée aux membres connectés

## Stack technique

| Partie | Outil | Rôle |
|---|---|---|
| Frontend | [React 19](https://react.dev) + [Vite](https://vitejs.dev) | Application monopage |
| Navigation | [React Router 7](https://reactrouter.com) | Pages et URL |
| Backend | [Supabase](https://supabase.com) | Base PostgreSQL, authentification, stockage des images, API automatique |
| Sécurité | Row Level Security (PostgreSQL) | Chacun ne peut modifier que ses propres données |
| Hébergement | [Vercel](https://vercel.com) | Déploiement automatique à chaque push |

Il n'y a **pas de serveur à maintenir** : le frontend parle directement à Supabase avec la clé publique, et les règles de sécurité sont appliquées par la base de données elle-même.

## Structure du projet

```
├── index.html
├── public/                 logo, favicon, avatar par défaut
├── supabase/
│   ├── schema.sql          tables de base, sécurité, stockage (à exécuter en 1er)
│   ├── reddit-features.sql membres, réponses, votes de commentaires, sauvegardes, karma (2e)
│   └── seed.sql            communautés de départ (optionnel)
├── src/
│   ├── main.jsx            point d'entrée
│   ├── App.jsx             liste des routes
│   ├── lib/
│   │   ├── supabase.js     client Supabase
│   │   ├── api.js          toutes les requêtes (posts, votes, commentaires…)
│   │   ├── utils.js        dates relatives, messages d'erreur…
│   │   └── useTheme.js     thème clair / sombre
│   ├── context/            AuthContext (session), ToastContext (notifications)
│   ├── components/         Navbar, Layout, PostCard, Feed, VoteButtons, Comments…
│   ├── pages/              Home, SubredditPage, PostPage, PostEditor, Profile…
│   └── styles/index.css    toute la feuille de style
├── vercel.json             redirection des URL vers l'application
└── .env.example            modèle des variables d'environnement
```

## Installation en local

### Prérequis

- [Node.js](https://nodejs.org) 18.18 ou plus récent (`node -v` pour vérifier)
- Un compte [Supabase](https://supabase.com) (gratuit)

### 1. Récupérer le projet

```bash
git clone https://github.com/xavi-ouattaradongui/reddit-clone-projet-final.git
cd reddit-clone-projet-final
npm install
```

### 2. Créer la base Supabase

1. Sur [supabase.com](https://supabase.com), crée un projet (région conseillée : *Paris*).
2. Ouvre **SQL Editor → New query**, colle le contenu de [`supabase/schema.sql`](supabase/schema.sql) et clique sur **Run**.
3. Fais de même avec [`supabase/reddit-features.sql`](supabase/reddit-features.sql).
4. *(Optionnel)* Puis avec [`supabase/seed.sql`](supabase/seed.sql) pour avoir quelques communautés de départ.
5. *(Conseillé en développement)* Dans **Authentication → Sign In / Providers → Email**, désactive **Confirm email** pour pouvoir te connecter tout de suite après l'inscription.

### 3. Configurer les variables d'environnement

Copie le modèle :

```bash
cp .env.example .env.local
```

Puis remplis les deux valeurs depuis **Project Settings → API** :

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-publique
```

> La clé `anon` (ou *publishable*) est faite pour être utilisée dans le navigateur.
> Ne mets **jamais** la clé `service_role` / `secret` dans ce projet.

### 4. Lancer

```bash
npm run dev
```

Le site est disponible sur <http://localhost:5173>.

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Version optimisée pour la production, dans `dist/` |
| `npm run preview` | Tester localement la version de production |
| `npm run lint` | Vérifier le code avec ESLint |

## Déploiement sur Vercel

1. Pousse le projet sur GitHub.
2. Sur [vercel.com](https://vercel.com), clique sur **Add New → Project** et importe le dépôt `reddit-clone-projet-final`.
3. Vercel détecte Vite tout seul (commande `npm run build`, dossier `dist`).
4. Dans **Environment Variables**, ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
5. Clique sur **Deploy**.
6. Dans Supabase, va dans **Authentication → URL Configuration** et mets l'adresse Vercel (par ex. `https://zthread.vercel.app`) dans **Site URL**, pour que les liens des emails de confirmation pointent vers le bon site.

Chaque `git push` sur la branche principale redéploie le site automatiquement. Le fichier `vercel.json` permet d'ouvrir directement une URL comme `/r/dev`.

## Base de données

```
auth.users (géré par Supabase)
   │ 1
   ▼ 1
profiles ─────────────┬──────────────┬───────────────┐
   │ créateur         │ auteur       │ membre        │ sauvegarde
   ▼                  ▼              ▼               ▼
subreddits ──1:n──── posts ◄──── memberships     saved_posts
   ▲                  │  └──1:n── votes (+1 / -1)
   └──── memberships  └──1:n── comments ──1:n── comments (réponses, parent_id)
                                   └──1:n── comment_votes
```

- **`post_feed`** renvoie chaque post avec sa communauté, son auteur, son score, son nombre de commentaires et son score « hot ».
- **`comment_feed`**, **`subreddit_stats`** (membres, posts) et **`profile_stats`** (karma) font de même pour les commentaires, communautés et profils.
- Un **trigger** crée automatiquement le profil à l'inscription.
- Les **règles RLS** permettent à tout le monde de lire, mais seul l'auteur peut modifier ou supprimer son contenu.
- Les images sont stockées dans le bucket public **`post-images`**, dans un dossier par utilisateur.

## Équipe

Projet réalisé par :

- **OUATTARA Dongui**
- **HOVOR Fara**

> **Historique :** la version 1 du projet utilisait Strapi Cloud. Elle a été entièrement réécrite avec Supabase pour la version 2. L'ancien code reste disponible dans l'historique Git (branche `main` avant la v2).
