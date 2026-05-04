# Frontend — Heritage

Application React 18 construite avec Vite et Apollo Client, imitant MyHeritage.fr.

## Stack

- **React 18** + React Router v6
- **Apollo Client** (GraphQL)
- **React Flow** (arbre généalogique interactif)
- **Vite** (bundler + serveur de dev)
- **Vitest** + React Testing Library (tests)

## Pages

| Route | Description |
|-------|-------------|
| `/` | Page d'accueil |
| `/login` | Connexion |
| `/register` | Inscription |
| `/tree` | Arbre généalogique interactif |
| `/person/:id` | Profil d'une personne |
| `/search` | SuperSearch — Archives historiques |
| `/media` | Galerie de médias |
| `/matches` | Smart Matching |

## Développement

```bash
# Dans le container
npm run dev

# Ou avec make
make cli_front
npm run dev
```

## Tests

```bash
npm test
```

