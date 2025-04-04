import { generateTsuid } from "@/services/uuid/ulid";

import { throwError, validateJSON } from "@/utils";

import { EntityConstants } from "@/constants";

const models = [
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ2X",
    type: "model/llm/v1",
    name: "anthropic/claude-3.5-sonnet",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "anthropic/claude-3.5-sonnet",
    model: "anthropic/claude-3.5-sonnet",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ3X",
    type: "model/llm/v1",
    name: "huggingfaceh4/zephyr-7b-beta",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "huggingfaceh4/zephyr-7b-beta",
    model: "huggingfaceh4/zephyr-7b-beta:free",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ4X",
    type: "model/llm/v1",
    name: "meta-llama/llama-3.1-8b-instruct",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "meta-llama/llama-3.1-8b-instruct",
    model: "meta-llama/llama-3.1-8b-instruct",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ6X",
    type: "model/llm/v1",
    name: "openai/gpt-4o-mini",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "openai/gpt-4o-mini",
    model: "openai/gpt-4o-mini",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ7X",
    type: "model/llm/v1",
    name: "google/gemma-2-9b-it",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "google/gemma-2-9b-it",
    model: "google/gemma-2-9b-it",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ8X",
    type: "model/llm/v1",
    name: "mistralai/mistral-nemo",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "mistralai/mistral-nemo",
    model: "mistralai/mistral-nemo",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCZ5X",
    type: "model/llm/v1",
    name: "gryphe/mythomax-l2-13b",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey:
        "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"
    },
    label: "gryphe/mythomax-l2-13b",
    model: "gryphe/mythomax-l2-13b",
    systemMessage: "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  },
  {
    "id": "01J48CZW4GTAQ7DMWV0ADJCZ1X",
    "type": "model/llm/v1",
    "name": "custom/llama-3-8b-instruct",
    "createdBy": {
      "id": "1",
      "name": "Faith Copilot 💬✝️",
      "verified": true
    },
    "createdAt": "2024-09-01T00:00:00.000Z",
    "provider": "custom",
    "api": {
      //"baseURL": "https://prykon--chatbot-from-model-mistral-7b-instruct-v0-2-main.modal.run", // chat/completions",
      "baseURL": "http://44.203.56.145:8081/v1/", 
      "apiKey": "EMPTY"
    },
    "label": "custom/llama-3-8b-instruct",
    "model": "meta-llama/Meta-Llama-3-8B-Instruct",
    "systemMessage": "you are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine",
    "params": {
      "temperature": 0.3,
      "top_p": 0.9,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.0,
      "stop": []
    }
  },
  {
    id: "01J48CZW4GTAQ7DMWV0ADJCA2X",
    type: "model/llm/v1",
    name: "anthropic/claude-3.5-sonnet (EN/AR)",
    createdBy: {
      id: "1",
      name: "Faith Copilot 💬✝️",
      verified: true
    },
    createdAt: "2024-09-01T00:00:00.000Z",
    provider: "openrouter",
    api: {
      baseURL: "https://openrouter.ai/api/v1", // chat/completions",
      apiKey: "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"
    },
    label: "anthropic/claude-3.5-sonnet (EN/AR)",
    model: "anthropic/claude-3.5-sonnet",
    systemMessage: `You are a helpful Christian chatbot which always prioritizes the context above you in order to answer questions, and always responds according to Christian tradition and doctrine.  انت شات بوت مسيحي مفيد، دايماً تعطي الأولوية للسياق اللي فوق علشان تجاوب على الأسئلة، وتجاوب دايماً حسب التقاليد والعقيدة المسيحية You are a helpful and versatile bilingual assistant that communicates fluently in both English and Arabic (including Modern Standard Arabic and regional dialects). You will: Automatically detect the language used by the user and respond in the same language Switch seamlessly between English and Arabic based on user preference When translating, consider cultural context and use appropriate dialectical variations when requested For Arabic responses, use Modern Standard Arabic (فصحى) by default unless a specific dialect is requested Format Arabic text with proper right-to-left display and diacritical marks when helpful When providing explanations in Arabic, ensure technical terms are clear by providing English equivalents in parentheses when needed Maintain consistent tone and style within each language while adapting to formal/informal register as appropriate For code or technical content, provide comments and documentation in the same language as the conversation If language preference is unclear, politely ask: "Would you prefer I respond in English or Arabic? / هل تفضل أن أرد باللغة العربية أم الإنجليزية؟" When appropriate, leverage your understanding of both languages to explain idioms, cultural references, and linguistic nuances In all interactions, prioritize clear communication while preserving the cultural and linguistic authenticity of both languages. All responses should align with Christian tradition and doctrine, using appropriate religious terminology and references in both languages when relevant.`,
    params: {
      temperature: 0.3,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      stop: []
    }
  }
];

export const getModel = ({
  env,
  oid,
  uid,
  tenid,
  modelId,
  options
}) => {
  const model = models?.find((_model) => _model?.id === modelId);
  if (options?.filter === true) {
    return {
      id: model?.id,
      label: model?.label,
      systemMessage: model?.systemMessage,
      params: model?.params,
    };
  };
  return model;
};

export const getModels = ({
  oid,
  uid,
  options
}) => {
  if (options?.filter === true) {
    return models?.map((_model) => ({
      id: _model?.id,
      name: _model?.name,
      model: _model?.model,
      createdAt: _model?.createdAt,
      createdBy: _model?.createdBy,
      label: _model?.model,
      systemMessage: _model?.systemMessage,
      params: _model?.params,
    }));
  };
  return models;
};

export const registerModel = async ({ env, oid, uid, tenid, data }) => {
  const validation = validateJSON(data, {
    required: ["label", "model", "provider", "api", "params"],
    optional: ["systemMessage"]
  });
  if (!validation?.isValid) {
    throwError({
      name: "BadRequestError",
      cause: new Error(validation?.errors.join(", "))
    });
  };
  const modelId = await generateTsuid();
  /*
  const model = {
    id: modelId,
    type: "model/llm/v1",
    provider: data?.provider,
    api: data?.api,
    label: data?.label,
    model: data?.model,
    systemMessage: data?.systemMessage,
    params: data?.params
  };
  */
  const values = { data: JSON.stringify({
    id: indexId,
    type: "index/v1", // index/vec/v1, index/doc/v1
    createdAt: new Date().toISOString(),
    createdBy: uid,
    ...data
  })}
  const pk = `${uid}#${EntityConstants.MODEL}`;
  await insert({ env, pk, sk: modelId, values });
  return modelId;
}
