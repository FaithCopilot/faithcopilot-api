//import { ms } from "itty-time";

import {
  selectIdentity,
  selectByPKSKBeginsWithConditional,
  insertIdentity,
  updateIdentity,
  deleteIdentity,
  insertTx,
  deleteTx,
  selectByKeysConditional,
  selectMultipleRecords,
} from "../../services/db/dynamodb";

//import { getEvents } from "../../services/db/redis";

import { getUserPK, getKeyPK } from "../../services/db/entities";

import { generateTsuid } from "../../services/uuid/ulid";

import { generateDefaultExpirationDate, generateRandomString } from "../../utils";

import { EntityConstants } from "../../constants";

export const getAccount = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  const userPK = getUserPK({ id: uid });
  const res = await selectIdentity({ env, pk: userPK });
  const data = res?.data ?? {};
  return new Response(JSON.stringify(data), { status: 200 });
};

export const updateAccount = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  // TODO: validate "v1/account" schema
  const body = env.request?.content;
  const userPK = getUserPK({ id: uid });
  await updateIdentity({ env, pk: userPK, values: body });
  return new Response(null, { status: 204 });
};

export const deleteAccount = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  //const uid = env.request.uid;
  //const userPK = getUserPK({ id: uid });
  // TODO: delete all user data
  //await deleteIdentity({ env, pk: userPK });
  return new Response(null, { status: 204 });
};

export const createAPIKey = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  const body = env.request?.content;
  const label = body?.label ?? "API Key";
  const iss = body?.iss ?? new Date().toISOString();
  const exp = body?.exp ?? generateDefaultExpirationDate().toISOString();
  const claims = body?.claims ?? [];
  const userPK = getUserPK({ id: uid });
  const secretKey = `sk-${generateRandomString(64)}`;
  const kid = await generateTsuid();
  const keyPK = getKeyPK({ key: kid });
  const txValues = [
    {
      pk: secretKey,
      sk: secretKey,
      data: JSON.stringify({ uid, kid, label, iss, exp, claims }),
    },
    {
      pk: userPK,
      sk: keyPK,
      data: JSON.stringify({ secretKey, label, iss, exp, claims }),
    },
  ];
  await insertTx({ env, values: txValues });
  return new Response(JSON.stringify({ key: secretKey }), { status: 201 });
};

// DELETE /v1/account/developers/api-keys/123xyz...
export const deleteAPIKey = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  const { params } = request;
  if (!params?.id) {
    return new Response("Bad Request", { status: 400 });
  }
  const kid = params.id;
  const userPK = getUserPK({ id: uid });
  const keyPK = getKeyPK({ key: kid });
  const res = await selectByKeysConditional({ env, pk: userPK, sk: keyPK });
  if (!res?.data?.secretKey) {
    return new Response("Not Found", { status: 404 });
  }
  const secretKey = res.data.secretKey;
  const keys = [
    { pk: secretKey, sk: secretKey },
    { pk: userPK, sk: keyPK },
  ];
  await deleteTx({ env, keys });
  return new Response(null, { status: 204 });
};

export const readAPIKeys = async (request, env) => {
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  const pk = getUserPK({ id: uid });
  const skBeginsWith = `${EntityConstants.KEY}#`;
  const items = await selectByPKSKBeginsWithConditional({ env, pk, skBeginsWith });
  const res = items?.map((item) => {
    let secretKey = item.data?.secretKey;
    if (!secretKey) {
      secretKey = "sk-1234567890";
    }
    const secretKeyP = secretKey.substring(0, 2) + "-***" + secretKey.substring(secretKey.length - 4);
    const kid = item.sk.split("#")[1];
    return {
      id: kid,
      sk: secretKeyP,
      label: item.data.label,
      scope: item.data.claims,
      iss: item.data.iss,
      exp: item.data.exp,
    };
  });
  return new Response(JSON.stringify(res), { status: 200 });
};

