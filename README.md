# LMPC Inspect

Officer-grade **Legal Metrology (Packaged Commodities) Rules, 2011** inspection
system for SIH26034. The model proposes; the officer signs.

Spine (fixed):

```
Capture → geometry & scale → extract → LMPC rule engine → officer confirm → report & repository
```

Read **[docs/architecture.md](docs/architecture.md)** before writing code.
JSON shapes change in `packages/contracts` first.

## Layout

| Path | Package | Owns |
|---|---|---|
| `apps/web` | `@lmpc/web` | Next.js PWA (officer / controller / admin) |
| `packages/camera` | `@lmpc/camera` | Capture overlay, ZXing |
| `packages/contracts` | `@lmpc/contracts` / `lmpc-contracts` | OpenAPI + JSON Schema |
| `packages/db` | `lmpc-db` | SQLAlchemy models, repos |
| `engine/lmpc` | `lmpc-engine` | Pure `evaluate()` — no I/O |
| `services/api` | `lmpc-api` | FastAPI, auth, enqueue |
| `workers/vision` | `lmpc-vision` | OCR / metrology DAG |
| `workers/reports` | `lmpc-reports` | PDF |
| `rules/lmpc/v2026_07` | data | Gazette thresholds |

Import direction: `lmpc_contracts` ← engine/db ← api/vision/reports.
API never imports vision or reports. Workers never import the API.

## Local DX

| Command | What |
|---|---|
| `just bootstrap` | pnpm + uv + `.env` |
| `just test-engine` | Engine unit tests — **OK on Windows, no Docker** |
| `just up` | Postgres, MinIO, Redis, api, vision, reports, web |
| `just demo` | Seed + print URLs |

Judging deploy is **one Linux VM + docker compose**. Railway is stretch.

Python 3.12, Node 22. Feature flags default off except dashboard.

## Demo cut

- **36h (PR-08):** pack-only overlay + confirm + PDF + dashboard.
- **Judging clip 3 (PR-09):** listing screenshot / Rule 6(10A) on the same inspection.
