import { describe, it, expect } from "vitest";
import { validateABACPolicy, Policy } from ".";

describe("Policy Validation", () => {
  const allowPolicy: Policy = {
    effect: "ALLOW",
    actions: { read: true, write: true },
    resource: { chat: true, data: true, context: true, safety: true, search: true },
    subject: { status: "active" },
    environment: { country: "United States" },
  };

  const denyPolicy: Policy = { ...allowPolicy, effect: "DENY" };

  const user: any = {
    userId: "user1",
    attributes: { status: "active" },
  };

  const environment = { country: "United States" };

  it("should allow access for matching allow policy", () => {
    expect(validateABACPolicy(allowPolicy, user, "read", "chat", environment)).toBe(true);
  });

  it("should deny access for matching deny policy", () => {
    expect(validateABACPolicy(denyPolicy, user, "read", "chat", environment)).toBe(false);
  });

  it("should deny access for non-allowed action", () => {
    expect(validateABACPolicy(allowPolicy, user, "delete", "chat", environment)).toBe(false);
  });

  it("should deny access for non-allowed resource", () => {
    expect(validateABACPolicy(allowPolicy, user, "read", "admin", environment)).toBe(false);
  });

  it("should deny access for user with mismatched status", () => {
    const inactiveUser: any = {
      userId: "user2",
      attributes: { status: "inactive" },
    };
    expect(validateABACPolicy(allowPolicy, inactiveUser, "read", "chat", environment)).toBe(false);
  });

  it("should deny access for mismatched environment", () => {
    const canadaEnvironment = { country: "Canada" };
    expect(validateABACPolicy(allowPolicy, user, "read", "chat", canadaEnvironment)).toBe(false);
  });
});
