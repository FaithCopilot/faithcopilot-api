/**
 * Detect if a string is potentially a JSON string
 * @param {*} str - Input to check
 * @returns {boolean} - Whether the input is potentially a JSON string
 */
export const isPotentialJSON = (str: string): boolean => {
  if (typeof str !== 'string') return false;
  const trimmed = str.trim();
  return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
         (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

/**
 * Parse a (potentially) deeply nested JSON string
 * @param input - Input to parse
 * @returns {object|string|number|boolean|null|undefined} - Parsed JSON object 
 */
export const deepParseJSON = (input?: object|string|number|boolean|null): object | string | number | boolean | null | undefined => {
  // handle null or undefined
  if (input === null || input === undefined) {
    return input;
  };
  // if input is a string, attempt to parse as JSON
  if (typeof input === 'string') {
    // attempt to unescape any escaped JSON string
    const unescapedInput = input.replace(/\\"/g, '"');
    try {
      // try parsing the unescaped string
      const parsed = JSON.parse(unescapedInput);
      // recursively parse the result
      return deepParseJSON(parsed);
    } catch (error) {
      // if parsing fails, return the original string
      return input;
    };
  };
  // if input is an array, map each element
  if (Array.isArray(input)) {
    return input.map(deepParseJSON);
  };
  // if input is an object, recursively parse each value
  if (typeof input === 'object' && input !== null) {
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = deepParseJSON(value);
    };
    return result;
  };
  // return any primitive type "as-is"
  return input;
};