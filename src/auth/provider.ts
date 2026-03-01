import { createHash, timingSafeEqual } from "node:crypto";
import type { AuthDecision, AuthProvider, Identity } from "../types/index.js";

function compareCredentials(
  providedCredential: string,
  ownerCredential: string,
): boolean {
  // Compare fixed-length digests to avoid leaking token length or prefix matches.
  const providedDigest = createHash("sha256").update(providedCredential).digest();
  const ownerDigest = createHash("sha256").update(ownerCredential).digest();
  return timingSafeEqual(providedDigest, ownerDigest);
}

export function createV1AuthProvider(ownerCredential: string): AuthProvider {
  const createdAt = new Date().toISOString();
  const ownerIdentity: Identity & { created_at: string } = {
    id: "owner",
    type: "owner",
    display_name: "Owner",
    status: "active",
    created: createdAt,
    created_at: createdAt,
  };

  return {
    async authenticate(credential: string): Promise<Identity | null> {
      if (!compareCredentials(credential, ownerCredential)) {
        return null;
      }

      return ownerIdentity;
    },

    async authorize(
      identity: Identity,
      _resource: string,
      _action: string,
    ): Promise<AuthDecision> {
      if (identity.type === "owner") {
        return { allowed: true };
      }

      return {
        allowed: false,
        reason: "Only owner access is supported in V1",
      };
    },
  };
}
