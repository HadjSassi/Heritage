# Heritage — MyHeritage.fr Clone

Application web full-stack imitant MyHeritage.fr, construite avec React, GraphQL (Apollo Federation), Node.js et une stack de bases de données polyglotte.

## Stack technique

| Couche        | Technologie                          |
|---------------|--------------------------------------|
| Frontend      | React 18 + Vite + Apollo Client      |
| API Gateway   | Apollo Federation v2 + Express       |
| Microservices | Node.js + Apollo Subgraph            |
| Relationnel   | PostgreSQL 16                        |
| Graphe        | Neo4j 5                              |
| Cache/Session | Redis 7                              |
| Recherche     | Elasticsearch 8                      |
| Stockage      | MinIO (S3-compatible)                |
| Reverse Proxy | Caddy 2                              |
| CI            | Docker + Docker Compose              |

## Fonctionnalités

1. **Arbre généalogique** — création, édition, import/export GEDCOM
2. **Recherche d'archives** — SuperSearch via Elasticsearch
3. **Smart Matching** — correspondance automatique entre arbres
4. **Galerie médias** — photos, documents, audio
5. **Authentification** — JWT + sessions Redis

## Démarrage rapide

```bash
# Installer les dépendances et construire les images
make install

# Démarrer tous les services
make run

# Voir les logs
make logs

# Accéder à l'application : http://localhost
```

## Structure

```
Heritage/
├── docker-base/    # Docker Compose + Caddy
├── frontend/       # React App (Vite)
├── backend/        # Microservices Node.js
├── Makefile
└── README.md
```

## Variables d'environnement

Copier `.env.example` vers `.env` et ajuster les valeurs :

```bash
cp .env.example .env
```

