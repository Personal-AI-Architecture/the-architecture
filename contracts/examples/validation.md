# Examples Validation

> Rules for keeping standalone example files aligned with canonical contracts.

## Purpose

Make sure valid and invalid example files remain trustworthy when contracts, config shapes, or review rules change.

## Core Rule

If a contract or config shape changes, update the matching valid and invalid standalone example files in the same change.

## Validation Rules

- Every valid example must remain consistent with its canonical contract and owning architecture spec.
- Every invalid example must still demonstrate a real drift pattern rather than a random malformed payload.
- Valid and invalid example pairs should cover the same concept where practical.
- If a conformance test relies on an example, the examples manifest must reference that test ID.
- If a checklist points to an example, that example must remain useful for the review step it supports.

## Required Companion Updates

- Contract payload change -> update example files, the examples manifest, and affected review checklists.
- Config shape change -> update runtime/adapter examples, the examples manifest, and affected checklists.
- New recurring drift example -> update the invalid example set and applicable conformance checks.

## Review Questions

- Does each linked example still match the canonical contract?
- Does each invalid example still represent a real drift and not an outdated one?
- Were valid and invalid pairs updated together?
- Were links from architecture specs, checklists, and the examples manifest updated together?

## Source Docs

- `contracts/examples/README.md`
- `contracts/examples/examples-manifest.json`
- `architecture/gateway-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/configuration-spec.md`
