import { AwsClient } from "aws4fetch";

const replaceApostrophe = (str) => str?.replace(/'/g, "&apos;") ?? "";
const restoreApostrophe = (str) => str?.replace(/&apos;/g, "'") ?? "";

const dynamoDbOp = async ({ env, op, opBody }) => {
  //console.log('dynamoDbOp', op, JSON.stringify(opBody));
  const aws = new AwsClient({
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  });
  const res = await aws.fetch(env.AWS_DYNAMODB_ENDPOINT, {
  //const res = await aws.fetch(`https://dynamodb.${env.AWS_REGION}.amazonaws.com`, {
  //const res = await aws.fetch(`http://localhost:8000`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Amz-Target": `DynamoDB_${env.AWS_DYNAMODB_TARGET_VERSION}.${op}`,
    },
    body: JSON.stringify(opBody),
  });
  //console.log('dynamoDbOp', op, res.status, await res.text());
  /*
   * DynamoDB returns 200 on success, or a variety of 4xx/5xx on error
   * see: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/CommonErrors.html
   */
  if (res.status !== 200) {
    const errorText = await res.text();
    console.error("dynamoDbOp", op, res.status, errorText);
    throw new Error(500, errorText);
  }
  return res.json();
};

// NOTE: PartiQL Statements limited to max length of 8192
// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ExecuteStatement.html
export const execute = async ({ env, stmt, op, item }) => {
  if (stmt) {
    return dynamoDbOp({ env, op: "ExecuteStatement", opBody: { Statement: stmt } });
  }
  if (item && op) {
    return dynamoDbOp({ env, op, opBody: item });
  }
  throw new Error("execute: stmt or item (and op) required");
};

// NOTE: PartiQL transactions are limited to 100 total statements
// https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_ExecuteTransaction.html
// TODO: handle like selectBatchRecordsAll
export const executeTx = async ({ env, stmts, items }) => {
  if (stmts) {
    return dynamoDbOp({ env, op: "ExecuteTransaction", opBody: { TransactStatements: stmts } });
  }
  if (items) {
    return dynamoDbOp({ env, op: "TransactWriteItems", opBody: { TransactItems: items } });
  }
  throw new Error("executeTx: stmts or items required");
};

export const executeBatch = async ({ env, stmts }) => dynamoDbOp({ env, op: "BatchExecuteStatement", opBody: { Statements: stmts } });

// TODO: provide examples in jsdoc and/or tests
const mapConditions = ({ prefix, conditions }) => {
  if (!conditions || conditions?.length < 1) return "";
  const _conditions = conditions.map(({ key, value }) => `${key} = ${value}`).join(" AND ");
  return `${prefix} ${_conditions}`;
};

// TODO: check whether 'sk' exists
const mapKeysCondition = ({ pk, sk }) =>
  mapConditions({
    prefix: "WHERE",
    conditions: [
      { key: "pk", value: `'${pk}'` },
      { key: "sk", value: `'${sk}'` },
    ],
  });

const getAbacConditionCheckItem = ({ env, abac }) => ({
  TableName: env.AWS_DYNAMODB_TABLE,
  Key: { pk: { S: abac.pk }, sk: { S: abac.sk } },
  ConditionExpression: "attribute_exists(pk) AND attribute_exists(sk)",
});

const getAbacConditionCheckStmt = ({ env, abac }) =>
  `EXISTS(SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk='${abac.pk}' AND sk='${abac.sk}' AND "sk" IS NOT MISSING)`;

// TODO: provide examples in jsdoc and/or tests
export const mapFiltersToConditions = ({ filters }) => {
  const conditions = [];
  for (const prop in filters) {
    const value = filters[prop];
    if (value) {
      conditions.push({ key: prop, value: `'${value}'` });
    }
  }
  return conditions;
};

const prepareStatementValues = ({ values }) => {
  if (typeof values === "object") {
    values = JSON.stringify(values);
  }
  if (typeof values === "string") {
    // NOTE: DynamoDB PartiQL treats single quotes as a reserved character, so
    // transform single quotes to &apos; to avoid errors
    values = replaceApostrophe(values);
  }
  if (typeof values !== "string") {
    throw new Error("Unable to prepare statement values for: ", JSON.stringify(values));
  }
  return values;
};


///////////////////////////////////////////////////////////////////////////////
// SELECT/READ
///////////////////////////////////////////////////////////////////////////////

// assumes all values are strings
// assumes "data" attribute is stringified JSON
const mapAttributesToObject = ({ record, skipKeys = false }) => {
  const obj = {};
  for (const prop in record) {
    if (prop === "data") {
      let value = record[prop]?.S ?? "";
      // NOTE: DynamoDB PartiQL treats single quotes as a reserved character, so
      // transform &apos; to single quotes per users' expectations
      value = restoreApostrophe(value);
      try {
        obj[prop] = JSON.parse(value);
      } catch (err) {
        console.error(err);
        obj[prop] = {};
      }
    } else {
      obj[prop] = record[prop]?.S ?? "";
    }
  }
  return obj;
};

