import { Context } from "hono";

import {
  listEntities,
  createEntity,
  readEntityById,
  updateEntityById,
  deleteEntityById,
} from "@/services/helpers";

import { EntityConstants } from "@/constants";

export const handler = (fn: Function) => async (c: Context) => fn(c.req.raw.clone(), c.env, c.req.param());

export const honoHandler = (c: Context) => {
  const request = c.req.raw.clone();
  const env = c.env;
  const pathParams = c.req.param(); // path params
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const data = env?.request?.content;
  const email = env?.request?.email;
  const oid = env?.request?.oid;
  const uid = env?.request?.uid;
  const tenid = request?.headers?.get("X-TENANT-ID") ?? undefined;
  return { request, env, pathParams, searchParams, data, email, oid, uid, tenid };
};

const isSafePublicEntityType = ({ entity }: { entity: string }) => {
  return(
    entity !== EntityConstants.KEY &&
    entity !== EntityConstants.ENV
  );
};

export const listEntitiesHandler = async (c: Context, entity: string, filterItemFn: Function, pub?: boolean) => {
  const { env, oid, uid, tenid, searchParams } = honoHandler(c);
  if (!pub) {
    const _pub = searchParams?.get("public");
    if (_pub) pub = _pub === "true";
  };
  pub = isSafePublicEntityType({ entity });
  const data = await listEntities({ env, oid, uid, tenid, entity, pub });
  if (!data || (data.length === 1 && !data[0]?.id)) {
    return new Response(null, { status: 204 });
  };
  const filteredData = data?.map((_item: any) => filterItemFn(_item))?.filter((_item: any) => _item);
  return new Response(JSON.stringify(filteredData), { status: 200 });
};

export const createEntityHandler = async (c: Context, entity: string) => {
  const { env, data, email, oid, uid, tenid } = honoHandler(c);
  const res = await createEntity({ env, email, oid, uid, tenid, entity, data });
  if (!res?.id) {
    return new Response(null, { status: 500 });
  };
  return new Response(JSON.stringify({ id: res.id }), { status: 201 });
};

export const readEntityByIdHandler = async (c: Context, entity: string) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  const data = await readEntityById({ env, oid, uid, tenid, entity, eid });
  return new Response(JSON.stringify(data), { status: 200 });
};

export const updateEntityByIdHandler = async (c: Context, entity: string) => {
  const { env, pathParams, data, email, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  await updateEntityById({ env, email, oid, uid, tenid, entity, eid, data });
  return new Response(null, { status: 204 });
};

export const deleteEntityByIdHandler = async (c: Context, entity: string) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  const res = await deleteEntityById({ env, oid, uid, tenid, entity, eid });
  if (!res) {
    return new Response(null, { status: 404 });
  };
  return new Response(null, { status: 204 });
};