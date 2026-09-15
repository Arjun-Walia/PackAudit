from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiError(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class Meta(BaseModel):
    request_id: str
    warnings: list[str] = Field(default_factory=list)
    pagination: dict[str, int] | None = None


class Envelope(BaseModel, Generic[T]):
    success: bool
    data: T | None = None
    error: ApiError | None = None
    meta: Meta
