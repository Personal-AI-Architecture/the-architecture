#!/usr/bin/env python3

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator, ValidationError


ROOT = Path(__file__).resolve().parents[2]
MANIFEST = Path(__file__).resolve().parent / "examples-manifest.json"


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    raise SystemExit(1)


def schema(name: str) -> dict:
    path = ROOT / "contracts" / "schemas" / name
    return json.loads(path.read_text())


def validate_schema(payload: object, name: str, file_path: str) -> None:
    try:
        Draft202012Validator(schema(name)).validate(payload)
    except ValidationError as exc:
        fail(f"{file_path} does not validate against {name}: {exc.message}")


def validate_content_parts(parts: object, file_path: str) -> None:
    if not isinstance(parts, list) or not parts:
        fail(f"{file_path} content must be a non-empty list of parts")
    for part in parts:
        validate_schema({"role": "user", "content": [part]}, "message.json", file_path)


def validate_contract_example(file_path: str, payload: object, kind: str) -> None:
    """Validate the example-specific contract envelope not represented by one JSON Schema."""
    name = Path(file_path).name

    if name in {"runtime-config.json", "invalid-runtime-config.json"}:
        validator = Draft202012Validator(schema("configuration.json"))
        errors = list(validator.iter_errors(payload))
        if kind == "valid" and errors:
            fail(f"{file_path} does not validate against configuration.json: {errors[0].message}")
        if kind == "invalid" and not errors:
            fail(f"{file_path} is marked invalid but validates against configuration.json")
        return

    if name == "memory-restore-tool.json":
        validate_schema(payload, "tool-definition.json", file_path)
        if payload.get("name") != "memory_restore":
            fail(f"{file_path} must define memory_restore")
        return

    if name in {"client-message-request.json", "invalid-client-message-request.json"}:
        valid = (
            isinstance(payload, dict)
            and isinstance(payload.get("content"), list)
            and "messages" not in payload
            and "provider" not in payload
            and "model" not in payload
            and "tool_definitions" not in payload
        )
        if valid:
            validate_content_parts(payload["content"], file_path)
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its client request shape is {'valid' if valid else 'invalid'}")
        return

    if name in {"gateway-engine-request.json", "invalid-gateway-engine-request.json"}:
        valid = (
            isinstance(payload, dict)
            and isinstance(payload.get("messages"), list)
            and bool(payload.get("messages"))
            and isinstance(payload.get("model"), str)
            and isinstance(payload.get("metadata"), dict)
            and isinstance(payload["metadata"].get("correlation_id"), str)
            and all(isinstance(message, dict) and isinstance(message.get("content"), list) for message in payload["messages"])
            and not any(key in payload["metadata"] for key in ("provider", "api_key", "tool_sources"))
        )
        if valid:
            for message in payload["messages"]:
                validate_schema(message, "message.json", file_path)
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its internal request shape is {'valid' if valid else 'invalid'}")
        return

    if name in {"conversation-list-response.json", "invalid-conversation-list-response.json"}:
        valid = (
            isinstance(payload, dict)
            and isinstance(payload.get("conversations"), list)
            and isinstance(payload.get("total"), int)
            and not isinstance(payload.get("total"), bool)
            and all(isinstance(item, dict) and {"id", "created_at", "updated_at"} <= item.keys() for item in payload["conversations"])
        )
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its conversation-list shape is {'valid' if valid else 'invalid'}")
        return

    if name in {"conversation-detail-response.json", "invalid-conversation-detail-response.json"}:
        valid = (
            isinstance(payload, dict)
            and isinstance(payload.get("id"), str)
            and isinstance(payload.get("messages"), list)
            and isinstance(payload.get("created_at"), str)
            and isinstance(payload.get("updated_at"), str)
        )
        if valid:
            for message in payload["messages"]:
                if not isinstance(message, dict) or not {"id", "created_at"} <= message.keys():
                    valid = False
                    break
                validate_schema(message, "message.json", file_path)
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its conversation-detail shape is {'valid' if valid else 'invalid'}")
        return

    if name in {"approval-request-event.json", "approval-result-event.json", "invalid-approval-request-event.json", "invalid-approval-result-event.json"}:
        schema_name = "approval-request.json" if "request" in name else "approval-decision.json"
        errors = list(Draft202012Validator(schema(schema_name), format_checker=None).iter_errors(payload))
        valid = not errors
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its approval shape is {'valid' if valid else 'invalid'}")
        return

    if name in {"adapter-config.json", "invalid-adapter-config.json"}:
        valid = isinstance(payload, dict) and {"base_url", "model", "api_key_env"} <= payload.keys() and "memory_root" not in payload and "approval_mode" not in payload
        if (kind == "valid") != valid:
            fail(f"{file_path} has kind={kind} but its adapter-config shape is {'valid' if valid else 'invalid'}")
        return

    fail(f"No example validator is registered for {file_path}")


