/*
// TODO: move to services
import { extractText, getDocumentProxy, getMeta } from "unpdf";
// TODO: move to services
import { parse } from "csv-parse/browser/esm";
*/

import { getObject, putObject } from "@/services/storage";

import { selectByKeysConditional, selectByPK, insert } from "@/services/db";

import { generateTsuid } from "@/services/uuid/ulid";

import { throwError } from "@/utils";

/*
import { crawlURL } from "@/services/parsers/html";
import { chunkByText } from "@/services/parsers/text";
*/

import {
  ChunkOptionConstants,
  EntityConstants,
  PUBLIC_ID
} from "@/constants";

/*
const processChunks = async ({ env, uid, name, type, collections, chunks }) => {
  const _chunks = [];
  const did = await generateTsuid();
  for (let ii = 0; ii < chunks.length; ii++) {
    // copy to R2
    const chunk = chunks[ii];
    const key = `${uid}/${did}/${ii}.txt`;
    // TODO: reuse
    // TODO: error handling
    //break;
    await putObject({
      provider: env.STORAGE_PROVIDER,
      accountId: env.STORAGE_ACCOUNT_ID,
      accessKeyId: env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      bucket: env.STORAGE_BUCKET,
      key,
      body: chunk,
      type: "text/plain"
    });
    console.log(`Uploaded chunk # ${ii} to storage`);
    _chunks.push({
      id: `${did}_${ii}`,
      uri: key,
      metadata: collections?.[0] ? { [collections[0]]: true } : undefined,
    });
  };
  const workerChunks = {
    uid,
    id: did,
    config: {
      storage: {
        provider: env.STORAGE_PROVIDER,
        accountId: env.STORAGE_ACCOUNT_ID,
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
        region: env.STORAGE_REGION,
        bucket: env.STORAGE_BUCKET
      },
      embed: {
        provider: env.EMBED_PROVIDER,
        apiKey: env.EMBED_API_KEY,
        model: env.EMBED_MODEL,
        format: env.EMBED_FORMAT
      },
      vector: {
        provider: env.VECTOR_PROVIDER,
        apiKey: env.VECTOR_API_KEY,
        accountId: env.VECTOR_ACCOUNT_ID,
        indexName: env.VECTOR_INDEX_NAME
      }
    },
    chunks: _chunks,
    metadata: collections?.[0] ? { [collections[0]]: true } : undefined,
  };
  console.log("*** WORKER CHUNKS: ", JSON.stringify(workerChunks)?.substring(0, 1000));
  //const result = await env.WORKER.processChunks(workerChunks);
  const res = await env.WORKER.fetch("http://localhost", {
    method: "POST",
    body: JSON.stringify(workerChunks),
    headers: { "Content-Type": "application/json" }
  });
  // status 503 - service unavailable. write error
  if (res?.ok) {
    // store in DDB
    // TODO: constants
    const pk = `${uid}#dataset`;
    const sk = did; // ulid, so it has a built-in timestamp
    const values = { data: JSON.stringify({
      schema: "v1/dataset",
      ts: new Date().toISOString(),
      title: name,
      type,
      numChunks: chunks?.length ?? '?',
      collections,
      status: "pending"
    })};
    await insert({ env, pk, sk, values });
  };
  // TODO: return response
  return res;
};

/*
const getExtension = ({ filename }) => {
  //if (!file?.name?.includes(".")) {
  //  throw new Error("Invalid file name");
  //};
  const ext = filename?.split(".")?.pop(); // TODO: more robust
  return ext;
};

const processURL = async ({ env, uid, collection, url, numChunks }) => {
  const type = "text/html";
  // generate dataset uuid
  const did = await generateTsuid();
  // copy to R2
  const ext = "html";
  const key = `${uid}/${did}/og.${ext}`;
  const res = await fetch(url);
  const body = await res.text();
  await putObject({
    provider: env.STORAGE_PROVIDER,
    accountId: env.STORAGE_ACCOUNT_ID,
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
    bucket: env.STORAGE_BUCKET,
    key,
    body,
    type
  });
  // store in DDB
  // TODO: constants
  const pk = `${uid}#dataset`;
  const sk = did; // ulid, so it has a built-in timestamp
  const values = { data: JSON.stringify({
    schema: "v1/dataset",
    ts: new Date().toISOString(),
    key,
    type,
    numChunks,
    collections: [collection],
    title: url,
  })};
  // TODO: handle any errors?
  try {
    await insert({ env, pk, sk, values });
  } catch(error) {
    console.error(error);
  };
  return { did };
};

const processFile = async ({ env, uid, collection, file, numChunks }) => {
  const type = file?.type;
  // generate dataset uuid
  const did = await generateTsuid();
  // copy to R2
  const ext = getExtension({ filename: file.name });
  const key = `${uid}/${did}/og.${ext}`;
  await putObject({
    provider: env.STORAGE_PROVIDER,
    accountId: env.STORAGE_ACCOUNT_ID,
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
    bucket: env.STORAGE_BUCKET,
    key,
    body: file?.stream(),
    type
  });
  // store in DDB
  // TODO: constants
  const pk = `${uid}#dataset`;
  const sk = did; // ulid, so it has a built-in timestamp
  const values = { data: JSON.stringify({
    schema: "v1/dataset",
    ts: new Date().toISOString(),
    key,
    type,
    numChunks,
    collections: [collection],
    title: file.name,
  })};
  // TODO: handle any errors?
  try {
    await insert({ env, pk, sk, values });
  } catch(error) {
    console.error(error);
  };
  return { did };
};
*/
/*

//const [image] = await extractImages(pdf, 1);
//const buffer = Buffer.from(image);

const isChunkByText = (chunkOption) => {
  switch(chunkOption) {
    case ChunkOptionConstants.LENGTH:
    case ChunkOptionConstants.SENTENCE:
    case ChunkOptionConstants.PARAGRAPH:
      return true;
    default:
      return false;
  };
};

const chunkPDF = async({ env, file, chunkOptions }) => {
  const chunkBy = chunkOptions?.chunkBy;
  const isChunkByPage = chunkBy === ChunkOptionConstants.PAGE;
  // check if valid chunk option
  if (!isChunkByPage && !isChunkByText(chunkBy)) {
    return null;
  };
  const mergePages = isChunkByPage ? false : true;
  const buffer = await file.arrayBuffer();
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages });
  let chunks = [];
  if (isChunkByPage) {
    for (let ii = 0; ii < totalPages; ii++) {
      chunks.push(text?.[ii]);
    };
  } else {
    chunks = chunkByText({ text, chunkOptions });
  };
  return chunks;
};
*/

