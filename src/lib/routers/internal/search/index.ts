import { Hono, Context } from "hono";

import { honoHandler } from "@/routers/helpers";

import profilesRouter from "./profiles";
//import sessionsRouter from "./sessions";

import { search } from "@/services/search/semantic";
import { isPotentialJSON } from "@/services/utils";

const router = new Hono();

router.route("/profiles", profilesRouter);
//router.route("/sessions", sessionsRouter);

router.get('/', async(c: Context) => {
  const { env, searchParams, oid, uid, tenid } = honoHandler(c);
  const profile = searchParams.get("profile");
  const q = searchParams.get("q");
  const topK = searchParams.get("topK");
  if (!profile || !q) {
    return new Response("Bad Request", { status: 400 });
  };
  const res = await search({ env, oid, uid, tenid, profile, q, topK });
  if (typeof res === "string") {
    if (isPotentialJSON(res)) {
      return new Response(res, { status: 200 });
    };
    return new Response(JSON.stringify([{ data: res }]), { status: 200 });
  };
  return new Response(JSON.stringify(res), { status: 200 });
});

export default router;