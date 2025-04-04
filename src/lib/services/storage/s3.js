import { AwsClient } from "aws4fetch";

export const PROVIDER = "S3";

//const URL = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

const getClient = (args) => {
  const { accessKeyId, secretAccessKey, region } = args;
  return new AwsClient({
    accessKeyId,
    secretAccessKey,
    region,
    service: "s3",
  });
};

export const listObjectsV2 = async (args) => {
  const { bucket, prefix, region } = args;
  if (!bucket || !region) {
    return new Response("Bad Request", { status: 400 });
  }
  const url = new URL(`https://${bucket}.s3.${region}.amazonaws.com`);
  url.searchParams.append("list-type", "2");
  if (prefix) {
    url.searchParams.append("prefix", prefix);
  }
  const client = getClient(args);
  return client.fetch(url);
};

export const getObject = async (args) => {
  const { bucket, key, region } = args;
  if (!bucket || !key || !region) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${bucket}.s3.${region}.amazonaws.com/${key}`);
};

export const putObject = async (args) => {
  const { bucket, key, region, body } = args;
  if (!bucket || !key || !region || !body) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${bucket}.s3.${region}.amazonaws.com/${key}`, {
    method: "PUT",
    body,
  });
};

export const deleteObject = async (args) => {
  const { bucket, key, region } = args;
  if (!bucket || !key || !region) {
    return new Response("Bad Request", { status: 400 });
  }
  const client = getClient(args);
  return client.fetch(`https://${bucket}.s3.${region}.amazonaws.com/${key}`, {
    method: "DELETE",
  });
};

export const deleteObjects = async (args) => {
  const { bucket, keys, region } = args;
  if (!bucket || !keys || !region) {
    return new Response("Bad Request", { status: 400 });
  }
  const data = `
  <?xml version="1.0" encoding="UTF-8"?>
  <Delete>
    ${keys.map((key) => `<Object><Key>${key}</Key></Object>`).join("")}
  </Delete>
  `;
  const client = getClient(args);
  return client.fetch(`https://${bucket}.s3.${region}.amazonaws.com`, {
    method: "POST",
    headers: {
      "Content-Type": "application/xml",
    },
    body: data,
  });
};