/*
const handleHTMLCrawl = async({ env, uid, collection, url }) => {
  const chunks = await crawlURL({ url });
  const { did } = await processURL({
    env,
    uid,
    collection,
    url,
    numChunks: chunks.length
  });
  await processChunks({
    env,
    uid,
    did,
    collection,
    chunks
  });
  return new Response(null, { status: 201 });
};
*/

const safeParse = (object, defaultValue=null) => {
  try {
    return JSON.parse(object);
  } catch(error) {
    return defaultValue;
  };
};

const parseFields = (formData) => {
  const name = formData.get("name");
  let tags = safeParse(formData.get("tags"), []);
  let metadata = safeParse(formData.get("metadata"), {});
  let options = safeParse(formData.get("options"), {});
  return { name, tags, metadata, options };
};

export const getDataObject = async({ env, data, did }) => {
  let isChunk = false;
  if (did?.includes("-")) {
    isChunk = true;
    //did = did.split("-")[0];
  };
  if (isChunk) {
    const versionRef = data?.versions?.find(version => {
      return version?.chunks?.find(chunk => chunk?.id === did);
    });
    if (!versionRef) {
      throwError({
        name: "NotFoundError",
        cause: new Error("versionRef not found")
      });
    };
    const chunkRef = versionRef?.chunks?.find(chunk => chunk?.id === did);
    if (!chunkRef) {
      throwError({
        name: "NotFoundError",
        cause: new Error("chunkRef not found")
      });
    };
    const storageKey = chunkRef?.storageKey;
    if (!storageKey) {
      throwError({
        name: "NotFoundError",
        cause: new Error("storageKey not found")
      });
    };
    const chunkObject = await getObject({
      provider: env.STORAGE_PROVIDER,
      accountId: env.STORAGE_ACCOUNT_ID,
      accessKeyId: env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      bucket: env.STORAGE_BUCKET,
      key: storageKey
    });
    const text = await chunkObject.text();
    return text;
  };
  // TODO: return og file
};

