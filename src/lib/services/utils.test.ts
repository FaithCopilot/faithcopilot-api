import { expect, test, describe } from "vitest";
import { deepParseJSON } from "./utils";

describe('deepParseJSON', () => {
  test('handles null and undefined', () => {
    expect(deepParseJSON(null)).toBe(null)
    expect(deepParseJSON(undefined)).toBe(undefined)
  })

  test('handles primitive values', () => {
    expect(deepParseJSON(123)).toBe(123)
    expect(deepParseJSON("hello")).toBe("hello")
    expect(deepParseJSON(true)).toBe(true)
  })

  test('parses simple JSON strings', () => {
    expect(deepParseJSON('{"name": "test"}')).toEqual({name: 'test'})
    expect(deepParseJSON('[1,2,3]')).toEqual([1,2,3])
  })

  test('parses nested JSON strings', () => {
    const input = '{"data": "{\\"nested\\": {\\"value\\": 123}}"}'
    const expected = {data: {nested: {value: 123}}}
    expect(deepParseJSON(input)).toEqual(expected)
  })

  test('handles arrays with mixed content', () => {
    const input = ['[1,2]', {key: '"{\\"nested\\":true}"'}, 123]
    const expected = [[1,2], {key: {nested: true}}, 123]
    expect(deepParseJSON(input)).toEqual(expected)
  })

  test('handles malformed JSON', () => {
    expect(deepParseJSON('{invalid}')).toBe('{invalid}')
    expect(deepParseJSON('{"missing": "quote}')).toBe('{"missing": "quote}')
  })

  test('handles deeply nested structures', () => {
    const input = '{"l1": "{\\"l2\\": {\\"l3\\": {\\"l4\\": \\"{\\\\\\"value\\\\\\":123}\\\"}"}}"}'
    const expected = {l1: {l2: {l3: {l4: {value: 123}}}}}
    expect(deepParseJSON(input)).toEqual(expected)
  })

  test('handles escaped sequences', () => {
    const input = '{"text": "Hello \\"World\\""}'
    const expected = {text: 'Hello "World"'}
    expect(deepParseJSON(input)).toEqual(expected)
  })

  test('handles empty structures', () => {
    expect(deepParseJSON('{}')).toEqual({})
    expect(deepParseJSON('[]')).toEqual([])
    expect(deepParseJSON('""')).toBe('')
  })
})