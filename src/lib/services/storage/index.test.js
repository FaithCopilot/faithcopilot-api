import { describe, expect, test } from "vitest";
import { listObjectsV2, getObject, putObject, deleteObject, deleteObjects } from "./index";

describe("R2", () => {
  const accountId = import.meta.env.VITE_CF_ACCOUNT_ID;
  const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
  let args = {
    provider: "R2",
    accountId,
    accessKeyId,
    secretAccessKey,
    region: "auto",
    bucket: "faithcopilot-dev",
  };

  test("listObjectsV2", async () => {
    args = {
      ...args,
      //delimiter: '/',
      prefix: "myorg",
      filterPrefix: "myorg1/v1/dpo/",
    };
    const res = await listObjectsV2(args);
    expect(res?.length > 0);
  });

  test("getObject", async () => {
    args = {
      ...args,
      key: "myorg1/v1/sft/01HNM9TJMEXDQPKENEYHB5Q3VG_01HNNJDWGFJF1BT6HDQ6DBS4NG.json",
    };
    const res = await getObject(args);
    const data = await res.json();
    expect(data.schema).toBe("v1/sft");
  });

  test.skip("putObject", async () => {
    args = {
      ...args,
      key: "test/v1/sft/test.json",
      body: JSON.stringify({ schema: "v1/sft" }),
    };
    const res = await putObject(args);
    expect(res.status).toBe(200);
  });

  test.skip("deleteObject", async () => {
    args = {
      ...args,
      key: "test/v1/sft/test.json",
    };
    const res = await deleteObject(args);
    expect(res.status).toBe(204);
  });
});