// NOTE: BatchExecuteStatement and BatchWriteItem can perform no more than 25 statements per batch
// ref: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/ql-reference.multiplestatements.batching.html
const selectBatchRecords = async ({ env, stmts }) => {
  const data = await executeBatch({ env, stmts });
  return data?.Responses?.map((item) => mapAttributesToObject({ record: item?.Item }));
};

// TODO: use Promise.allSettled to handle errors?
const selectBatchRecordsAll = async ({ env, stmts, limit = 25 }) => {
  if (stmts.length < 1) {
    return [];
  }
  if (stmts.length <= limit) {
    return selectBatchRecords({ env, stmts });
  }
  // slice stmts into segments of "limit"
  const stmtSegments = [];
  for (let ii = 0; ii < stmts.length; ii += limit) {
    stmtSegments.push(stmts.slice(ii, ii + limit));
  }
  // execute all segments, wait for all to complete
  const allData = await Promise.all(stmtSegments.map((stmtSegment) => executeTx({ env, stmts: stmtSegment })));
  // flatten the response arrays and map the attributes to objects
  const records = allData.flatMap((data) => data?.Responses ?? []).map((item) => mapAttributesToObject({ record: item?.Item }));
  return records;
};

export const selectBatch = async ({ env, keys }) => {
  const stmts = keys?.map((item) => ({
    Statement: `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk='${item.pk}' AND sk='${item.sk}'`,
  }));
  //return selectBatchRecordsAll({ env, stmts });
  return selectBatchRecordsAll({ env, stmts, limit: 5 });
};

export const selectMultipleRecords = async ({ env, stmt }) => {
  const data = await execute({ env, stmt });
  return data?.Items?.map((record) => mapAttributesToObject({ record, skipKeys: false })).filter((n) => n) ?? [];
};

export const selectSingleRecord = async ({ env, stmt }) => {
  const data = await execute({ env, stmt });
  const record = data?.Items[0];
  return mapAttributesToObject({ record });
};

export const selectByKeysConditional = async ({ env, pk, sk, conditions }) => {
  const stmt = `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} ${mapKeysCondition({ pk, sk })} ${mapConditions({ prefix: "AND", conditions })};`;
  return selectSingleRecord({ env, stmt });
};

// NOTE: conditions are optional; pk/skBeginsWith alone are much more efficient
export const selectByPKSKBeginsWithConditional = async ({ env, pk, skBeginsWith, conditions }) => {
  const stmt = `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk = '${pk}' AND begins_with(sk, '${skBeginsWith}') ${mapConditions({ prefix: "AND", conditions })};`;
  return selectMultipleRecords({ env, stmt });
};

// TODO: this is a scan! remove?
export const selectByPKBeginsWithSKBeginsWithConditional = async ({ env, pkBeginsWith, skBeginsWith, conditions }) => {
  const stmt = `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE begins_with(pk, '${pkBeginsWith}') AND begins_with(sk, '${skBeginsWith}') ${mapConditions({ prefix: "AND", conditions })};`;
  return selectMultipleRecords({ env, stmt });
};

export const selectIdentity = async ({ env, pk }) => selectByKeysConditional({ env, pk, sk: pk });

export const selectByPK = async ({ env, pk }) => {
  const stmt = `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk = '${pk}';`;
  return selectMultipleRecords({ env, stmt });
};

export const selectByMultiKeys = async ({ env, keys }) => {
  const batchRes = await selectBatch({ env, keys });
  const idx = batchRes?.findIndex((item) => item?.pk);
  const foundRes = batchRes?.[idx];
  if (!foundRes?.data) {
    console.error("selectByMultiKeys: Not Found, keys: ", JSON.stringify(keys));
    throw new Error(404, "Not Found");
  };
  return { idx, data: foundRes.data };
};

