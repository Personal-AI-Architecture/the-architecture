# Post-v1.0 follow-ups

These items are explicitly deferred from the v1.0 release gate. They do not
change the v1.0 contracts or the release verification result.

## Client-facing tool event polish

One tool call can currently produce several stream events while arguments are
being assembled. A future client-facing refinement should either aggregate
those partial updates into one final event or mark intermediate events so a
client does not display duplicate tool calls.

## MCP setup documentation

Document how to configure an external MCP tool source through
`RUNTIME_TOOL_SOURCES` and add a small example MCP server/configuration that a
newcomer can run without inventing a test server.

## Gateway continuation example

Add a README example showing how to continue an existing conversation with
`POST /conversations/{id}/messages`.

## Runner prerequisite clarity

Update the runner quickstart to require Python 3.12 or newer and explain that
the macOS system Python 3.9 cannot install the pinned requirements.

These follow-ups are tracked after the v1.0 release; none is a release blocker.
