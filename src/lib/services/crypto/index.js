import {
  PROVIDER as PROVIDER_JOSE,
  generateToken as generateToken_jose,
  parseToken as parseToken_jose,
  verifyToken as verifyToken_jose,
} from "./jose";

import {
  PROVIDER as PROVIDER_BCRYPTJS,
  hashPassword as hashPassword_bcryptjs,
  comparePassword as comparePassword_bcryptjs,
} from "./bcryptjs";

export const generateToken = async (args) => {
  const provider = args?.provider || PROVIDER_JOSE;
  switch (provider) {
    case PROVIDER_JOSE:
      return generateToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const parseToken = async (args) => {
  const provider = args?.provider || PROVIDER_JOSE;
  switch (provider) {
    case PROVIDER_JOSE:
      return parseToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const verifyToken = async (args) => {
  const provider = args?.provider || PROVIDER_JOSE;
  switch (provider) {
    case PROVIDER_JOSE:
      return verifyToken_jose(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const hashPassword = async (args) => {
  const provider = args?.provider || PROVIDER_BCRYPTJS;
  switch (provider) {
    case PROVIDER_BCRYPTJS:
      return hashPassword_bcryptjs(args);
    default:
      throw new Error("Invalid Provider");
  }
};

export const comparePassword = async (args) => {
  const provider = args?.provider || PROVIDER_BCRYPTJS;
  switch (provider) {
    case PROVIDER_BCRYPTJS:
      return comparePassword_bcryptjs(args);
    default:
      throw new Error("Invalid Provider");
  }
};