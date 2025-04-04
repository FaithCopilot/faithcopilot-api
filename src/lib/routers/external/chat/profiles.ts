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

const profiles = [
  {
    "id": "01JDJ9KN0NF20ACS9EFEQB66DK",
    "name": "Basic Chat Profile",
    "createdBy": {
      "id": "1",
      "name": "FaithCopilot 💬✝️",
    },
    "createdAt": "2024-11-19T16:15:00Z",
    "steps": [
      {
        "name": "Vars",
        "call": "vars",
        "assign": [
          {
            "systemMessage": "You are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine."
          }
        ]
      },
      {
        "name": "Merge System Message (unless overridden in request)",
        "call": "script",
        "args": {
          "systemMessage": "{{systemMessage}}",
          "messages": "{{args.data.messages}}",
          "env": "{{args.env}}",
          "code": "if (args?.systemMessage && args?.messages?.find(m => m.role === \"system\") === undefined) { return [{ \"role\": \"system\", \"content\": args.systemMessage }, ...args.messages]; } return args.messages;"
        },
        "result": "mergedWithSystemMessage"
      },
      {
        "name": "Anthropic Claude 3.5 (New)",
        "call": "http",
        "args": {
          "url": "https://openrouter.ai/api/v1/chat/completions",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer {{args.env.secrets.OPENROUTER_API_KEY}}"
          },
          "body": "{ \"model\": \"anthropic/claude-3.5-sonnet\", \"messages\": {{mergedWithSystemMessage}} }"
        },
        "result": "llmOutput",
        "return": "{{llmOutput}}"
      }
    ]
  },
  {
    "id": "01JDJ9NXSBH0TMFAPTS18907NR",
    "name": "ChatGPT Profile (AR/EN)",
    "createdBy": {
      "id": "123XYZ",
      "name": "zdmc23",
    },
    "createdAt": "2024-11-20T12:30:00Z",
    "steps": [
      {
        "name": "Vars",
        "call": "vars",
        "assign": [
          {
            "systemMessage": "You are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine.  انت شات بوت مسيحي مفيد، دايماً تعطي الأولوية للسياق اللي فوق علشان تجاوب على الأسئلة، وتجاوب دايماً حسب التقاليد والعقيدة المسيحية You are a helpful and versatile bilingual assistant that communicates fluently in both English and Arabic (including Modern Standard Arabic and regional dialects). You will: Automatically detect the language used by the user and respond in the same language Switch seamlessly between English and Arabic based on user preference When translating, consider cultural context and use appropriate dialectical variations when requested For Arabic responses, use Modern Standard Arabic (فصحى) by default unless a specific dialect is requested Format Arabic text with proper right-to-left display and diacritical marks when helpful When providing explanations in Arabic, ensure technical terms are clear by providing English equivalents in parentheses when needed Maintain consistent tone and style within each language while adapting to formal/informal register as appropriate For code or technical content, provide comments and documentation in the same language as the conversation If language preference is unclear, politely ask: \"Would you prefer I respond in English or Arabic? / هل تفضل أن أرد باللغة العربية أم الإنجليزية؟\" When appropriate, leverage your understanding of both languages to explain idioms, cultural references, and linguistic nuances In all interactions, prioritize clear communication while preserving the cultural and linguistic authenticity of both languages. All responses should align with Christian tradition and doctrine, using appropriate religious terminology and references in both languages when relevant."
          }
        ]
      },
      {
        "name": "Merge System Message (unless overridden in request)",
        "call": "script",
        "args": {
          "systemMessage": "{{systemMessage}}",
          "messages": "{{args.data.messages}}",
          "env": "{{args.env}}",
          "code": "if (args?.systemMessage && args?.messages?.find(m => m.role === \"system\") === undefined) { return [{ \"role\": \"system\", \"content\": args.systemMessage }, ...args.messages]; } return args.messages;"
        },
        "result": "mergedWithSystemMessage"
      },
      {
        "name": "OpenAI GPT-4o (mini)",
        "call": "http",
        "args": {
          "url": "https://openrouter.ai/api/v1/chat/completions",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer {{args.env.secrets.OPENROUTER_API_KEY}}"
          },
          "body": "{ \"model\": \"openai/gpt-4o-mini\", \"messages\": {{mergedWithSystemMessage}} }"
        },
        "result": "llmOutput",
        "return": "{{llmOutput}}"
      }
    ]
  }
];


const filterFn = (item: any) => {
  if (!item || !item?.id) return null;
  return {
    id: item?.id,
    name: item?.name,
    createdAt: item?.createdAt,
    createdBy: item?.createdBy,
  };
};

router.get('/', async(c: Context) => listEntitiesHandler(c, ENTITY, filterFn, true));
router.post('/', withContent, async(c: Context) => createEntityHandler(c, ENTITY));
router.get("/:id", async(c: Context) => readEntityByIdHandler(c, ENTITY));
router.put("/:id", withContent, async(c: Context) => updateEntityByIdHandler(c, ENTITY));
router.delete("/:id", async(c: Context) => deleteEntityByIdHandler(c, ENTITY));

/*
router.get('/:id', async(c: Context) => {
  const { env, pathParams, oid, uid, tenid } = honoHandler(c);
  const eid = pathParams?.id;
  //const data = await getEntityById({ env, oid, uid, tenid, entity: ENTITY, eid });
  const data = profiles?.find((item: any) => item?.id === eid);
  if (!data) {
    return new Response("Not Found", { status: 404 });
  };
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
  //const data = profiles;
  //return new Response(JSON.stringify(data), { status: 200 });
});

router.post('/', withContent, async(c: Context) => {
  const { env, data: workflow, oid, uid, tenid } = honoHandler(c);
  if (!workflow?.steps) {
    return new Response("Bad Request", { status: 400 });
  };
  //await insert({ env, pk, sk, values });
  // chat profiles are a type of workflow
  //await createWorkflow({ env, oid, uid, tenid, workflow });
  return new Response(null, { status: 201 });
});
*/

export default router;