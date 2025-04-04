import { Hono } from "hono";
import { withContent } from "@/routers/middleware";
import { handler } from "@/routers/helpers";

import {
  token,
  signup,
  logout,
} from "@/services/auth";

const router = new Hono();

router.post("token", withContent, handler(token));
router.post("signup", withContent, handler(signup));
router.get("logout", handler(logout));

export default router;
