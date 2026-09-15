# LMPC Inspect — Production Codebase Architecture

| Field | Value |
|---|---|
| **Document** | LMPC Inspect architecture (SIH26034) |
| **Author** | SIH architecture |
| **Date** | 2026-09-13 |
| **Status** | Draft (rev 2 — review issues addressed) |
| **Product spec** | Obsidian vault `SIH/PRD.md` |
| **Problem statement** | SIH26034 — LMPC Rules 2011 compliance by scanning packs, images and listings |
| **Repo (greenfield)** | `D:\SIH` (`lmpc-inspect`) — scaffolded from this document |

---

## Overview

Legal Metrology officers today inspect packaged commodities by eye. Findings are not clause-cited, font-height vs Principal Display Panel (PDP) area is almost never measured, e-commerce Rule 6(10)/6(10A) checks are a different workflow, and nothing in the field produces a signed, evidence-backed inspection note with model and rule-pack versions. Generic OCR apps will fail this problem statement because they answer “what text is on the pack?” instead of “does this pack violate a named LMPC clause, with millimetre evidence?”

**LMPC Inspect** is an officer-grade inspection system plus an optional packer pre-check sandbox. The product is a **modular monolith** with a contracts-first monorepo. Every feature hangs off one fixed spine:

`Capture → geometry & scale → extract → LMPC rule engine → officer confirm → report & repository`

The model **proposes**; the officer **signs**. The system never auto-prosecutes. Phases 6–9 (listings, dashboards/maps, packer sandbox, watchlist) are feature-flagged modules on that spine, not a rewrite.

This document specifies the repo skeleton, ownership boundaries, the **full** HTTP/JSON contracts, Postgres + object-store data model, vision DAG, pure rule engine, AuthZ, local DX, demo-scale numbers, and an ordered PR plan a small SIH team can execute without later architectural rewrites.

---

## Background & Motivation

### Current state

- Workspace `D:\SIH` is empty. There is no code, no schema, no CI.
- The only product truth is `SIH/PRD.md` (vault). Feature-map rows conflict with the Phase 2 tech list (React Native vs web PWA). This document resolves those conflicts in **Key Decisions**.
- LMPC (Packaged Commodities) Rules, 2011, as amended through G.S.R. 128(E) (13 Feb 2026, Rule 6(10A) in force 1 Jul 2026), define *what* must appear and *how* (PDP, Table I heights, letter width, contrast, language). Officers still apply this by hand.

### Pain points this architecture must remove

| Pain | Consequence if ignored |
|---|---|
| UI before a written rule pack | “AI theatre”: findings that cannot quote a clause |
| Ad-hoc JSON between web, API, and workers | Merge wars and silent schema drift in a 36h hackathon |
| Cloud OCR / GPU-only path | Field demo dies on a CPU VM |
| Auto-fail / auto-prosecute | Legally unsafe; out of spec |
| Live marketplace scrape | ToS risk; judges cannot reproduce |
| RN APK as the only client | Judges without Play Store / sideload fail the demo |
| Microservices on day one | Ops tax a 4–6 person team cannot pay |
| Watchlist mixed into statutory PDF | Cross-regulator overreach; FSSAI/CDSCO confusion |

### Demo cut (binding)

The PRD states two bars. This architecture **does not treat them as one**.

| Bar | What must work | When |
|---|---|---|
| **36h prototype (PR-08)** | Login as officer → upload **PDP + back** + barcode → extracted fields → **one** mm-font + PDP finding with overlay → officer **Confirm** (≥1 accepted) → download PDF → appear on dashboard | Hard gate. Pack-only. `FEATURE_LISTINGS=false`. |
| **Judging 3-minute script (PR-09)** | The 36h path **plus** listing screenshot on the **same** inspection showing Rule 6(10A) COO-filter missing | Best-effort in the same weekend. If PR-09 slips, **drop clip 3**; do not stall the PDF. |

Judging clip (when PR-09 lands):

1. Overlay PDP + scale bar.
2. Finding: “MRP numeral 1.8 mm vs required 2.5 mm — Rule 7 Table I Sl. 3”.
3. Listing missing searchable/sortable COO filter — Rule 6(10A). *(PR-09 only.)*
4. Officer taps **Confirm**.
5. PDF opens with evidence crops and clause IDs.

`FEATURE_LISTINGS` stays **false** in compose from PR-01 through PR-08. PR-09 flips it.

---

## Goals & Non-Goals

### Goals

1. Ship a **contracts-first** monorepo a pair of developers can split without merge wars.
2. Encode LMPC **manner** rules (PDP, Table I, width, isolation, contrast, Hindi-or-English), not only field presence.
3. Keep the rule engine a **pure function** of structured inputs + a versioned rule pack. Engine output has **no persistence IDs**.
4. Make the vision pipeline a **DAG of idempotent steps** with stored artifacts and re-run-from-step. Fast overlay and full analysis are **two jobs**.
5. Preserve an **evidence chain**: raw hash, watermark, EXIF policy, officer identity, model + rule-pack versions on every report.
6. Support **CPU-only** field demo; GPU optional.
7. Enable Phases 6–9 by **feature flags**, without destabilizing the spine.
8. Make the 36h vertical slice the first mergeable product path, not a throwaway. Canned-fixture vision (PR-06a) is a hard gate so OCR slip does not kill the demo.

### Non-Goals (v1 / demo)