def main() -> None:
    if not MANIFEST.exists():
        fail(f"Manifest not found: {MANIFEST}")

    try:
        data = json.loads(MANIFEST.read_text())
    except json.JSONDecodeError as exc:
        fail(f"Manifest is not valid JSON: {exc}")
        return

    if not isinstance(data, dict):
        fail("Manifest root must be an object")

    required_root = {"version", "traceability_source", "examples"}
    missing_root = required_root - set(data.keys())
    if missing_root:
        fail(f"Manifest missing root keys: {sorted(missing_root)}")

    examples = data["examples"]
    if not isinstance(examples, list) or not examples:
        fail("Manifest 'examples' must be a non-empty array")

    seen_files = set()
    allowed_kinds = {"valid", "invalid"}

    for idx, entry in enumerate(examples):
        if not isinstance(entry, dict):
            fail(f"Entry {idx} must be an object")

        required_entry = {"file", "kind", "owning_docs", "matrix_ids", "related_checklists", "glossary_terms"}
        missing_entry = required_entry - set(entry.keys())
        if missing_entry:
            fail(f"Entry {idx} missing keys: {sorted(missing_entry)}")

        file_path = entry["file"]
        kind = entry["kind"]
        if not isinstance(file_path, str) or not file_path.startswith("contracts/examples/"):
            fail(f"Entry {idx} has invalid file path: {file_path!r}")
        if kind not in allowed_kinds:
            fail(f"Entry {idx} has invalid kind: {kind!r}")
        if file_path in seen_files:
            fail(f"Duplicate manifest file entry: {file_path}")
        seen_files.add(file_path)

        absolute_file = ROOT / file_path
        if not absolute_file.exists():
            fail(f"Referenced example file does not exist: {file_path}")

        try:
            payload = json.loads(absolute_file.read_text())
        except json.JSONDecodeError as exc:
            fail(f"Referenced example is not valid JSON: {file_path}: {exc}")
        validate_contract_example(file_path, payload, kind)

        for list_key in ["owning_docs", "matrix_ids", "related_checklists", "glossary_terms"]:
            value = entry[list_key]
            if not isinstance(value, list) or not value:
                fail(f"Entry {idx} field '{list_key}' must be a non-empty array")

        for doc_path in entry["owning_docs"] + entry["related_checklists"]:
            if not isinstance(doc_path, str) or not (
                doc_path.startswith("build/primers/")
                or doc_path.startswith("conformance/")
            ):
                fail(f"Entry {idx} has invalid doc/checklist path: {doc_path!r}")
            absolute_doc = ROOT / doc_path
            if not absolute_doc.exists():
                fail(f"Referenced doc/checklist does not exist: {doc_path}")

        for matrix_id in entry["matrix_ids"]:
            if not isinstance(matrix_id, str) or "-" not in matrix_id:
                fail(f"Entry {idx} has invalid matrix ID: {matrix_id!r}")

    print(f"OK: validated {len(examples)} manifest entries and contract example shapes")


if __name__ == "__main__":
    main()
