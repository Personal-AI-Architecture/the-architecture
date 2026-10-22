# Deployment Invariant Tests

> Validates the architecture deployment contract from [deployment-spec.md](../architecture/deployment-spec.md).

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
- [ ] Conversations are stored locally (in a database or files on local disk)
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
- [ ] Gateway API is accessible on the loopback interface (`127.0.0.1` and/or `::1`); either address family is valid
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
1. System running with a local model and local tools; record the owner's configured network destinations, including any remote backup
2. Network monitor capturing all traffic from the system's process(es), with loopback identified separately

**Procedure:**
1. Start the system
2. Wait 60 seconds (capture startup traffic)
3. Have a conversation using only local tools
4. Wait another 60 seconds (capture idle traffic)
5. If the owner configured a remote destination, trigger its scheduled or manual operation and capture the destination
6. Compare each non-loopback connection with the owner's configuration

**Pass criteria:**
- [ ] Zero unconfigured non-loopback outbound connections during startup, conversation, and idle
- [ ] Local-only configuration makes no non-loopback outbound connection
- [ ] Loopback traffic is allowed
- [ ] A configured provider, external tool, or remote backup can reach only its configured destination, including during background operation
- [ ] No DNS lookups for unconfigured external services
- [ ] No "phone home" behavior — no update checks, no analytics, no license validation
- [ ] When a cloud provider is configured, calls go only to its configured endpoint

**Failure indicators:**
- Any non-loopback connection to an unconfigured destination
- DNS lookups for services the user hasn't configured
- Connections to analytics or telemetry endpoints
- Background network activity to an unconfigured destination
- Update check connections without user opt-in

---

## DEPLOY-5: No Unconfigured Outbound During Operation

**Validates:** Deployment implementation checklist: outbound destinations are owner configured, including remote backups

**Setup:** Record the effective owner configuration and monitor system DNS and network traffic. Prepare a local model and tool, then a separately configured remote backup destination.

**Procedure:** Run a conversation, tool call, idle interval, and scheduled backup with the local-only configuration. Configure the remote backup and repeat. Compare observed non-loopback destinations with the configuration at each point.

**Pass criteria:**
- [ ] Local-only operation makes no non-loopback outbound calls
- [ ] After configuration, the remote backup can run in the background to its configured destination
- [ ] No call or DNS lookup reaches an unconfigured destination; loopback is allowed
- [ ] Removing the destination from configuration stops subsequent calls to it

**Failure indicators:** An unconfigured destination is contacted, or a valid configured remote backup is blocked solely because it runs in the background.

---

## DEPLOY-6: Genuine Release Verification

**Validates:** Deployment implementation checklist: owner can verify the genuine, untampered release

**Setup:** Obtain a published release and its verification material through the implementation's documented method. Prepare a copy altered by one byte.

**Procedure:** Follow the owner-facing verification instructions for the original release and the altered copy. Record the release identity and the trust anchor used.

**Pass criteria:**
- [ ] An owner can follow documented steps to verify release identity and integrity before running it
- [ ] The genuine release verifies against a trust anchor independent of the downloaded artifact
- [ ] The altered copy fails verification and is not presented as genuine

**Failure indicators:** Verification cannot be performed by the owner, trusts only metadata inside the downloaded artifact, or accepts the altered copy.

---

## DEPLOY-7: Broken Update Rollback With Data Intact

**Validates:** Deployment implementation checklist: a broken update can be rolled back and owner data remains usable

**Setup:** Install a working version. Save representative Memory, preferences, conversations, and auth data. Record content and access checks. Keep the previous version available.

**Procedure:** Apply an update that fails a controlled startup or functional check. Follow the documented rollback procedure. Restart the previous version and repeat the content and access checks.

**Pass criteria:**
- [ ] The previous working version can be restored without reinstalling or recreating owner data
- [ ] All recorded Memory, preference, conversation, and auth data remain intact and usable after rollback
- [ ] The owner can still sign in and resume the saved conversation
- [ ] The failed update is reported; rollback does not silently discard owner changes

**Failure indicators:** Rollback is unavailable, the previous version cannot read its data, or any owner data is missing or corrupted.
