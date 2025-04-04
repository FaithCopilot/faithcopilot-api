import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";

import { honoHandler } from "@/routers/helpers";

import { chat } from "@/services/chat";
import { getDefaultContext } from "@/services/helpers";

const router = new Hono();

router.post('/chat/completions', withContent, async(c: Context) => {
  const { env, data, oid, uid, tenid } = honoHandler(c);
  if (!data?.model || !data?.messages) {
    return new Response("Bad Request", { status: 400 });
  };
  const context = await getDefaultContext({ env, oid, uid, tenid, data });
  const response = await chat({ env, context: context?.env, oid, uid, tenid, data });
  // clone the response to return a response with modifiable headers
  const newResponse = new Response(response.body, response);
  return newResponse;
});

export default router;