export const selectTx = async ({ env, abac, keys }) => {
  const stmts = [];
  if (abac) {
    // ConditionCheck not available for reads (considered a 'write' operation)
    // so use a separate SELECT statement to validate ABAC
    const abacStmt = `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk='${abac.pk}' AND sk='${abac.sk}'`;
    stmts.push({ Statement: abacStmt });
    keys?.forEach((_keys) =>
      stmts.push({ Statement: `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk='${_keys.pk}' AND sk='${_keys.sk}'` }),
    );
    const res = await executeTx({ env, stmts });
    // this is our ConditionCheck replacement (ABAC statement returns empty obj)
    // {"Responses":[{},{...},...
    if (!res?.Responses?.[0]?.Item) {
      throw new Error(403, "Forbidden per ABAC");
    }
    if (res?.Responses?.length == 2) {
      // if only a single record, return the object directly
      return mapAttributesToObject({ record: res.Responses[1]?.Item });
    }
    // slice off the ABAC response, and map the remaining returned record
    return res?.Responses?.slice(1)?.map((item) => mapAttributesToObject({ record: item?.Item }));
  }
  keys?.forEach((_keys) =>
    stmts.push({ Statement: `SELECT * FROM ${env.AWS_DYNAMODB_TABLE} WHERE pk='${_keys.pk}' AND sk='${_keys.sk}'` }),
  );
  const res = await executeTx({ env, stmts });
  if (res?.Responses?.length == 1) {
    // if only a single record, return the object directly
    return mapAttributesToObject({ record: res.Responses[0]?.Item });
  }
  return res?.Responses?.map((item) => mapAttributesToObject({ record: item?.Item }));
};

export const exists = async ({ env, pk, sk }) => {
  if (!pk) throw new Error(500, "pk is required");
  if (!sk) {
    return selectIdentity({ env, pk });
  }
  return selectByKeysConditional({ env, pk, sk });
};


///////////////////////////////////////////////////////////////////////////////
// INSERT/CREATE
///////////////////////////////////////////////////////////////////////////////

export const getInsertItem = ({ env, values }) => {
  // only support "pk", "sk", "data", "expiresAt", "entity", and "event"
  const Item = { pk: { S: values.pk }, sk: { S: values.sk } };
  if (values?.data) {
    Item["data"] = {
      S: typeof values.data === "string" ? values.data : JSON.stringify(values.data),
    };
  }
  if (values?.expiresAt) {
    Item["expiresAt"] = {
      N: `${values.expiresAt}`, // needs to be 'string' value for some reason
    };
  }
  return {
    TableName: env.AWS_DYNAMODB_TABLE,
    Item,
    ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)",
  };
};

export const getInsertStmt = ({ env, values }) => {
  const stmts = [];
  for (const prop in values) {
    let value = values?.[prop];
    // only support "pk", "sk", "data", "expiresAt", "entity", and "event"
    if (prop === "pk" || prop === "sk" || prop === "data" || prop === "entity" || prop === "event") {
      // prepare "values" per DynamoDB PartiQL requirements
      value = prepareStatementValues({ values: value });
      stmts.push(`'${prop}' : '${value}'`);
    }
    if (prop === "expiresAt") {
      // numeric value
      stmts.push(`'${prop}' : ${value}`);
    }
  }
  const mappedValues = `{ ${stmts.join(", ")} }`;
  return `INSERT INTO ${env.AWS_DYNAMODB_TABLE} VALUE ${mappedValues};`;
};

export const insertTx = async ({ env, abac, values, partiql }) => {
  if (partiql) {
    const stmts = [];
    if (abac) {
      const conditionCheckStmt = getAbacConditionCheckStmt({ env, abac });
      stmts.push({ Statement: conditionCheckStmt });
    }
    values?.forEach((_values) => stmts.push({ Statement: `${getInsertStmt({ env, values: _values })}` }));
    return executeTx({ env, stmts });
  }
  const items = [];
  if (abac) {
    const conditionCheckItem = getAbacConditionCheckItem({ env, abac });
    items.push({ ConditionCheck: conditionCheckItem });
  }
  values?.forEach((_values) => items.push({ Put: getInsertItem({ env, values: _values }) }));
  return executeTx({ env, items });
};

export const insert = async ({ env, pk, sk, values, partiql }) => {
  if (!values) values = {};
  const _values = { ...values, pk, sk };
  if (partiql) {
    const stmt = getInsertStmt({ env, values: _values });
    return execute({ env, stmt });
  }
  const item = getInsertItem({ env, values: _values });
  return execute({ env, op: "PutItem", item });
};

export const insertByKeys = async ({ env, pk, sk, values, partiql }) => insert({ env, pk, sk, values, partiql });

export const insertIdentity = async ({ env, pk, values, partiql }) => insert({ env, pk, sk: pk, values, partiql });


///////////////////////////////////////////////////////////////////////////////
// UPDATE
///////////////////////////////////////////////////////////////////////////////

// TODO: handle conditions
export const getUpdateItem = ({ env, pk, sk, values, conditions }) => ({
  TableName: env.AWS_DYNAMODB_TABLE,
  Key: { pk: { S: pk }, sk: { S: sk } },
  UpdateExpression: "SET #ffffff = :ffffff",
  ExpressionAttributeValues: {
    ":ffffff": {
      S: typeof values === "string" ? values : JSON.stringify(values),
    },
  },
  ExpressionAttributeNames: {
    "#ffffff": "data",
  },
});

