import { Hono, Context } from "hono";

import { honoHandler } from "@/routers/helpers";

import profilesRouter from "./profiles";
//import sessionsRouter from "./sessions";

import { search } from "@/services/search/semantic";
import { isPotentialJSON } from "@/services/utils";

const router = new Hono();

router.route("/profiles", profilesRouter);
//router.route("/sessions", sessionsRouter);

const deepJsonParse = (input) => {
  // Handle null or undefined
  if (input === null || input === undefined) {
    return input;
  }

  // If input is a string, attempt to parse as JSON
  if (typeof input === 'string') {
    // First, attempt to unescape any escaped JSON string
    const unescapedInput = input.replace(/\\"/g, '"');
    
    try {
      // Try parsing the unescaped string
      const parsed = JSON.parse(unescapedInput);
      // Recursively parse the result
      return deepJsonParse(parsed);
    } catch (error) {
      // If parsing fails, return the original string
      return input;
    }
  }

  // If input is an array, map each element
  if (Array.isArray(input)) {
    return input.map(deepJsonParse);
  }

  // If input is an object, recursively parse each value
  if (typeof input === 'object' && input !== null) {
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = deepJsonParse(value);
    }
    return result;
  }

  // For primitive types, return as-is
  return input;
};

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
  /*
  // if res is an array of objects as strings, parse them
  if (Array.isArray(res) && res.every((item) => typeof item === "string")) {
    //console.log("*** YES DETECTED 2")
  } else {
    //console.log("*** NO NOT DETECTED 2")
  }
  */
  return new Response(JSON.stringify(res), { status: 200 });
});

export default router;
