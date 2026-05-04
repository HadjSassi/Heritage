# Docker Infrastructure — Heritage

Ce dossier contient la configuration Docker Compose et le reverse proxy Caddy pour orchestrer tous les services de l'application Heritage.

## Services

| Service          | Rôle                              | Port interne |
|------------------|-----------------------------------|--------------|
| `caddy`          | Reverse proxy HTTP/HTTPS          | 80 / 443     |
| `frontend`       | Application React (Vite)          | 3000         |
| `gateway`        | Apollo Federation Gateway         | 4000         |
| `service-auth`   | Authentification & utilisateurs   | 4001         |
| `service-tree`   | Arbre généalogique (GraphQL)      | 4002         |
| `service-records`| Recherche d'archives              | 4003         |
| `service-media`  | Gestion des médias                | 4004         |
| `service-matching`| Smart Matching                  | 4005         |
| `postgres`       | Base de données relationnelle     | 5432         |
| `neo4j`          | Base de données graphe            | 7687         |
| `redis`          | Cache & sessions                  | 6379         |
| `elasticsearch`  | Moteur de recherche               | 9200         |
| `minio`          | Stockage objet S3-compatible      | 9000 / 9001  |

## Démarrage

```bash
# Depuis la racine du projet
make run

# Ou directement
docker compose -f docker-base/docker-compose.yml up -d
```

## Accès

- **Application** : http://localhost
- **GraphQL Playground** : http://localhost/graphql
- **MinIO Console** : http://localhost:9001

## Variables d'environnement

Toutes les variables sont configurables via `.env` à la racine du projet.
Voir `.env.example` pour la liste complète.

