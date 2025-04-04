import { generateTsuid } from "@/services/uuid/ulid";

import { generateToken, parseToken } from "@/services/crypto";

import { selectIdentity, insertTx } from "@/services/db/dynamodb";

import { getUserPK } from "@/services/db/entities";

import {
  EntityConstants,
  GrantTypeConstants,
  LocationConstants,
  SchemaConstants,
} from "@/constants";

// auth flow
export const getNextLocation = ({ currentLocation, userData }) => {
  if (currentLocation === LocationConstants.LOGIN) {
    return LocationConstants.HOME;
  }
  return LocationConstants.LOGIN;
};

const handleSignup = async ({ request, env, email, email_verified, password, provider }) => {
  const oid = await generateTsuid();
  const uid = await generateTsuid();
  // email data
  const emailData = {
    schema: SchemaConstants.Email.V1,
    oid,
    uid,
  };
  if (email_verified) {
    emailData["email_verified"] = email_verified;
  }
  if (provider) {
    emailData["provider"] = provider;
  }
  if (password) {
    const { hash: hashedPassword } = await hashPassword({ env, password });
    emailData["hashedPassword"] = hashedPassword;
  }
  // user data
  const userPK = getUserPK({ id: uid });
  const userData = {
    schema: SchemaConstants.User.V1,
    email,
    oid,
    plan: "free",  // TODO: constant
    status: "active", // TODO: constant
  };
  const orgPK = `org#${oid}`; // getOrgPK({ id: oid });
  // new account tx:
  const txValues = [
    {
      pk: EntityConstants.EMAIL,
      sk: `${new Date().toISOString()}#${email}`,
    },
    {
      pk: email,
      sk: email,
      data: JSON.stringify(emailData),
    },
    {
      pk: userPK,
      sk: userPK,
      data: JSON.stringify(userData),
    },
    {
      pk: orgPK,
      sk: userPK,
    },
    {
      pk: userPK,
      sk: orgPK,
    }
  ];
  await insertTx({ env, values: txValues });
  // include email in JWT claims
  const claims = {
    email,
    email_verified,
  };
  // authenticate user and respond with next location
  return authenticatedResponse({ env, oid, subject: uid, claims, userData: emailData });
};

export const signup = async (request, env) => {
  const { email, password } = env?.request?.content;
  if (!email || !password) {
    return new Response("Bad request", { status: 400 });
  }
  return handleSignup({ request, env, email, password });
};

/*
export const parseHardcodedUser = async({ email }) => {
  try {
    // conditional import - astro js
    const usersData = (await import("functions/_data/users.json")).default;
    return usersData?.[email];
  } catch (err) {
    console.warn("Error loading 'data/users.json': ", err);
    return err;
  };
};
*/

export const isValidConfig = ({ env }) =>
  env?.JWT_SECRET &&
  env?.JWT_ISSUER &&
  env?.JWT_AUDIENCE &&
  env?.JWT_EXPIRATION &&
  env?.COOKIE_NAME &&
  env?.COOKIE_DOMAIN &&
  env?.COOKIE_MAX_AGE;

export const getEmailByUid = async ({ env, uid }) => {
  const userPK = getUserPK({ id: uid });
  const res = await selectIdentity({ env, pk: userPK });
  return res?.data;
};

export const getUserDataByEmail = async ({ env, email }) => {
  const res = await selectIdentity({ env, pk: email });
  return res?.data;
};

const authenticatedResponse = async ({ env, oid, subject, claims, userData }) => {
  if (!claims) claims = {};
  const jwt = await generateToken({ env, oid, subject, claims });
  if (!jwt) {
    return new Response("Unauthorized", { status: 401 });
  };
  const bearerToken = {
    access_token: jwt,
    token_type: "Bearer",
    expires_in: env.JWT_EXPIRATION,
    //scope: "create",
    //state: "xyz"
  };
  // respond with next location
  // TODO: do not include JWT in response body
  const response = new Response(JSON.stringify(bearerToken), { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Content-Type", "application/json");
  response.headers.set(
    "Set-Cookie",
    `${env.COOKIE_NAME}=${jwt}; Path=/; SameSite=None; Secure; Domain=${env.COOKIE_DOMAIN}; Max-Age=${env.COOKIE_MAX_AGE}`,
  );
  const nextLocation = getNextLocation({
    env,
    currentLocation: LocationConstants.LOGIN,
    userData,
  });
  if (nextLocation) {
    response.headers.set("X-Location", nextLocation);
  }
  return response;
};

const handleGrantTypePassword = async ({ env, data }) => {
  const { email, password } = data;
  if (!email || !password) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userData = await getUserDataByEmail({ env, email });
  //if (!userData?.oid || !userData?.uid || !userData?.hashedPassword) {
  if (!userData?.uid || !userData?.hashedPassword) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { oid, uid, hashedPassword } = userData;
  const { matches } = await comparePassword({ env, password, hashedPassword });
  if (matches !== true) {
    return new Response("Unauthorized", { status: 401 });
  }
  // include email in JWT claims
  const claims = {
    email,
    email_verified: userData?.email_verified ?? false,
  };
  // authenticate user and respond with next location
  return authenticatedResponse({ env, oid, subject: uid, claims, userData });
};

const handleGrantTypeTokenExchange = async ({ request, env, data, provider }) => {
  if (!data?.token) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { email, email_verified } = await parseToken({ token: data.token });
  if (!email) {
    return new Response("Unauthorized", { status: 401 });
  }
  // check hardcoded list, if enabled
  if (env?.ENABLE_HARDCODED_USERS === true) {
    const emailAllowlist = env?.HARDCODED_USERS ?? [];
    if (!emailAllowlist.includes(email)) {
      return new Response("Unauthorized", { status: 401 });
    }
  }
  let userData = null;
  // TODO: re-enable?
  // check hardcoded list, if enabled
  //if (env?.ENABLE_HARDCODED_USERS === true) {
  //  userData = await parseHardcodedUser({ email });
  //} else {
  userData = await getUserDataByEmail({ env, email });
  //};
  //if (!userData?.oid || !userData?.uid) {
  if (!userData?.uid) {
    return handleSignup({ request, env, email, email_verified, provider });
  };
  const { oid, uid } = userData;
  // include email in JWT claims
  const claims = {
    email,
    email_verified,
  };
  // authenticate user and respond with next location
  return authenticatedResponse({ env, oid, subject: uid, claims, userData });
};

export const token = async (request, env) => {
  const { searchParams } = new URL(request?.url);
  const grantType = searchParams.get("grant_type");
  const provider = searchParams.get("provider");
  if (!isValidConfig({ env }) || !grantType) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = env?.request?.content;
  if (grantType === GrantTypeConstants.PASSWORD) {
    return handleGrantTypePassword({ env, data });
  }
  if (grantType === GrantTypeConstants.TOKEN_EXCHANGE) {
    return handleGrantTypeTokenExchange({ request, env, data, provider });
  }
  return new Response("Unauthorized", { status: 401 });
};

export const logout = async (request, env) => {
  // only use temporary redirect (to ensure request made and cookie deleted)
  const response = new Response(null, { status: 307 });
  response.headers.set("X-Location", `/login`);
  response.headers.set(
    "Set-Cookie",
    `${env.COOKIE_NAME}=; Path=/; SameSite=None; Secure; Domain=${env.COOKIE_DOMAIN}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`,
  );
  return response;
};
