import {
  PROVIDER as PROVIDER_JOSE,
  generateToken as generateToken_jose,
  parseToken as parseToken_jose,
  verifyToken as verifyToken_jose,
} from "./jose.js";

const DEFAULT_PROVIDER = PROVIDER_JOSE;

export const generateToken = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_JOSE:
      return generateToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const parseToken = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_JOSE:
      return parseToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const verifyToken = async (args) => {
  const provider = args?.provider || DEFAULT_PROVIDER;
  switch (provider) {
    case PROVIDER_JOSE:
      return verifyToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};