export const getDataById = async({ env, oid, uid, tenid, did }) => {
  //const id = tenid ? `${oid}#${uid}#${tenid}` : `${oid}#${uid}`;
  const id = tenid ? `${uid}#${tenid}` : uid;
  const pk = `${id}#${EntityConstants.DATA}`;
  let sk = did;
  if (did?.includes("-")) {
    sk = did.split("-")[0];
  };
  const res = await selectByKeysConditional({ env, pk, sk });
  let data = res?.data;
  if (!data) {
    const pubPK = `${PUBLIC_ID}#${EntityConstants.DATA}`;
    const pubRes = await selectByKeysConditional({ env, pk: pubPK, sk });
    data = pubRes?.data;
    if (!data) {
      throwError({
        name: "NotFoundError",
        cause: new Error(`Data ID: ${did} not found`)
      });
    };
  };
  const text = await getDataObject({ env, data, did });
  return text;
};

export const uploadData = async({ env, oid, uid, tenid, contentType, formData }) => {
  // TODO: lookup user account to check storage override
  const provider = env?.STORAGE_PROVIDER;
  const accountId = env?.STORAGE_ACCOUNT_ID;
  const accessKeyId = env?.STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = env?.STORAGE_SECRET_ACCESS_KEY;
  const bucket = env?.STORAGE_BUCKET;
  if (!provider || !accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throwError({ message: "Invalid storage configuration" });
  };
  let id = uid;
  if (!id) {
    throwError({
      name: "BadRequestError",
      message: "No uid found",
    });
  };
  const did = await generateTsuid();
  // TODO: lookup user account to check storage limits 
  const keyPrefix = tenid ? `${id}/${tenid}/${did}` : `${id}/${did}`;
  let storage = { provider, bucket };
  if (!contentType?.includes("multipart/form-data")) {
    throwError({
      name: "BadRequestError",
      message: "Invalid Content-Type",
    });
  };
  if (!formData) {
    throwError({
      name: "BadRequestError",
      message: "Missing Form Data",
    });
  };
  const { name, tags, metadata, options } = parseFields(formData);
  // VALIDATE REQUEST
  let binaryFiles = [];
  let textFiles = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      if (key === options?.file) {
      //if (!value.type.startsWith("text/")) {
        binaryFiles.push(key);
      } else {
        textFiles.push(key);
      };
    };
  };
  if (binaryFiles.length > 1) {
    throwError({
      name: "BadRequestError",
      message: "More than 1 binary file found",
    });
  };
  if (binaryFiles.length === 0 && textFiles.length === 0) {
    throwError({
      name: "BadRequestError",
      message: "No file data found",
    });
  };
  // PROCESS BINARY FILE (IF EXIST)
  if (binaryFiles.length === 1) {
    const binaryFileKey = binaryFiles[0];
    const binaryFile = formData.get(binaryFileKey);
    let filename = binaryFile.name;
    let extension = filename.split('.').pop();
    if (!extension) {
      // TODO: attempt to map based on content-type
      extension = "bin";
    };
    const fileKey = `${keyPrefix}/orig.${extension}`;
    storage["key"] = fileKey;
    storage = {
      ...storage,
      file: {
        lastModified: binaryFile.lastModified,
        name: binaryFile.name,
        type: binaryFile.type,
        size: binaryFile.size
      }
    }
    // COPY (STREAM) TO STORAGE
    let resPutObject = await putObject({
      provider,
      accountId,
      accessKeyId,
      secretAccessKey,
      bucket,
      key: fileKey,
      body: binaryFile.stream(),
      type: binaryFile.type
    });
    if (!resPutObject?.ok) {
      throwError({
        message: "Unable to upload to storage",
        cause: new Error(resPutObject?.error)
      });
    };
  };
  // PROCESS CHUNKS (IF EXIST)
  let entries = [];
  const chunks = [];
  if (options?.chunks) {
    for (let ii=0; ii < options?.chunks?.length; ii++) {
      const key = options?.chunks?.[ii];
      const value = formData.get(key);
      entries.push([key, value]);
    };
  } else {
    for (let ii=0; ii < textFiles.length; ii++) {
      const key = textFiles[ii];
      const value = formData.get(key);
      entries.push([key, value]);
    };
  };
  for (let jj=0; jj < entries.length; jj++) {
    const [key, value] = entries[jj];
    if (
      value instanceof File &&
      //value.type.startsWith("text/") &&
      key !== options?.file
    ) {
      const chunkId = await generateTsuid();
      const storageKey = `${keyPrefix}/${chunkId}.txt`;
      chunks.push({
        id: `${did}-${chunkId}`,
        name: key,
        storageKey,
        file: {
          lastModified: value.lastModified,
          name: value.name,
          type: value.type,
          size: value.size
        }
      });
      if (value.size === 0) {
        continue;
      };
      // COPY (STREAM) TO STORAGE
      //const buffer = await value.arrayBuffer();
      const stream = value.stream();
      const resPutObject = await putObject({
        provider,
        accountId,
        accessKeyId,
        secretAccessKey,
        bucket,
        key: storageKey,
        //body: buffer,
        body: stream,
        type: value.type,
        //type: "text/plain"
      });
      if (!resPutObject?.ok) {
        throwError({
          message: "Unable to upload to storage",
          cause: new Error(resPutObject?.error)
        });
      };
    };
  };
  // INITIAL VERSION
  const versions = [{
    desc: "Initial upload",
    createdAt: new Date().toISOString(),
    options,
    chunks 
  }];
  // INSERT INTO DB
  if (tenid) {
    id = `${id}#${tenid}`;
  };
  const pk = `${id}#${EntityConstants.DATA}`;
  const sk = did; // ulid, so it has a built-in timestamp
  const values = { data: JSON.stringify({
    id: did,
    type: "data/v1",
    metdata: {
      createdAt: new Date().toISOString(),
      service: "data",
      name,
      tags,
      ...metadata
    },
    storage,
    versions
  })};
  await insert({ env, pk, sk, values });
  // filter "file" metadata from response
  const chunksP = chunks?.map(chunk => ({ id: chunk?.id, name: chunk?.name }));
  const resData = { id: did, chunks: chunksP };
  return resData;
};

