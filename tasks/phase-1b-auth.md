# Phase 1B: Auth Middleware — Codex Task

## What You're Building

V1 owner-only authentication and authorization. Auth is a cross-cutting layer — independent of Gateway and Engine (D60). It sits as middleware on the request path.

You are building **three things**:
1. `src/auth/provider.ts` — V1 auth provider (authenticate + authorize)
2. `src/auth/middleware.ts` — Hono middleware for HTTP requests
3. `src/auth/bootstrap.ts` — Token generation and configuration

## Interfaces You Must Implement

All types are already defined in `src/types/index.ts`. Do not modify the type definitions.

### AuthProvider interface (from `src/types/index.ts`)

```typescript
interface AuthProvider {
  authenticate(credential: string): Promise<Identity | null>;
  authorize(identity: Identity, resource: string, action: string): Promise<AuthDecision>;
}
```

### AuthDecision (from `src/types/index.ts`)

```typescript
interface AuthDecision { allowed: boolean; reason?: string; }
```

### AuthResult (from `src/types/index.ts`)

```typescript
type AuthResult =
  | { authenticated: true; identity: Identity; headers: { "X-Actor-ID": string; "X-Actor-Permissions": string } }
  | { authenticated: false; error: string };
```

### Identity (from `src/types/generated.ts` via `src/types/index.ts`)

The Identity type is generated from `specs/schemas/identity.json`. It supports 8 actor types: owner, collaborator, system_agent, background_agent, external_agent, service, economic, federated. Only "owner" is active in V1.

---

## File 1: `src/auth/provider.ts`

Export:

```typescript
export function createV1AuthProvider(ownerCredential: string): AuthProvider
```

### Behavior

**`authenticate(credential)`**
- If `credential` exactly matches `ownerCredential`, return an Identity object:
  - `id`: `"owner"`
  - `type`: `"owner"`
  - `display_name`: `"Owner"`
  - `status`: `"active"`
  - `created_at`: ISO 8601 timestamp (set once at provider creation, not per-call)
- If `credential` does not match, return `null`
- No timing attacks: always do a constant-time comparison (use `crypto.timingSafeEqual`)

**`authorize(identity, resource, action)`**
- V1: if the identity type is `"owner"`, always return `{ allowed: true }`
- All other identity types: return `{ allowed: false, reason: "Only owner access is supported in V1" }`

---

## File 2: `src/auth/middleware.ts`

Export:

```typescript
export function createAuthMiddleware(provider: AuthProvider): Middleware
```

Where `Middleware` is a Hono middleware function: `(c: Context, next: Next) => Promise<void | Response>`.

### Behavior

1. Extract credential from the request in this order:
   - `Authorization: Bearer <token>` header
   - `X-API-Key: <token>` header
   - Fall through to no credential

2. If no credential found: return 401 JSON response `{ code: "unauthorized", message: "No credentials provided" }`

3. Call `provider.authenticate(credential)`:
   - If `null` returned: return 401 JSON response `{ code: "unauthorized", message: "Invalid credentials" }`
   - If identity returned but `status !== "active"`: return 401 JSON response `{ code: "unauthorized", message: "Identity is <status>" }`

4. On success: set request headers and call `next()`:
   - `X-Actor-ID`: the identity's `id`
   - `X-Actor-Permissions`: JSON string of `{ type: identity.type }`

### Import Constraints

This file imports from `hono`. It must NOT import from `../gateway/`, `../engine/`, or `../memory/`.

---

## File 3: `src/auth/bootstrap.ts`

Export:

```typescript
export async function resolveAuthToken(configDir: string): Promise<string>
```

### Behavior

1. Check `PAI_AUTH_TOKEN` env var. If set, return its value.

2. If not set, check for existing token file at `{configDir}/auth-token`:
   - If file exists, read and return its contents (trimmed)

3. If neither exists, generate a new token:
   - Use `crypto.randomBytes(32).toString('hex')` for a 64-character hex token
   - Write to `{configDir}/auth-token`
   - Set file permissions to `0o600` (owner read/write only)
   - Print the **file path** to stdout: `Auth token written to: {configDir}/auth-token`
   - NEVER print the token value itself (prevents leaking to logs and shell history)
   - Return the generated token

---

## Dependencies

You may use:
- `node:crypto` — timing-safe comparison, random token generation
- `node:fs/promises` — file operations for token persistence
- `node:path` — path resolution
- `hono` — HTTP middleware (already in package.json)
- Types from `../types/index.js`

You must NOT import from:
- `../gateway/`
- `../engine/`
- `../memory/`
- `../adapters/`

---

## Constraints

1. Zero imports from gateway, engine, memory, or adapters
2. Constant-time credential comparison (prevent timing attacks)
3. Token never printed to stdout — only the file path
4. File permissions 0600 on generated token file
5. Use the exact types from `src/types/index.ts`
6. ESM imports, TypeScript strict mode
7. No hardcoded paths, provider names, or product names

---

## How to Verify Your Work

```bash
npm run build
npm run check:imports
npm run check:lockin
npm run lint
```

All four must pass.
