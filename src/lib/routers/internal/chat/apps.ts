import { Hono, Context } from "hono";

import { withAuthInternal, withContent } from "@/routers/middleware";

import {
  honoHandler,
  listEntitiesHandler,
  createEntityHandler,
  readEntityByIdHandler,
  updateEntityByIdHandler,
  deleteEntityByIdHandler,
} from "@/routers/helpers";

import { getId } from "@/services/helpers";

import { selectByPK } from "@/services/db/dynamodb";

import { resolveTemplate } from "@/services/parser/template";

import { EntityConstants } from "@/constants";

const ENTITY = EntityConstants.APP_CHAT;

import html from "./apps.html";

const router = new Hono();

const filterFn = (item: any) => {
  if (!item || !item?.id) return null;
  return {
    id: item?.id,
    name: item?.name,
    appId: item?.appId,
    params: item?.params,
    createdAt: item?.createdAt,
    createdBy: item?.createdBy,
  };
};

/*
const html = `
  <style>
    :root {
      --main-primary: #3730a3;
      --main-tertiary: #1e1b4b;
      --main-secondary: #f4f4f4;
      --link: #a5b4fc;
    }  
  </style>
`;
*/

const context = {
  BRAND: "ZZ's Cool Chat",
  COLORS: {
    primary: '#F0F',
    secondary: '#0FF',
    tertiary: '#FF0',
    link: '#a5b4fc'
  },
  OCOLORS: {
    primary: "#3730a3",
    secondary: "#f4f4f4",
    tertiary: "#1e1b4b",
    link: "#a5b4fc"
  },
  PUBLIC_API_URL: "http://localhost:8787",
};

const isValid = (id?: string|null) => {
  if (!id) return false;
  return id === "zz-cool-chat";
};

router.get('/html', async(c: Context) => {
  const { env, oid, uid, tenid, searchParams } = honoHandler(c);
  const id = getId({ oid, uid, tenid });
  const appId = searchParams?.get("id");
  const pk = `${id}#${ENTITY}`;
  // TODO: direct lookup vs query
  const items = await selectByPK({ env, pk });
  const found = items?.find((item: any) => item?.data?.appId === appId);
  if (found?.data) {
  //if (isValid(appId)) {
    const itemData = found?.data;
    const brand = itemData?.params?.find((item: any) => item?.id === "brand")?.value;
    const primary = itemData?.params?.find((item: any) => item?.id === "color-primary")?.value;
    const secondary = itemData?.params?.find((item: any) => item?.id === "color-secondary")?.value;
    const tertiary = itemData?.params?.find((item: any) => item?.id === "color-tertiary")?.value;
    const links = itemData?.params?.find((item: any) => item?.id === "color-links")?.value;
    const context = {
      BRAND: brand ?? '',
      COLORS: {
        primary: primary ?? "red",
        secondary: secondary ?? "blue",
        tertiary: tertiary ?? "green",
        link: links ?? "purple"
      },
      PUBLIC_API_URL: "https://api-staging.faithcopilot.com"
    };
    //"http://localhost:8787"
    const htmlResolved = resolveTemplate({ template: html, context });
    return new Response(htmlResolved, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  };
  return new Response(null, { status: 404 });
});
/*
router.get('/html-data', async(c: Context) => {
  const { searchParams } = honoHandler(c);
  const id = searchParams?.get("id");
  let data = {
    brand: "Faith Copilot",
    colors: {
      primary: '#3730a3',
      secondary: '#f4f4f4',
      tertiary: '#1e1b4b',
      link: '#a5b4fc'
    }
  };
  if (id === "zz-cool-chat") {
    data = {
      brand: "ZZ's Cool Chat",
      colors: {
        primary: '#F0F',
        secondary: '#0FF',
        tertiary: '#FF0',
        link: '#a5b4fc'
      }
    };
  };
  return new Response(JSON.stringify(data), { status: 200 });
});
*/
router.get('/', async(c: Context) => listEntitiesHandler(c, ENTITY, filterFn));
router.post('/', withContent, async(c: Context) => createEntityHandler(c, ENTITY));
router.get("/:id", async(c: Context) => readEntityByIdHandler(c, ENTITY));
router.put("/:id", withContent, async(c: Context) => updateEntityByIdHandler(c, ENTITY));
router.delete("/:id", async(c: Context) => deleteEntityByIdHandler(c, ENTITY));

export default router;