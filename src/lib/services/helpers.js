import {
  selectBatch,
  selectByKeysConditional,
  selectByPK,
  insertByKeys,
  updateByKeys,
  deleteByKeys,
} from "@/services/db";

import { generateTsuid } from "@/services/uuid/ulid";

import { throwError } from "@/utils";

import { PUBLIC_ID, BrandConstants, EntityConstants } from "@/constants";

// use 'oid', if present, otherwise fall back to 'uid'
// combine with 'tenid', if present
export const getId = ({ oid, uid, tenid }) => {
  if (oid) {
    return tenid ? `${oid}#${tenid}` : oid;
  };
  return tenid ? `${uid}#${tenid}` : uid;
};

export const getPK = ({ id, entity }) => `${id}#${entity}`;

export const getSK = ({ eid }) => {
  if (eid?.includes("-")) {
    return eid.split("-")[0];
  };
  return eid;
};

export const getKeys = ({ oid, uid, tenid, entity, eid }) => {
  const id = getId({ oid, uid, tenid });
  const pk = getPK({ id, entity });
  const sk = getSK({ eid });
  return { pk, sk };
};

const removeDuplicateKeys = (array) => {
  return array.filter((item, index, self) =>
    index === self.findIndex((t) => 
      t.pk === item.pk && t.sk === item.sk
    )
  );
};

const isValidPublic = ({ id, entity, pub }) => {
  // if any of these are undefined, return false
  if (!id || !entity || !pub) return false;
  // if pub is not explicitly set to true, return false
  if (pub !== true) return false;
  // public data is always displayed?
  if (entity === EntityConstants.DATA) return true;
  // if the FC sysuser, return false (to prevent dupes)
  if (id === PUBLIC_ID) return false;
  // default to "pub" param 
  return pub === true;
};

const listEntitiesByIds = async({ env, oid, uid, tenid, entity, pub, ids }) => {
  const id = getId({ oid, uid, tenid });
  const pk = getPK({ id, entity });
  let keys = ids.map(id => {
    if (id?.includes("-") && entity === EntityConstants.DATA) {
      const sk = id.split("-")?.[0];
      if (!sk) return null;
      //return { pk, sk };
      // TODO:
      return { pk: `${PUBLIC_ID}#data`, sk };
    };
    return { pk, sk: id };
  }).filter(Boolean);
  keys = removeDuplicateKeys(keys);
  const batchRes = await selectBatch({ env, keys });
  const entities = batchRes?.map?.(item => item?.data);
  return entities?.filter(Boolean) ?? [];
};

export const listEntities = async({ env, oid, uid, tenid, entity, pub, ids }) => {
  if (ids?.length > 0) {
    return listEntitiesByIds({ env, oid, uid, tenid, entity, pub, ids });
  };
  const id = getId({ oid, uid, tenid });
  const pk = getPK({ id, entity });
  const res = await selectByPK({ env, pk });
  let entities = res?.map?.(item => item?.data) ?? [];
  if (isValidPublic({ id, entity, pub })) {
    const pubPK = `${PUBLIC_ID}#${entity}`;
    const pubRes = await selectByPK({ env, pk: pubPK });
    const pubEntities = pubRes?.map?.(item => item?.data) ?? [];
    entities = [...entities, ...pubEntities];
  };
  // remove any duplicates by id
  entities = entities.reduce((acc, entity) => {
    const id = entity?.id;
    if (!id) return acc;
    if (acc.find(item => item.id === id)) return acc;
    acc.push(entity);
    return acc;
  }, []);
  // TODO: merge with above list operation
  return entities?.filter(Boolean);
};

export const readEntityById = async({ env, oid, uid, tenid, entity, eid }) => {
  const id = getId({ oid, uid, tenid });
  const pk = getPK({ id, entity });
  const sk = getSK({ eid });
  const res = await selectByKeysConditional({ env, pk, sk });
  let data = res?.data;
  // TODO: is this correct? always check for public data if not found?
  if (!data && isValidPublic({ id, entity, pub: true })) {
    const pubPK = `${PUBLIC_ID}#${entity}`;
    const pubRes = await selectByKeysConditional({ env, pk: pubPK, sk });
    data = pubRes?.data;
    if (!data) {
      throwError({
        name: "NotFoundError",
        cause: new Error(`${entity} id: ${eid} not found`)
      });
    };
  };
  return data;
};

