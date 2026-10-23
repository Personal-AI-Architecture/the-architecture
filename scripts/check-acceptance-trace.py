#!/usr/bin/env python3
"""Check that every PAA acceptance criterion names evidence or a decision.

This checks traceability, not whether a target implementation passed runtime tests.
"""

from __future__ import annotations

import re
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = ROOT / "spec/personal-ai-architecture-spec.md"
AUDIT = ROOT / "maintainers/v1-acceptance-proof-audit-2026-10-23.md"
CRITERION = re.compile(r"^- \*\*(AC-(\d+)\.(\d+))\*\*\s+—\s+(.+)$", re.MULTILINE)
STORY = re.compile(r"^#### US-(\d+):", re.MULTILINE)
AUDIT_ROW = re.compile(r"^\| US-(\d+) \| AC-(\d+)\.(\d+)–(\d+)\.(\d+) \|", re.MULTILINE)


def main() -> int:
    text = SPEC.read_text()
    matches = list(CRITERION.finditer(text))
    problems: list[str] = []
    ids = [match.group(1) for match in matches]
    stories = {int(number) for number in STORY.findall(text)}
    duplicates = sorted(item for item, count in Counter(ids).items() if count > 1)
    if duplicates:
        problems.append(f"duplicate criteria: {', '.join(duplicates)}")

    by_story: dict[int, list[int]] = {}
    for match in matches:
        identifier, story, item, body = match.groups()
        story_number, item_number = int(story), int(item)
        by_story.setdefault(story_number, []).append(item_number)
        if "_(evidence:" not in body and "_(decision:" not in body:
            problems.append(f"{identifier} has no evidence or explicit decision marker")
        if "_(basis:" in body:
            problems.append(f"{identifier} has an unqualified basis marker")

    for story_number in sorted(stories):
        found = sorted(by_story.get(story_number, []))
        if found != list(range(1, max(found, default=0) + 1)):
            problems.append(f"US-{story_number} criteria are missing or noncontiguous: {found}")
        if not found:
            problems.append(f"US-{story_number} has no acceptance criteria")
    for extra in sorted(set(by_story) - stories):
        problems.append(f"AC under missing US-{extra} heading")

    audit_text = AUDIT.read_text()
    audited: list[str] = []
    for story, first_us, first, last_us, last in AUDIT_ROW.findall(audit_text):
        if story != first_us or story != last_us:
            problems.append(f"audit range crosses stories: US-{story} / AC-{first_us}.{first}–{last_us}.{last}")
            continue
        audited.extend(f"AC-{story}.{item}" for item in range(int(first), int(last) + 1))
    if sorted(audited) != sorted(ids):
        problems.append(f"audit rows do not cover the spec exactly: missing={sorted(set(ids) - set(audited))}, extra={sorted(set(audited) - set(ids))}")

    if problems:
        for problem in problems:
            print(f"FAIL: {problem}")
        return 1
    evidence = sum("_(evidence:" in match.group(4) for match in matches)
    decisions = len(matches) - evidence
    print(f"PASS: {len(matches)} unique criteria across {len(stories)} stories; {evidence} evidence routes, {decisions} explicit decisions; audit rows cover each criterion once")
    print("Traceability only: target runtime outcomes require separate evidence.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
