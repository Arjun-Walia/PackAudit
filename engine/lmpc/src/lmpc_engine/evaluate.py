"""Pure evaluate() — no images, no DB, no persistence IDs."""

from __future__ import annotations

from typing import Any


def evaluate(
    fields: dict[str, Any],
    metrology: dict[str, Any],
    rule_pack: dict[str, Any],
    exceptions: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Return ProposedFinding dicts. Worker mints UUIDv5 ids."""
    raise NotImplementedError("PR-04")
