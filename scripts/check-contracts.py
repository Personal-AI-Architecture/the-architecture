#!/usr/bin/env python3
"""Validate every published JSON Schema and OpenAPI document, without network access."""

import json
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

import yaml
from jsonschema import Draft202012Validator
from openapi_spec_validator import validate as validate_openapi


ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts"


class UniqueKeyLoader(yaml.SafeLoader):
    pass


def yaml_mapping(loader: UniqueKeyLoader, node: yaml.MappingNode) -> dict:
    result = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node)
        if key in result:
            raise ValueError(f"duplicate YAML key: {key}")
        result[key] = loader.construct_object(value_node)
    return result


UniqueKeyLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG, yaml_mapping)


def load_json(path: Path) -> object:
    def unique_keys(pairs: list[tuple[str, object]]) -> dict:
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate JSON key: {key}")
            result[key] = value
        return result

    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_keys)


def load_document(path: Path) -> object:
    if path.suffix == ".json":
        return load_json(path)
    if path.suffix in {".yaml", ".yml"}:
        return yaml.load(path.read_text(encoding="utf-8"), Loader=UniqueKeyLoader)
    raise ValueError(f"unsupported reference target: {path}")


def walk_references(value: object, source: Path, cache: dict[Path, object]) -> None:
    if isinstance(value, list):
        for item in value:
            walk_references(item, source, cache)
        return
    if not isinstance(value, dict):
        return
    for keyword in ("$ref", "$dynamicRef"):
        if keyword not in value:
            continue
        reference = value[keyword]
        if not isinstance(reference, str):
            raise ValueError(f"{source.relative_to(ROOT)}: {keyword} must be a string")
        parts = urlsplit(reference)
        if parts.scheme or parts.netloc or parts.query:
            raise ValueError(f"{source.relative_to(ROOT)}: non-local {keyword}: {reference}")
        target = (source.parent / unquote(parts.path)).resolve() if parts.path else source
        if not target.is_relative_to(CONTRACTS) or not target.is_file():
            raise ValueError(f"{source.relative_to(ROOT)}: missing {keyword} target: {reference}")
        if target not in cache:
            cache[target] = load_document(target)
        node = cache[target]
        fragment = unquote(parts.fragment)
        if fragment:
            if not fragment.startswith("/"):
                raise ValueError(f"{source.relative_to(ROOT)}: invalid JSON pointer: {reference}")
            for raw_key in fragment[1:].split("/"):
                key = raw_key.replace("~1", "/").replace("~0", "~")
                try:
                    node = node[int(key)] if isinstance(node, list) else node[key]
                except (IndexError, KeyError, TypeError, ValueError) as exc:
                    raise ValueError(f"{source.relative_to(ROOT)}: unresolved {keyword}: {reference}") from exc
    for child in value.values():
        walk_references(child, source, cache)


def main() -> int:
    schemas = sorted((CONTRACTS / "schemas").glob("*.json"))
    schemas += sorted((CONTRACTS / "examples").glob("*.schema.json"))
    openapi = sorted((CONTRACTS / "openapi").glob("*.yaml"))
    if not schemas or not openapi:
        print("ERROR: contract schemas or OpenAPI documents are missing")
        return 1

    cache: dict[Path, object] = {}
    errors: list[str] = []
    for path in schemas + openapi:
        try:
            cache[path] = load_document(path)
        except Exception as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
    for path in schemas:
        if path not in cache:
            continue
        try:
            Draft202012Validator.check_schema(cache[path])
            walk_references(cache[path], path, cache)
        except Exception as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
    for path in openapi:
        if path not in cache:
            continue
        try:
            walk_references(cache[path], path, cache)
            validate_openapi(cache[path], base_uri=path.as_uri())
        except Exception as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")

    manifest = CONTRACTS / "examples" / "examples-manifest.json"
    manifest_schema = CONTRACTS / "examples" / "examples-manifest.schema.json"
    if manifest_schema in cache:
        try:
            Draft202012Validator(cache[manifest_schema]).validate(load_json(manifest))
        except Exception as exc:
            errors.append(f"{manifest.relative_to(ROOT)}: {exc}")

    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        return 1
    print(f"PASS: {len(schemas)} JSON Schemas, {len(openapi)} OpenAPI documents, local references, and examples manifest")
    return 0


if __name__ == "__main__":
    sys.exit(main())
