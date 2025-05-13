#  Projet Reddit Clone

Un projet de clone de Reddit réalisé en équipe dans le cadre d’un projet pédagogique. Cette plateforme permet aux utilisateurs de créer et naviguer dans des subreddits, de publier et commenter des posts.

##  Fonctionnalités

###  Fonctionnalités principales
- Authentification (inscription, connexion, déconnexion)
- Création, édition et suppression de subreddits
- Navigation par thématiques (subreddits)
- Création, édition et suppression de posts (texte ou image)
- Ajout de commentaires aux posts
- Recherche de posts

###  Fonctionnalités bonus (optionnelles)
- Support d'images via Strapi Media Library
- Recherches avec filtrage intelligent

##  Stack technique

### Backend
- [Strapi](https://strapi.io/) — CMS Headless utilisé comme API principale
- [Neon](https://neon.tech/) — Base de données PostgreSQL serverless
- Gestion des modèles : Utilisateurs, Subreddits, Posts, Commentaires

### Frontend
- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) — SPA rapide et moderne
- [Axios](https://axios-http.com/) — Requêtes HTTP vers l’API Strapi
- [Liveblocks](https://liveblocks.io/) — Fonctionnalité de collaboration en temps réel

## Installation et lancement

### Prérequis
- Node.js 
- Un compte Neon
- Strapi (installé globalement ou via `npx create-strapi-app`)

### Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/xavi-ouattaradongui/Projet-Final.git
   cd Projet-Final

2. **Lancer le backend**
- cd my-strapi-project
- npm install
- npm run dev

2. **Lancer le frontend**
- cd my-strapi-project
- npm install
- npm run dev

##  Équipe et répartition des tâches

### Équipe

- OUATTARA Dongui
- HOVOR Fara
- DAHMOUNE amelie
- BAKOUCHE Samy

### Répartition des tâches

- OUATTARA Dongui  — Backend Strapi & BDD

    Installation et configuration de Strapi

    Connexion à la base PostgreSQL Neon

    Création des modèles : Users, Subreddits, Posts, Comments

    Mise en place des rôles, permissions, et relations entre modèles

- HOVOR Fara et OUATTARA Dongui — Frontend UI & Auth

    Mise en place du projet React + Vite

    Pages : Auth (login, register), Accueil

    Intégration des appels API avec Axios

- OUATTARA Dongui et BAKOUCHE Samy — Intégration Strapi ↔ React

    Connexion des données Strapi dans React

    Routage dynamique (slug) et navigation

    Gestion des fichiers (images) via Strapi Media Library

    Composants d’interface (Navbar)

- DAHMOUNE amelie et OUATTARA dongui  — Fonctionnalité, Intégration Strapi ↔ React

    Gestion des formulaires CRUD (posts, subreddits)

    Composants d’interface (CreatPostForm et SubrdditForm)

    Tests de bout en bout des principales fonctionnalités

    Déploiement du frontend et coordination de la soutenance

- HOVOR Fara et DAHMOUNE amelie — Qualité de l’interface (design, ergonomie, UX)

    mise en place d’un design cohérent et attrayant

    organisation du projet et de la docmumentation 

## Cahier des charges

### Le projet respecte les exigences suivantes :

    Strapi comme CMS/API

    Neon comme base de données PostgreSQL

    Application full-stack fonctionnelle avec authentification et gestion de contenu

### Livrables

    ✅ Application déployée

    ✅ Code source disponible sur GitHub

    ✅ Documentation claire (ce README)

    

### Licence

    Ce projet est réalisé dans le cadre d’un exercice pédagogique. Aucune licence commerciale n’est associée.





   

    
