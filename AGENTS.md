# Agent notes — LMPC Inspect

- Source of truth: `docs/architecture.md`
- Product spec: Obsidian vault `SIH/PRD.md` (SIH26034)
- Spine: Capture → geometry & scale → extract → LMPC rule engine → officer confirm → report
- Model proposes; officer signs. Never auto-prosecute.
- Contracts-first: change `packages/contracts` before API, engine, or UI JSON.
- Engine (`lmpc-engine`) is pure: no images, no DB, no persistence IDs.
- `FEATURE_LISTINGS` stays false until PR-09.
- Windows host: `just test-engine` only. OCR/PDF inside Linux compose.
- Do not invent millimetres. If OCR is not ready, use canned fixtures (`VISION_BACKEND=canned`).
- After implementation work, append a dated summary, changed scope, verification results and remaining limitations to Obsidian `SIH/Development Log.md`. Preserve earlier entries. Current vault: `C:/Users/pc/OneDrive/Documents/Obsidian Vault`; prefer the Obsidian connector, with direct filesystem append/edit if its local API is unavailable.
- The officer frontend currently has an explicitly labelled session-local demonstration mode; see `docs/officer-workspace.md`. Do not confuse predefined UI sample values with output from the real engine or live OCR.