export const readData = async(request, env, params) => {
  let id = env?.request?.uid;
  if (!id) {
    return new Response("Bad Request", { status: 400 });
  };
  const tenid = request.headers.get("X-TENANT-ID");
  if (tenid) {
    //id = `${id}#${tenid}`;
    // TODO: temporary (for alpha release)
    id = `${id}#01J0KNTN17RWB1N3HWYJJCHDZR`;
  };
  const pk = `${id}#${EntityConstants.DATA}`;
  let { id: did } = params;
  if (did) {
    let isChunk = false;
    if (did?.includes("-")) {
      isChunk = true;
      did = did.split("-")[0];
    };
    const res = await selectByKeysConditional({ env, pk, sk: did });
    const data = res?.data;
    if (!data) {
      return new Response("Not Found", { status: 404 });
    };
    if (isChunk) {
      const versionRef = data?.versions?.find(version => {
        return version?.chunks?.find(chunk => chunk?.id === params?.id);
      });
      if (!versionRef) {
        return new Response("Not Found", { status: 404 });
      };
      const chunkRef = versionRef?.chunks?.find(chunk => chunk?.id === params?.id);
      if (!chunkRef) {
        return new Response("Not Found", { status: 404 });
      };
      const storageKey = chunkRef?.storageKey;
      if (!storageKey) {
        return new Response("Not Found", { status: 404 });
      };
      const chunkObject = await getObject({
        provider: env.STORAGE_PROVIDER,
        accountId: env.STORAGE_ACCOUNT_ID,
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
        bucket: env.STORAGE_BUCKET,
        key: storageKey
      });
      const text = await chunkObject.text();
      return new Response(JSON.stringify({ text }), { status: 200 });
    };
    return new Response(JSON.stringify(data), { status: 200 });
  };
  const res = await selectByPK({ env, pk });
  const data = res?.map?.(item => item?.data);
  return new Response(JSON.stringify(data), { status: 200 });
};
