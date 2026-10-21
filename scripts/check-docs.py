#!/usr/bin/env python3
"""Check documentation registry integrity and freshness against Git changes."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "maintainers" / "doc-registry.json"
EXCLUDED_DIRS = {".git", "node_modules", "tasks"}


def git(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", *args], cwd=ROOT, text=True, capture_output=True, check=False
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return [line for line in result.stdout.splitlines() if line]


def repo_markdown() -> set[str]:
    paths = set()
    for path in ROOT.rglob("*.md"):
        relative = path.relative_to(ROOT)
        if any(part in EXCLUDED_DIRS for part in relative.parts):
            continue
        paths.add(relative.as_posix())
    return paths


def changed_files(base: str | None, head: str | None) -> set[str]:
    if base:
        return set(git("diff", "--name-only", f"{base}..{head or 'HEAD'}"))

    changed = set(git("diff", "--name-only", "HEAD"))
    changed.update(git("diff", "--cached", "--name-only"))
    tracked = set(git("ls-files", "--others", "--exclude-standard"))
    return changed | tracked


def path_matches(changed: str, covered: str) -> bool:
    if covered.endswith("/"):
        return changed == covered[:-1] or changed.startswith(covered)
    return changed == covered


def validate_registry(entries: list[dict], markdown: set[str]) -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    registered = set()
    valid_tiers = {1, 2, 3}
    valid_triggers = {"code", "spec", "manual"}

    for index, entry in enumerate(entries):
        prefix = f"docs[{index}]"
        path = entry.get("path")
        if not isinstance(path, str) or not path:
            errors.append(f"{prefix}.path must be a non-empty string")
            continue
        if path in seen:
            errors.append(f"duplicate registry path: {path}")
        seen.add(path)
        registered.add(path)
        if path not in markdown:
            errors.append(f"registry path does not exist: {path}")
        if entry.get("tier") not in valid_tiers:
            errors.append(f"{path}: tier must be 1, 2, or 3")
        if entry.get("update_trigger") not in valid_triggers:
            errors.append(f"{path}: update_trigger must be code, spec, or manual")
        covers = entry.get("covers")
        if not isinstance(covers, list) or not all(isinstance(item, str) for item in covers):
            errors.append(f"{path}: covers must be a list of strings")
        else:
            for covered in covers:
                target = ROOT / covered.rstrip("/")
                if not target.exists():
                    errors.append(f"{path}: covers path does not exist: {covered}")
                if covered.endswith("/") and not target.is_dir():
                    errors.append(f"{path}: directory cover is not a directory: {covered}")
        depends_on = entry.get("depends_on")
        if not isinstance(depends_on, list) or not all(isinstance(item, str) for item in depends_on):
            errors.append(f"{path}: depends_on must be a list of strings")
        else:
            for dependency in depends_on:
                if dependency not in registered and dependency not in {item.get("path") for item in entries}:
                    errors.append(f"{path}: depends_on is not registered: {dependency}")

    for path in sorted(markdown - registered):
        errors.append(f"markdown file is not registered: {path}")

    graph = {entry.get("path"): set(entry.get("depends_on", [])) for entry in entries}
    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(node: str, trail: list[str]) -> None:
        if node in visiting:
            cycle = " -> ".join(trail + [node])
            errors.append(f"circular dependency: {cycle}")
            return
        if node in visited:
            return
        visiting.add(node)
        for dependency in graph.get(node, set()):
            if dependency in graph:
                visit(dependency, trail + [node])
        visiting.remove(node)
        visited.add(node)

    for path in graph:
        visit(path, [])
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git ref to compare against (for CI/PR checks)")
    parser.add_argument("--head", help="Git ref to compare against --base (default: HEAD)")
    parser.add_argument("--strict", action="store_true", help="fail for Tier 3 staleness too")
    args = parser.parse_args()

    try:
        payload = json.loads(REGISTRY.read_text())
        entries = payload["docs"]
        if not isinstance(entries, list):
            raise ValueError("registry field 'docs' must be a list")
        markdown = repo_markdown()
        errors = validate_registry(entries, markdown)
        changed = changed_files(args.base, args.head)
    except (OSError, json.JSONDecodeError, KeyError, ValueError, RuntimeError) as exc:
        print(f"check:docs — ERROR: {exc}")
        return 2

    if errors:
        print("check:docs — registry validation failed")
        for error in errors:
            print(f"  ERROR  {error}")
        return 2

    stale: list[tuple[dict, list[str]]] = []
    for entry in entries:
        path = entry["path"]
        reasons: list[str] = []
        for changed_path in sorted(changed):
            for covered in entry["covers"]:
                if path_matches(changed_path, covered):
                    reasons.append(f"covers {covered} (changed: {changed_path})")
            if changed_path in entry["depends_on"]:
                reasons.append(f"depends_on {changed_path} (modified)")
        if reasons and path not in changed:
            stale.append((entry, sorted(set(reasons))))

    print("check:docs — documentation freshness check")
    print(f"  changed files: {len(changed)}")
    for entry in entries:
        match = next((item for item in stale if item[0]["path"] == entry["path"]), None)
        if match:
            print(f"  STALE  {entry['path']} (Tier {entry['tier']})")
            for reason in match[1]:
                print(f"         {reason}")
            action = "update required before merge" if entry["tier"] < 3 else "warning"
            print(f"         action: Tier {entry['tier']} — {action}")
        else:
            print(f"  OK     {entry['path']}")

    tier12 = [entry for entry, _ in stale if entry["tier"] < 3]
    tier3 = [entry for entry, _ in stale if entry["tier"] == 3]
    print(f"\n  Result: {len(stale)} stale, {len(entries) - len(stale)} fresh")
    if tier12:
        print("  Status: FAIL (Tier 1/2 docs require update before merge)")
        return 2
    if tier3:
        print("  Status: WARN (Tier 3 docs are stale)")
        return 1 if args.strict else 0
    print("  Status: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
