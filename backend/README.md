# Backend — Heritage Microservices

Architecture microservices Node.js avec Apollo Federation v2.

## Services

| Service            | Port | Base de données       | Description                        |
|--------------------|------|-----------------------|------------------------------------|
| `gateway`          | 4000 | —                     | Apollo Federation Gateway          |
| `service-auth`     | 4001 | PostgreSQL + Redis    | Authentification JWT               |
| `service-tree`     | 4002 | PostgreSQL + Neo4j   | Arbre généalogique & relations     |
| `service-records`  | 4003 | Elasticsearch         | Recherche d'archives historiques   |
| `service-media`    | 4004 | PostgreSQL + MinIO    | Gestion des médias                 |
| `service-matching` | 4005 | Redis                 | Smart Matching                     |

## Architecture Apollo Federation

```
Client → Gateway (port 4000)
           ├── service-auth    (subgraph: User, AuthPayload)
           ├── service-tree    (subgraph: FamilyTree, Person, LifeEvent)
           ├── service-records (subgraph: HistoricalRecord, SearchResult)
           ├── service-media   (subgraph: Media)
           └── service-matching (subgraph: Match)
```

## Variables d'environnement

Chaque service lit ses variables depuis l'environnement Docker.
Voir `.env.example` à la racine du projet.

## Tests

```bash
# Depuis la racine
make test

# Ou directement
cd backend && npm test
```

## Développement local d'un service

```bash
make cli_backend
# Dans le container :
cd code/services/service-auth && npm run dev
```

## Health checks

Chaque service expose `GET /health` :

```bash
curl http://localhost:4001/health
# {"status":"ok","service":"auth"}
```

