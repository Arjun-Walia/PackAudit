"""ARQ worker. VISION_BACKEND=canned is the 36h hard gate."""

from __future__ import annotations

from aiohttp import web


async def health_app() -> None:
    async def healthz(_: web.Request) -> web.Response:
        return web.json_response({"status": "ok"})

    async def readyz(_: web.Request) -> web.Response:
        return web.json_response({"status": "ready", "backend": "canned"})

    app = web.Application()
    app.router.add_get("/healthz", healthz)
    app.router.add_get("/readyz", readyz)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", 8081)
    await site.start()


class WorkerSettings:
    functions: list = []
    max_jobs = 1
    redis_settings = None
