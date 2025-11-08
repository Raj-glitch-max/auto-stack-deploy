.PHONY: up down logs shell migrate seed

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f backend

shell:
	docker compose exec backend bash

migrate:
	docker compose exec backend alembic upgrade head

seed:
	docker compose exec backend python scripts/seed.py

