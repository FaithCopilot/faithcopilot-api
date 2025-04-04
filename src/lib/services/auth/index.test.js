import { describe, expect, test } from "vitest";
import { signup, token, forgotPassword, logout, getNextLocation } from "./index";

//import { deleteIdentity } from '../services/db/dynamodb'

//import { GrantTypeConstants, LocationConstants } from '../constants'
import { GrantTypeConstants, LocationConstants } from "./src/lib/constants";

const API_URL = "http://localhost:8787";

describe("AUTH", () => {
  let env = {
    AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    AWS_REGION: import.meta.env.VITE_AWS_REGION,
    AWS_DYNAMODB_TARGET_VERSION: import.meta.env.VITE_AWS_DYNAMODB_TARGET_VERSION,
    AWS_DYNAMODB_TABLE: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
    COOKIE_NAME: import.meta.env.VITE_COOKIE_NAME,
    COOKIE_DOMAIN: import.meta.env.VITE_COOKIE_DOMAIN,
    COOKIE_MAX_AGE: import.meta.env.VITE_COOKIE_MAX_AGE,
    HASH_KEY: import.meta.env.VITE_HASH_KEY,
  };

  /*
  describe.skip('/signup', () => {
    const data = {
      orgId: '42',
      email: 'test@example.com',
      password: '123xyz',
    }

    test('happy path', async () => {
      const request = new Request(`${env.API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      const response = await signup({ request, env })
      expect(response.status).toBe(201)
    })

    test.skip('clean up', async () => {
      // delete to clean up
      const res = await deleteIdentity({ env, pk: data.email })
      expect(res).toBe(true)
    })
  })
  */

  describe("/token", () => {
    const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;
    const JWT_ISSUER = import.meta.env.VITE_JWT_ISSUER;
    const JWT_AUDIENCE = import.meta.env.VITE_JWT_AUDIENCE;
    const JWT_EXPIRATION = import.meta.env.VITE_JWT_EXPIRATION;
    env = {
      ...env,
      JWT_SECRET,
      JWT_ISSUER,
      JWT_AUDIENCE,
      JWT_EXPIRATION,
    };

    test("handleGrantTypePassword", async () => {
      // TODO: env.vars
      const data = {
        email: "zdmc23@gmail.com",
        password: "changeme",
      };
      const request = new Request(`${env.API_URL}/auth/token?grant_type=${GrantTypeConstants.PASSWORD}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const response = await token({ request, env });
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.headers.get("Set-Cookie")).toBeDefined();
      const resData = await response.json();
      expect(resData.access_token).toBeDefined();
      expect(resData.token_type).toBe("Bearer");
    });

    test.skip("handleGrantTypeTokenExchange", async () => {
      // TODO: env.vars
      const data = {
        token: "eyJhbGci",
      };
      const request = new Request(`${API_URL}/auth/token?grant_type=${GrantTypeConstants.TOKEN_EXCHANGE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      await expect(() => token({ request, env })).rejects.toThrowError("Invalid JWT");
      //const response = await token({ request, env });
      //expect(response.status).toBe(401);
    });
  });

  test.skip("/forgot-password", async () => {
    env = {
      ...env,
      FASTMAIL_TOKEN: import.meta.env.VITE_FASTMAIL_TOKEN,
      FASTMAIL_USERNAME: import.meta.env.VITE_FASTMAIL_USERNAME,
      BRAND: import.meta.env.PUBLIC_BRAND_NAME,
    };
    const data = { email: "test@example.com" };
    const request = new Request(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const response = await forgotPassword({ request, env });
    expect(response.status).toBe(200);
  });

  test.skip("/logout", async () => {
    const request = new Request(`${API_URL}/logout`);
    const response = await logout({ request, env });
    expect(response.headers.get("Location")).toBe(`${API_URL}/login`);
    expect(response.headers.get("Set-Cookie")).toBeDefined();
    expect(response.status).toBe(302);
  });

  describe.skip("getNextLocation()", () => {
    test("LOGIN, nothing else -> CONFIRM_EMAIL", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.LOGIN,
        }),
      ).toBe(LocationConstants.CONFIRM_EMAIL);
    });
    test("LOGIN, email_verified=false -> CONFIRM_EMAIL", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.LOGIN,
          userData: {
            email_verified: false,
          },
        }),
      ).toBe(LocationConstants.CONFIRM_EMAIL);
    });
    test("LOGIN, email_verified=true -> HOME", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.LOGIN,
          userData: {
            email_verified: true,
          },
        }),
      ).toBe(LocationConstants.HOME);
    });
    test("LOGIN, mfa exists, email_verified=true -> MFA", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.LOGIN,
          userData: {
            email_verified: true,
            mfa: "??",
          },
        }),
      ).toBe(LocationConstants.MFA);
    });
    test("MFA -> LOGIN", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.MFA,
        }),
      ).toBe(LocationConstants.HOME);
    });
    test("RESET_PASSWORD -> LOGIN", () => {
      expect(
        getNextLocation({
          currentLocation: LocationConstants.RESET_PASSWORD,
        }),
      ).toBe(LocationConstants.LOGIN);
    });
    test("SOMETHING ELSE -> LOGIN", () => {
      expect(
        getNextLocation({
          currentLocation: "/something-else",
        }),
      ).toBe(LocationConstants.LOGIN);
    });
  });
});
