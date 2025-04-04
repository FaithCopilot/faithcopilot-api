import { deepParseJSON, isPotentialJSON } from "@/services/utils";

export const resolveTemplate = ({ template, context } : { template: any, context: object }): any => {
  // if not a string, return as-is
  if (typeof template !== "string") {
    return template;
  };
  // resolve variables with advanced parsing
  return template.replace(/{{([\w.]+)}}/g, (match, path) => {
    // navigate through nested object using path
    const value = path.split('.').reduce((obj: any, key: string) => 
      obj && obj[key] !== undefined ? obj[key] : undefined, 
      context
    );
    // handle various value types
    if (value === undefined) {
      // keep original if not found
      return match;
    };
    // if value is an object or array, stringify it
    if (typeof value === "object" && value !== null) {
      //const escapeJsonString = (str) => JSON.stringify(str).slice(1, -1);
      //return escapeJsonString(JSON.stringify(value));
      return JSON.stringify(value);
    }
    // for other types, ensure a String representation
    return String(value);
  });
};

export const resolveArgs = ({ args, context }: { args: object|string; context: object; }): any => {
  // handle arrays, by recursively resolving each item
  if (Array.isArray(args)) {
    return args.map(item => resolveArgs({ args: item, context }));
  };
  
  // handle strings
  if (typeof args === "string") {
    // resolve any templates in the string
    const resolvedTemplate = resolveTemplate({ template: args, context });
    
    // if the resolved template looks like a JSON object, then parse it 
    if (isPotentialJSON(resolvedTemplate)) {
      try {
        //return JSON.parse(resolvedTemplate);
        return deepParseJSON(resolvedTemplate);
      } catch (error) {
        console.error("Failed to parse JSON: ", resolvedTemplate);
        return resolvedTemplate;
      };
    };
    return resolvedTemplate;
  };

  // handle any remaining non-object types, or null, or undefined values
  if (typeof args !== "object" || args === null || args === undefined) {
    return args;
  };

  // handle objects, by recursively resolving each key/value pair 
  const resolved = {};
  for (const [key, value] of Object.entries(args)) {
    resolved[key] = resolveArgs({ args: value, context });
  };
  return resolved;
};