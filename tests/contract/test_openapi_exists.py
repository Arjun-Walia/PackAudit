from pathlib import Path


def test_openapi_yaml_present() -> None:
    path = Path(__file__).resolve().parents[2] / "packages/contracts/openapi/openapi.yaml"
    assert path.is_file()
