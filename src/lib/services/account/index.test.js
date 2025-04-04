import { describe, expect, test } from "vitest";

import { getAccount, updateAccount } from "./index";

describe("ACCOUNT", () => {
  const env = {
    API_URL: import.meta.env.VITE_API_URL,
    AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    AWS_REGION: import.meta.env.VITE_AWS_REGION,
    AWS_DYNAMODB_TARGET_VERSION: import.meta.env.VITE_AWS_DYNAMODB_TARGET_VERSION,
    AWS_DYNAMODB_TABLE: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
  };
  describe("GET /v1/account", () => {
    test("happy path", async () => {
      const request = new Request(`${env.API_URL}/v1/account`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      const response = await getAccount({ request, env });
      const resData = await response.json();
      expect(resData).toBeDefined();
      expect(resData?.schema).toBe("v1/account");
      expect(response.status).toBe(200);
    });
  });
  describe.skip("PUT /v1/account", () => {
    test("happy path", async () => {
      const data = {
        schema: "v1/account",
        email: "zdmc23@gmail.com",
        notifications: {
          email: {
            alerts: false,
            product: true,
          },
          inapp: {
            analytics: false,
            organization: false,
          },
        },
      };
      const request = new Request(`${env.API_URL}/v1/account`, {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const response = await updateAccount({ request, env });
      expect(response.status).toBe(204);
    });
  });
});
