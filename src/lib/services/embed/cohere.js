export const PROVIDER = "COHERE";

/*
API_KEY="YOUR_API_KEY"

curl -X POST https://api.cohere.ai/v1/embed \
  -H 'accept: application/json' \
  -H 'authorization: Bearer $API_KEY' \
  -H 'content-type: application/json' \
  -d '{
    "texts": [
      "I am a sentence for which I would like to get its embedding",
      "I am also a sentence for which I would like to get its embedding"
    ],
    "model": "embed-english-v3.0",
    "input_type": "search_query", 
    "embedding_types": "float"
  }'
*/
//
export const embed = async (args) => {
  const { apiKey, texts, model, inputType, embeddingTypes } = args;
  if (!apiKey || !texts) {
    return new Response("Bad Request", { status: 400 });
  }
  const data = {
    texts,
  };
  if (model) {
    data["model"] = model;
  }
  if (inputType) {
    data["inputType"] = inputType;
  }
  if (embeddingTypes) {
    data["embeddingTypes"] = embeddingTypes;
  }
  return fetch("https://api.cohere.ai/v1/embed", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};
