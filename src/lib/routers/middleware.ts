import { createMiddleware } from "hono/factory";
import { parse } from "cookie";
import { verifyToken } from "../services/crypto";
import { selectByKeysConditional } from "../services/db/dynamodb";

// see: https://github.com/kwhitley/itty-router/blob/v5.x/src/withContent.ts
export const withContent = createMiddleware(async (c, next) => {
  if (c.req.method !== "POST" && c.req.method !== "PUT") {
    await next();
    return;
  }
  const request = c.req.raw.clone();
  if (!c.env?.request) {
    c.env["request"] = {};
  }
  c.env.request["content"] = request.body
    ? await request
        .clone()
        .json()
        .catch(() => request.clone().formData())
        .catch(() => request.text())
    : undefined;
  await next();
});

export const withAuthInternal = createMiddleware(async (c, next) => {
  const request = c.req.raw;
  const env = c.env;
  const cookies = parse(request.headers.get("Cookie") || "");
  const { COOKIE_NAME } = env;
  const jwt = cookies?.[COOKIE_NAME];
  if (!jwt) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { sub, email, email_verified } = await verifyToken({ env, jwt });
  // unverified email, redirect to /confirm-email
  if (sub && email_verified !== true) {
    const response = new Response(null, { status: 302 });
    response.headers.set("X-Location", `/confirm-email`);
    return response;
  }
  // uid does not exist, return unauthorized
  if (!sub) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!c.env?.request) {
    c.env["request"] = {};
  }
  c.env.request["uid"] = sub;
  c.env.request["email"] = email;
  await next();
});

export const withAuthExternal = createMiddleware(async (c, next) => {
  const env = c.env;
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401 });
  };
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  };
  const { sub, email } = await verifyToken({ env, jwt: token });
  // uid does not exist, return unauthorized
  if (!sub) {
    return new Response("Unauthorized", { status: 401 });
  };
  if (!c.env?.request) {
    c.env["request"] = {};
  }
  c.env.request["uid"] = sub;
  c.env.request["email"] = email;
  /*
  if (data?.claims) {
    c.env.request["claims"] = data.claims;
  };
  */
  await next();
});

export const withAuthPublic = createMiddleware(async (c, next) => {
  const env = c.env;
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return new Response("Bad Request", { status: 400 });
  };
  // lookup token data
  const pk = "widget"; // TODO: use constant
  const { data } = await selectByKeysConditional({ env, pk, sk: token });
  if (!data?.origins || !data?.uid || !data?.email) {
    return new Response("Unauthorized", { status: 401 });
  };
  const request = c.req.raw.clone();
  const origin = request.headers.get("Origin");
  // verify request origin
  if (!data.origins.includes(origin)) {
    return new Response("Unauthorized", { status: 401 });
  };
  // set uid and email for downstream request handlers
  if (!c.env?.request) {
    c.env["request"] = {};
  };
  c.env.request["uid"] = data.uid;
  c.env.request["email"] = data.email;
  await next();
});

/*
// ABAC (claims) middleware
export const withAuthABAC = async (
export const withAuthABAC = createMiddleware(async (c, next) => {
  request: any,
  env: Env,
  ctx: any,
  acceptedClaims: Array<string>,
): Promise<Response | undefined> => {
  if (!acceptedClaims) {
    console.error('abacMiddlewareInternal/acceptedClaims not defined')
    return new Response('Server Error', { status: 500 })
  }
  const requestClaims = request['claims'] ?? []
  const hasPermission = requestClaims.some((claim: string) => acceptedClaims.includes(claim))
  if (!hasPermission) {
    return new Response('Forbidden', { status: 403 })
  }
}
*/
