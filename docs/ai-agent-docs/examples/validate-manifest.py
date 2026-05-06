#!/usr/bin/env python3

import json
import sys
from pathlib import Path


ROOT = Path("/home/hex/Project/References/docs/ai")
MANIFEST = ROOT / "examples" / "examples-manifest.json"


def fail(message: str) -> None:
    print(f"ERROR: {message}")
    raise SystemExit(1)


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
        if not isinstance(file_path, str) or not file_path.startswith("docs/ai/examples/"):
            fail(f"Entry {idx} has invalid file path: {file_path!r}")
        if kind not in allowed_kinds:
            fail(f"Entry {idx} has invalid kind: {kind!r}")
        if file_path in seen_files:
            fail(f"Duplicate manifest file entry: {file_path}")
        seen_files.add(file_path)

        absolute_file = Path("/home/hex/Project/References") / file_path
        if not absolute_file.exists():
            fail(f"Referenced example file does not exist: {file_path}")

        for list_key in ["owning_docs", "matrix_ids", "related_checklists", "glossary_terms"]:
            value = entry[list_key]
            if not isinstance(value, list) or not value:
                fail(f"Entry {idx} field '{list_key}' must be a non-empty array")

        for doc_path in entry["owning_docs"] + entry["related_checklists"]:
            if not isinstance(doc_path, str) or not doc_path.startswith("docs/ai/"):
                fail(f"Entry {idx} has invalid doc/checklist path: {doc_path!r}")
            absolute_doc = Path("/home/hex/Project/References") / doc_path
            if not absolute_doc.exists():
                fail(f"Referenced doc/checklist does not exist: {doc_path}")

        for matrix_id in entry["matrix_ids"]:
            if not isinstance(matrix_id, str) or "-" not in matrix_id:
                fail(f"Entry {idx} has invalid matrix ID: {matrix_id!r}")

    print(f"OK: validated {len(examples)} manifest entries")


if __name__ == "__main__":
    main()
