import { getMultiKeysByEntity } from "@/services/helpers";
import { selectByMultiKeys } from "@/services/db/dynamodb";
import { throwError } from "@/utils";

import { resolveTemplate } from "@/services/parser/template";

import { EntityConstants } from "@/constants";

const mapSpecialMessages = (message) => {
  if (
    message?.role !== "system" &&
    message?.role !== "user" &&
    message?.role !== "assistant"
  ) {
    return ({ ...message, role: "user" });
  };
  return message;
};

const safeParseNumber = (value, fn) => {
  const parsedValue = fn(value);
  return isNaN(parsedValue) ? undefined : parsedValue;
};

const parseParam = (params, key, fn) => {
  if (params?.[key]) {
    const parsedValue = safeParseNumber(params[key], fn);
    if (parsedValue) params[key] = parsedValue;
  };
  return params;
};

const filterParams = (params) => {
  const validParams = [
    "temperature",
    "top_p",
    "presence_penalty",
    "frequency_penalty",
    "max_tokens",
    "stop",
    "stream"
  ];
  return Object.keys(params).reduce((acc, key) => {
    if (validParams.includes(key)) {
      acc[key] = params[key];
    }
    return acc;
  }, {});
};

const parseParams = (params) => {
  let parsedParams = filterParams(params);
  parsedParams = parseParam(parsedParams, "temperature", parseFloat);
  parsedParams = parseParam(parsedParams, "top_p", parseFloat);
  parsedParams = parseParam(parsedParams, "presence_penalty", parseFloat);
  parsedParams = parseParam(parsedParams, "frequency_penalty", parseFloat);
  parsedParams = parseParam(parsedParams, "max_tokens", parseInt);
  if (parsedParams?.stop && Array.isArray(parsedParams.stop)) {
    parsedParams["stop"] = parsedParams.stop.filter(item => typeof item === "string");
  };
  parsedParams = parseParam(parsedParams, "stream", Boolean);
  return parsedParams;
};

const extractDataParams = (data) => {
  const { model, messages, ...params } = data;
  return params;
};

export const chat = async({ env, context, oid, uid, tenid, data }) => {
  // map any special messages to user role
  const parsedMessages = data.messages.map(mapSpecialMessages);
  const keys = getMultiKeysByEntity({ oid, uid, entity: EntityConstants.MODEL, sk: data.model });
  const { data: model } = await selectByMultiKeys({ env, keys });
  // TODO:
  //if (!model?.model || !model?.http?.url) {
  if (!model?.model) {
    throwError({
      name: "ConfigurationError",
      message: `Invalid model configuration: ${data.model}`
    });
  };
  // if no incoming system message AND model config has, then append it
  const idx = parsedMessages.findIndex(message => message.role === "system");
  if (idx < 0 && model?.systemMessage) {
    parsedMessages.unshift({ role: "system", content: model.systemMessage });
  };
  const dataParams = extractDataParams(data);
  const params = dataParams ?? model?.params ?? {};
  const parsedParams = parseParams(params);
  let url = model?.http?.url ?? model?.api?.baseURL + "/chat/completions";
  const apiKey = model?.api?.apiKey;
  const method = model?.http?.method ?? "POST";
  const headers = model?.http?.headers ?? {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  };
  const body = {
    model: model.model,
    messages: parsedMessages,
    ...parsedParams
  };
  // resolve any templates in the URL
  url = resolveTemplate({ template: url, context: { env: context }});
  // resolve any templates in the Headers
  for (const [key, value] of Object.entries(headers)) {
    headers[key] = resolveTemplate({ template: value, context: { env: context }});
  };
  /*
  // resolve any templates in the Params
  for (const [key, value] of Object.entries(parsedParams)) {
    parsedParams[key] = resolveTemplate({ template: value, context: { env: context }});
  };
  */
  /*
  const zzurl = "http://localhost:8080/v1/chat/completions";
  const zzbody = {
    ...body,
    model: "llama-2-7b-chat"
  };
  */
  // TODO: resolve any templates in the Body?
  const options = {
    method,
    headers,
    body: JSON.stringify(body) //zzbody)
  };
  //return fetch(zzurl, options);
  return fetch(url, options);
};