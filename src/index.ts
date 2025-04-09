import { Hono, Context } from "hono";
import { cors } from "hono/cors";
//import { getRouterName, showRoutes } from "hono/dev";

import internalRouter from "./lib/routers/internal";
import externalRouter from "./lib/routers/external";

const router = new Hono();

router.onError((err, c) => {
  console.error(err?.cause ?? err);
  let statusCode = 500;
  let statusMessage = "Internal Server Error";
  switch(err?.name) {
    case "BadRequestError":
      statusCode = 400;
      statusMessage = "Bad Request";
      break;
    case "JWTExpired":
    case "JWSInvalid":
    case "JWTClaimValidationFailed":
    case "JWSSignatureVerificationFailed":
    case "JWTMalformed":
    case "UnauthorizedError":
      statusCode = 401;
      statusMessage = "Unauthorized";
      break;
    case "NotFoundError":
      statusCode = 404;
      statusMessage = "Not Found";
      break;
    case "NotImplementedError":
    default:
      statusCode = 500;
      statusMessage = "Internal Server Error";
  };
  switch(err?.message) {
    case "400":
      statusCode = 400;
      statusMessage = "Bad Request";
      break;
    case "401":
      statusCode = 401;
      statusMessage = "Unauthorized";
      break;
    case "404":
      statusCode = 404;
      statusMessage = "Not Found";
      break;
    default:
      // inherits 500 from above
  };
  return new Response(statusMessage, { status: statusCode });
  //return new Response(err?.message ?? statusMessage, { status: statusCode });
  //return c.text(err?.message ?? statusMessage, statusCode)
});

/*
//router.use(logger());
router.use(async function logger(c, next) {
  await next()
  c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
    const name =
      handler.name ||
      (handler.length < 2 ? '[handler]' : '[middleware]')
    console.log(
      method,
      ' ',
      path,
      ' '.repeat(Math.max(10 - path.length, 0)),
      name,
      i === c.req.routeIndex ? '<- respond from here' : ''
    )
  })
});
*/

router.use(
  cors({
    origin: (origin, c) => {
      const env = c.env;
      if (!origin || !env?.ORIGIN) {
        return '*';
      };
      const request = c.req.raw;
      const url = new URL(request.url);
      const path = url.pathname;
      if (path?.startsWith("/api")) {
        return '*';
      };
      /*
      // TODO: check origin per env
      //if (env.ENVIRONMENT === "dev") {
      if (origin === env.ORIGIN) {
        return origin;
      };
      */
      if (env?.ORIGIN?.includes(origin)) {
        return origin;
      };
      return env.ORIGIN;
    },
    /*
    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials

    The Access-Control-Allow-Credentials response header tells browsers whether the server allows cross-origin HTTP requests to include credentials.
    Credentials are cookies, TLS client certificates, or authentication headers containing a username and password. By default, these credentials are not sent in cross-origin requests, and doing so can make a site vulnerable to CSRF attacks.

    fetch('https://example.com', { credentials: 'include' })
    */
    credentials: true,
    // TODO: test which of these may be removed
    allowHeaders: [ "X-Location", "Set-Cookie", "Cookie", "Authorization", "Content-Type", "Origin", "Accept" ],
    exposeHeaders: [ "X-Location" ]
  })
);

router.route("/api/v1", externalRouter);
router.route("/v1", internalRouter);
router.all('*', () => new Response("Bad Request", { status: 400 }));

/*
console.log(getRouterName(router));
showRoutes(router, {
  verbose: true,
});
*/

export default router;
