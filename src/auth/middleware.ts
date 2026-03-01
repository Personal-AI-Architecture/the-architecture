import type { Context, Next } from "hono";
import type { AuthProvider } from "../types/index.js";

function extractCredential(context: Context): string | null {
  const authorization = context.req.header("Authorization");
  if (authorization) {
    const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch?.[1]) {
      return bearerMatch[1].trim();
    }
  }

  const apiKey = context.req.header("X-API-Key");
  if (apiKey) {
    return apiKey.trim();
  }

  return null;
}

export function createAuthMiddleware(provider: AuthProvider) {
  return async (context: Context, next: Next): Promise<Response | undefined> => {
    const credential = extractCredential(context);

    if (!credential) {
      return context.json(
        {
          code: "unauthorized",
          message: "No credentials provided",
        },
        401,
      );
    }

    const identity = await provider.authenticate(credential);
    if (!identity) {
      return context.json(
        {
          code: "unauthorized",
          message: "Invalid credentials",
        },
        401,
      );
    }

    if (identity.status !== "active") {
      return context.json(
        {
          code: "unauthorized",
          message: `Identity is ${identity.status}`,
        },
        401,
      );
    }

    context.req.raw.headers.set("X-Actor-ID", identity.id);
    context.req.raw.headers.set(
      "X-Actor-Permissions",
      JSON.stringify({ type: identity.type }),
    );

    await next();
  };
}
