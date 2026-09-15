# Officer workspace — frontend handoff

## Scope

The public landing page is unchanged. The required pack-only **frontend pages** now exist as a connected, explicitly labelled browser demonstration. This does not complete the production PR-08 backend milestone.

| Route | Purpose |
| --- | --- |
| `/login` | Demo profile entry; no password or authentication claim |
| `/dashboard` | Counts and recent records derived from this tab's records |
| `/inspect` | Product identity, front/back image uploads, separate illustrative sample |
| `/inspections` | Search and status filters |
| `/inspections/[id]` | Evidence, predefined sample fields, manual accept/reject/reopen, history |
| `/inspections/[id]/report` | Accepted-sample note preview and browser Print / Save as PDF |
| `/rules` | Clearly qualified sample rule context and scope |
| `/settings` | Demo profile, installation help, storage/service disclosures |

## Boundaries

- FastAPI identity/inspection/report routes are empty scaffolds. No API, database, OCR, barcode decoder, rule engine, or PDF worker is wired to these screens.
- Browser state is a UI-only demonstration model (`lib/officer-model.ts`), not the generated HTTP types. `packages/contracts/ts/src` is not hand-edited.
- Storage is sessionStorage under `lmpc-demo-workspace-v1`. Records and images survive refresh in the same tab. This is neither secure tenant isolation nor an offline upload queue. No sensitive inspection data should be entered.
- Actual uploads become capture drafts. Only a separately opened illustrative sample receives predefined values. Those values are **not** output from the Python engine or measurements of the illustration.
- Images: JPEG/PNG/WebP, 1 MB per face, decode checked. Both faces required for a draft. Barcode entered manually and format checked, not decoded or checksum verified.
- Reject requires a note. Reopen removes report eligibility. Notes are available only after an accepted sample finding. Revised unsaved notes block the report link until the decision is saved again.
- The report is an HTML print view with a demonstration warning and a non-authenticated reviewer. Browser Save as PDF is not a server-generated WeasyPrint report or cryptographic signature.
- Public service-worker cache is restricted to named public assets; officer routes and `/v1` are not cached. The legacy app cache is removed on activation.
- Listings, packer sandbox, maps, watchlist and offline sync remain out of the pack-only demo cut. Feature flags were not enabled.

## Verification

Run `pnpm --filter @lmpc/web test`, `pnpm --filter @lmpc/web test:coverage`, and `pnpm --filter @lmpc/web build`.

Unit checks cover source separation, review transitions, report gating, input validation, corrupted saved state, derived counts and public-cache isolation. Coverage applies to the pure local state model, not to all React components.

Browser verification performed through the in-app browser: demo entry/exit, empty dashboard, capture validation, front/back uploads and persistence, sample rejection/reopening/acceptance, note preview, search/status filters, and 320/390px layouts. Browser print layout has print CSS; an actual system PDF-save dialog was not exercised.

## Next integration gate

Implement contracts and the PR-05/06a API + canned-vision spine before claiming the production demo complete. Replace the local workspace adapter with generated contracts, httpOnly authentication, evidence/object-store uploads, engine-produced findings and report-worker jobs. Run OCR/PDF services only inside Linux compose per the architecture. Do not send upload drafts through the illustrative sample path.
