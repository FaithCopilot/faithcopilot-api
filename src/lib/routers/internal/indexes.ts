import { Hono, Context } from "hono";

//import { withContent } from "@/routers/middleware";
import { honoHandler } from "@/routers/helpers";

import { listEntities, getEntityById } from "@/services/helpers";

import { EntityConstants } from "@/constants";

const ENTITY = EntityConstants.INDEX;

const router = new Hono();

router.get('/:id', async(c: Context) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  const data = await getEntityById({ env, oid, uid, tenid, entity: ENTITY, eid });
  return new Response(JSON.stringify(data), { status: 200 });
});

router.get('/', async(c: Context) => {
  const { env, oid, uid, tenid } = honoHandler(c);
  const data = await listEntities({ env, oid, uid, tenid, entity: ENTITY, pub: true });
  const filteredData = data?.map((_item: any) => ({
    "id": _item.id,
    "name": _item.name,
    "provider": _item.provider,
    "params": _item.params,
  }));
  return new Response(JSON.stringify(filteredData), { status: 200 });
});

/*
router.post('/', withContent, async(c: Context) => {
});
*/

export default router;