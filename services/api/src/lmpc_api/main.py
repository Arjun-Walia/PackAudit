"""HTTP entry. OpenAPI YAML is the only HTTP source of truth."""

from __future__ import annotations

from pathlib import Path

import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from lmpc_api.settings import Settings, get_settings

OPENAPI_PATH = Path(__file__).resolve().parents[4] / "packages/contracts/openapi/openapi.yaml"


def _load_spec() -> dict:
    return yaml.safe_load(OPENAPI_PATH.read_text(encoding="utf-8"))


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="LMPC Inspect", version="0.1.0", docs_url="/docs")
    spec = _load_spec()
    app.openapi = lambda: spec  # type: ignore[method-assign]

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/readyz")
    def readyz() -> dict[str, str]:
        return {"status": "ready"}

    from lmpc_api.identity.router import router as identity_router
    from lmpc_api.inspections.router import router as inspections_router
    from lmpc_api.catalog.router import router as catalog_router
    from lmpc_api.reports.router import router as reports_router

    app.include_router(identity_router, prefix="/v1")
    app.include_router(inspections_router, prefix="/v1")
    app.include_router(catalog_router, prefix="/v1")
    app.include_router(reports_router, prefix="/v1")
    if settings.feature_listings:
        from lmpc_api.listings.router import router as listings_router

        app.include_router(listings_router, prefix="/v1")
    if settings.feature_dashboard:
        from lmpc_api.analytics.router import router as analytics_router

        app.include_router(analytics_router, prefix="/v1")
    if settings.feature_packer_sandbox:
        from lmpc_api.packer.router import router as packer_router

        app.include_router(packer_router, prefix="/v1")
    if settings.feature_watchlist:
        from lmpc_api.watchlist.router import router as watchlist_router

        app.include_router(watchlist_router, prefix="/v1")
    return app


app = create_app()