- Auto-prosecution, compounding, or court filing.
- Live Amazon/Flipkart/Blinkit scraping.
- On-device ML Kit as the primary OCR (conflicts with PWA-first).
- Native ARCore/ARKit scale (Phase 4 fallback #3; post-demo).
- PostGIS district heatmaps as a demo blocker (schema-ready, feature-flagged).
- Packer sandbox and watchlist in Phase 1–5.
- Postgres RLS in the 36h window (app-level `tenant_id` filter only).
- Cryptographic officer e-sign (printed name + code + timestamp is the signature block).
- Multi-region HA, Kafka, service mesh, Kubernetes operators.
- Replacing FSSAI / CDSCO / CIB-RC determinations.
- Railway/Render as the **supported** judging deploy (stretch only). Supported path is **one Linux VM + docker compose**.

---

## Key Decisions

Decisions below are **binding** for the repo skeleton. PRD conflicts are resolved here, not left as “TBD”.

| ID | Decision | Choice | Rationale |
|---|---|---|---|
| KD-1 | Primary field client | **Next.js App Router PWA** (`apps/web`), current LTS at scaffold time. Optional later **Expo** app consumes the same OpenAPI. | PRD Phase 2 says “Web app (Install button)”. Feature map says RN/SQLite. Judges must not depend on Play Store. Expo is a later client, not a second backend. |
| KD-2 | Process topology | **One FastAPI app** + **two ARQ workers** (vision, reports) sharing Postgres, Redis, MinIO. Persistence lives in `packages/db` (`lmpc-db`). Bounded contexts are packages, not networks. | Premature microservices fail SIH ops. OCR/PDF must not block HTTP. Extraction path: move a package without changing contracts. |
| KD-3 | Rule engine | **Pure Python + Pydantic**, rule packs as versioned JSON/YAML under `rules/lmpc/`. Not OPA. Returns `ProposedFinding[]` **without** `id`. | Engine must be unit-testable without images, DB, or inspection identity. |
| KD-4 | OCR | **PaddleOCR PP-OCRv4 + PP-Structure** (CPU). DocTR optional adapter. **No ML Kit**. VLM behind `FEATURE_VLM_FALLBACK` (off). Weights **baked** into `Dockerfile.vision`. | Indic+English on CPU. First-request latency cannot download models. |
| KD-5 | Auth (demo vs later) | Demo: FastAPI-issued HS256 JWT delivered as **httpOnly cookie** on **same origin** (Next.js rewrites `/v1` → API). Claims stay Keycloak-shaped. Later: RS256 issuer (PR-14). **Not Firebase.** | Memory-only tokens die on PWA refresh mid-demo. Same-origin removes CORS on the API. Firebase is a poor government fit. |
| KD-6 | Monorepo tool | **pnpm workspaces** (JS) + **uv workspace** (Python). **Not Nx/Turborepo.** Orchestrate with `just`. Python **3.12**, Node **22**. | Two languages. Explicit member maps in PR-01. |
| KD-7 | Offline v1 | **Online-first.** Optional Dexie queue behind `FEATURE_OFFLINE_QUEUE` (off). | Demo is campus Wi‑Fi. |
| KD-8 | Contracts | Hand-written **OpenAPI YAML is the only HTTP source of truth**. FastAPI **serves that file**; it does not autogenerate `/openapi.json`. JSON Schema is the only source for findings/packs/jobs/fields/metrology. Generated: `packages/contracts/ts/src/` (`@lmpc/contracts`) and `packages/contracts/py/src/lmpc_contracts/` (`lmpc-contracts`). **Never hand-edit generated files.** | Prevents FastAPI `/openapi.json` drifting from the YAML the PWA is generated from. |
| KD-9 | Object store | **MinIO** locally / S3-compatible in deploy. | Matches PRD. |
| KD-10 | Reports | **WeasyPrint PDF** for demo; DOCX flagged. PDF allowed **iff ≥1 `accepted` finding**. Signature block = printed `display_name` + `officer_code` + timestamps. | Closes “officer signs” without crypto. |
| KD-11 | Search | **Postgres FTS** later. Demo list filter is `GET /v1/inspections?gtin=` (no `tsvector` yet). Dual-MRP is a **query** over `products.gtin` ⋈ `extracted_fields.payload.mrp`, not an index on `findings`. | SKU memory must not wait for a new contract. |
| KD-12 | Watchlist / listings / packer | **Modules + flags.** Listings are a **face on the same inspection**, not a second aggregate. Watchlist never enters a statutory PDF without `officer_decision=accepted`. | Spec: satellite; 6(10A) still hangs on the spine. |
| KD-13 | Default compute | **CPU mandatory.** `DEVICE=cpu` on the **vision** service. CUDA opt-in. | Field VM has no GPU. |
| KD-14 | Rule-pack default | `lmpc.v2026_07`. | 6(10A) in force for judging. |
| KD-15 | Job split | `vision_fast` then `vision_full`. Overlay target is the fast job. | Same-job “full DAG continues” cannot hit &lt;5 s if the UI waits on `succeeded`. |
| KD-16 | Queue | **ARQ** (Redis). Vision worker `max_jobs=1`. | PaddleOCR is process-global and not safely concurrent. |
| KD-17 | Tenancy | 36h: **application** `WHERE tenant_id = :jwt_tenant` on every query. **No RLS**, no `current_tenant()`. Snapshot `district_code` and `officer_code` onto `inspections` at create. | RLS is a later PR. Controllers must not join live `users.district_code` (rewrites history). |
| KD-18 | Host OS | Windows host runs **`just test-engine` only**. OCR, WeasyPrint/GTK, Paddle wheels run **inside Linux compose images**. | This workspace is Windows; WeasyPrint and Paddle are unforced host pain. |
| KD-19 | Wire IDs | Public IDs are **UUID strings**. No `insp_` / `fnd_` / `job_` / `face_` prefixes on the wire. | Prefixes were a display convention that fought the UUID PK. |
| KD-20 | 36h OCR cut-line | PR-06a canned fixtures are the **hard gate** for PR-07/08. If overlay p95 &gt; 8 s, ship canned metrology with a visible **“fixture scale”** badge rather than invent millimetres. | Paddle first-load must not kill judging. |

---

## Proposed Design

### 1. System context

```mermaid
flowchart TB
  subgraph clients [Clients]
    PWA["apps/web — Next.js PWA<br/>same-origin /v1 rewrite"]
    Expo["apps/mobile — Expo later"]
  end

  subgraph edge [One Linux VM + compose]
    API["services/api — FastAPI<br/>serves openapi.yaml"]
    Redis[(Redis + ARQ)]
    PG[(Postgres 16)]
    MinIO[(MinIO)]
    VW["workers/vision — ARQ max_jobs=1"]
    RW["workers/reports — ARQ"]
    DB["packages/db — lmpc-db"]
    ENG["engine/lmpc — ProposedFinding[]"]
    RULES["rules/lmpc/v2026_07"]
  end

  PWA -->|"same origin /v1"| API
  Expo -.->|same OpenAPI| API
  API --> DB
  VW --> DB
  RW --> DB
  DB --> PG
  API --> MinIO
  API --> Redis
  Redis --> VW
  Redis --> RW
  VW --> MinIO
  VW --> ENG
  ENG --> RULES
  RW --> MinIO
```

HTTP never calls PaddleOCR on the request thread. The API writes evidence, enqueues ARQ jobs, returns `202` + `job_id`. Workers persist through `lmpc-db` (not through the HTTP API). The vision process is the only one allowed to load OCR weights.

### 2. Monorepo layout

Repository name: **`lmpc-inspect`**.

```text
lmpc-inspect/
├── apps/
│   └── web/                         # @lmpc/web — Next.js App Router PWA (LTS)
│       ├── app/                     # (officer), (controller), (admin); auditor uses controller RO
│       ├── components/capture/
│       ├── lib/api/
│       ├── public/manifest.webmanifest
│       ├── next.config.ts           # rewrites /v1 → http://api:8000/v1
│       └── tests/e2e/demo.spec.ts
├── services/
│   └── api/                         # lmpc-api
│       ├── pyproject.toml
│       ├── src/lmpc_api/
│       │   ├── main.py              # create_app(); mounts static OpenAPI
│       │   ├── settings.py
│       │   ├── deps.py
│       │   ├── envelope.py          # Envelope[T]
│       │   ├── identity/
│       │   ├── inspections/
│       │   ├── catalog/
│       │   ├── listings/            # flag; empty module until PR-09
│       │   ├── analytics/
│       │   ├── packer/
│       │   ├── watchlist/
│       │   ├── audit/
│       │   └── reports/
│       ├── alembic/
│       └── tests/
├── workers/
│   ├── vision/                      # lmpc-vision
│   │   ├── pyproject.toml
│   │   └── src/lmpc_vision/
│   │       ├── worker.py            # ARQ WorkerSettings
│   │       ├── runner.py
│   │       ├── persistence.py       # calls lmpc_db only
│   │       ├── steps/
│   │       ├── adapters/ocr.py
│   │       └── overlays.py
│   └── reports/                     # lmpc-reports
│       ├── pyproject.toml
│       └── src/lmpc_reports/
│           ├── worker.py
│           ├── pdf.py
│           └── docx.py
├── engine/
│   └── lmpc/                        # lmpc-engine — PURE
│       ├── pyproject.toml
│       ├── src/lmpc_engine/
│       │   ├── evaluate.py          # -> list[ProposedFinding]
│       │   ├── packs.py
│       │   ├── checks/
│       │   └── exceptions.py
│       └── tests/golden/            # namkeen-01/fields.json, metrology.json, expected.json
├── packages/
│   ├── contracts/
│   │   ├── openapi/openapi.yaml     # HTTP source of truth
│   │   ├── jsonschema/
│   │   │   ├── envelope.schema.json
│   │   │   ├── proposed_finding.schema.json
│   │   │   ├── finding.schema.json
│   │   │   ├── extracted_fields.schema.json
│   │   │   ├── metrology.schema.json
│   │   │   ├── rule_pack.schema.json
│   │   │   └── job_envelope.schema.json
│   │   ├── ts/                      # @lmpc/contracts — generated into src/
│   │   │   ├── package.json
│   │   │   └── src/
│   │   └── py/                      # lmpc-contracts — generated into src/lmpc_contracts/
│   │       ├── pyproject.toml
│   │       └── src/lmpc_contracts/
│   ├── db/                          # lmpc-db — SQLAlchemy models, session, repos
│   │   ├── pyproject.toml
│   │   └── src/lmpc_db/
│   ├── camera/                      # @lmpc/camera
│   └── config/                      # @lmpc/config
│       └── importlinter.ini
├── rules/lmpc/v2017_01|v2022_12|v2026_07/
├── fixtures/
│   ├── packs/namkeen-01/            # photos + canned fields.json + metrology.json + overlay.jpg
│   ├── listings/
│   ├── labels/
│   └── synthetic/
├── infra/
│   ├── docker-compose.yml
│   ├── Dockerfile.api
│   ├── Dockerfile.vision            # bakes PP-OCRv4 + Indic weights
│   ├── Dockerfile.reports           # apt: pango cairo gdk-pixbuf libffi weasyprint deps
│   ├── Dockerfile.web
│   └── seed/
├── tests/contract/
├── docs/
│   ├── architecture.md
│   ├── clauses.md
│   ├── demo-script.md
│   └── demo-cut.md                  # 36h vs judging clip 3
├── justfile
├── pnpm-workspace.yaml
├── pyproject.toml
├── package.json
├── .nvmrc                           # 22
├── .python-version                  # 3.12
├── .env.example
└── README.md
```

#### Workspace maps (PR-01 must commit these verbatim)

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/contracts/ts"
  - "packages/camera"
  - "packages/config"
```

Root `package.json`: `"packageManager": "pnpm@9"`, engines `node: ">=22 <23"`.

Root `pyproject.toml`:

```toml
[project]
name = "lmpc-inspect"
version = "0.1.0"
requires-python = ">=3.12,<3.13"

[tool.uv.workspace]
members = [
  "engine/lmpc",
  "services/api",
  "workers/vision",
  "workers/reports",
  "packages/contracts/py",
  "packages/db",
]
```

| Directory | Distribution | Import package | Hatch map |
|---|---|---|---|
| `services/api` | `lmpc-api` | `lmpc_api` | `src/lmpc_api` |
| `engine/lmpc` | `lmpc-engine` | `lmpc_engine` | `src/lmpc_engine` |
| `workers/vision` | `lmpc-vision` | `lmpc_vision` | `src/lmpc_vision` |
| `workers/reports` | `lmpc-reports` | `lmpc_reports` | `src/lmpc_reports` |
| `packages/db` | `lmpc-db` | `lmpc_db` | `src/lmpc_db` |
| `packages/contracts/py` | `lmpc-contracts` | `lmpc_contracts` | `src/lmpc_contracts` (generated) |

Each member `pyproject.toml` uses:

```toml
[tool.hatch.build.targets.wheel]
packages = ["src/lmpc_api"]  # example for api
```

**Import direction (enforced by `packages/config/importlinter.ini`):**

```text
lmpc_contracts          (no internal deps)
lmpc_engine             → lmpc_contracts
lmpc_db                 → lmpc_contracts
lmpc_api                → lmpc_contracts, lmpc_engine, lmpc_db
lmpc_vision             → lmpc_contracts, lmpc_engine, lmpc_db
lmpc_reports            → lmpc_contracts, lmpc_db
```

`lmpc_api` **must not** import `lmpc_vision` or `lmpc_reports`. Workers **must not** import `lmpc_api`. Persistence goes through `lmpc_db` repositories.

#### Ownership

| Package | Owns | Does not own |
|---|---|---|
| `@lmpc/web` | PWA, capture UX, confirm, dashboard widgets | Rules, OCR |
| `@lmpc/camera` | Overlay, ZXing, client EXIF hints | Upload protocol |
| `@lmpc/contracts` / `lmpc-contracts` | Generated types | SQLAlchemy |
| `lmpc-engine` | `evaluate()` | Images, DB, HTTP, UUIDs of rows |
| `lmpc-db` | Models, Alembic env helpers, repos | HTTP, OpenCV |
| `lmpc-api` | Auth, REST, enqueue, RBAC | OpenCV, WeasyPrint |
| `lmpc-vision` | DAG, OCR, metrology, overlays, finding ID mint | HTTP, PDF |
| `lmpc-reports` | PDF/DOCX from Postgres + MinIO | OCR |
| `rules/lmpc/*` | Gazette text, thresholds | Code |

**Merge-war rule:** JSON shape changes go through `packages/contracts` first.

**36h pair split:**

- Dev A: contracts, rule pack, engine, API, reports enqueue.
- Dev B: PR-06a runner + canned steps, `@lmpc/camera`, officer PWA.
- Shared gate: `just demo` on CPU with canned namkeen fixture.
- PR-06b (real Paddle) is Dev B stretch and **must not** block PR-07/08.

### 3. Bounded contexts

```mermaid
flowchart LR
  Identity --> Audit
  Inspections --> Catalog
  Inspections --> Audit
  Inspections --> Identity
  Listings --> Inspections
  Analytics --> Inspections
  Packer --> Inspections
  Watchlist --> Inspections
  Reports --> Inspections
  Reports --> Audit
```

| Context | Path | Responsibility |
|---|---|---|
| identity | `lmpc_api.identity` | Login cookie, users, roles, tenants |
| inspections | `lmpc_api.inspections` | Aggregate, faces, evidence, decisions, scale_hints |
| catalog | `lmpc_api.catalog` | GTIN identity; `GET /v1/inspections?gtin=` |
| vision | `lmpc_vision` | `vision_fast` / `vision_full` DAG |
| metrology | `lmpc_vision.steps.metrology` | mm, PDP cm², width, isolation, contrast |
| lmpc-engine | `lmpc_engine` | Pure `ProposedFinding[]` |
| reports | `lmpc_reports` + API enqueue | PDF reads **Postgres + MinIO**, not `findings.json` alone |
| listings | `lmpc_api.listings` | PR-09 UI helpers; data is `face=listing` on the inspection |
| analytics | `lmpc_api.analytics` | KPIs |
| packer-sandbox | `lmpc_api.packer` | `tenant_type=packer` |
| watchlist | `lmpc_api.watchlist` | Advisory |
| audit | `lmpc_db` + `lmpc_api.audit` | Append-only events; per-inspection hash chain |

### 4. Contracts-first

**Hand-written only:**

- `packages/contracts/openapi/openapi.yaml`
- `packages/contracts/jsonschema/*.schema.json`

**Generated (do not edit):**

```text
just contracts
# datamodel-code-generator==0.26.3 \
#   --input packages/contracts/jsonschema \
#   --output packages/contracts/py/src/lmpc_contracts \
#   --output-model-type pydantic_v2.BaseModel --use-standard-collections
# json-schema-to-typescript (json-schema-to-typescript@15) → packages/contracts/ts/src/schema/
# openapi-typescript@7 → packages/contracts/ts/src/openapi.ts
```

CI: `just contracts && git diff --exit-code packages/contracts/ts/src packages/contracts/py/src`.

**OpenAPI serving (KD-8):** `create_app()` loads the YAML and replaces FastAPI autogen:

```python
# services/api/src/lmpc_api/main.py
from pathlib import Path
import yaml
from fastapi import FastAPI
from lmpc_api.identity.router import router as identity_router
from lmpc_api.inspections.router import router as inspections_router
from lmpc_api.catalog.router import router as catalog_router
from lmpc_api.listings.router import router as listings_router
from lmpc_api.analytics.router import router as analytics_router
from lmpc_api.packer.router import router as packer_router
from lmpc_api.watchlist.router import router as watchlist_router
from lmpc_api.reports.router import router as reports_router
from lmpc_api.settings import Settings, get_settings

OPENAPI_PATH = Path(__file__).resolve().parents[4] / "packages/contracts/openapi/openapi.yaml"

def _load_spec() -> dict:
    return yaml.safe_load(OPENAPI_PATH.read_text())

def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="LMPC Inspect", version="0.1.0", docs_url="/docs")
    spec = _load_spec()
    app.openapi = lambda: spec  # type: ignore[method-assign]
    app.include_router(identity_router, prefix="/v1")
    app.include_router(inspections_router, prefix="/v1")
    app.include_router(catalog_router, prefix="/v1")
    app.include_router(reports_router, prefix="/v1")
    if settings.feature_listings:
        app.include_router(listings_router, prefix="/v1")
    if settings.feature_dashboard:
        app.include_router(analytics_router, prefix="/v1")
    if settings.feature_packer_sandbox:
        app.include_router(packer_router, prefix="/v1")
    if settings.feature_watchlist:
        app.include_router(watchlist_router, prefix="/v1")
    return app
```

Contract tests (`tests/contract`) compare `GET /openapi.json` to the YAML (semantic equality). Schemathesis runs **against the YAML file**, not against FastAPI autogen. Flagged routers that are off must still exist in the YAML as tagged `x-feature-flag: FEATURE_LISTINGS` and are filtered from the **served** spec by a small transformer — default demo serve = YAML minus flagged paths. PR-02 ships the **unfiltered** YAML including later routes so the file is not a stub; the transformer hides them when the flag is false.

**Envelope:** responses always wrap; **request bodies are never enveloped**.

```python
class Envelope(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ErrorBody | None = None
    meta: Meta
```

`error.code` closed set: `unauthorized`, `forbidden`, `validation`, `not_found`, `conflict`, `unsupported_media`, `payload_too_large`, `job_failed`, `rule_pack_invalid`, `scale_unavailable`.

**PR-02 YAML must include these paths** (non-negotiable, not a stub):

| Method | Path |
|---|---|
| POST | `/v1/auth/login` |
| POST | `/v1/auth/logout` |
| GET | `/v1/auth/me` |
| POST | `/v1/inspections` |
| GET | `/v1/inspections` |
| GET | `/v1/inspections/{id}` |
| POST | `/v1/inspections/{id}/faces` |
| POST | `/v1/inspections/{id}/barcode` |
| PATCH | `/v1/inspections/{id}/scale-hints` |
| POST | `/v1/inspections/{id}/analyze` |
| GET | `/v1/jobs/{job_id}` |
| POST | `/v1/inspections/{id}/findings/{finding_id}/decision` |
| POST | `/v1/inspections/{id}/report` |
| GET | `/v1/inspections/{id}/report` |
| GET | `/v1/dashboard/summary` |
| GET | `/v1/evidence/{id}` |
| GET | `/healthz` |

### 5. Vision pipeline as two jobs + one DAG

```mermaid
flowchart TD
  API[POST /analyze] --> F[ARQ vision_fast]
  F --> A[ingest_raw]
  A --> B[preprocess]
  B --> E[detect_barcode]
  E --> S[estimate_scale]
  B --> G[ocr_layout PDP crop]
  G --> H[extract_fields]
  S --> I[metrology manner metrics]
  H --> I
  I --> J[evaluate_rules]
  J --> K[render_overlays]
  K --> P[persist + inspection awaiting_officer]
  P --> FULL[ARQ enqueue vision_full]
  FULL --> C[detect_pack]
  C --> D[segment_panels remaining faces]
  D --> G2[ocr_layout other faces]
  G2 --> H2[extract_fields merge]
  H2 --> I2[metrology remaining targets]
  I2 --> J2[evaluate_rules upsert]
  J2 --> K2[overlays annex]
```

Each node: `step(input_artifact_uris, params) -> output_artifact_uris`. Re-run from `jobs.resume_from`. Artifacts immutable under `runs/{run_id}/`. CPU default.

| Step | Used by | Output suffix | Failure policy |
|---|---|---|---|
| `ingest_raw` | fast | `raw.jpg`, `raw.sha256` | Hard fail |
| `preprocess` | fast | `preprocessed.jpg`, `glare_mask.png` | Soft: continue with raw; `quality.glare` |
| `detect_pack` | full | `pack_box.json` | Soft: full frame; retake if conf &lt; 0.4 |
| `segment_panels` | full | `panels.json` | Officer `face` label wins over detector |
| `detect_barcode` | fast | `barcode.json` | Soft. Client ZXing value **wins**; vision confirms; mismatch → `metrics.barcode_mismatch=true` |
| `estimate_scale` | fast | `scale.json` | Try EAN/UPC module, then `scale_hints.coin_mm`, then `scale_hints.pack_height_mm`. If none: **structured** `job_failed` / `scale_unavailable` (not HTTP 500). Canned path uses `scale_method=fixture`. |
| `ocr_layout` | fast: PDP only; full: all | `ocr.json` (blocks + `script`) | Hard fail if no text on PDP |
| `extract_fields` | both | `fields.json` | **Never invent MRP**. Missing → `present=false`, `raw=null` |
| `metrology` | both | `metrology.json` | Always `±`. Includes height, width, isolation, contrast, `print_vs_blown` |
| `evaluate_rules` | both | `findings.json` as `ProposedFinding[]` | Worker mints IDs, upserts |
| `render_overlays` | both | `overlay.jpg`, `crops/{finding_id}.jpg` | Fast path: if a finding has no crop, skip that crop and still persist; UI shows bbox on full overlay. Full path: retry crop |

**Job kinds:** `vision_fast` | `vision_full` | `report`.

**Fast path persist:** when `render_overlays` of `vision_fast` succeeds, worker sets `inspections.status = awaiting_officer`, upserts findings, writes `extracted_fields` for this `run_id`. UI does **not** wait for `vision_full`.

**Polling:** `GET /v1/jobs/{id}` every **500 ms**. Client timeout **15 s** for `vision_fast`, **45 s** for `vision_full`. Publish `job_steps` so the PWA can render when fast `render_overlays` is `succeeded` even if the parent `vision_full` is still `running`.

**Upsert rule:** `INSERT … ON CONFLICT (inspection_id, rule_id, coalesce(target_field,'')) DO UPDATE` of summary/metrics/confidence/evidence **but do not update `officer_decision` or decision rows**. Full-job findings must not clobber a Confirm already tapped on the fast-path Table I row.

**Concurrency:** `POST /analyze` returns **409 `conflict`** if this inspection already has a `vision_fast` or `vision_full` in `queued|running`.

**Canned mode (PR-06a / KD-20):** if `jobs.params.use_canned_fixture = "namkeen-01"` (or env `VISION_BACKEND=canned`), every step copies `fixtures/packs/namkeen-01/{fields,metrology,overlay}.json|jpg`. Overlay badge text: `FIXTURE SCALE`. Engine still runs for real.

**Scale methods (order):** (1) EAN-13/UPC module width, assumed module **0.330 mm**, `uncertainty_rel = 0.15`; (2) 1-rupee coin **21.93 mm** or typed pack height; (3) AR off. Always persist `scale.method`. Never claim 0.1 mm from a phone: `2.1 ± 0.4 mm`. Fail Table I only if `measured_mm + uncertainty_mm < required_mm`.

**Analyze preconditions:** at least one `face=pdp`. 36h script also uploads `back` (API warns via `meta.warnings` if missing, does not 409). `captured_at` optional; fallback EXIF `DateTimeOriginal`, then server `now()`.

### 6. Rule engine (pure function)

```python
def evaluate(
    fields: ExtractedFields,
    metrology: MetrologyResult,
    rule_pack: RulePack,
    exceptions: ExceptionContext,
) -> list[ProposedFinding]:
    """No I/O, no clock, no inspection_id, no UUID minting."""
```

`ExceptionContext.as_of: date` is **required** (6(10A) in-force). Workers copy `job.as_of` — they must not call `date.today()`. Demo seed `as_of=2026-07-02`.

**ID minting (worker, after evaluate):**

```python
FINDING_NAMESPACE = UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")  # UUID_URL

def mint_finding_id(inspection_id: UUID, rule_id: str, target_field: str | None) -> UUID:
    name = f"{inspection_id}:{rule_id}:{target_field or ''}"
    return uuid5(FINDING_NAMESPACE, name)
```

This is the **same** identity as unique index `findings_identity` on `(inspection_id, rule_id, COALESCE(target_field, ''))`. Do not change one without the other.

Category exceptions emit `status=skipped_exception` (a row is stored so UNIQUE holds). Statutory PDFs **omit** those rows by default.

Severity lives in the pack. Python implements predicates; JSON supplies thresholds and clause text.

### 7. Queue, workers, persistence

| Item | Binding |
|---|---|
| Library | **ARQ** 0.26+ on Redis 7 |
| Queues | default ARQ queue; functions `run_vision_fast`, `run_vision_full`, `run_report` |
| Vision concurrency | `max_jobs=1`, `job_timeout=120` |
| Reports concurrency | `max_jobs=2`, `job_timeout=60` |
| Retry | 2 retries on `S3Transient` / `DBTransient`; **no** retry on schema validation or `scale_unavailable` |
| Poison | after retries: `jobs.status=failed`, `jobs.error` set; no separate DLQ broker |
| Persistence | `lmpc_db` session in the worker process |
| Reports input | latest `findings` + `officer_decisions` from Postgres; crops from MinIO keys on those rows; product/inspection identity from Postgres |

`extracted_fields` is **versioned by `run_id`**. `inspections.current_run_id` points at the latest successful fast or full run. Re-analyze inserts a new row; it does not clobber history.

### 8. Feature flags

| Flag | PR-01…08 default | Unlocks |
|---|---|---|
| `FEATURE_LISTINGS` | **false** | PR-09 listing face UI + 6(10A) clip |
| `FEATURE_DASHBOARD` | **true** | Summary KPIs (no maps) |
| `FEATURE_DASHBOARD_MAPS` | false | Leaflet + PostGIS |
| `FEATURE_PACKER_SANDBOX` | false | Phase 8 |
| `FEATURE_WATCHLIST` | false | Phase 9 |
| `FEATURE_OFFLINE_QUEUE` | false | Dexie |
| `FEATURE_VLM_FALLBACK` | false | VLM |
| `FEATURE_DUAL_MRP` | false | Rule 18(2A) query board |
| `FEATURE_AR_SCALE` | false | AR |
| `FEATURE_DOCX` | false | DOCX |
| `VISION_BACKEND` | `canned` until 6b, then `paddle` | OCR implementation |

Flags are copied onto `jobs.params` so replay does not flip mid-run.

---

## API / Interface Changes

Greenfield. All product routes under `/v1`. Browser talks **only** to the Next origin; `next.config.ts` rewrites `/v1/:path*` → `http://api:8000/v1/:path*` (dev: `http://localhost:8000`). Login sets `Set-Cookie: lmpc_access=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`. Playwright uses that cookie. CSRF is not required for same-site Lax on this demo; PR-14 adds refresh + CSRF if cookies stay.

MinIO: browser does **not** fetch the bucket. Thumbs and overlays go through `GET /v1/evidence/{id}` (API enforces RBAC, logs `evidence.raw_read` when `kind=raw`). If a later PR switches to pre-signed URLs, MinIO CORS must allow the web origin; not required for 36h.

### Demo path

```mermaid
sequenceDiagram
  actor Officer
  participant Web as apps/web
  participant API as lmpc-api
  participant PG as Postgres
  participant S3 as MinIO
  participant Q as ARQ/Redis
  participant V as lmpc-vision
  participant E as lmpc-engine
  participant R as lmpc-reports

  Officer->>Web: login
  Web->>API: POST /v1/auth/login
  API-->>Web: Set-Cookie + Envelope user
  Officer->>Web: PDP + back + barcode + optional coin/height
  Web->>API: POST /v1/inspections
  API->>PG: insert inspection (district_code snapshot)
  Web->>API: POST /v1/inspections/{id}/faces
  API->>S3: raw.jpg + sha256
  API->>PG: faces + evidence_objects
  Web->>API: POST /v1/inspections/{id}/analyze
  API->>PG: 409 if vision job running
  API->>Q: enqueue vision_fast
  API-->>Web: 202 job_id
  loop poll 500 ms
    Web->>API: GET /v1/jobs/{id}
  end
  V->>S3: artifacts
  V->>E: evaluate(...)
  E-->>V: ProposedFinding[]
  V->>PG: mint UUIDv5, upsert findings, extracted_fields
  V->>Q: enqueue vision_full
  Web->>API: GET /v1/inspections/{id}
  Officer->>Web: Confirm
  Web->>API: POST .../findings/{uuid}/decision
  Web->>API: POST .../report
  API->>Q: enqueue report
  R->>PG: findings + decisions
  R->>S3: report.pdf
  Web->>API: GET report + dashboard
```

### Request / response shapes

IDs in examples are UUIDs. Envelope omitted in `data` payloads below.

**POST `/v1/auth/login`** `{ "email": "officer@demo.lmpc", "password": "demo-officer" }`  
**data:** `{ "user": { "id": "2f0e8a6a-…", "email": "…", "role": "officer", "tenant_id": "…", "district_code": "MH-PUN", "display_name": "LMO Demo" } }` plus Set-Cookie. JWT claims: `sub`, `role`, `tenant_id`, `district_code`, `officer_code`, `iss=lmpc-inspect-demo`, `aud=lmpc-api`.

**POST `/v1/inspections`**

```json
{
  "channel": "kirana",
  "capture_mode": "pack",
  "location": { "lat": 18.5204, "lon": 73.8567, "accuracy_m": 12 },
  "device": { "model": "Pixel 7", "ua": "Mozilla/…" },
  "scale_hints": { "coin_mm": null, "pack_height_mm": null },
  "notes": null
}
```

**data:** `{ "id": "018f2c9a-…", "status": "draft", "district_code": "MH-PUN", "officer_code": "LMO-1024", "created_at": "2026-09-13T10:00:00Z" }`.

**GET `/v1/inspections?gtin=8901234567890&status=&limit=20&offset=0`** — list for dashboard and dual-MRP later. Always filtered by JWT `tenant_id`. Controllers additionally filter `district_code` unless role=admin.

**POST `/v1/inspections/{id}/faces`** `multipart/form-data`

| field | notes |
|---|---|
| `face` | `pdp` \| `back` \| `side` \| `neck` \| `listing` \| `annexure` |
| `file` | JPEG/PNG/WebP, max 12 MB, magic-byte sniff |
| `client_sha256` | optional; server recomputes; mismatch → 409 |
| `captured_at` | optional ISO-8601 |

Retakes: new row (UNIQUE is `(inspection_id, face, captured_at)`). **Analyze uses the latest `captured_at` per `face`**.

**PATCH `/v1/inspections/{id}/scale-hints`** `{ "coin_mm": 21.93, "pack_height_mm": null }` — also accepted on create and on analyze body.

**POST `/v1/inspections/{id}/barcode`** `{ "symbology": "ean13", "value": "8901234567890", "source": "zxing" }` — persisted as client barcode; vision may confirm.

**POST `/v1/inspections/{id}/analyze`**

```json
{
  "rule_pack_id": "lmpc.v2026_07",
  "as_of": "2026-07-02",
  "fast_path": true,
  "resume_from": null,
  "scale_hints": { "coin_mm": null, "pack_height_mm": 180.0 },
  "use_canned_fixture": null
}
```

Requires a `pdp` face. Enqueues `vision_fast` (and `vision_full` after fast succeeds, unless `fast_path=false` then only full). **202:** `{ "job_id": "018f…", "status": "queued", "kind": "vision_fast", "poll_url": "/v1/jobs/018f…" }`. **409** if a vision job is already `queued|running`.

**GET `/v1/jobs/{job_id}`** `{ "id", "kind", "status", "steps": [{ "name", "status", "started_at", "finished_at", "error" }] }`.

**GET `/v1/inspections/{id}`** (officer screen; `fields` / `metrology` / `findings` validate against the JSON Schemas below):

```json
{
  "id": "018f2c9a-7c3e-7b1a-9c4d-2e1f0a9b8c7d",
  "status": "awaiting_officer",
  "district_code": "MH-PUN",
  "officer_code": "LMO-1024",
  "product": { "gtin": "8901234567890", "brand": null, "generic_name": "Namkeen" },
  "faces": [
    { "id": "018f2c9b-…", "face": "pdp", "evidence_id": "018f2c9c-…" }
  ],
  "fields": { "$ref": "extracted_fields.schema.json" },
  "metrology": { "$ref": "metrology.schema.json" },
  "findings": [{ "$ref": "finding.schema.json" }],
  "jobs": [
    { "id": "018f…", "kind": "vision_fast", "status": "succeeded" },
    { "id": "018f…", "kind": "vision_full", "status": "running" }
  ]
}
```

API adds `evidence_crop.url` (via `/v1/evidence/{id}`) onto Finding; the stored object is `object_key` + `bbox_px`.

**POST `/v1/inspections/{id}/findings/{finding_id}/decision`** `{ "decision": "accepted", "note": "…" }` with `decision` ∈ `accepted|rejected|annotated`.

**POST `/v1/inspections/{id}/report`** — **409** if zero `accepted` findings. Else 202 report job.

**GET `/v1/inspections/{id}/report`** `{ "pdf_evidence_id": "018f…", "sha256": "…", "rule_pack_id": "lmpc.v2026_07", "engine_version": "0.1.0", "model_id": "paddleocr-v4-cpu|canned-namkeen-01" }`.

**GET `/v1/dashboard/summary`** `{ "inspections_today": 1, "pct_noncompliant": 100, "awaiting_officer": 0, "top_missing_fields": ["usp", "coo"], "recent": [{ "id": "018f…", "gtin": "890…", "status": "reported", "severity_max": "major" }] }`.

**Idempotency:** header `Idempotency-Key` on POST inspections, faces, analyze, decision, report. Table `idempotency_keys`. TTL 24 h. Replay returns the stored Envelope.

**PDF policy (closes Q5):**

| Finding status / decision | On statutory PDF |
|---|---|
| `skipped_exception` | Omitted |
| `proposed` + `pending` | Listed as “proposed, not confirmed” |
| `proposed` + `accepted` | Cited as confirmed |
| `proposed` + `rejected` / `annotated` | Listed with officer note |
| Generation gate | **≥1 accepted** required; no `UNCONFIRMED` watermark |

Signature block: `display_name`, `officer_code`, latest decision `created_at`. Not a cryptographic signature.

---

## Data Model Changes

Postgres 16. Public IDs are UUIDv4 (Railway-safe; no uuid-ossp requirement). `TIMESTAMPTZ`. No physical deletes of evidence or findings.

```mermaid
erDiagram
  tenants ||--o{ users : has
  users ||--o{ inspections : conducts
  tenants ||--o{ inspections : owns
  products ||--o{ inspections : identified_by
  inspections ||--|{ inspection_faces : has
  inspection_faces ||--|{ evidence_objects : stores
  inspections ||--o{ extracted_fields : versions
  inspections ||--o{ findings : has
  findings ||--o{ officer_decisions : decided
  inspections ||--o{ jobs : runs
  jobs ||--|{ job_steps : contains
  rule_pack_versions ||--o{ jobs : used_by
  inspections ||--o{ audit_events : trail
```

```sql
CREATE TYPE user_role AS ENUM (
  'officer', 'controller', 'packer', 'admin', 'auditor'
);
CREATE TYPE tenant_type AS ENUM ('government', 'packer');
CREATE TYPE inspection_status AS ENUM (
  'draft', 'queued', 'analyzing', 'awaiting_officer',
  'decisions_complete', 'reported', 'void'
);
CREATE TYPE face_kind AS ENUM (
  'pdp', 'back', 'side', 'neck', 'listing', 'annexure'
);
CREATE TYPE finding_status AS ENUM ('proposed', 'skipped_exception');
CREATE TYPE finding_severity AS ENUM ('critical', 'major', 'minor');
CREATE TYPE officer_decision_kind AS ENUM (
  'pending', 'accepted', 'rejected', 'annotated'
);
CREATE TYPE job_kind AS ENUM ('vision_fast', 'vision_full', 'report');
CREATE TYPE job_status AS ENUM (
  'queued', 'running', 'succeeded', 'failed', 'cancelled'
);
CREATE TYPE channel_kind AS ENUM ('kirana', 'supermarket', 'ecom');

CREATE TABLE tenants (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  type       tenant_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY,
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  email         TEXT NOT NULL UNIQUE, -- global unique: packer demo emails must not collide with gov
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL,
  district_code TEXT,
  officer_code  TEXT,
  display_name  TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id            UUID PRIMARY KEY,
  gtin          TEXT UNIQUE,
  brand         TEXT,
  generic_name  TEXT,
  pack_size_raw TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rule_pack_versions (
  id               TEXT PRIMARY KEY,
  gazette_list     JSONB NOT NULL,
  checksum_sha256  TEXT NOT NULL,
  effective_from   DATE NOT NULL,
  is_default       BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inspections (
  id                   UUID PRIMARY KEY,
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  officer_id           UUID NOT NULL REFERENCES users(id),
  product_id           UUID REFERENCES products(id),
  channel              channel_kind NOT NULL,
  status               inspection_status NOT NULL DEFAULT 'draft',
  capture_mode         TEXT NOT NULL DEFAULT 'pack',
  district_code        TEXT NOT NULL,          -- snapshot at create from JWT
  officer_code         TEXT NOT NULL,          -- snapshot at create
  lat                  DOUBLE PRECISION,
  lon                  DOUBLE PRECISION,
  location_accuracy_m  DOUBLE PRECISION,
  device_model         TEXT,
  scale_hints          JSONB NOT NULL DEFAULT '{}',
  current_run_id       UUID,
  notes                TEXT,
  rule_pack_id         TEXT REFERENCES rule_pack_versions(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inspections_tenant_created ON inspections (tenant_id, created_at DESC);
CREATE INDEX inspections_tenant_gtin ON inspections (tenant_id, product_id);
CREATE INDEX inspections_district ON inspections (tenant_id, district_code, created_at DESC);

CREATE TABLE inspection_faces (
  id            UUID PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES inspections(id),
  face          face_kind NOT NULL,
  captured_at   TIMESTAMPTZ NOT NULL,
  device_model  TEXT
);
CREATE UNIQUE INDEX faces_retake ON inspection_faces
  (inspection_id, face, captured_at);

CREATE TABLE evidence_objects (
  id            UUID PRIMARY KEY,
  face_id       UUID REFERENCES inspection_faces(id),
  inspection_id UUID NOT NULL REFERENCES inspections(id),
  kind          TEXT NOT NULL,  -- raw | preprocessed | overlay | crop | report
  object_key    TEXT NOT NULL UNIQUE,
  sha256        TEXT NOT NULL,
  content_type  TEXT NOT NULL,
  bytes         INTEGER NOT NULL,
  width_px      INTEGER,
  height_px     INTEGER,
  exif_stripped BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE extracted_fields (
  id            UUID PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES inspections(id),
  run_id        UUID NOT NULL,
  payload       JSONB NOT NULL,
  model_id      TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, run_id)
);

CREATE TABLE findings (
  id                 UUID PRIMARY KEY,   -- UUIDv5 minted by worker
  inspection_id      UUID NOT NULL REFERENCES inspections(id),
  rule_id            TEXT NOT NULL,
  clause             TEXT NOT NULL,
  gazette            TEXT NOT NULL,
  status             finding_status NOT NULL DEFAULT 'proposed',
  severity           finding_severity NOT NULL,
  summary            TEXT NOT NULL,
  target_field       TEXT,
  confidence         REAL NOT NULL,
  metrics            JSONB NOT NULL DEFAULT '{}',
  evidence_crop_key  TEXT,
  evidence_bbox_px   JSONB,
  overlay_key        TEXT,
  officer_decision   officer_decision_kind NOT NULL DEFAULT 'pending',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX findings_identity ON findings
  (inspection_id, rule_id, COALESCE(target_field, ''));

CREATE TABLE officer_decisions (
  id          UUID PRIMARY KEY,
  finding_id  UUID NOT NULL REFERENCES findings(id),
  officer_id  UUID NOT NULL REFERENCES users(id),
  decision    officer_decision_kind NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id             UUID PRIMARY KEY,
  inspection_id  UUID NOT NULL REFERENCES inspections(id),
  kind           job_kind NOT NULL,
  status         job_status NOT NULL,
  resume_from    TEXT,
  params         JSONB NOT NULL,          -- includes as_of, flags, scale_hints
  error          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at     TIMESTAMPTZ,
  finished_at    TIMESTAMPTZ
);

CREATE TABLE job_steps (
  id             UUID PRIMARY KEY,
  job_id         UUID NOT NULL REFERENCES jobs(id),
  name           TEXT NOT NULL,
  status         job_status NOT NULL,
  attempt        INTEGER NOT NULL DEFAULT 1,
  artifact_keys  JSONB NOT NULL DEFAULT '[]',
  error          TEXT,
  started_at     TIMESTAMPTZ,
  finished_at    TIMESTAMPTZ,
  UNIQUE (job_id, name, attempt)
);

CREATE TABLE idempotency_keys (
  tenant_id      UUID NOT NULL,
  key            TEXT NOT NULL,
  method         TEXT NOT NULL,
  path           TEXT NOT NULL,
  status_code    INTEGER NOT NULL,
  response_hash  TEXT NOT NULL,
  response_body  JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, key)
);
CREATE INDEX idempotency_created ON idempotency_keys (created_at);

CREATE TABLE audit_heads (
  chain_key   TEXT PRIMARY KEY,          -- 'inspection:{uuid}' | 'tenant:{uuid}'
  last_id     BIGINT NOT NULL,
  last_sha256 TEXT NOT NULL
);

CREATE TABLE audit_events (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id       UUID,
  tenant_id      UUID,
  inspection_id  UUID,
  chain_key      TEXT NOT NULL,
  type           TEXT NOT NULL,
  payload        JSONB NOT NULL,
  prev_sha256    TEXT,
  sha256         TEXT NOT NULL
);
CREATE INDEX audit_events_chain ON audit_events (chain_key, id);

-- App DB role: INSERT on audit_events, SELECT/INSERT/UPDATE on spine,
-- NO DELETE on audit_events, evidence_objects, findings, officer_decisions.
-- No RLS in 36h. Every repo method ANDs tenant_id = :jwt_tenant.
```

**Dual-MRP (PR-10, `FEATURE_DUAL_MRP`):** not an index on `findings`. Query:

```sql
SELECT i.id, p.gtin, ef.payload #>> '{mrp,value_inr}' AS mrp
FROM inspections i
JOIN products p ON p.id = i.product_id
JOIN extracted_fields ef ON ef.inspection_id = i.id AND ef.run_id = i.current_run_id
WHERE i.tenant_id = :tenant AND p.gtin = :gtin;
```

FTS (`tsvector` on brand/generic_name) is PR-10; demo uses `?gtin=` and status filters.

**Object keys**

```text
tenants/{tenant_id}/inspections/{inspection_id}/
  faces/{face_id}/raw.jpg
  faces/{face_id}/preprocessed.jpg
  runs/{run_id}/...json
  runs/{run_id}/overlay.jpg
  runs/{run_id}/crops/{finding_id}.jpg
  reports/{report_id}.pdf
```

**Audit types:** `inspection.created`, `inspection.face_uploaded`, `inspection.voided`, `job.enqueued`, `job.succeeded`, `job.failed`, `finding.proposed`, `finding.overridden`, `finding.accepted`, `report.generated`, `auth.login`, `auth.login_failed`, `rule_pack.activated`, `watchlist.match_proposed`, **`evidence.raw_read`**.

**Hash chain (not global):** `chain_key = inspection:{id}` for inspection-scoped events; `chain_key = tenant:{id}` for login / rule-pack events. Insert: `SELECT … FROM audit_heads WHERE chain_key=:k FOR UPDATE`, then insert event, update head. **PR-05 may ship append-only + `request_id` without hashes**; hash chain is allowed only with `audit_heads`. Do not implement a process-global prev pointer.

Alembic in `services/api/alembic` using models from `lmpc_db`. Rule pack edits = new pack id.

---

## Concrete contracts (full JSON Schema)

All drafts are 2020-12, `additionalProperties: false`. These files are copied into `packages/contracts/jsonschema/` in PR-02.

### `envelope.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/envelope.schema.json",
  "title": "Envelope",
  "type": "object",
  "additionalProperties": false,
  "required": ["success", "data", "error", "meta"],
  "properties": {
    "success": { "type": "boolean" },
    "data": {},
    "error": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["code", "message"],
      "properties": {
        "code": {
          "type": "string",
          "enum": [
            "unauthorized", "forbidden", "validation", "not_found",
            "conflict", "unsupported_media", "payload_too_large",
            "job_failed", "rule_pack_invalid", "scale_unavailable"
          ]
        },
        "message": { "type": "string" },
        "details": { "type": ["object", "null"] }
      }
    },
    "meta": {
      "type": "object",
      "additionalProperties": false,
      "required": ["request_id"],
      "properties": {
        "request_id": { "type": "string" },
        "warnings": { "type": "array", "items": { "type": "string" } },
        "pagination": {
          "type": ["object", "null"],
          "additionalProperties": false,
          "required": ["limit", "offset", "total"],
          "properties": {
            "limit": { "type": "integer" },
            "offset": { "type": "integer" },
            "total": { "type": "integer" }
          }
        }
      }
    }
  }
}
```

### Shared field fragment (inlined in ExtractedFields)

A field extraction object always has `present`, `raw`, `confidence`. Typed values are optional and **must be null when `present` is false** (never invented).

### `extracted_fields.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/extracted_fields.schema.json",
  "title": "ExtractedFields",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "mrp", "net_qty", "usp", "packer", "importer", "coo", "date",
    "consumer_care", "generic_name", "language", "listing_ui"
  ],
  "properties": {
    "mrp": { "$ref": "#/$defs/moneyField" },
    "net_qty": { "$ref": "#/$defs/qtyField" },
    "usp": { "$ref": "#/$defs/uspField" },
    "packer": { "$ref": "#/$defs/textField" },
    "importer": { "$ref": "#/$defs/textField" },
    "coo": { "$ref": "#/$defs/textField" },
    "date": { "$ref": "#/$defs/dateField" },
    "consumer_care": { "$ref": "#/$defs/careField" },
    "generic_name": { "$ref": "#/$defs/textField" },
    "language": { "$ref": "#/$defs/languageField" },
    "listing_ui": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["coo_filter_present", "coo_filter_sortable", "confidence"],
      "properties": {
        "coo_filter_present": { "type": "boolean" },
        "coo_filter_sortable": { "type": "boolean" },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  },
  "$defs": {
    "bbox": {
      "type": ["array", "null"],
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4
    },
    "textField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" }
      }
    },
    "moneyField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence", "value_inr", "incl_all_taxes"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" },
        "value_inr": { "type": ["number", "null"] },
        "incl_all_taxes": { "type": ["boolean", "null"] }
      }
    },
    "qtyField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence", "value", "unit"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" },
        "value": { "type": ["number", "null"] },
        "unit": {
          "type": ["string", "null"],
          "enum": [null, "g", "kg", "ml", "l", "n"]
        }
      }
    },
    "uspField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence", "inr_per", "unit"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" },
        "inr_per": { "type": ["number", "null"] },
        "unit": {
          "type": ["string", "null"],
          "enum": [null, "g", "kg", "ml", "l"]
        }
      }
    },
    "dateField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence", "month", "year"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" },
        "month": { "type": ["integer", "null"], "minimum": 1, "maximum": 12 },
        "year": { "type": ["integer", "null"] }
      }
    },
    "careField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["present", "raw", "confidence", "phone", "email"],
      "properties": {
        "present": { "type": "boolean" },
        "raw": { "type": ["string", "null"] },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
        "bbox_px": { "$ref": "#/$defs/bbox" },
        "phone": { "type": ["string", "null"] },
        "email": { "type": ["string", "null"] }
      }
    },
    "languageField": {
      "type": "object",
      "additionalProperties": false,
      "required": ["scripts", "present_hi_or_en", "confidence"],
      "properties": {
        "scripts": {
          "type": "array",
          "items": { "type": "string", "enum": ["Deva", "Latn", "other"] }
        },
        "present_hi_or_en": { "type": "boolean" },
        "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    }
  }
}
```

`listing_ui` is `null` when there is no `face=listing`. Pack vs listing **diff** is computed in the engine from two `ExtractedFields` snapshots merged by the worker (`fields` from PDP + `listing_ui` + listing-face MRP/qty/COO overlays stored in the same object; listing-face raw text lives in `packer.raw` etc. only if the worker copies them into this document under the same keys with `bbox_px` from the listing image — the worker sets `jobs.params.face_filter`).

### `metrology.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/metrology.schema.json",
  "title": "MetrologyResult",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "mm_per_px", "scale_method", "uncertainty_rel",
    "pdp_area_cm2", "pdp_area_uncertainty_cm2", "print_vs_blown", "targets"
  ],
  "properties": {
    "mm_per_px": { "type": "number", "exclusiveMinimum": 0 },
    "scale_method": {
      "type": "string",
      "enum": ["ean13_module", "upc_module", "coin", "pack_height", "fixture"]
    },
    "uncertainty_rel": { "type": "number", "minimum": 0 },
    "pdp_area_cm2": { "type": "number", "minimum": 0 },
    "pdp_area_uncertainty_cm2": { "type": "number", "minimum": 0 },
    "print_vs_blown": { "type": "string", "enum": ["print", "blown"] },
    "targets": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "mrp": { "$ref": "#/$defs/glyph" },
        "net_qty": { "$ref": "#/$defs/glyph" },
        "usp": { "$ref": "#/$defs/glyph" }
      }
    }
  },
  "$defs": {
    "glyph": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "height_mm", "height_uncertainty_mm",
        "width_mm", "width_uncertainty_mm",
        "isolation_mm", "contrast_ratio", "bbox_px"
      ],
      "properties": {
        "height_mm": { "type": "number" },
        "height_uncertainty_mm": { "type": "number", "minimum": 0 },
        "width_mm": { "type": "number" },
        "width_uncertainty_mm": { "type": "number", "minimum": 0 },
        "isolation_mm": {
          "type": "object",
          "additionalProperties": false,
          "required": ["top", "bottom", "left", "right"],
          "properties": {
            "top": { "type": "number" },
            "bottom": { "type": "number" },
            "left": { "type": "number" },
            "right": { "type": "number" }
          }
        },
        "contrast_ratio": { "type": "number", "minimum": 0 },
        "bbox_px": {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 4,
          "maxItems": 4
        }
      }
    }
  }
}
```

Manner checks consume **only** this object plus `ExtractedFields.language`. There is no extra DAG node: `metrology` step measures glyphs; `extract_fields` sets `language.scripts` from Unicode/OCR script tags.

### `proposed_finding.schema.json` (engine output)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/proposed_finding.schema.json",
  "title": "ProposedFinding",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "rule_id", "clause", "gazette", "status", "severity",
    "summary", "confidence", "target_field", "metrics"
  ],
  "properties": {
    "rule_id": { "type": "string", "pattern": "^lmpc\\.[a-z0-9_.]+$" },
    "clause": { "type": "string", "minLength": 3 },
    "gazette": { "type": "string", "minLength": 3 },
    "status": { "type": "string", "enum": ["proposed", "skipped_exception"] },
    "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
    "summary": { "type": "string" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "target_field": {
      "type": ["string", "null"],
      "enum": [
        null, "mrp", "net_qty", "usp", "packer", "importer",
        "coo", "date", "consumer_care", "generic_name",
        "language", "pdp", "listing"
      ]
    },
    "metrics": { "$ref": "https://lmpc.local/schema/finding.schema.json#/$defs/metrics" },
    "evidence_bbox_px": {
      "type": ["array", "null"],
      "items": { "type": "number" },
      "minItems": 4,
      "maxItems": 4
    }
  }
}
```

### `finding.schema.json` (API + DB)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/finding.schema.json",
  "title": "Finding",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id", "rule_id", "clause", "gazette", "status", "severity",
    "summary", "confidence", "officer_decision", "target_field",
    "metrics", "evidence_crop"
  ],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "rule_id": { "type": "string", "pattern": "^lmpc\\.[a-z0-9_.]+$" },
    "clause": { "type": "string", "minLength": 3 },
    "gazette": { "type": "string", "minLength": 3 },
    "status": { "type": "string", "enum": ["proposed", "skipped_exception"] },
    "severity": { "type": "string", "enum": ["critical", "major", "minor"] },
    "summary": { "type": "string" },
    "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
    "officer_decision": {
      "type": "string",
      "enum": ["pending", "accepted", "rejected", "annotated"]
    },
    "target_field": {
      "type": ["string", "null"],
      "enum": [
        null, "mrp", "net_qty", "usp", "packer", "importer",
        "coo", "date", "consumer_care", "generic_name",
        "language", "pdp", "listing"
      ]
    },
    "metrics": { "$ref": "#/$defs/metrics" },
    "evidence_crop": {
      "type": ["object", "null"],
      "additionalProperties": false,
      "required": ["object_key", "bbox_px"],
      "properties": {
        "object_key": { "type": "string" },
        "bbox_px": {
          "type": "array",
          "items": { "type": "number" },
          "minItems": 4,
          "maxItems": 4
        },
        "url": { "type": "string", "format": "uri" }
      }
    },
    "overlay_key": { "type": ["string", "null"] }
  },
  "$defs": {
    "metrics": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "measured_mm": { "type": "number" },
        "required_mm": { "type": "number" },
        "uncertainty_mm": { "type": "number" },
        "pdp_area_cm2": { "type": "number" },
        "table_i_sl": { "type": "integer" },
        "print_vs_blown": { "type": "string", "enum": ["print", "blown"] },
        "band": {
          "type": "string",
          "enum": ["fail", "within_uncertainty", "pass"]
        },
        "width_over_height": { "type": "number" },
        "min_width_over_height": { "type": "number" },
        "contrast_ratio": { "type": "number" },
        "min_contrast_ratio": { "type": "number" },
        "isolation_mm": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "top": { "type": "number" },
            "bottom": { "type": "number" },
            "left": { "type": "number" },
            "right": { "type": "number" }
          }
        },
        "exception_id": { "type": "string" },
        "barcode_mismatch": { "type": "boolean" },
        "listing_coo_filter_present": { "type": "boolean" },
        "pack_value": { "type": ["string", "number", "null"] },
        "listing_value": { "type": ["string", "number", "null"] }
      }
    }
  }
}
```

### `job_envelope.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/job_envelope.schema.json",
  "title": "JobEnvelope",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "job_id", "kind", "inspection_id", "tenant_id", "rule_pack_id",
    "as_of", "resume_from", "flags", "model_id", "engine_version",
    "faces", "scale_hints"
  ],
  "properties": {
    "job_id": { "type": "string", "format": "uuid" },
    "kind": { "type": "string", "enum": ["vision_fast", "vision_full", "report"] },
    "inspection_id": { "type": "string", "format": "uuid" },
    "tenant_id": { "type": "string", "format": "uuid" },
    "rule_pack_id": { "type": "string" },
    "as_of": { "type": "string", "format": "date" },
    "resume_from": { "type": ["string", "null"] },
    "face_filter": {
      "type": ["string", "null"],
      "enum": [null, "pdp", "back", "side", "neck", "listing"]
    },
    "use_canned_fixture": { "type": ["string", "null"] },
    "flags": { "type": "object" },
    "model_id": { "type": "string" },
    "engine_version": { "type": "string" },
    "faces": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["face_id", "face", "raw_key", "sha256"],
        "properties": {
          "face_id": { "type": "string", "format": "uuid" },
          "face": {
            "type": "string",
            "enum": ["pdp", "back", "side", "neck", "listing", "annexure"]
          },
          "raw_key": { "type": "string" },
          "sha256": { "type": "string" }
        }
      }
    },
    "scale_hints": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "coin_mm": { "type": ["number", "null"] },
        "pack_height_mm": { "type": ["number", "null"] },
        "barcode_value": { "type": ["string", "null"] }
      }
    }
  }
}
```

### `rule_pack.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://lmpc.local/schema/rule_pack.schema.json",
  "title": "RulePack",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "id", "effective_from", "gazettes", "checks", "table_i",
    "mrp_wording", "exceptions"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^lmpc\\.v[0-9]{4}_[0-9]{2}$" },
    "effective_from": { "type": "string", "format": "date" },
    "gazettes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["citation", "date"],
        "properties": {
          "citation": { "type": "string" },
          "date": { "type": "string", "format": "date" }
        }
      }
    },
    "checks": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "string",
        "enum": [
          "presence", "format_mrp", "format_usp", "table_i", "width",
          "isolation", "contrast", "language", "listing_6_10",
          "listing_6_10a", "dual_mrp"
        ]
      }
    },
    "table_i": { "type": "object" },
    "mrp_wording": {
      "type": "object",
      "additionalProperties": false,
      "required": ["allowed_substrings"],
      "properties": {
        "allowed_substrings": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "exceptions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "skips_rule_ids"],
        "properties": {
          "id": { "type": "string" },
          "skips_rule_ids": { "type": "array", "items": { "type": "string" } },
          "when": { "type": "object" }
        }
      }
    }
  }
}
```

`rules/lmpc/v2026_07/clauses/*.yaml` files are **human commentary** compiled into `pack.json` (`checks` + clause strings). They are not a second runtime schema. `mrp_wording.json` seed: `["MRP", "inclusive of all taxes", "incl. of all taxes", "₹", "Rs.", "INR"]` until Q2 is photocopied.

### Rule pack fragment — Rule 7 Table I

Bounds follow the PRD table (inclusive lower bound). Gazette transcriptions disagree on `≤` vs `<` and Sl. 1 blown height (1.5 vs 2.0 mm). Operators are **data**. See Open Questions Q1.

`rules/lmpc/v2026_07/table_i.json` (embedded in `pack.json` as `table_i`):

```json
{
  "rule_id": "lmpc.r7.table_i",
  "clause": "Rule 7(2) read with Table I",
  "gazette": "G.S.R. 629(E) dated 23.06.2017",
  "applies_to": ["mrp", "net_qty", "usp"],
  "width_rule": {
    "rule_id": "lmpc.r7.width",
    "clause": "Rule 7(3)",
    "min_width_over_height": 0.333333,
    "exceptions_glyphs": ["1", "i", "I", "l"]
  },
  "rows": [
    { "sl": 1, "pdp_area_cm2": { "min": 0, "max_exclusive": 50 }, "min_height_print_mm": 1.0, "min_height_blown_mm": 1.5, "severity": "major" },
    { "sl": 2, "pdp_area_cm2": { "min": 50, "max_exclusive": 100 }, "min_height_print_mm": 1.5, "min_height_blown_mm": 3.0, "severity": "major" },
    { "sl": 3, "pdp_area_cm2": { "min": 100, "max_exclusive": 500 }, "min_height_print_mm": 2.5, "min_height_blown_mm": 4.0, "severity": "major" },
    { "sl": 4, "pdp_area_cm2": { "min": 500, "max_exclusive": 2500 }, "min_height_print_mm": 4.0, "min_height_blown_mm": 6.0, "severity": "major" },
    { "sl": 5, "pdp_area_cm2": { "min": 2500, "max_exclusive": null }, "min_height_print_mm": 6.0, "min_height_blown_mm": 6.0, "severity": "major" }
  ],
  "pdp_geometry": {
    "rectangular": "height_cm * width_cm of PDP face",
    "cylindrical": "0.40 * height_cm * circumference_cm excluding top, bottom, neck"
  },
  "uncertainty_policy": {
    "fail_only_if": "measured_mm + uncertainty_mm < required_mm",
    "else": "metrics.band = within_uncertainty"
  }
}
```

Other `rule_id`s: `lmpc.r6.1.a` packer, `lmpc.r6.1.d` generic name, `lmpc.r6.1.net_qty`, `lmpc.r6.1.mrp`, `lmpc.r6.usp`, `lmpc.r6.date`, `lmpc.r6.consumer_care`, `lmpc.r6.coo`, `lmpc.r6.language`, `lmpc.r6.10`, `lmpc.r6.10a` (effective 2026-07-01 vs `as_of`), `lmpc.r18.2a` (flagged). Missing MRP/net qty → `critical`; Table I / contrast / language → `major`; isolation / width → `minor`.

### Pydantic (generated; engine uses ProposedFinding)

```python
class ProposedFinding(BaseModel):
    rule_id: str
    clause: str
    gazette: str
    status: Literal["proposed", "skipped_exception"]
    severity: Literal["critical", "major", "minor"]
    summary: str
    confidence: float
    target_field: str | None
    metrics: FindingMetrics
    evidence_bbox_px: tuple[float, float, float, float] | None = None
    model_config = {"extra": "forbid"}
```

---

## Local DX

Compose services: `postgres:16`, `minio`, `minio-init`, `redis:7`, `api`, `vision`, `reports`, `web`.

```yaml
vision:
  build: { context: .., dockerfile: infra/Dockerfile.vision }
  environment:
    DEVICE: cpu
    VISION_BACKEND: canned   # paddle after PR-06b
    DATABASE_URL: postgresql://lmpc:lmpc@postgres:5432/lmpc
    REDIS_URL: redis://redis:6379/0
    S3_ENDPOINT: http://minio:9000
    S3_BUCKET: lmpc-evidence
  depends_on: [postgres, redis, minio]
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8081/readyz"]
    interval: 5s
    timeout: 3s
    retries: 30

api:
  environment:
    FEATURE_LISTINGS: "false"
    FEATURE_DASHBOARD: "true"
    FEATURE_WATCHLIST: "false"
    JWT_SECRET: ${JWT_SECRET}
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]

reports:
  build: { context: .., dockerfile: infra/Dockerfile.reports }
```

`Dockerfile.vision` **COPY**s Paddle PP-OCRv4 + Indic det/rec weights into `/models` (fetched in the image build, not at container boot). Entrypoint loads them into memory, then binds `/healthz` (process up) and `/readyz` (weights loaded **or** `VISION_BACKEND=canned`). `just demo` waits on `vision` **readyz**.

`Dockerfile.reports` `apt-get`s `libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev libcairo2 weasyprint` (Debian bookworm names may vary; pin in the Dockerfile).

`DEVICE=cpu` is set on **vision**, not on api.

| Target | What |
|---|---|
| `just bootstrap` | pnpm install + uv sync --all-packages + `.env` from example |
| `just contracts` | regenerate + fail on diff |
| `just up` | compose up --build |
| `just seed` | users, default pack checksum, namkeen fixture |
| `just demo` | up + seed; wait `/readyz`; print web URL. MinIO console `:9001` user/password from `.env.example` (`MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`). |
| `just test-engine` | `uv run pytest engine/lmpc -q` — **no Docker, OK on Windows host** |
| `just test-api` | pytest API vs compose Postgres |
| `just test-e2e` | Playwright 36h path (pack-only) |

`.env.example` is **dev-only**. README deploy section: generate `JWT_SECRET` and MinIO creds; **do not** copy seed passwords to a public VM.

Engine tests:

```bash
uv run pytest engine/lmpc/tests -q
# engine/lmpc/tests/golden/namkeen-01/{fields,metrology,expected}.json
# rules/lmpc/v2026_07 on disk
```

Seed users (dev): `officer@demo.lmpc` / `demo-officer`, plus controller/admin/auditor/packer analogues. Packer email `packer@demo.lmpc` must not collide with gov (global unique).

---

## AuthZ matrix and evidence chain

Enforced in `deps.require_role` **and** `lmpc_db` repo filters `tenant_id = jwt.tenant_id`. **No SQL `current_tenant()` in 36h.** Pytest: packer JWT GET of a gov inspection UUID returns **404** (not 403) to avoid ID oracle.

| Action | Officer | Controller | Packer | Admin | Auditor |
|---|---|---|---|---|---|
| Login | ✓ | ✓ | ✓ if flag | ✓ | ✓ |
| Create pack inspection | ✓ | — | — | ✓ | — |
| Upload faces | ✓ own draft | — | ✓ artwork | ✓ | — |
| Analyze | ✓ own | — | ✓ own | ✓ | — |
| Read inspection | own | tenant ∩ `inspections.district_code` | own tenant | all | all RO |
| Decide findings | own, not reported | — | sandbox | — | — |
| Statutory PDF | own, ≥1 accepted | district | **watermarked PRE-CHECK only** | ✓ | — |
| Dashboard | own counts | tenant | own | all | RO |
| Activate rule pack | — | — | — | ✓ | — |
| `GET /v1/evidence` raw | own | tenant | — | ✓ | ✓ RO + `evidence.raw_read` |
| Void | own draft | ✓ | own draft | ✓ | — |

Auditor uses the **controller UI** with mutations hidden (no separate `(auditor)` app group).

Evidence: server SHA-256; watermark `officer_code | ISO-8601 | lat,lon (1e-3°) | device | inspection_id`; EXIF GPS stored on inspection; MIS default strips precise GPS; magic sniff; re-encode derivatives; raw immutable.

PII: officer identity tenant-scoped; GPS on inspection; passwords argon2id; logs = ids only.

---

## Testing strategy (TDD)

80%+ on `lmpc-engine` and `lmpc-api` domain. Paddle weights are **not** in default CI (PR-06b nightly).

| Layer | Where |
|---|---|
| Contract | `tests/contract` vs **YAML file**; `/openapi.json` equals served YAML |
| Engine golden | `engine/lmpc/tests/golden/` |
| Metrology unit | synthetic glyphs in `workers/vision/tests` (no Paddle) |
| Pack schema | every `rules/lmpc/*/pack.json` |
| API | login cookie, upload fake S3, enqueue fake ARQ, 409 concurrent analyze, packer 404, `?gtin=` |
| Worker replay | `resume_from=extract_fields` does not call OCR |
| Playwright | `apps/web/tests/e2e/demo.spec.ts` — **36h pack-only** path |
| Listing e2e | added in PR-09 |

```python
def test_table_i_sl3_mrp_undersize():
    fields = load("engine/lmpc/tests/golden/namkeen-01/fields.json")
    metro = load("engine/lmpc/tests/golden/namkeen-01/metrology.json")
    pack = load_pack("rules/lmpc/v2026_07")
    out = evaluate(fields, metro, pack, ExceptionContext(as_of=date(2026, 7, 2)))
    hit = next(f for f in out if f.rule_id == "lmpc.r7.table_i.sl3")
    assert hit.status == "proposed"
    assert "2.5" in hit.summary
    assert getattr(hit, "id", None) is None
```

---

## Scale and latency

| Metric | Demo / 36h | Later |
|---|---|---|
| Inspections | 5–20 / day | 500–2 000 / day |
| Concurrent officers | 2 | 50 |
| Faces | 2 (pdp+back) | 2–6 |
| Raw image | 1.5–4 MB | long edge 2048 for OCR |
| Storage / inspection | 15–25 MB | ~20 MB |
| Upload | &lt; 3 s / face | &lt; 5 s 4G |
| `vision_fast` overlay | **target &lt; 5 s**, budget 8 s; else canned + badge | same |
| `vision_full` | &lt; 30 s CPU | &lt; 20 s GPU optional |
| PDF | &lt; 5 s | &lt; 5 s |
| First request after boot | wait `/readyz` (weights in RAM) | same |

**Supported judging deploy:** one Linux VM, `docker compose up`. Railway/Render as **seven billed services is a stretch** and not the script default.

---

## Alternatives Considered

### A. Primary client: Expo/RN vs PWA

Rejected Expo as primary: Play Store friction. PWA chosen (KD-1). Expo remains a second OpenAPI client.

### B. Microservices vs modular monolith + workers

Rejected many network services. Monolith + ARQ workers + `lmpc-db` (KD-2).

### C. OPA vs Python engine

Rejected OPA sidecar. Python predicates + JSON packs (KD-3).

### D. PaddleOCR vs DocTR vs ML Kit vs cloud

PaddleOCR CPU, weights baked (KD-4). Cloud forbidden default. ML Kit is Android-only.

### E. Firebase vs Keycloak vs app JWT

App JWT, Keycloak-shaped claims, httpOnly cookie on same origin (KD-5). Firebase rejected.

### F. Nx/Turborepo vs pnpm + uv

pnpm + uv + just (KD-6).

### G. SQLite WASM vs online-first

Online-first (KD-7).

### H. FastAPI autogen vs static YAML

Static YAML served as `/openapi.json` (KD-8). Autogen would fork the PWA types.

### I. Same-job fast+full vs two jobs

Two jobs (KD-15). Same-job continuation cannot meet overlay SLO if UI waits on `succeeded`.

---

## Security & Privacy Considerations

| Threat | Sev | Mitigation |
|---|---|---|
| Cross-tenant read | **Critical** | App `tenant_id` filter; packer JWT 404s gov IDs |
| JWT theft | High | httpOnly SameSite=Lax cookie; 8 h TTL; same origin |
| Auto-prosecute | **Critical** | PDF iff ≥1 accepted; pending labelled proposed |
| GPS leak via MinIO URL | High | Evidence proxied via API; `evidence.raw_read` |
| Malicious upload | High | Magic sniff, 12 MB, 40 MP cap |
| VLM injection | Medium | Flag off |
| SQL injection | High | SQLAlchemy params |
| XSS in notes | Medium | React text; escaped WeasyPrint |
| Brute-force | Medium | 5 / 15 min / IP+email; argon2id |
| Watchlist-as-ban | High | Flag off; not on statutory PDF |
| Live scrape | Medium | Screenshots + mock store |
| Secrets in repo | High | `.env` gitignored; **seed passwords are not production** |
| Audit race | Medium | Per-inspection/`tenant` chain + `audit_heads FOR UPDATE`, or skip hashes in PR-05 |

CORS on API is unnecessary for the PWA (same origin). Expo later: explicit origin allowlist. Rate limits: login 5/min; upload 30/min/user; analyze 10/min/user.

---

## Observability

JSON logs: `ts`, `level`, `request_id`, `job_id`, `inspection_id`, `step`, `duration_ms`. No GPS, no JWT.

Prometheus `/metrics` on API (`:8000`) and workers (`:8081` vision, `:8082` reports): request duration, `jobs_in_progress{kind}`, `job_step_duration_seconds{step}`, OCR conf, findings by severity, overrides, upload bytes.

**Probes:**

| Service | `/healthz` | `/readyz` |
|---|---|---|
| api | process up + can import app | Postgres ping |
| vision | process up | weights in memory **or** canned backend |
| reports | process up | WeasyPrint import succeeds |

`X-Request-ID` propagated. Alerts post-demo.

---

## Rollout Plan

1. **PR-01…08** — 36h pack-only spine. `FEATURE_LISTINGS=false`. `VISION_BACKEND=canned` until 6b.
2. **Judging deploy:** one Linux VM + compose. Seed namkeen. Wait `/readyz` before the 3-minute script (first request is not a model download).
3. **PR-09** — listing face + 6(10A). Flip `FEATURE_LISTINGS`. If this misses 36h, drop clip 3 (`docs/demo-cut.md`).
4. **Finale:** dual-MRP query board, maps, packer, offline, watchlist.
5. **Rollback:** image tags. Rule pack rollback = previous `is_default`. In-flight jobs keep `jobs.params.flags`.

---

## Risks

| Risk | Sev | Mitigation |
|---|---|---|
| Curved / foil OCR | High | Multi-shot, glare mask, never invent MRP; canned fallback |
| Noisy mm | High | `±`; fail only if measured+σ &lt; required; fixture badge if p95 &gt; 8 s |
| Wrong clause | **Critical** | Human pack; officer override; golden tests |
| Watchlist as ban | High | Flag off |
| Live scrape | Medium | Screenshots |
| No official dataset | Medium | 50–100 labelled; 3 committed fixtures |
| Monolith mud | Medium | import-linter in PR-01 |
| iOS Safari camera | Medium | File-upload fallback |
| Paddle on Windows host | Medium | KD-18: compose only |
| 7-service Railway bill | Medium | One VM compose is supported |
| Table I bounds | Medium | Pack data + Q1 |
| PR-06 kitchen sink | High | Split 6a/6b; 6a hard-gates demo |

---

## Open Questions

1. **Table I operators / Sl. 1 blown height.** Need gazette PDF in `rules/lmpc/v2026_07/gazettes/`. Until then PRD bounds, blown Sl.1 = 1.5 mm.
2. **USP wording table** vs net-qty band — photocopy into `mrp_wording.json` / USP check.
3. **Food dating vs FSSAI** skip rules — exception data once Legal confirms.
4. *Closed:* public IDs are UUIDv4; finding identity is UUIDv5 from inspection+rule+field (no uuid-ossp).
5. *Closed:* PDF iff ≥1 accepted; pending = proposed not confirmed; signature = printed name+code+time.
6. District seed can be `MH-PUN` only.
7. Git-LFS vs MinIO seed bucket for extra photos.

None block the skeleton. Q2–Q3 do not block the five JSON Schemas (wording lists are data arrays).

---

## References

- Product spec: Obsidian `SIH/PRD.md` (SIH26034).
- LMPC Rules 2011; G.S.R. 629(E) 23 Jun 2017; G.S.R. 128(E) 13 Feb 2026 (Rule 6(10A), in force 1 Jul 2026).
- PaddleOCR PP-OCRv4; FastAPI; Pydantic v2; SQLAlchemy 2; Alembic; ARQ; WeasyPrint; ZXing; Next.js App Router PWA.
- Contracts: `packages/contracts`. Engine: `engine/lmpc`. Persistence: `packages/db`.

---

## PR Plan

Independently reviewable PRs. No application code is scaffolded in `D:\SIH` by this document.

### PR-01 — Repo skeleton and DX

- **Title:** `chore: monorepo skeleton with pnpm, uv, compose, and just`
- **Affects:** `pnpm-workspace.yaml`, root + member `pyproject.toml` (maps in §2), `package.json`, `.nvmrc`, `.python-version`, `justfile`, `infra/docker-compose.yml` with **`FEATURE_LISTINGS=false`**, Dockerfiles with `/healthz` stubs, `packages/config/importlinter.ini`, `.env.example`, README (Windows: `just test-engine` only; judging = one Linux VM)
- **Depends on:** none
- **Description:** `just up` brings Postgres, MinIO, Redis. No product logic.

### PR-02 — Contracts (OpenAPI + JSON Schema)

- **Title:** `feat: contracts for findings, rule packs, jobs, and demo HTTP`
- **Affects:** all files under `packages/contracts/jsonschema/` (full schemas in this doc), `openapi.yaml` with the **listed demo routes**, generation scripts pinned (`datamodel-code-generator==0.26.3`, `openapi-typescript@7`, `json-schema-to-typescript@15`), `just contracts`, CI diff
- **Depends on:** PR-01
- **Description:** ProposedFinding, Finding, ExtractedFields, MetrologyResult, RulePack, JobEnvelope, Envelope. No servers.

### PR-03 — Rule pack v2026_07 and human checklist

- **Title:** `feat: LMPC v2026_07 rule pack and clause checklist`
- **Affects:** `rules/lmpc/v2026_07/**`, `docs/clauses.md`, pack schema tests
- **Depends on:** PR-02
- **Description:** Table I, wording list, presence, 6(10)/6(10A) data, exceptions. Phase 1 exit checklist.

### PR-04 — Pure rule engine + golden tests

- **Title:** `feat: lmpc-engine evaluate() with Table I and presence checks`
- **Affects:** `engine/lmpc/**`, `engine/lmpc/tests/golden/**`
- **Depends on:** PR-03
- **Description:** Returns `ProposedFinding[]` (no `id`). Goldens include namkeen Sl. 3. `just test-engine` on Windows without Docker.

### PR-05 — API identity, inspections, persistence

- **Title:** `feat: FastAPI identity, inspections, evidence upload, RBAC`
- **Affects:** `packages/db`, `services/api`, Alembic spine + `idempotency_keys` + `audit_events` (append-only; hash chain optional via `audit_heads`), cookie login, `GET /v1/inspections?gtin=`, district/officer snapshots, MinIO upload, analyze **501** until PR-06a, OpenAPI static serve
- **Depends on:** PR-02 (PR-04 recommended)
- **Description:** AuthZ tests including packer 404. No global audit chain.

### PR-06a — Vision job runner + canned fixtures

- **Title:** `feat: ARQ vision_fast/full runner with canned namkeen artifacts`
- **Affects:** `workers/vision` (steps as functions that can load `fixtures/packs/namkeen-01`), `lmpc-db` job repos, API analyze enqueue + 409 concurrent, compose `vision` with `VISION_BACKEND=canned` and `/readyz`
- **Depends on:** PR-04, PR-05
- **Description:** **Hard gate** for PR-07/08. Produces Table I Sl. 3 via **real engine** + canned fields/metrology/overlay. Badge `FIXTURE SCALE`. No Paddle import required.

### PR-06b — PaddleOCR CPU + real metrology

- **Title:** `feat: PaddleOCR CPU DAG, barcode scale, glyph metrology`
- **Affects:** `lmpc_vision.adapters.ocr`, metrology step, `Dockerfile.vision` baked weights, `VISION_BACKEND=paddle`, `/readyz` waits on weights
- **Depends on:** PR-06a
- **Description:** Stretch. If overlay p95 &gt; 8 s on the demo laptop, keep canned for judging and show the badge. Must not block PR-07/08.

### PR-07 — Officer PWA capture + confirm

- **Title:** `feat: Next.js PWA officer flow with camera overlay and ZXing`
- **Affects:** `apps/web`, `packages/camera`, same-origin rewrite, coin/height control, poll 500 ms on `vision_fast`
- **Depends on:** PR-05, **PR-06a** (not 6b)
- **Description:** Installable PWA. PDP+back, barcode, scale hints, overlay, Confirm. File-upload fallback.

### PR-08 — Report worker + dashboard (36h vertical slice)

- **Title:** `feat: PDF inspection note and dashboard summary`
- **Affects:** `workers/reports`, reports + analytics routers, WeasyPrint Debian deps, Playwright `demo.spec.ts`, `docs/demo-script.md`, `docs/demo-cut.md`
- **Depends on:** PR-06a, PR-07
- **Description:** PDF iff ≥1 accepted; pending listed as proposed; printed signature block. Dashboard lists the inspection. **This PR is the 36h ‘done’ (pack-only).** `FEATURE_LISTINGS` remains false.

### PR-09 — Listing face (Rule 6(10) / 6(10A))

- **Title:** `feat: listing screenshot on the same inspection`
- **Affects:** `face=listing` upload already in PR-05; engine listing checks; PWA split view; mock store HTML; compose `FEATURE_LISTINGS=true`; Playwright clip 3
- **Depends on:** PR-08
- **Description:** Same inspection, reuse `vision_fast` with `face_filter=listing`. No live scrape. If this misses the weekend, drop clip 3.

### PR-10 — Dashboard polish, maps, dual-MRP query

- **Title:** `feat: controller KPIs, Leaflet, dual-MRP board`
- **Affects:** analytics, optional PostGIS, `FEATURE_DUAL_MRP` query over gtin⋈mrp, optional `tsvector`
- **Depends on:** PR-08
- **Description:** Repeat SKU board uses `GET /v1/inspections?gtin=`.

### PR-11 — Offline queue (PWA)

- **Title:** `feat: IndexedDB upload queue behind FEATURE_OFFLINE_QUEUE`
- **Affects:** Dexie queue; uses PR-05 idempotency
- **Depends on:** PR-07
- **Description:** Off by default.

### PR-12 — Packer pre-compliance sandbox

- **Title:** `feat: packer tenant artwork pre-check`
- **Affects:** packer router, PRE-CHECK watermark, tenant isolation tests
- **Depends on:** PR-08
- **Description:** Separate tenant.

### PR-13 — Watchlist satellite

- **Title:** `feat: cross-regulator watchlist advisory module`
- **Affects:** watchlist JSON, UI, flag off by default
- **Depends on:** PR-08
- **Description:** Cannot appear on statutory PDF without confirm.

### PR-14 — Auth issuer swap prep

- **Title:** `chore: RS256 Keycloak-shaped issuer behind AUTH_ISSUER`
- **Affects:** identity JWT validation
- **Depends on:** PR-05
- **Description:** Demo remains HS256 cookie.

Each PR includes tests at the layer it owns, does not expand flags into the spine without default-off, and does not invent JSON outside `packages/contracts`.
