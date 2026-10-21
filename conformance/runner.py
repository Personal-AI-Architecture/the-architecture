#!/usr/bin/env python3
"""Run the first executable, implementation-neutral PAA conformance baseline.

This runner proves properties of the published PAA contract package. It does not
assume a target implementation language or runtime framework. Target-specific
adapters can be added later without changing these contract checks.
"""

from __future__ import annotations

import argparse
import ipaddress
import json
import subprocess
import sys
from pathlib import Path


REQUIRED_FILES = (
    "contracts/schemas/configuration.json",
    "contracts/schemas/identity.json",
    "contracts/schemas/message.json",
    "contracts/schemas/policy.json",
    "contracts/schemas/tool-definition.json",
    "contracts/openapi/gateway-engine.yaml",
    "contracts/openapi/gateway-api.yaml",
    "contracts/openapi/model-api.yaml",
    "contracts/examples/validate-manifest.py",
)


class Failure(Exception):
    pass


def read_json(root: Path, relative: str) -> object:
    try:
        return json.loads((root / relative).read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise Failure(f"cannot read JSON {relative}: {exc}") from exc


def require(condition: bool, message: str) -> None:
    if not condition:
        raise Failure(message)


def is_loopback(address: str) -> bool:
    try:
        return ipaddress.ip_address(address).is_loopback
    except ValueError:
        return False


def run_example_validator(root: Path) -> None:
    command = [sys.executable, str(root / "contracts/examples/validate-manifest.py")]
    result = subprocess.run(command, cwd=root, capture_output=True, text=True)
    require(result.returncode == 0, result.stdout.strip() or result.stderr.strip() or "example validator failed")


def check_contract_baseline(root: Path) -> list[str]:
    for relative in REQUIRED_FILES:
        require((root / relative).is_file(), f"missing required contract file: {relative}")

    run_example_validator(root)

    configuration = read_json(root, "contracts/schemas/configuration.json")
    require(configuration.get("required") == ["memory_root", "provider_adapter", "auth_mode", "tool_sources"], "runtime configuration is not the four-field contract")

    identity = read_json(root, "contracts/schemas/identity.json")
    require(identity["properties"]["type"]["type"] == "string", "identity actor type is not extensible")

    tool_definition = read_json(root, "contracts/schemas/tool-definition.json")
    require(set(tool_definition["required"]) == {"name", "description", "parameters", "source", "visibility"}, "tool-definition required fields drifted")
    require(tool_definition["properties"]["source"]["required"] == ["id", "kind"], "tool source provenance shape drifted")
    visibility = tool_definition["properties"]["visibility"]["properties"]
    require(set(visibility["mode"]["enum"]) == {"always_send", "discoverable"}, "tool visibility modes drifted")
    require(set(visibility["authorization"]["enum"]) == {"permitted", "not_permitted"}, "tool authorization markers drifted")

    tool_example = read_json(root, "contracts/examples/memory-restore-tool.json")
    require(tool_example["source"]["id"] + ":" + tool_example["name"] == "builtin:memory:memory_restore", "tool source/name identity is not stable")
    require("requires_approval" not in tool_example, "approval policy leaked into tool definition")

    message = read_json(root, "contracts/schemas/message.json")
    call = message["$defs"]["ToolCallPart"]
    require("source_id" in call["required"], "tool calls do not preserve source identity")

    gateway_request = read_json(root, "contracts/examples/gateway-engine-request.json")
    require(set(gateway_request) >= {"messages", "model", "auth_context", "metadata"}, "internal request is missing a bounded required field")
    auth_context = gateway_request["auth_context"]
    require(set(auth_context) >= {"actor", "authentication_id", "authenticated_at", "correlation_id"}, "auth_context is incomplete")
    require(not ({"permissions", "credential", "token", "api_key"} & set(auth_context)), "auth_context carries credentials or permissions")
    require(isinstance(gateway_request["metadata"].get("correlation_id"), str), "internal request lacks metadata correlation_id")

    policy = read_json(root, "contracts/schemas/policy.json")
    conditions = policy["properties"]["conditions"]["properties"]
    require(set(conditions) == {"time_window", "max_per_day", "requires_approval"}, "portable policy condition set drifted")

    address_cases = {
        "127.0.0.1": True,
        "::1": True,
        "0.0.0.0": False,
        "::": False,
        "192.168.1.20": False,
    }
    for address, expected in address_cases.items():
        require(is_loopback(address) is expected, f"loopback decision failed for {address}")

    return [
        "EXAMPLES: canonical valid/invalid examples pass their labels",
        "CONFIG: four runtime fields",
        "IDENTITY: extensible actor type",
        "TOOLS: source identity and visibility/authorization semantics",
        "MESSAGES: source_id preserved on tool calls",
        "AUTH: permission-free transport-neutral auth_context",
        "POLICY: portable condition vocabulary",
        "DEPLOY: loopback-only default accepts 127.0.0.1/::1 and rejects wildcard/LAN addresses",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="PAA repository root")
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        checks = check_contract_baseline(root)
    except Failure as exc:
        print(f"FAIL: {exc}")
        return 1
    print(f"PASS: PAA executable conformance baseline ({len(checks)} checks)")
    for check in checks:
        print(f"  {check}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
