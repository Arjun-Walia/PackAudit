# Repository structure

```
lmpc-inspect/
├── apps/web                 @lmpc/web     Next.js PWA
├── packages/
│   ├── camera               @lmpc/camera
│   ├── config               @lmpc/config  import-linter
│   ├── contracts/           OpenAPI + JSON Schema (source of truth)
│   └── db                   lmpc-db
├── engine/lmpc              lmpc-engine   pure evaluate()
├── services/api             lmpc-api
├── workers/vision           lmpc-vision
├── workers/reports          lmpc-reports
├── rules/lmpc/v2026_07      gazette data
├── fixtures/packs/namkeen-01
├── infra/                   compose + Dockerfiles
├── tests/contract/
└── docs/architecture.md     read this first
```

Ownership and PR order: `docs/architecture.md` § PR Plan.
