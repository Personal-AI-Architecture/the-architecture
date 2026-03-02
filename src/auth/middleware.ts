import type { Context, Next } from "hono";
import type { AuthProvider } from "../types/index.js";

function parseCookies(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const cookiePart of cookieHeader.split(";")) {
    const trimmed = cookiePart.trim();
    if (trimmed.length === 0) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (name.length === 0 || rawValue.length === 0) {
      continue;
    }

    cookies.set(name, decodeURIComponent(rawValue));
  }

  return cookies;
}

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

  const cookieHeader = context.req.header("Cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    const candidateNames = ["pai_auth_token", "auth_token", "token", "api_key"];

    for (const name of candidateNames) {
      const value = cookies.get(name);
      if (value && value.length > 0) {
        return value;
      }
    }

    if (cookies.size === 1) {
      const onlyCookie = cookies.values().next().value;
      if (onlyCookie && onlyCookie.length > 0) {
        return onlyCookie;
      }
    }
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
