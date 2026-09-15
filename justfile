set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# Windows host: `just test-engine` only. OCR/PDF run inside Linux compose images.

bootstrap:
    pnpm install
    uv sync --all-packages
    if (!(Test-Path .env)) { Copy-Item .env.example .env }

contracts:
    uv run python packages/contracts/scripts/generate.py
    git diff --exit-code packages/contracts/ts/src packages/contracts/py/src

up:
    docker compose -f infra/docker-compose.yml up --build -d

down:
    docker compose -f infra/docker-compose.yml down

seed:
    docker compose -f infra/docker-compose.yml exec api python -m lmpc_api.seed

demo: up
    Write-Host "Wait for vision /readyz then open http://localhost:3000"
    Write-Host "MinIO console http://localhost:9001 — creds from .env.example"

test-engine:
    uv run pytest engine/lmpc -q

test-api:
    uv run pytest services/api -q

test-e2e:
    pnpm --filter @lmpc/web exec playwright test
