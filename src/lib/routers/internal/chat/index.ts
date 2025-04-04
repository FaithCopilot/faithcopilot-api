import { Hono, Context } from "hono";

import { withContent, withAuthInternal } from "@/routers/middleware";

import { honoHandler } from "@/routers/helpers";

import { throwError } from "@/utils";

import { selectBatch } from "@/services/db/dynamodb";
import { chat } from "@/services/chat";
import { run } from "@/services/workflows";
import { isPotentialJSON } from "@/services/utils";
import { getDefaultContext } from "@/services/helpers";

import { PUBLIC_ID, EntityConstants } from "@/constants";

import appsRouter from "./apps";
import profilesRouter from "./profiles";

const router = new Hono();

router.use("apps", withAuthInternal);
router.use("profiles", withAuthInternal);

router.route("/apps", appsRouter);
router.route("/profiles", profilesRouter);


// Helper function to convert data to stream
function toReadableStream(data: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(data));
      controller.close();
    }
  });
}

// Modified run function with streaming
const streamResponse = async function*(env: any, workflow: any, context: any) {
  const response = await run(env, workflow, context);
  
  // If response is a string, yield chunks
  if (typeof response === 'string') {
    const chunkSize = 100; // Adjust chunk size as needed
    for (let i = 0; i < response.length; i += chunkSize) {
      const chunk = response.slice(i, i + chunkSize);
      yield chunk;
    }
  } else {
    // Handle object responses by converting eo JSON
    yield JSON.stringify(response);
  };
};

/*
router.get('/:id', handler(proxyPartial));
router.get('/', handler(proxyPartial));
*/

const classifyResult = (result: any) => {
  const isPublic = result?.pk?.includes(EntityConstants.PUBLIC_ID);
  const isProfile = result?.pk?.includes(EntityConstants.PROFILE_CHAT);
  const isModel = result?.pk?.includes(EntityConstants.MODEL);
  return { isPublic, isProfile, isModel };
};

router.post('/completions', withContent, async(c: Context) => {
  const { request, env, data, oid, uid, tenid } = honoHandler(c);
  if (!data?.model || !data?.messages) {
    return new Response("Bad Request", { status: 400 });
  };
  const origin = request.headers.get("Origin");
  const ip = request.headers.get("CF-Connecting-IP");
  const ip6 = request.headers.get("CF-Connecting-IPv6");
  const ua = request.headers.get("User-Agent");
  const country = request.headers.get("CF-IPCountry");
  const pkProfile = `${oid ?? uid}#${EntityConstants.PROFILE_CHAT}`;
  const pkPubProfile = `${PUBLIC_ID}#${EntityConstants.PROFILE_CHAT}`;
  const pkModel = `${oid ?? uid}#${EntityConstants.MODEL}`;
  const pkPubModel = `${PUBLIC_ID}#${EntityConstants.MODEL}`;
  const sk = data?.model;
  const keys = [
    { pk: pkProfile, sk },
    { pk: pkPubProfile, sk },
    { pk: pkModel, sk },
    { pk: pkPubModel, sk }
  ];
  // filter any duplicates
  const uniqueKeys = keys.filter((item, index, self) => 
    index === self.findIndex((t) => (
      t?.pk === item?.pk && t?.sk === item?.sk
    ))
  );
  const batchRes = await selectBatch({ env, keys: uniqueKeys });
  const foundRes = batchRes?.find((item: any) => item?.pk);
  if (!foundRes?.data) {
    throwError({
      name: "NotFoundError",
      message: "Chat Profile or Model not found",
    });
  };
  const context = await getDefaultContext({ env, oid, uid, tenid, data });
  context["request"] = { origin, ip, ip6, ua, country };
  const { isPublic, isProfile, isModel } = classifyResult(foundRes);
  if (isModel) {
    const response = await chat({ env, context: context?.env, oid, uid, tenid, data });
    // clone the response to return a response with modifiable headers
    const newResponse = new Response(response.body, response);
    return newResponse;
  };
  const steps = foundRes.data?.steps ?? [];
  const response = await run(env, steps, context);
  // TODO: handle edge cases?
  if (typeof response === "string") {
    if (isPotentialJSON(response)) {
      return new Response(response, { status: 200 });
    };
    throwError({
      name: "Server Error",
      message: "Something went wrong. Please check your configurations and try again.",
    });
  };
  return new Response(JSON.stringify(response), { status: 200 });
  //const stream = streamResponse(workflow, initialContext);
  return new Response(
    //toReadableStream(JSON.stringify(stream)), {
    toReadableStream(response), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
  /*
  const response = await chat({ env, oid, uid, tenid, data });
  // clone the response to return a response with modifiable headers
  const newResponse = new Response(response.body, response);
  return newResponse;
  */
});

export default router;
