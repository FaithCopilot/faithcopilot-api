import { Hono, Context } from "hono";

import { withContent } from "@/routers/middleware";

import {
  listEntitiesHandler,
  createEntityHandler,
  readEntityByIdHandler,
  updateEntityByIdHandler,
  deleteEntityByIdHandler,
} from "@/routers/helpers";

import { EntityConstants } from "@/constants";

const ENTITY = EntityConstants.PROFILE_CHAT;

const router = new Hono();

const filterFn = (item: any) => {
  if (!item || !item?.id) return null;
  return {
    id: item?.id,
    name: item?.name,
    createdAt: item?.createdAt,
    createdBy: item?.createdBy,
  };
};

router.get('/', async(c: Context) => listEntitiesHandler(c, ENTITY, filterFn));
router.post('/', withContent, async(c: Context) => createEntityHandler(c, ENTITY));
router.get("/:id", async(c: Context) => readEntityByIdHandler(c, ENTITY));
router.put("/:id", withContent, async(c: Context) => updateEntityByIdHandler(c, ENTITY));
router.delete("/:id", async(c: Context) => deleteEntityByIdHandler(c, ENTITY));

export default router;