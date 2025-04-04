import { expect, test, describe } from "vitest";
import {
  resolveTemplate,
  resolveArgs
} from "./template";

describe('resolveTemplate', () => {
  test('should return non-string templates as-is', () => {
    const input = { foo: 'bar' };
    expect(resolveTemplate({ template: input, context: {} })).toEqual(input);
  });

  test('should replace simple variables', () => {
    const template = 'Hello {{name}}!';
    const context = { name: 'World' };
    expect(resolveTemplate({ template, context })).toBe('Hello World!');
  });

  test('should handle nested object access', () => {
    const template = '{{user.name}} is {{user.age}} years old';
    const context = { user: { name: 'John', age: 30 } };
    expect(resolveTemplate({ template, context })).toBe('John is 30 years old');
  });

  test('should keep original placeholder if value not found', () => {
    const template = 'Hello {{unknown}}!';
    const context = { name: 'World' };
    expect(resolveTemplate({ template, context })).toBe('Hello {{unknown}}!');
  });

  test('should stringify objects and arrays', () => {
    const template = 'Data: {{data}}';
    const context = { data: { foo: 'bar' } };
    expect(resolveTemplate({ template, context })).toBe('Data: {"foo":"bar"}');
  });
});

describe('resolveArgs', () => {
  test('should handle array inputs', () => {
    const args = ['{{name}}', '{{age}}'];
    const context = { name: 'John', age: 30 };
    expect(resolveArgs({ args, context })).toEqual(['John', '30']);
  });

  test('should resolve template strings', () => {
    const args = 'Hello {{name}}!';
    const context = { name: 'World' };
    expect(resolveArgs({ args, context })).toBe('Hello World!');
  });

  test('should parse JSON strings after template resolution', () => {
    const args = '{"name": "{{name}}"}';
    const context = { name: 'John' };
    expect(resolveArgs({ args, context })).toEqual({ name: 'John' });
  });

  test('should handle non-object inputs', () => {
    expect(resolveArgs({ args: 42, context: {} })).toBe(42);
    expect(resolveArgs({ args: null, context: {} })).toBe(null);
    expect(resolveArgs({ args: undefined, context: {} })).toBe(undefined);
  });

  test('should recursively resolve nested objects', () => {
    const args = {
      user: {
        name: '{{name}}',
        details: {
          age: '{{age}}'
        }
      }
    };
    const context = { name: 'John', age: 30 };
    expect(resolveArgs({ args, context })).toEqual({
      user: {
        name: 'John',
        details: {
          age: '30'
        }
      }
    });
  });

  test('should handle failed JSON parsing', () => {
    const args = '{invalid json}';
    const context = {};
    expect(resolveArgs({ args, context })).toBe('{invalid json}');
  });
});

/*
// Example usage scenarios
const scenarios = [
  {
    context: {
      result2: JSON.stringify([1, 2, 3])
    },
    template: "{ \"topK\": 2, \"includeMetadata\": true, \"includeData\": true, \"vector\": {{result2}} }"
  },
  {
    context: {
      result2: JSON.stringify([1, 2, 3])
    },
    template: "{ \"topK\": 2, \"includeMetadata\": true, \"includeData\": true, \"vector\": \"{{result2}}\" }"
  },
  {
    context: {
      result2: [1, 2, 3]
    },
    template: "{ \"topK\": 2, \"includeMetadata\": true, \"includeData\": true, \"vector\": \"{{result2}}\" }"
  },
  {
    context: {
      result: {
        step2: JSON.stringify({ id: 123, name: "example" })
      }
    },
    template: "{ \"topK\": 2, \"includeMetadata\": true, \"includeData\": true, \"vector\": {{result.step2}} }"
  },
  {
    context: {
      result: {
        step2: { id: 123, name: "example" }
      }
    },
    template: "{ \"topK\": 2, \"includeMetadata\": true, \"includeData\": true, \"vector\": \"{{result.step2}}\" }"
  }
];

scenarios.forEach((scenario, index) => {
  console.log(`Scenario ${index + 1}:`);
  const resolvedTemplate = resolveArgs(scenario.template, scenario.context);
  console.log('Template:', scenario.template);
  console.log('Resolved:', resolvedTemplate);
  console.log('Parsed:', JSON.parse(resolvedTemplate));
  console.log('---');
});
*/