export const getEntityById = async({ env, oid, uid, tenid, entity, eid }) => readEntityById({ env, oid, uid, tenid, entity, eid });

const setCreated = ({ data, id, email }) => {
  if (!data?.createdAt) {
    data["createdAt"] = new Date().toISOString();
  };
  if (!data?.createdBy) {
    data["createdBy"] = {
      id,
      name: id === PUBLIC_ID ? BrandConstants.USERNAME : email,
      verified: id === PUBLIC_ID
    };
  };
  return data;
};

export const createEntity = async({ env, email, oid, uid, tenid, entity, data }) => {
  const id = getId({ oid, uid, tenid });
  const eid = await generateTsuid();
  const { pk, sk } = getKeys({ oid, uid, tenid, entity, eid });
  data = setCreated({ data, id, email });
  const values = { data: { id: eid, ...data }};
  await insertByKeys({ env, pk, sk, values });
  return { id: eid };
};

export const updateEntityById = async({ env, email, oid, uid, tenid, entity, eid, data }) => {
  const id = getId({ oid, uid, tenid });
  const { pk, sk } = getKeys({ oid, uid, tenid, entity, eid });
  data = setCreated({ data, id, email });
  // TODO: validate data per type/schema
  // if missing, then lookup data and merge updates
  return updateByKeys({ env, pk, sk, values: data });
};

export const deleteEntityById = async({ env, oid, uid, tenid, entity, eid }) => {
  const { pk, sk } = getKeys({ oid, uid, tenid, entity, eid });
  return deleteByKeys({ env, pk, sk });
};

export const getEnvContext = async({ env, oid, uid, tenid }) => {
  const entity = EntityConstants.ENV;
  const entities = await listEntities({ env, oid, uid, tenid, entity, pub: true });
  if (!entities) return {};
  const envContext = entities.reduce((acc, envVar) => {
    acc[envVar.key] = envVar.value;
    return acc;
  }, {});
  return envContext;
};

export const getDefaultContext = async({ env, oid, uid, tenid, data }) => {
  const _env = await getEnvContext({ env, oid, uid, tenid });
  const context = {
    data,
    env: _env
  };
  return context;
};

export const getMultiKeysByEntity = ({ oid, uid, tenid, entity, sk }) => {
  const id = getId({ oid, uid, tenid });
  const pkPriv = `${id}#${entity}`;
  const pkPub = `${PUBLIC_ID}#${entity}`;
  const keys = [
    { pk: pkPriv, sk },
  ];
  if (id !== PUBLIC_ID) {
    keys.push({ pk: pkPub, sk });
  };
  return keys;
};

export const fetchText = async ({ env, args }) => {
  if (!args?.url || (args?.body && !args?.method)) {
    throw new Error('Missing URL or Method in HTTP request');
  };
  const url = new URL(args.url);
  if (args?.searchParams) {
    for (const [key, value] of Object.entries(args.searchParams)) {
      url.searchParams.append(key, value);
    };
  };
  const options = { method: args.method };
  if (args?.headers) {
    options["headers"] = args.headers;
  };
  if (args?.body) {
    const body = args.body;
    if (args?.parse && typeof body === "string") {
      options["body"] = JSON.parse(body);
    } else if (args?.stringify && typeof body === "object") {
      options["body"] = JSON.stringify(body);
    } else {
      //options["body"] = JSON.parse(JSON.stringify(body));
      options["body"] = body;
    };
  };
  //options["timeout"] = 15000; // prevent CF 522 error
  let res;
  // TODO: better identify URL
  if (args.url?.includes("api-staging") && env.ENVIRONMENT !== "dev") {
    res = await env.SELF.fetch(url, options);
  } else {
    res = await fetch(url, options);
  };
  const resText = await res.text();
  if (!res?.ok) {
    console.error("onError httpClient Args: ", args);
    throw new Error(`HTTP error: ${res.status} - ${res.statusText} - ${resText}`);
  };
  return resText;
};
