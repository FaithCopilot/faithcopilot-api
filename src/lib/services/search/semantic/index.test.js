import { describe, expect, test } from "vitest";
import { search } from "./index";

describe("search", () => {
  const EMBED_PROVIDER = import.meta.env.EMBED_PROVIDER;
  const EMBED_API_KEY = import.meta.env.EMBED_API_KEY;
  const EMBED_MODEL = import.meta.env.EMBED_MODEL;
  const VECTOR_PROVIDER = import.meta.env.VECTOR_PROVIDER;
  const VECTOR_API_KEY = import.meta.env.VECTOR_API_KEY;
  const VECTOR_ACCOUNT_ID = import.meta.env.VECTOR_ACCOUNT_ID;
  const VECTOR_INDEX_NAME = import.meta.env.VECTOR_INDEX_NAME;
  const STORAGE_PROVIDER = import.meta.env.STORAGE_PROVIDER;
  const STORAGE_ACCOUNT_ID = import.meta.env.STORAGE_ACCOUNT_ID;
  const STORAGE_ACCESS_KEY_ID = import.meta.env.STORAGE_ACCESS_KEY_ID;
  const STORAGE_SECRET_ACCESS_KEY = import.meta.env.STORAGE_SECRET_ACCESS_KEY;
  const STORAGE_BUCKET = import.meta.env.STORAGE_BUCKET;
  const env = {
    EMBED_PROVIDER,
    EMBED_API_KEY,
    EMBED_MODEL,
    VECTOR_PROVIDER,
    VECTOR_API_KEY,
    VECTOR_ACCOUNT_ID,
    VECTOR_INDEX_NAME,
    STORAGE_PROVIDER,
    STORAGE_ACCOUNT_ID,
    STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY,
    STORAGE_BUCKET,
  };
  test("happy path", async () => {
    const data = {
      collections: ["test"],
      query: "this is a test message to search",
      topK: 2,
    };
    const request = new Request("/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const res = await search({ request, env });
  });
});
