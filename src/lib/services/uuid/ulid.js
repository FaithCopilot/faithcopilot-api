//import { generate, parse } from 'xksuid';
//import { decodeTime, ulid } from 'ulid';
import { decodeTime, ulidFactory } from "ulid-workers";
const ulid = ulidFactory();
/*
import { decodeTime, monotonicFactory } from 'ulid';

// ref: https://github.com/ulid/javascript/issues/72#issuecomment-1143617380
const prng = () => {
  const buffer = new Uint8Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 0xff;
};
const ulid = monotonicFactory(prng);
*/

/*
USAGE:
const tsuid = await generateTsuid();
const ts = parseTsuid({ tsuid });
*/

/**
 * Generate a time-sortable UUID (tsuid)
 *
 * @returns {Promise<string>}
 */
export const generateTsuid = async () => ulid(); //generate();

/**
 * Parse time-sortable UUID (tsuid) to get timestamp
 *
 * @param {*} tsuid
 * @param {*} options
 * @returns {Date} timestamp
 */
export const parseTsuid = ({ tsuid, options }) => {
  //const { ts } = parse(ksuid);
  //return ts;
  return decodeTime(tsuid);
};
