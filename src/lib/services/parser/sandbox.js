import JSON5 from "json5";
import { deepParseJSON, isPotentialJSON } from "@/services/utils";

import sandboxModule from "@nyariv/sandboxjs";
const Sandbox = sandboxModule.default || sandboxModule;
const sandbox = new Sandbox();

// TODO: should be a package since it is also used by nualua-app
// TODO: various test cases around this for different types of input and code
export const parse = async (input, codeToEval) => {
  if (typeof input === "string") {
    if (input?.includes("'")) {
      input = input.replaceAll("'", "%27");
    }
    // attempt to parse as JSON object (in case it is), else parse as string
    try {
      input = JSON.parse(input);
    } catch (error) {
      // ignore
    }
  }
  if (typeof codeToEval !== "string") {
    codeToEval = JSON.stringify(codeToEval);
  }
  const exec = sandbox.compile(codeToEval);
  // TODO: rename "text" to "input" in code and here!
  const output = await exec({ text: input })?.run();
  if (typeof output === "string") {
    if (output?.includes("%27")) {
      return output.replaceAll("%27", "'");
    }
  }
  return output;
};

const sanitizeJSON = (str) => str.replace(/\\n/g, "<br/>");

const parseArgs = (args) => {
  // for each key in args, check if it is a string and isPotentiallyJSON and parse
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && isPotentialJSON(value)) {
      try {
        args[key] = JSON5.parse(sanitizeJSON(value));
      } catch (error) {
        // ignore
        console.error("evalCode: JSON parse error: ", error);
      };
    };
  };
  return args;
};

export const evalCode = async ({ args, codeToEval }) => {
  args = parseArgs(args);
  const exec = sandbox.compile(codeToEval);
  const output = await exec({ args })?.run();
  return output;
};