import { Hono } from "hono";
import { withContent } from "@/routers/middleware";
import { handler } from "@/routers/helpers";

import {
  getAnalytics,
  getAccount,
  updateAccount,
  deleteAccount,
  readAPIKeys,
  createAPIKey,
  deleteAPIKey
} from "@/services/account";

const router = new Hono();

router.get("analytics", handler(getAnalytics));
router.get("api-keys", handler(readAPIKeys));
router.post("api-keys", withContent, handler(createAPIKey));
router.delete("api-keys/:id", handler(deleteAPIKey));
router.get("/", handler(getAccount));
router.put("/", withContent, handler(updateAccount));
router.delete("/", handler(deleteAccount));

export default router;
