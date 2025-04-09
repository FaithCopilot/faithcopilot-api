import { hash, compare } from "bcryptjs";

export const PROVIDER = "bcryptjs";

export const hashPassword = async ({ env, password }) => {
  const hashedPassword = await hash(password, 10);
  return { hash: hashedPassword };
};

export const comparePassword = async ({ env, password, hashedPassword }) => {
  const isMatch = await compare(password, hashedPassword);
  return { matches: isMatch };
};