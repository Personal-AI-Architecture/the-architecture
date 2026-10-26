#!/usr/bin/env python3
"""Run the first executable, implementation-neutral PAA conformance baseline.

This runner proves properties of the published PAA contract package. It does not
assume a target implementation language or runtime framework. Target-specific
adapters can be added later without changing these contract checks.
"""

from __future__ import annotations

import argparse
import copy
import ipaddress
import json
import subprocess
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator


REQUIRED_FILES = (
    "contracts/schemas/configuration.json",
    "contracts/schemas/identity.json",
    "contracts/schemas/message.json",
    "contracts/schemas/policy.json",
    "contracts/schemas/tool-definition.json",
    "contracts/openapi/gateway-agent-loop.yaml",
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


def read_yaml(root: Path, relative: str) -> object:
    try:
        return yaml.safe_load((root / relative).read_text())
    except (OSError, yaml.YAMLError) as exc:
        raise Failure(f"cannot read YAML {relative}: {exc}") from exc


def require(condition: bool, message: str) -> None:
    if not condition:
        raise Failure(message)


def validate_case(schema: dict, payload: object, expected: bool, label: str) -> None:
    actual = Draft202012Validator(schema).is_valid(payload)
    require(actual is expected, f"{label} {'should validate' if expected else 'should fail validation'}")


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

    source_kind = tool_definition["properties"]["source"]["properties"]["kind"]
    require(source_kind.get("type") == "string" and source_kind.get("minLength") == 1 and "enum" not in source_kind, "new tool protocols are blocked by source.kind")

    tool_example = read_json(root, "contracts/examples/memory-restore-tool.json")
    require(tool_example["source"]["id"] + ":" + tool_example["name"] == "builtin:memory:memory_restore", "tool source/name identity is not stable")
    require("requires_approval" not in tool_example, "approval policy leaked into tool definition")
    new_protocol_tool = copy.deepcopy(tool_example)
    new_protocol_tool["source"]["kind"] = "future_transport"
    new_protocol_tool["extensions"] = {"example/tool_hint": {"rank": 2}}
    validate_case(tool_definition, new_protocol_tool, True, "new protocol and tool extensions")
    new_protocol_tool["source"]["kind"] = ""
    validate_case(tool_definition, new_protocol_tool, False, "empty tool-source kind")
    new_protocol_tool["source"]["kind"] = "future_transport"
    new_protocol_tool["unrecognized_core_field"] = True
    validate_case(tool_definition, new_protocol_tool, False, "unknown tool core field")

    message = read_json(root, "contracts/schemas/message.json")
    call = message["$defs"]["ToolCallPart"]
    require("source_id" in call["required"], "tool calls do not preserve source identity")
    for part_name in ("TextPart", "ImagePart", "FilePart", "ToolCallPart", "ToolResultPart"):
        require("extensions" in message["$defs"][part_name]["properties"], f"{part_name} has no extension slot")
    extended_message = {"role": "user", "content": [{"type": "text", "text": "hello", "extensions": {"example/new_flag": True}}]}
    validate_case(message, extended_message, True, "message-part extension")
    extended_message["content"][0]["unrecognized_core_field"] = True
    validate_case(message, extended_message, False, "unknown message-part core field")

    gateway_request = read_json(root, "contracts/examples/gateway-agent-loop-request.json")
    require(set(gateway_request) >= {"messages", "model", "provider", "auth_context", "metadata"}, "internal request is missing a bounded required field")
    auth_context = gateway_request["auth_context"]
    require(set(auth_context) >= {"actor", "authentication_id", "authenticated_at", "correlation_id"}, "auth_context is incomplete")
    require(not ({"permissions", "credential", "token", "api_key"} & set(auth_context)), "auth_context carries credentials or permissions")
    require(isinstance(gateway_request["metadata"].get("correlation_id"), str), "internal request lacks metadata correlation_id")

    auth_schema = copy.deepcopy(read_json(root, "contracts/schemas/auth-context.json"))
    auth_schema["properties"]["actor"] = read_json(root, "contracts/schemas/identity.json")
    unexpected_auth = dict(auth_context, extensions={"example/new_flag": True})
    validate_case(auth_schema, unexpected_auth, False, "unexpected auth-context field")

    model_contract = read_yaml(root, "contracts/openapi/model-api.yaml")
    agent_loop_contract = read_yaml(root, "contracts/openapi/gateway-agent-loop.yaml")
    gateway_contract = read_yaml(root, "contracts/openapi/gateway-api.yaml")
    model_error = model_contract["components"]["schemas"]["CompletionError"]
    agent_loop_error = agent_loop_contract["components"]["schemas"]["ErrorEvent"]
    gateway_error = gateway_contract["components"]["schemas"]["ErrorEvent"]
    for boundary, schema in (("Model API", model_error), ("Agent Loop", agent_loop_error), ("Gateway API", gateway_error)):
        unsupported = {"_event_type": "error", "code": "capability_unsupported", "message": "Image input is unavailable.", "capability": "image_input"}
        validate_case(schema, unsupported, True, f"{boundary} unsupported ability")
        unsupported.pop("capability")
        validate_case(schema, unsupported, False, f"{boundary} unnamed ability")
        unavailable = {"_event_type": "error", "code": "model_unavailable", "message": "Selected model is unavailable."}
        validate_case(schema, unavailable, True, f"{boundary} unavailable model")
    for boundary, contract in (("Model API", model_contract), ("Agent Loop", agent_loop_contract), ("Gateway API", gateway_contract)):
        schema = contract["components"]["schemas"]["Error"]
        unsupported = {"code": "capability_unsupported", "message": "Image input is unavailable.", "capability": "image_input"}
        validate_case(schema, unsupported, True, f"{boundary} pre-stream unsupported ability")
        unsupported.pop("capability")
        validate_case(schema, unsupported, False, f"{boundary} pre-stream unnamed ability")
        validate_case(schema, {"code": "model_unavailable", "message": "Selected model is unavailable."}, True, f"{boundary} pre-stream unavailable model")
    validate_case(model_error, {"_event_type": "error", "code": "rate_limited", "message": "Try later."}, True, "open provider error code")
    validate_case(agent_loop_error, {"_event_type": "error", "code": "rate_limited", "message": "Try later."}, False, "unknown Agent Loop error category")


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
        "MODEL_ERRORS: canonical model/ability categories and named missing capability",
        "TOOL_KIND: new protocol labels validate without a contract edit",
        "EXTENSIONS: additive slots validate while strict core and auth fields reject extras",
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
