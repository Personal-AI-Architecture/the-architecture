# Examples Validation

> Rules for keeping standalone example files aligned with the primer layer.

## Purpose

Make sure valid and invalid example files remain trustworthy when contracts, config shapes, or review rules change.

## Core Rule

If a contract or config shape changes, update the matching valid and invalid standalone example files in the same change.

## Validation Rules

- Every valid example must remain consistent with its owning primer doc.
- Every invalid example must still demonstrate a real drift pattern rather than a random malformed payload.
- Valid and invalid example pairs should cover the same concept where practical.
- If a matrix row begins relying on an example, the traceability map must reference that example file.
- If a checklist points to an example, that example must remain useful for the review step it supports.

## Required Companion Updates

- Contract payload change -> update example files, contract doc links, traceability map, and affected review checklists.
- Config shape change -> update runtime/adapter examples, configuration doc links, traceability map, and affected checklists.
- New recurring drift example -> update invalid example file set and `failure-patterns.md` if the pattern is reusable.

## Review Questions

- Does each linked example still match the canonical shape in the primer?
- Does each invalid example still represent a real drift and not an outdated one?
- Were valid and invalid pairs updated together?
- Were links from primer docs, checklists, and traceability map updated together?

## Source Docs

- `docs/ai/examples/README.md`
- `docs/ai/primer-change-policy.md`
- `docs/ai/traceability-map.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/configuration.md`
