// Define types for our policy structure
type Effect = "ALLOW" | "DENY";

export interface Policy {
  effect: Effect;
  actions: Record<string, boolean>;
  resource: Record<string, boolean>;
  subject: Record<string, string>;
  environment: Record<string, string>;
}

/**
 * Validates a request against a given policy.
 * @param policy - The policy to validate against.
 * @param user - The user making the request.
 * @param action - The action being performed.
 * @param resource - The resource being accessed.
 * @param environment - The environmental context of the request.
 * @returns Whether the request is allowed or not.
 */
export const validateABACPolicy = (
  policy: Policy,
  user: any,
  action: string,
  resource: string,
  environment: Record<string, any>,
): boolean => {
  // immediately return false if the policy effect is not "ALLOW"
  if (policy?.effect?.toUpperCase() !== "ALLOW") {
    return false;
  }

  // check if the action is allowed
  if (!policy?.actions?.[action]) {
    return false;
  }

  // check if the resource is allowed
  if (!policy?.resource?.[resource]) {
    return false;
  }

  // check if the user "abac" attributes match the policy subject
  for (const [key, value] of Object?.entries(policy?.subject)) {
    if (user?.abac[key] !== value) {
      return false;
    }
  }

  // check environmental conditions
  for (const [key, value] of Object?.entries(policy?.environment)) {
    if (environment?.[key] !== value) {
      return false;
    }
  }

  // if all conditions are met, allow access
  return true;
};
