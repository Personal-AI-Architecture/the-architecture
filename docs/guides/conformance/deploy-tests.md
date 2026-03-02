# Deployment Invariant Tests

> Validates the Level 1 deployment contract from `deployment-spec.md`.

---

## DEPLOY-1: Offline Operation

**Validates:** Deployment contract guarantee 2 (functions fully offline)

**Setup:**
1. System installed on a machine with a local model (e.g., Ollama)
2. All tools are local (no external API tools)
3. Network connectivity available at start

**Procedure:**
1. Start the system — verify it works with network available
2. Disconnect all network interfaces (disable WiFi, unplug ethernet)
3. Send a message that triggers the full agent loop (message → model → tool call → response)
4. Perform memory operations: read, write, search, list
5. Verify conversation persistence

**Pass criteria:**
- [ ] System starts without network access (if already installed)
- [ ] Full agent loop completes: message → model → tool call → response
- [ ] All memory operations succeed: read, write, edit, delete, search, list
- [ ] Conversations are persisted and resumable
- [ ] Auth works locally — login succeeds, permissions enforced
- [ ] No error messages about missing network connectivity
- [ ] No outbound connection attempts (verify with network monitor)

**Failure indicators:**
- System fails to start without network
- Agent loop cannot complete without cloud services
- Memory operations fail without network
- Auth requires an external service to validate

---

## DEPLOY-2: Local Data Storage

**Validates:** Deployment contract guarantee 3 (data stays local by default)

**Setup:**
1. System installed with default configuration
2. Network monitor active (e.g., `tcpdump`, Little Snitch, Wireshark)
3. Provider configured (cloud or local — either is valid for this test)

**Procedure:**
1. Start the system
2. Have a multi-turn conversation with tool calls
3. Create, edit, and delete files in Your Memory
4. Monitor all network traffic throughout

**Pass criteria:**
- [ ] All Your Memory data resides on the local filesystem
- [ ] Conversations are stored locally (SQLite or files on local disk)
- [ ] Auth data is stored locally
- [ ] Configuration files are local
- [ ] No data is written to any external service unless explicitly configured
- [ ] Network traffic shows only: explicit provider API calls (if cloud model) and explicit tool API calls (if external tools configured)
- [ ] No analytics, telemetry, or tracking traffic

**Failure indicators:**
- Data written to a cloud storage service without explicit configuration
- Telemetry or analytics traffic observed
- Memory content transmitted externally without user-initiated action
- Auth tokens validated against an external service (for local deployment)

---

## DEPLOY-3: Default Localhost

**Validates:** Deployment contract §Network Posture, security-spec

**Setup:**
1. Fresh install of the system on a machine connected to a local network
2. A second machine on the same network
3. Port scanner available on the second machine

**Procedure:**
1. Install the system with default configuration (no config modifications)
2. Start the system
3. From the local machine: verify the Gateway API is accessible on localhost
4. From the second machine: attempt to connect to the Gateway API
5. Scan for any ports exposed to the network

**Pass criteria:**
- [ ] Gateway API is accessible on `localhost` (127.0.0.1 or ::1)
- [ ] Gateway API is NOT accessible from other machines on the network
- [ ] No ports are exposed to the network by default
- [ ] No UPnP, mDNS, or discovery broadcasts are sent
- [ ] No automatic port forwarding is configured
- [ ] Exposing to the network requires explicit configuration change

**Failure indicators:**
- Gateway API binds to 0.0.0.0 by default
- Any port is accessible from another machine without configuration
- Discovery protocols advertise the system on the network
- Default config includes network-exposed ports

---

## DEPLOY-4: No Silent Outbound

**Validates:** Security-spec, deployment contract guarantee 3

**Setup:**
1. System running with a local model and local tools only
2. Network monitor capturing all traffic from the system's process(es)

**Procedure:**
1. Start the system
2. Wait 60 seconds (capture startup traffic)
3. Have a conversation using only local tools
4. Wait another 60 seconds (capture idle traffic)
5. Analyze all captured network traffic

**Pass criteria:**
- [ ] Zero outbound network connections during startup (with local-only config)
- [ ] Zero outbound connections during conversation (with local model + local tools)
- [ ] Zero outbound connections during idle
- [ ] No DNS lookups for external services
- [ ] No "phone home" behavior — no update checks, no analytics, no license validation
- [ ] When cloud provider IS configured: only explicit API calls to the configured provider endpoint

**Failure indicators:**
- Any network traffic not directly attributable to a user-initiated action
- DNS lookups for services the user hasn't configured
- Connections to analytics or telemetry endpoints
- Background network activity during idle
- Update check connections without user opt-in
