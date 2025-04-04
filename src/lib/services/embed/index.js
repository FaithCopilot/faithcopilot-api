import { PROVIDER as PROVIDER_OPENAI, embed as embed_openai } from "./openai";

import { PROVIDER as PROVIDER_COHERE, embed as embed_cohere } from "./cohere";

const DEFAULT_PROVIDER = PROVIDER_OPENAI;

export const embed = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_OPENAI:
      return embed_openai(args);
    case PROVIDER_COHERE:
      return embed_cohere(args);
    default:
      throw new Error("Invalid provider");
  }
};
