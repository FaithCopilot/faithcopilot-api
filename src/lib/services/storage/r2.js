import { AwsClient } from "aws4fetch";
import * as htmlparser2 from "htmlparser2";

export const PROVIDER = "R2";

const getClient = (args) => {
  const { accessKeyId, secretAccessKey, region } = args;
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: region ?? "auto",
    service: "s3",
  });
};

// TODO: move to ./utils.js
const parseListObjectsV2 = (xml) => {
  const objects = [];
  let keyDetected = false;
  const parser = new htmlparser2.Parser({
    onopentag(name, attributes) {
      if (name === "key") {
        keyDetected = true;
      }
    },
    ontext(text) {
      if (keyDetected) {
        objects.push(text);
        keyDetected = false;
      }
    },
  });
  parser.write(xml);
  parser.end();
  return objects;
};

export const listObjectsV2 = async (args) => {
  const { accountId, bucket, delimiter, prefix, filterPrefix } = args;
  if (!accountId || !bucket) {
    return new Response("Bad Request", { status: 400 });
  }
  const url = new URL(`https://${bucket}.${accountId}.r2.cloudflarestorage.com/`);
  url.searchParams.append("list-type", "2");
  if (delimiter) {
    url.searchParams.append("delimiter", encodeURIComponent(delimiter));
  }
  if (prefix) {
    url.searchParams.append("prefix", encodeURIComponent(prefix));
  }
  const client = getClient(args);
  const res = await client.fetch(url);
  const xml = await res.text();
  const keys = parseListObjectsV2(xml);
  if (filterPrefix) {
    return keys.filter((key) => key.startsWith(filterPrefix));
  }
  return keys;
};

export const getObject = async (args) => {
  const { accountId, bucket, key } = args;
  if (!accountId || !bucket || !key) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`);
};

export const putObject = async (args) => {
  const { accountId, bucket, key, body, type } = args;
  if (!accountId || !bucket || !key || !body) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`, {
    method: "PUT",
    headers: {
      "Content-Type": type,
    },
    body, // supports: FormData().get("file").arrayBuffer() or FormData().get("file").stream()
  });
};

export const deleteObject = async (args) => {
  const { accountId, bucket, key } = args;
  if (!accountId || !bucket || !key) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`, {
    method: "DELETE",
  });
};

export const deleteObjects = async (args) => {
  const { accountId, bucket, keys } = args;
  if (!accountId || !bucket || !keys) {
    return new Response("Bad Request", { status: 400 });
  }
  const data = `
  <?xml version="1.0" encoding="UTF-8"?>
  <Delete>
    ${keys.map((key) => `<Object><Key>${key}</Key></Object>`).join("")}
  </Delete>
  `;
  const client = getClient(args);
  return client.fetch(`https://${accountId}.r2.cloudflarestorage.com/${bucket}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: data,
  });
};
