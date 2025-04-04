export const throwError = ({ name, message, cause }) => {
  const err = new Error(message, { cause });
  if (name) {
    err.name = name;
  };
  throw err;
};

export const validateJSON = (obj, schema) => {
  const errors = [];
  // check for required fields
  for (const field of schema.required) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    };
  };
  // check for unexpected fields
  const allowedFields = new Set([...schema.required, ...(schema.optional || [])]);
  for (const field in obj) {
    if (!allowedFields.has(field)) {
      errors.push(`Unexpected field: ${field}`);
    };
  };
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

export const generateDefaultExpirationDate = ({ days } = {}) => {
  if (!days || typeof days !== "number") days = 1;
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + days);
  return expDate;
};

// random, n-length alphanumeric string
export const generateRandomString = (length) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomString += charset[randomIndex];
  }
  return randomString;
};

// 6-digit code
export const getCode = () => Math.floor(100000 + Math.random() * 900000);

// unix time - seconds since epoch
export const getEpochTime = () => Math.floor(Date.now() / 1000);

// https://stackoverflow.com/questions/643782/how-to-check-whether-an-object-is-a-date
export const getEndOfDayUTC = (date) => {
  if (
    !date ||
    !(date instanceof Date) ||
    !(typeof date.getMonth === 'function')
  ) {
    return date;
  };
  // UTC
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const mask = (str, len) => {
  if (!str) return "";
  return "*".repeat(len ?? str.length-4) + str.slice(-4);
};