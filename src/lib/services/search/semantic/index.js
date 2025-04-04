import { getEnvContext, getMultiKeysByEntity } from "@/services/helpers";
import { selectByMultiKeys } from "@/services/db/dynamodb";
import { run } from "@/services/workflows";

import { EntityConstants } from "@/constants";

const getContext = async({ env, oid, uid, tenid, q, topK }) => {
  const _env = await getEnvContext({ env, oid, uid, tenid });
  const context = {
    data: {
      q,
      topK
    },
    env: _env
  };
  return context;
};

export const search = async ({ env, oid, uid, tenid, profile, q, topK }) => {
  const keys = getMultiKeysByEntity({ oid, uid, entity: EntityConstants.PROFILE_SEARCH, sk: profile });
  const { data: workflow } = await selectByMultiKeys({ env, keys });
  const steps = workflow?.steps ?? [];
  const context = await getContext({ env, oid, uid, tenid, q, topK });
  return run(env, steps, context); // TODO: named params
};