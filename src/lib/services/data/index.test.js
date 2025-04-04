import { describe, expect, test } from "vitest";
import { createData, readData } from "./data"
import fs from "node:fs/promises"; 

describe("DATA", () => {
  let env = {
    LOG: import.meta.env.VITE_LOG,
    API_URL: import.meta.env.VITE_API_URL,
    AWS_ACCESS_KEY_ID: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
    AWS_REGION: import.meta.env.VITE_AWS_REGION,
    AWS_DYNAMODB_TARGET_VERSION: import.meta.env.VITE_AWS_DYNAMODB_TARGET_VERSION,
    AWS_DYNAMODB_TABLE: import.meta.env.VITE_AWS_DYNAMODB_TABLE,
    uid: "42"
  };
  const LOG = env.LOG === "true";
  describe("createData", () => {
    const formData = new FormData();
    describe("uploadPDF", async() => {
      test("happy path", async() => {
        const pdfFilePath = "functions/_services/app/test.pdf";
        const data = await fs.readFile(pdfFilePath);
        const pdfBlob = new Blob([data], { type: "application/pdf" });
        formData.append("collection", "docs");
        formData.append("file", pdfBlob);
        const chunkOptions = {
          chunkBy: "paragraph", //"page", //"paragraph", //"page",
          chunkSize: 1024 * 1024,
          chunkNumber: 1,
          chunkTotal: 1
        };
        formData.append("chunkOptions", JSON.stringify(chunkOptions));
        const request = new Request(`${env.API_URL}/v1/data`, {
          method: "POST",
          body: formData,
          //headers: {
            //"Content-Type": "application/pdf" // Error: Could not parse content as FormData.
            //"Content-Type": "multipart/form-data" // Error: Multipart: Boundary not found
          //}
        });
        const res = await createData(request, env);
        expect(res.status).toBe(201);
      });
    });
    /*
    describe.skip("crawlURL", () => {
      formData.append("url", "https://disciple.tools/user-docs/");
      test("happy path", async() => {
      });
    });
    */
  });
  describe.skip("readData", () => {
    test("happy path", async() => {
      const request = new Request(`${env.API_URL}/v1/data`);
      const res = await readData(request, env);
      expect(res.status).toBe(200);
      const data = await res.json();
      if (LOG) console.log("*** DATA: ", data);
      expect(data).toBeInstanceOf(Array);
    });
  });
});
