import * as jose from "jose";

export const PROVIDER = "JOSE";

export const generateToken = async ({ env, oid, subject, claims, exp }) => {
  const encodedSecret = new TextEncoder().encode(env.JWT_SECRET);
  let payload = {};
  if (oid) {
    payload = { ...payload, oid };
  };
  if (claims) {
    payload = { ...payload, ...claims };
  };
  return new jose.SignJWT(payload)
    .setProtectedHeader({
      alg: "HS256",
      typ: "JWT",
    })
    .setIssuedAt()
    .setSubject(subject)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setExpirationTime(exp ?? env.JWT_EXPIRATION)
    .sign(encodedSecret);
};

/*
 * NOTE: this is trivial for now bc we are only supporting a single provider (Google),
 * but the assumption is that future provider "claims" mappings will go here
 */
export const parseToken = ({ token }) => jose.decodeJwt(token);

export const verifyToken = async ({ env, jwt }) => {
  const encodedSecret = new TextEncoder().encode(env.JWT_SECRET);
  const { payload } = await jose.jwtVerify(jwt, encodedSecret, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return payload;
};
