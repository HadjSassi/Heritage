You're an expert software engineer.

you'll create a full stack web application that imitates the same application of myheritage.fr

Here are the **full use cases (main functionalities + practical applications)** of MyHeritage (including myheritage.fr).

---

# 1) Build & manage a family tree

**Core use case: personal genealogy**

* Create unlimited family trees 
* Add relatives, relationships, life events (birth, marriage, death)
* Import/export GEDCOM files
* Sync across web, mobile, and desktop (Family Tree Builder)

**Use cases**

* Build your ancestry from scratch
* Digitize an existing family tree
* Organize family history in one place

---

# 2) Search historical records (genealogy research engine)

**Core use case: find ancestors in archives**

* Access billions of records (birth, marriage, death, census, immigration, etc.) ([MyHeritage][2])
* Global database with multiple countries
* “SuperSearch” across all records

**Use cases**

* Find missing ancestors
* Verify family stories
* Discover unknown relatives

---

# 3) Smart matching & automated discoveries

**Core use case: automated genealogy insights**

Key technologies:

* Smart Matching (compare with other trees)
* Record Matching (match with archives)
* Instant Discoveries (auto-add branches) ([Base de Connaissance de MyHeritage][3])

**Use cases**

* Automatically expand your tree
* Find relatives without manual search
* Get alerts when new data matches your family

---

# 4) Mobile genealogy (on-the-go use)

**Core use case: quick access anywhere**

* Edit tree from smartphone
* Scan photos and documents
* Add notes instantly ([Base de Connaissance de MyHeritage][7])

**Use cases**

* Update tree during family gatherings
* Capture real-time information
* Quick research anywhere

---

# 5) Data preservation & storytelling

**Core use case: long-term heritage storage**

* Store photos, documents, audio
* Add stories and biographies
* Preserve family history for future generations

**Use cases**

* Create a digital family archive
* Document life stories
* Pass heritage to descendants

---

# 6) Cross-language & global search

**Core use case: international genealogy**

* Automatic name translation across languages ([Wikipédia][8])
* Access international records

**Use cases**

* Research ancestors abroad
* Overcome language barriers
* Trace migration history

---
Below is a **realistic, production-grade tech stack** to build a platform like MyHeritage, based on actual observed technologies used by the company + inferred architecture for similar-scale systems.

---

# 7) High-level architecture (simplified)

```
Frontend (React + SSR)
        ↓
GraphQL Gateway
        ↓
Microservices
        ↓
--------------------------------
| Relational DB (Postgres)      |
| Graph DB (Neo4j)             |
| Search (Elasticsearch)       |
| Cache (Redis)                |
--------------------------------
        ↓
Data Pipelines (Kafka + Spark)
        ↓
AI Layer (Python ML models)
        ↓
Storage (S3 + CDN)
```

---

# Final summary (compressed)

To build MyHeritage.fr, you need:

* **Frontend:** React + GraphQL
* **Backend:** Microservices
* **Data:** PostgreSQL + Neo4j + Redis
* **Search:** Elasticsearch / Solr
* **AI:** Python (CV + NLP + ML)
* **Infra:** AWS + Kubernetes
* **Data pipelines:** Kafka + Spark

---

# project structure

The project should be like this :

```
Heritage/
├── docker-base/
│   ├── docker-compose.yml
│   ├── README.md
│   └── Caddyfile
├── frontend/
│   ├── Dockerfile/
│   ├── test/
│   ├── README.md
│   └── code/
├── backend/
│   ├── Dockerfile/
│   ├── README.md
│   ├── test/
│   └── code/
├── .gitignore
├── .dockerignore
├── Makefile
├── README.md
└── prompt.md
```
---

# Makefile should contain the following commands:

```Makefile
make install:

make run:

make stop:

make down:

make logs:

make cli_front:

make cli_backend:

make ps:

make test:
```

---

You're a an excellent expert in software engineer, you need to follow the best practices, the design patterns.

You should also commit all the changes, and write clear commit messages.

the commits should be unitary, meaning that each commit should represent a single logical change to the codebase. This makes it easier to understand the history of the project and to revert changes if necessary.