import { Hono } from "hono";

import { withAuthInternal } from "@/routers/middleware";

import accountRouter from "./account";
import authRouter from "./auth";
import accessRouter from "./access";
import chatRouter from "./chat";
import dataRouter from "./data";
import indexesRouter from "./indexes";
import modelsRouter from "./models";
import searchRouter from "./search";

const router = new Hono();

router.use("account", withAuthInternal);
router.use("access", withAuthInternal);
router.use("chat", withAuthInternal);
router.use("data", withAuthInternal);
router.use("indexes", withAuthInternal);
router.use("models", withAuthInternal);
router.use("search", withAuthInternal);

router.route("auth", authRouter);
router.route("account", accountRouter);
router.route("access", accessRouter);
router.route("chat", chatRouter);
router.route("data", dataRouter);
router.route("indexes", indexesRouter);
router.route("models", modelsRouter);
router.route("search", searchRouter);

export default router;
