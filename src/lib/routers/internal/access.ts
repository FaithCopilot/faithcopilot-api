import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";

import {
  honoHandler,
  listEntitiesHandler,
  createEntityHandler,
  readEntityByIdHandler,
  updateEntityByIdHandler,
  deleteEntityByIdHandler,
} from "@/routers/helpers";

import { createEntity } from "@/services/helpers";

import { generateToken } from "@/services/crypto";

import { mask, throwError } from "@/utils";

import { EntityConstants } from "@/constants";

const router = new Hono();


///////////////////////////////////////////////////////////////////////////////
// API KEYS
///////////////////////////////////////////////////////////////////////////////

const ENTITY_API_KEYS = EntityConstants.KEY;
const ENTITY_PATH_API_KEYS = "api-keys";

const filterAPIKeysFn = (item: any) => {
  if (!item || !item?.id) return null;
  return {
    id: item?.id,
    name: item?.name,
    sk: mask(item?.sk, 6),
    createdAt: item?.createdAt,
    createdBy: item?.createdBy,
    exp: item?.exp,
  };
};

/*
const validateAPIKeysFn = (c: Context) => {
  const data = c?.env?.request?.content;
};
*/

router.post(`/${ENTITY_PATH_API_KEYS}`, withContent, async(c: Context) => {
  const { env, email, data, oid, uid, tenid } = honoHandler(c);
  if (!(uid || oid) || !data?.exp) {
    return new Response("Bad Request", { status: 400 });
  };
  const expDate = new Date(data.exp);
  const claims = { email, email_verified: true };
  const jwt = await generateToken({ env, oid, subject: uid, exp: expDate, claims });
  if (!jwt) {
    throwError({
      name: "NotFoundError",
      cause: new Error(`Unable to generate API Key for "oid": ${oid}, "uid": ${uid}`),
    });
  };
  const values = {
    ...data,
    sk: jwt 
  };
  await createEntity({ env, oid, uid, tenid, entity: ENTITY_API_KEYS, data: values });
  return new Response(JSON.stringify({ key: jwt }), { status: 201 });
});

router.get(`/${ENTITY_PATH_API_KEYS}`, async(c: Context) => listEntitiesHandler(c, ENTITY_API_KEYS, filterAPIKeysFn));
router.get(`/${ENTITY_PATH_API_KEYS}/:id`, async(c: Context) => readEntityByIdHandler(c, ENTITY_API_KEYS));
router.put(`/${ENTITY_PATH_API_KEYS}/:id`, withContent, async(c: Context) => updateEntityByIdHandler(c, ENTITY_API_KEYS));
router.delete(`/${ENTITY_PATH_API_KEYS}/:id`, async(c: Context) => deleteEntityByIdHandler(c, ENTITY_API_KEYS));


///////////////////////////////////////////////////////////////////////////////
// ENVIRONMENT
///////////////////////////////////////////////////////////////////////////////

const ENTITY_ENVS = EntityConstants.ENV;
const ENTITY_PATH_ENVS = "envs";

const filterEnvsFn = (item: any) => {
  if (!item || !item?.id) return null;
  let value = item?.value;
  if (item?.isSecret) {
    value = '*'.repeat(10);
  };
  return {
    id: item?.id,
    name: item?.name,
    key: item?.key,
    value,
    isSecret: item?.isSecret,
    createdAt: item?.createdAt,
    createdBy: item?.createdBy,
  };
};

router.get(`/${ENTITY_PATH_ENVS}`, async(c: Context) => listEntitiesHandler(c, ENTITY_ENVS, filterEnvsFn));
router.post(`/${ENTITY_PATH_ENVS}`, withContent, async(c: Context) => createEntityHandler(c, ENTITY_ENVS));
router.get(`/${ENTITY_PATH_ENVS}/:id`, async(c: Context) => readEntityByIdHandler(c, ENTITY_ENVS));
router.put(`/${ENTITY_PATH_ENVS}/:id`, withContent, async(c: Context) => updateEntityByIdHandler(c, ENTITY_ENVS));
router.delete(`/${ENTITY_PATH_ENVS}/:id`, async(c: Context) => deleteEntityByIdHandler(c, ENTITY_ENVS));

export default router;
