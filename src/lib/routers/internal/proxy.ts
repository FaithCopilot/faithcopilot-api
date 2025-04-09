import { Hono } from "hono";
import { withContent } from "@/routers/middleware";
import { handler } from "@/routers/helpers";
import { proxy } from "@/services/proxy";

const router = new Hono();
router.all("*", withContent, handler(proxy));
export default router;
