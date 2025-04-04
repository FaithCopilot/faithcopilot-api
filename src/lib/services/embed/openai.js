export const PROVIDER = "OPENAI";

/*
API_KEY="YOUR_API_KEY"

curl https://api.openai.com/v1/embeddings \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": [
      "The food was delicious and the waiter...",
      "The food was delicious and the waiter was very friendly."
    ],
    "model": "text-embedding-ada-002",
    "encoding_format": "float"
  }'
*/
//
export const embed = async (args) => {
  const { apiKey, input, model, encodingFormat } = args;
  if (!apiKey || !input) {
    return new Response("Bad Request", { status: 400 });
  }
  const data = {
    input,
  };
  if (model) {
    data["model"] = model;
  }
  if (encodingFormat) {
    data["encoding_format"] = encodingFormat;
  }
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const resData = await res.json();
  const embeddings = resData?.data?.map((item) => item?.embedding);
  return embeddings?.filter((embedding) => embedding);
  //return embeddings;
};
