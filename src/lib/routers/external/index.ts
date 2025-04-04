import { Hono } from "hono";

import { withAuthExternal, withAuthPublic } from "@/routers/middleware";

import chatRouter from "./chat";
import dataRouter from "./data";
import indexesRouter from "./indexes";
import modelsRouter from "./models";
import searchRouter from "./search";
//import webhooksRouter from "./webhooks";
import widgetsRouter from "./widgets";

const router = new Hono();

//router.use(withAuthExternal);
/*
router.use("widgets", async(c, next) => {
  return new Response("Unauthorized", { status: 401 });
  await next();
});
*/
router.use("/chat/*", withAuthExternal);
router.use("/data/*", withAuthExternal);
router.use("/indexes/*", withAuthExternal);
router.use("/models/*", withAuthExternal);
router.use("/search/*", withAuthExternal);
//router.use("/webhooks/*", withAuthExternal);
router.use("/widgets/*", withAuthPublic);

router.route("chat", chatRouter);
router.route("data", dataRouter);
router.route("indexes", indexesRouter);
router.route("models", modelsRouter);
router.route("search", searchRouter);
//router.route("webhooks", webhooksRouter);
router.route("widgets", widgetsRouter);

export default router;