export const mapDateRangeToNumberedDays = ({ dateRange, occurrenceList }) => {
  const { start, end } = dateRange;
  if (!start || !end) {
    return [];
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  const daysInRange = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const result = [];
  for (let ii = 0; ii < daysInRange; ii++) {
    const currentDate = new Date(startDate.getTime() + ii * 24 * 60 * 60 * 1000);
    const formattedDate = currentDate.toISOString().slice(0, 10);
    let valuesForDay;
    if (typeof occurrenceList?.[0] === "string") {
      // occurrenceList contains only timestamp strings
      valuesForDay = occurrenceList.filter((timestamp) => timestamp.startsWith(formattedDate)).length;
    } else {
      // occurrenceList contains objects with 'ts' (timestamp) and 'value' props
      valuesForDay = occurrenceList.reduce((sum, entry) => {
        const entryDate = new Date(entry.ts).toISOString().slice(0, 10);
        if (entryDate === formattedDate) {
          return sum + 1; //entry.value;
        }
        return sum;
      }, 0);
    }
    result.push({ day: ii + 1, value: valuesForDay });
  }
  return result;
};

// TODO: move to utils
// NOTE: order is not relevant
export const findCommonStrings = ({ list1, list2 }) => {
  const commonStrings = [];
  for (const str1 of list1) {
    if (list2.includes(str1) && !commonStrings.includes(str1)) {
      commonStrings.push(str1);
    }
  }
  return commonStrings;
};

export const mapMetricData = ({ metric, ts, data }) => {
  if (!ts) return null;
  if (metric === "tokens") {
    if (!data?.tokens) return null;
    return { ts, value: data.tokens };
  }
  return null;
};

// TODO: move to utils
// YYYY-MM-DD
const formatDate = (date) => {
  let month = "" + (date.getMonth() + 1);
  let day = "" + date.getDate();
  const year = date.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
};

export const getAnalytics = async (request, env) => {
  // TODO: use constant
  const availableMetrics = ["api_request", "tokens", "session_start", "signup"];
  if (!env?.request?.uid) {
    return new Response("Unauthorized", { status: 401 });
  }
  const uid = env.request.uid;
  const { searchParams } = new URL(request?.url);
  let start = searchParams.get("start");
  let end = searchParams.get("end");
  const metrics = searchParams.get("metrics");
  if (!start || !end || !metrics) {
    return new Response("Bad Request", { status: 400 });
  }
  const res = {};
  // TODO:
  start = new Date(formatDate(new Date(start))).getTime();
  end = new Date(formatDate(new Date(end))).getTime();
  //start = new Date(formatDate(new Date(ms(start))) + "T00:00:00.000Z").getTime();
  //end = new Date(formatDate(new Date(ms(end))) + "T23:59:59.999Z").getTime();
  const commonMetrics = findCommonStrings({ list1: metrics.split(","), list2: availableMetrics });
  if (commonMetrics.length === 0) {
    return new Response("Bad Request", { status: 400 });
  }
  //const events = await getEvents({ env, uid, start, end });
  const events = []; // TODO
  for (const metric of commonMetrics) {
    const filteredEvents = events.filter((event) => event?.key?.includes(metric));
    const mappedEvents = filteredEvents.map((event) => ({
      metric,
      ts: event?.ts,
    }));
    res[metric] = mapDateRangeToNumberedDays({ dateRange: { start, end }, occurrenceList: mappedEvents });
  }
  /*
    const stmt = `SELECT * FROM "${env.AWS_DYNAMODB_TABLE}"."event-idx" WHERE event='${metric}' AND sk BETWEEN '${start}' AND '${end}'`;
    const items = await selectMultipleRecords({ env, stmt });
    //res[metric] = items?.data;
    const mappedItems = items?.map(item => {
      if (item?.data) {
        return mapMetricData({
          metric,
          ts: item?.sk,
          data: item.data
        });
      };
      return item?.sk ?? null;
    })?.filter(nn => nn) ?? [];
    res[metric] = mapDateRangeToNumberedDays({ dateRange: { start, end }, occurrenceList: mappedItems });
  };
  */
  return new Response(JSON.stringify(res), { status: 200 });
};
