COMPOSE=docker compose -f docker-base/docker-compose.yml
FRONTEND_SERVICE=frontend
BACKEND_SERVICE=gateway

.PHONY: install run stop down logs cli_front cli_backend ps test

install:
	$(COMPOSE) pull
	$(COMPOSE) build

run:
	$(COMPOSE) up -d

stop:
	$(COMPOSE) stop

down:
	$(COMPOSE) down -v

logs:
	$(COMPOSE) logs -f

cli_front:
	$(COMPOSE) exec $(FRONTEND_SERVICE) sh

cli_backend:
	$(COMPOSE) exec $(BACKEND_SERVICE) sh

ps:
	$(COMPOSE) ps

test:
	$(COMPOSE) run --rm $(FRONTEND_SERVICE) npm test -- --run
	$(COMPOSE) run --rm $(BACKEND_SERVICE) npm test

seed:
	$(COMPOSE) exec service-auth node seed.js

