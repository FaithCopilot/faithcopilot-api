import { generateTsuid } from "@/services/uuid/ulid";

import { insert } from "@/services/db/dynamodb";

import { throwError, validateJSON } from "@/utils";

import { EntityConstants } from "@/constants";

export const registerIndex = async({ env, oid, uid, tenid, data }) => {
  const validation = validateJSON(data, {
    required: ["name","provider","url", "key"],
    optional: ["tags","namespace","params","public","did"]
  });
  if (!validation?.isValid) {
    throwError({
      name: "BadRequestError",
      cause: new Error(validation?.errors.join(", "))
    });
  };
  if (data?.public === true && data?.provider === "pinecone" && !data?.did) {
    throwError({
      name: "BadRequestError",
      cause: new Error("Missing Data ID")
    });
    // TODO: update DB for public request
  };
  // generate uuid
  const indexId = await generateTsuid();
  // default param values
  if (!data?.params) {
    data["params"] = {
      topK: 3,
      scoreThreshold: 0.5
    };
  };
  if (data.namespace && data.provider === "upstash") {
    if (!data.url?.endsWith(`query/${data.namespace}`)) {
      if (data.url.endsWith('/')) {
        data["url"] = `${data.url}${data.namespace}`
      } else {
        data["url"] = `${data.url}/${data.namespace}`;
      };
    };
  };
  let headers = {
    "Content-Type": "application/json",
  };
  if (data.provider === "pinecone") {
    headers = {
      ...headers,
      "Api-Key": data.key,
      "X-Pinecone-API-Version": "2024-07"
    };
  } else if (data.provider === "upstash") {
    headers = {
      ...headers,
      "Authorization": `Bearer ${data.key}`
    };
  } else;
  data["request"] = {
    url: data.url,
    method: "POST",
    headers
  };
  // TODO: constant for "type" value
  const values = { data: JSON.stringify({
    id: indexId,
    type: "index/v1", // index/vec/v1, index/doc/v1
    createdAt: new Date().toISOString(),
    createdBy: uid,
    ...data
  })}
  // TODO: have a helper: getPK
  const pk = `${uid}#${EntityConstants.INDEX}`;
  await insert({ env, pk, sk: indexId, values });
  return indexId;
};