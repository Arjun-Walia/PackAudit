# Design summary — LMPC Inspect (SIH26034) — rev 2

Wrote (then revised after review) a greenfield production architecture for an empty `D:\SIH` workspace. Product truth is vault `SIH/PRD.md`. No application code was scaffolded.

**Document:** `C:\Users\pc\AppData\Local\Temp\grok-pc\grok-design-doc-0f5a5cad.md` (Draft, rev 2)  
**Review:** `C:\Users\pc\AppData\Local\Temp\grok-pc\grok-design-review-0f5a5cad.md` (all 20 issues **addressed**)  
**Date:** 2026-09-13 · **Author:** SIH architecture

## Spine

`Capture → geometry & scale → extract → LMPC rule engine → officer confirm → report & repository`

Model proposes; officer signs. Phases 6–9 are flags, not a rewrite.

## Demo cut (binding)

| Bar | Scope |
|---|---|
| **PR-08 / 36h** | Pack-only: login → PDP+back+barcode → one Table I overlay → Confirm → PDF → dashboard. `FEATURE_LISTINGS=false`. |
| **PR-09 / judging clip 3** | Same inspection + `face=listing` + Rule 6(10A). Drop clip 3 if this misses the weekend. |

## Binding decisions (incl. review)

| Decision | Choice |
|---|---|
| Client | Next.js App Router PWA (LTS); Expo later on same OpenAPI |
| Topology | FastAPI + ARQ workers (`vision_fast` / `vision_full` / `report`); `packages/db` (`lmpc-db`) |
| Engine | Pure Python; returns `ProposedFinding[]` **without IDs**; worker mints UUIDv5 |
| OCR | PaddleOCR CPU, weights **baked**; PR-06a canned fixtures are the 36h hard gate |
| Auth | Same-origin `/v1` rewrite + httpOnly cookie; Keycloak-shaped HS256 claims |
| Contracts | Hand-written OpenAPI YAML is the **only** HTTP source of truth; full JSON Schemas in the doc |
| Offline | Online-first |
| Tenancy | App-level `tenant_id` filter; snapshot `district_code`; no RLS in 36h |
| PDF | Iff ≥1 `accepted`; printed name+code+time; no crypto e-sign |
| Deploy | **One Linux VM + compose**. Windows host: `just test-engine` only. Railway is stretch. |
| IDs | UUID strings; no `insp_`/`fnd_` prefixes |

## Named packages

`@lmpc/web`, `@lmpc/camera`, `@lmpc/contracts`, `@lmpc/config`, `lmpc-api`, `lmpc-engine`, `lmpc-vision`, `lmpc-reports`, `lmpc-contracts`, **`lmpc-db`**, plus `rules/lmpc/v2026_07/`.

Src layout + uv/pnpm maps are specified (`requires-python >=3.12,<3.13`, Node 22).

## Contracts published in full

Envelope, ExtractedFields (incl. `language`, `listing_ui`), MetrologyResult (height/width/isolation/contrast), ProposedFinding, Finding (closed `metrics`), JobEnvelope (`as_of` required), RulePack (`checks` enum).

## Also specified

- Vision DAG as two jobs; poll 500 ms; upsert does not reset officer decisions; 409 concurrent analyze
- Idempotency table; `extracted_fields` versioned by `run_id`
- AuthZ matrix; evidence hash; GPS via API proxy + `evidence.raw_read`
- `GET /v1/inspections?gtin=` in PR-05; dual-MRP is a query, not a findings index
- `/healthz` vs `/readyz`; `DEVICE=cpu` on vision
- PR plan 01→05, **06a canned**, **06b Paddle**, 07 PWA, **08 36h done**, 09 listings, then dashboard/packer/watchlist
