import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";
import { honoHandler } from "@/routers/helpers";

import { getDataObject, uploadData } from "@/services/data";

import { listEntities, getEntityById } from "@/services/helpers";

import { EntityConstants } from "@/constants";

const router = new Hono();

router.get('/:id', async(c: Context) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const did = pathParams?.id;
  const data = await getEntityById({ env, oid, uid, tenid, entity: "data", eid: did });
  const text = await getDataObject({ env, data, did });
  return new Response(text, { status: 200 });
});

router.get('/', async(c: Context) => {
  const { env, oid, uid, tenid } = honoHandler(c);
  const data = await listEntities({ env, oid, uid, tenid, entity: EntityConstants.DATA, pub: true });
  return new Response(JSON.stringify(data), { status: 200 });
});

router.post('/', withContent, async(c: Context) => {
  const { request, env, data, oid, uid, tenid } = honoHandler(c);
  const contentType = request.headers.get("Content-Type");
  await uploadData({ env, oid, uid, tenid, contentType, formData: data });
  return new Response(null, { status: 201 });
}); 

export default router;
