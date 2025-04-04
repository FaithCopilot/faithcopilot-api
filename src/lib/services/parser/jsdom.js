const { JSDOM } = require("jsdom");

const getParserIIFE = (code) => `
  window.output = (() => {
    const parse = (text) => {
      ${code}
    };
    return parse(input);
  })();
`;

export const parse = async (input, code) => {
  const dom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {
    runScripts: "outside-only",
  });
  const parserIIFE = getParserIIFE(code);
  dom.window.input = input;
  try {
    await dom.window.eval(`
      (() => {
        ${parserIIFE}
      })()
    `);
    const output = dom.window.output;
    return output;
  } catch (error) {
    throw new Error("Error occurred while evaluating the code:", error);
  }
};
