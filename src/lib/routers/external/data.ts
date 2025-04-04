import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";
import { honoHandler } from "@/routers/helpers";

import { getDataObject, uploadData } from "@/services/data";
import { getObject } from "@/services/storage";
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

// TODO: move to utils
const removeDuplicates = (arr: string[]) => {
  return [...new Set(arr)];
};

// TODO: use "data" service
// TODO: limit the number of ids that can be queried
// web browsers have a limit of 2-8K characters in the URL
// /v1/data?ids=01J6SKRN7F4XZSQ13NVWTGEQWY-01J6SKRXTGD0F9AYG3TQBP4Q8C&ids=01J6SKDDZJ7TEXAET8XDPYPHN8-01J6SKDQGPJR32Y562TYN2AR5C 
router.get('/', async(c: Context) => {
  const { env, searchParams, oid, uid, tenid } = honoHandler(c);
  let ids = searchParams.getAll("ids");
  const data = await listEntities({ env, oid, uid, tenid, entity: EntityConstants.DATA, pub: true, ids });
  if (!ids || ids.length === 0) {
    return new Response(JSON.stringify(data), { status: 200 });
  };
  ids = removeDuplicates(ids);
  const mappedData: Array<any> = [];
  //const mappedData = ids.map(async(id: any) => {
  try {
  for (let ii=0; ii < ids.length; ii++) {
    const id = ids[ii];
    const isChunk = id.includes("-");
    const item = data.find((item: any) => item?.id === id.split("-")[0]);
    if (isChunk) {
      const versionRef = item?.versions?.find((version: any) => {
        return version?.chunks?.find((chunk: any) => chunk?.id === id);
      });
      if (!versionRef) {
        return new Response("Not Found", { status: 404 });
      };
      const chunkRef = versionRef?.chunks?.find((chunk: any) => chunk?.id === id);
      if (!chunkRef) {
        return new Response("Not Found", { status: 404 });
      };
      const storageKey = chunkRef?.storageKey;
      if (!storageKey) {
        return new Response("Not Found", { status: 404 });
      };
      const chunkObject = await getObject({
        provider: env.STORAGE_PROVIDER,
        accountId: env.STORAGE_ACCOUNT_ID,
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
        bucket: env.STORAGE_BUCKET,
        key: storageKey
      });
      const text = await chunkObject.text();
      mappedData.push({ id, data: text });
    };
  };
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  };
  return new Response(JSON.stringify(mappedData), { status: 200 });
});

router.post('/', withContent, async(c: Context) => {
  const { request, env, data, oid, uid, tenid } = honoHandler(c);
  const contentType = request.headers.get("Content-Type");
  const resData = await uploadData({ env, oid, uid, tenid, contentType, formData: data });
  return new Response(JSON.stringify(resData), { status: 201 });
}); 

export default router;
