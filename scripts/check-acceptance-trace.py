#!/usr/bin/env python3
"""Check that each PAA criterion has a published proof route of the right scope."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "spec/personal-ai-architecture-spec.md"
CONFORMANCE = ROOT / "conformance"
STORY = re.compile(r"^#### US-(\d+): (.+)$", re.MULTILINE)
CRITERION = re.compile(r"^- \*\*(AC-(\d+)\.(\d+))\*\* \[(implementation|repo)\] — .+$", re.MULTILINE)
TRACE = re.compile(r"^\| (AC-\d+\.\d+) \| (implementation|repo) \| (.+) \|$", re.MULTILINE)
TEST = re.compile(r"^## ((?:ARCH|DEPLOY|FS|SWAP)-[1-9]\d*): .+$", re.MULTILINE)
ROUTE = re.compile(r"\[((?:ARCH|DEPLOY|FS|SWAP)-[1-9]\d*)\]\(([^#()]+)#[^()]+\)")


def main() -> int:
    spec = SPEC.read_text()
    proof_trace = (CONFORMANCE / "acceptance-criteria.md").read_text()
    problems: list[str] = []
    criteria: dict[str, str] = {}

    stories = list(STORY.finditer(spec))
    if not stories or len({story[1] for story in stories}) != len(stories):
        problems.append("spec must contain unique user story IDs")
    for index, story in enumerate(stories):
        end = stories[index + 1].start() if index + 1 < len(stories) else len(spec)
        story_body = spec[story.end():end]
        rules = list(CRITERION.finditer(story_body))
        if len(rules) != len(re.findall(r"^- \*\*AC-", story_body, re.MULTILINE)):
            problems.append(f"US-{story[1]} has a malformed or unscoped criterion")
        merged = " — Merged into " in story[2]
        if bool(rules) == merged:
            problems.append(f"US-{story[1]} has unexpected criterion coverage")
        for rule in rules:
            identifier, story_number, _, scope = rule.groups()
            if story_number != story[1] or identifier in criteria:
                problems.append(f"misplaced or duplicate criterion: {identifier}")
            criteria[identifier] = scope

    tests: dict[str, tuple[str, str]] = {}
    for path in sorted(CONFORMANCE.glob("*-tests.md")):
        test_text = path.read_text()
        sections = list(TEST.finditer(test_text))
        for index, test in enumerate(sections):
            identifier = test[1]
            if identifier in tests:
                problems.append(f"duplicate conformance ID: {identifier}")
            end = sections[index + 1].start() if index + 1 < len(sections) else len(test_text)
            body = test_text[test.end():end]
            scope = "repo" if "**Scope:** Repository and published templates." in body else "implementation"
            tests[identifier] = (path.name, scope)

    traced: set[str] = set()
    used_tests: set[str] = set()
    for identifier, scope, links in TRACE.findall(proof_trace):
        if identifier in traced or criteria.get(identifier) != scope:
            problems.append(f"duplicate, unknown or incorrectly scoped trace row: {identifier}")
        traced.add(identifier)
        for link in links.split(", "):
            route = ROUTE.fullmatch(link)
            if not route or tests.get(route[1]) != (route[2], scope):
                problems.append(f"{identifier} has an invalid proof route: {link}")
            else:
                used_tests.add(route[1])

    missing = sorted(criteria.keys() - traced)
    if missing:
        problems.append(f"criteria missing from acceptance trace: {', '.join(missing)}")

    if problems:
        for problem in problems:
            print(f"FAIL: {problem}")
        return 1
    print(f"PASS: {len(criteria)} scoped criteria across {len(stories)} stories map to {len(used_tests)} unique published proof routes")
    print("Traceability only: target runtime outcomes require separate evidence.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
