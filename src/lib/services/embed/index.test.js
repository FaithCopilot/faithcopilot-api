import { describe, expect, test } from "vitest";
import { embed } from "./index";

describe("OPENAI", () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  let args = {
    provider: "OPENAI",
    model: "text-embedding-ada-002",
    encoding_format: "float",
    apiKey,
  };

  test("embed", async () => {
    args = {
      ...args,
      input: ["The food was delicious and the waiter...", "The food was delicious and the waiter was very friendly."],
    };
    const embeddings = await embed(args);
    expect(embeddings?.length).toBeGreaterThan(0);
  });
});
