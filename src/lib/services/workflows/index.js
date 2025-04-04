import JSON5 from "json5";
import { evalCode } from "@/services/parser/sandbox";
import { resolveArgs } from "@/services/parser/template";
import { isPotentialJSON } from "@/services/utils";
import { fetchText } from "@/services/helpers";

const runService = async ({ env, step, args }) => {
  const [_, serviceType, serviceId] = step.call.split(/[:#+]/);
  console.log("Service Type: ", serviceType);
  console.log("Service ID: ", serviceId);
  if (serviceType === 'ctx') {
    // TODO: lookup 
    const serviceWorkflow = {
      "name": "Smart Context 1",
      "next": "ctx1",
      "ctx1": {
          "name": "Testy Test",
          "call": "code:js",
          "args": {
              "data": "{{args.data}}",
              "env": "{{args.env}}",
              "code": `return([
                {"id":"01J82K0FEJFAA12ARG6V0CCYF5-01J82K0HQ0GK19E6HJX4F91QMY","score":0.61473459,"values":[],"metadata":{"file-name":"Quickstart.txt","language":"en"},"data":"# Quickstart\n\nThis documentation provides an overview and explanation of a Google Colab script. The script processes files, generates embeddings, and uploads them to a FaithCopilot server while supporting two vector storage providers: Pinecone and Upstash."}
              ])`
          },
          "result": "SMART_CONTEXT_1",
          "next": "End"
      },
      "End": {
          "return": "{{SMART_CONTEXT_1}}"
      }
    };
    //const result = await run(serviceWorkflow, context);
    //return result;
  };
  return {};
};

const runCallStep = async({ env, step, context }) => {
  const args = step?.args ? resolveArgs({ args: step.args, context }) : {};
  if (step.call === "vars") {
    return args;
  };
  if (step.call === "script") {
    return evalCode({ args, codeToEval: args.code });
  };
  if (step.call === "http") {
    return fetchText({ env, args });
  };
  if (step.call.startsWith("service:")) {
    return runService({ env, step, args });
  };
  return {};
};

export const run = async(env, workflow, context = {}) => {
  if (!workflow) {
    throw new Error('No workflow steps provided');
  };
  for (let ii=0; ii < workflow?.length; ii++) {
    const step = workflow[ii];
    let result = null;

    // handle any variable assignments
    if (step?.assign) {
      const assignments = step.assign?.[0];
      if (assignments) {
        for (const [key, value] of Object.entries(assignments)) {
          context[key] = resolveArgs({ args: value, context });
        };
      };
    };

    // handle the "call" directive
    if (step?.call) {
      result = await runCallStep({ env, step, context });
    };

    // check for EOS result, to end the workflow
    if (result == "<|EOS|>") {
      const role = "safety"; //"assistant";
      let content = "I am sorry, I am not able to help you with that."
      if (context?.["EOS_RESPONSE"]) {
        content = context["EOS_RESPONSE"];
      };
      // TODO: use official response format w/ token counts, etc...
      return { "choices": [ { "message": { role, content }}]};
    };
      
    // handle the "result" directive
    if (step?.result) {
      if (step.result === result) {
        throw new Error(`Unable to process step: ${step?.name ?? 'unknown'}`);
      };
      context[step.result] = result;
    };

    // handle the "return" directive
    if (step?.return !== undefined) {
      const returnValue = resolveArgs({ args: step.return, context });
      if (step.return === returnValue) {
        throw new Error(`Unable to process step: ${step?.name ?? 'unknown'}`);
      };
      if (isPotentialJSON(returnValue)) {
        return JSON5.parse(returnValue);
      };
      return returnValue;
    };
  };
  return context;
};