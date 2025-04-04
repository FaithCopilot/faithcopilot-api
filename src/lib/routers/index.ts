import { Hono } from "hono";

import externalRouter from "./external";
import internalRouter from "./internal";

export { withAuthInternal, withAuthExternal, withContent } from "./middleware";

export const router = new Hono();

router.route("/api/v1", externalRouter);
router.route("/v1", internalRouter);
