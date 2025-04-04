import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";
import { honoHandler } from "@/routers/helpers";

import { registerIndex } from "@/services/indexes";

import { listEntities, getEntityById } from "@/services/helpers";

import { EntityConstants } from "@/constants";

const router = new Hono();

router.get('/:id', async(c: Context) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  const data = await getEntityById({ env, oid, uid, tenid, entity: EntityConstants.INDEX, eid });
  return new Response(JSON.stringify(data), { status: 200 });
});

router.get('/', async(c: Context) => {
  const { env, oid, uid, tenid } = honoHandler(c);
  const data = await listEntities({ env, oid, uid, tenid, entity: EntityConstants.INDEX, pub: true });
  const filteredData = data?.map((_item: any) => ({
    "id": _item.id,
    "name": _item.name,
    "provider": _item.provider,
    "params": _item.params,
  }));
  return new Response(JSON.stringify(filteredData), { status: 200 });
});

router.post('/', withContent, async(c: Context) => {
  const { env, data, oid, uid, tenid } = honoHandler(c);
  const id = await registerIndex({ env, oid, uid, tenid, data });
  return new Response(JSON.stringify({ id }), { status: 201 });
});

export default router;