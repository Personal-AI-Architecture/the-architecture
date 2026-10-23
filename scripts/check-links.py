#!/usr/bin/env python3
"""Check repository-local Markdown/HTML links and anchors in tracked Markdown files."""

import re
import subprocess
import sys
import unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

from markdown_it import MarkdownIt


ROOT = Path(__file__).resolve().parents[1]
MARKDOWN = MarkdownIt("commonmark", {"html": True}).enable("table")
LINE_ANCHOR = re.compile(r"L(\d+)(?:-L(\d+))?$")


class HtmlLinks(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.links: list[str] = []
        self.anchors: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag in {"a", "img", "source", "video"}:
            target = values.get("href") if tag == "a" else values.get("src")
            if target:
                self.links.append(target)
        for name in ("id", "name"):
            if values.get(name):
                self.anchors.add(values[name] or "")


def slug(text: str) -> str:
    text = unicodedata.normalize("NFKC", text).casefold()
    text = "".join(char for char in text if char.isalnum() or char in "_ -")
    return text.replace(" ", "-")


def document(path: Path) -> tuple[list[tuple[str, int]], set[str]]:
    tokens = MARKDOWN.parse(path.read_text(encoding="utf-8"))
    links: list[tuple[str, int]] = []
    anchors: set[str] = set()
    slug_counts: dict[str, int] = {}
    for index, token in enumerate(tokens):
        if token.type == "heading_open" and index + 1 < len(tokens):
            inline = tokens[index + 1]
            words = "".join(" " if child.type == "softbreak" else child.content for child in inline.children or [] if child.type in {"text", "code_inline", "image", "softbreak"})
            base = slug(words)
            count = slug_counts.get(base, 0)
            anchors.add(f"{base}-{count}" if count else base)
            slug_counts[base] = count + 1
        if token.type not in {"inline", "html_block"}:
            continue
        line = (token.map[0] + 1) if token.map else 1
        for child in token.children or []:
            if child.type in {"link_open", "image"}:
                target = child.attrGet("href" if child.type == "link_open" else "src")
                if target:
                    links.append((target, line))
            if child.type == "html_inline":
                html = HtmlLinks()
                html.feed(child.content)
                links.extend((target, line) for target in html.links)
                anchors.update(html.anchors)
        if token.type == "html_block":
            html = HtmlLinks()
            html.feed(token.content)
            links.extend((target, line) for target in html.links)
            anchors.update(html.anchors)
    return links, anchors


def tracked_markdown() -> list[Path]:
    files = subprocess.check_output(["git", "ls-files", "-z", "--", "*.md"], cwd=ROOT)
    return [ROOT / name.decode() for name in files.split(b"\0") if name]


def main() -> int:
    paths = tracked_markdown()
    documents = {path: document(path) for path in paths}
    problems: list[str] = []
    checked = 0
    for source in paths:
        links, _ = documents[source]
        for raw_target, line in links:
            parts = urlsplit(raw_target)
            if parts.scheme or parts.netloc:
                continue  # External URL availability is not a deterministic repository check.
            target_path = unquote(parts.path)
            if not target_path and not parts.fragment:
                continue
            target = (ROOT / target_path.lstrip("/")) if target_path.startswith("/") else (source.parent / target_path)
            target = target.resolve()
            label = f"{source.relative_to(ROOT)}:{line}: {raw_target}"
            if not target.is_relative_to(ROOT):
                problems.append(f"{label} escapes the repository")
                continue
            if not target.exists():
                problems.append(f"{label} points to a missing path")
                continue
            checked += 1
            fragment = unquote(parts.fragment)
            if not fragment or target.is_dir():
                continue
            line_anchor = LINE_ANCHOR.fullmatch(fragment)
            if line_anchor:
                total = len(target.read_text(encoding="utf-8").splitlines())
                if int(line_anchor[1]) < 1 or int(line_anchor[2] or line_anchor[1]) > total:
                    problems.append(f"{label} points beyond line {total}")
                continue
            if target.suffix.lower() in {".md", ".markdown"}:
                if target not in documents:
                    documents[target] = document(target)
                if fragment not in documents[target][1]:
                    problems.append(f"{label} points to a missing anchor")
    for problem in problems:
        print(f"ERROR: {problem}")
    if problems:
        print(f"FAIL: {len(problems)} broken local links")
        return 1
    print(f"PASS: {checked} local links and anchors in {len(paths)} tracked Markdown files")
    return 0


if __name__ == "__main__":
    sys.exit(main())