export const getUpdateStmt = ({ env, pk, sk, values, conditions }) => {
  const keyConditions = sk ? mapKeysCondition({ pk, sk }) : mapKeysCondition({ pk, sk: pk });
  // prepare "values" per DynamoDB PartiQL requirements
  values = prepareStatementValues({ values });
  // NOTE: always setting "data" attribute
  const setStmt = `SET "data" = '${values}'`;
  const stmt = `UPDATE ${env.AWS_DYNAMODB_TABLE} ${setStmt} ${keyConditions} ${mapConditions({ prefix: "AND", conditions })};`;
  return stmt;
};

export const updateByKeysConditional = async ({ env, pk, sk, values, conditions, partiql }) => {
  if (partiql) {
    const stmt = getUpdateStmt({ env, pk, sk, values, conditions });
    return execute({ env, stmt });
  }
  const item = getUpdateItem({ env, pk, sk, values, conditions });
  return execute({ env, op: "UpdateItem", item });
};
export const updateByKeys = async ({ env, pk, sk, values }) => updateByKeysConditional({ env, pk, sk, values });

export const updateIdentity = async ({ env, pk, values, partiql }) => updateByKeysConditional({ env, pk, sk: pk, values, partiql });

export const updateTx = async ({ env, abac, values, partiql }) => {
  if (partiql) {
    const stmts = [];
    if (abac) {
      const conditionCheckStmt = getAbacConditionCheckStmt({ env, abac });
      stmts.push({ Statement: conditionCheckStmt });
    }
    values?.forEach((_values) => stmts.push({ Statement: getUpdateStmt({ env, pk: _values.pk, sk: _values.sk, values: _values.data }) }));
    return executeTx({ env, stmts });
  }
  const items = [];
  if (abac) {
    const conditionCheckItem = getAbacConditionCheckItem({ env, abac });
    items.push({ ConditionCheck: conditionCheckItem });
  }
  values?.forEach((_values) => items.push({ Update: getUpdateItem({ env, pk: _values.pk, sk: _values.sk, values: _values.data }) }));
  // returns {}, if successful
  return executeTx({ env, items });
};


///////////////////////////////////////////////////////////////////////////////
// DELETE
///////////////////////////////////////////////////////////////////////////////

// TODO: soft-delete option (mark as attr: deleted=1)
export const deleteByKeysConditional = async ({ env, pk, sk, conditions }) => {
  // using RETURNING ALL OLD * to get the deleted record, in order to know
  // whether to return success (204 - NO CONTENT) or error (404 - NOT FOUND)
  const stmt = `DELETE FROM ${env.AWS_DYNAMODB_TABLE} ${mapKeysCondition({ pk, sk })} ${mapConditions({ prefix: "AND", conditions })} RETURNING ALL OLD *`;
  const res = await execute({ env, stmt });
  if (res.Items?.length < 1) {
    throw new Error(404, "Not Found");
  }
  return true;
};
export const deleteByKeys = async ({ env, pk, sk }) => deleteByKeysConditional({ env, pk, sk });
export const deleteIdentity = async ({ env, pk }) => deleteByKeysConditional({ env, pk, sk: pk });

export const deleteTx = async ({ env, abac, keys }) => {
  const stmts = [];
  if (abac) {
    const conditionCheckStmt = getAbacConditionCheckStmt({ env, abac });
    stmts.push({ Statement: conditionCheckStmt });
  }
  if (!keys || keys.length < 1) {
    return false;
  }
  keys?.forEach((_keys) =>
    stmts.push({
      Statement: `DELETE FROM ${env.AWS_DYNAMODB_TABLE} ${mapKeysCondition({ pk: _keys.pk, sk: _keys.sk })}`,
    }),
  );
  await executeTx({ env, stmts });
  // either throws Tx error, or is successful
  return true;
};


///////////////////////////////////////////////////////////////////////////////
// HELPERS 
///////////////////////////////////////////////////////////////////////////////

export const insertEvent = async ({ env, oid, uid, event, data }) => {
  if (typeof data !== "string") data = JSON.stringify(data);
  const pk = `uid#${uid}`; // `${oid}#${oid}`
  const sk = `evt#${event}#${new Date().toISOString()}`;
  return insert({ env, pk, sk, values: { data }});
};

// https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-time-series.html
// TODO: use different table for logs
export const insertLog = async ({ env, oid, uid, data }) => {
  if (typeof data !== "string") data = JSON.stringify(data);
  const dateParts = new Date().toISOString().split('T');
  const pk = dateParts[0];
  const sk = dateParts[1];
  return insert({ env, pk, sk, values: { oid, uid, ...data }});
};