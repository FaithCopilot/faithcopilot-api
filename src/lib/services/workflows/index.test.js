import { describe, expect, test } from "vitest";
//import fetch from 'node-fetch';
import { run } from "./index";

import workflows from "./workflows.json";

/*
{
    "body": {
        "options": {
            "model": {
                "provider": "openrouter",
                "label": "meta-llama/llama-3-8b-instruct:nitro",
                "value": "meta-llama/llama-3-8b-instruct:nitro"
            },
            "inputContext": {
                "label": "Got Questions",
                "value": "gotquestions",
                "config": {
                    "name": "Got Questions",
                    "url": "https://www.gotquestions.org/incarnation-of-Christ.html",
                    "method": "GET",
                    "headers": {},
                    "parsers": {
                        "output": {
                            "enabled": true,
                            "code": "const questionRegex = /<h1><span itemprop=\"name headline\" property=\"og:title\">(.*?)<\\/span><\\/h1>/;\nconst questionMatch = text.match(questionRegex);\nconst question = questionMatch ? questionMatch[1] : null;\n\nconst answerRegex = /<div itemprop=\"articleBody\">(.*?)<\\/div>(.*?)<\\/div>/s;\nconst answerMatch = text.match(answerRegex);\nconst answer = answerMatch ? (answerMatch[1] + answerMatch[2]).trim() : null;\n\nreturn \"QUESTION: \" + question + \"\\n\\n\" + \"ANSWER: \" + answer;"
                        }
                    }
                }
            },
            "outputControl": {
                "label": "Keywords",
                "value": "keywords",
                "config": {
                    "name": "Keywords",
                    "headers": {},
                    "parsers": {
                        "output": {
                            "enabled": true,
                            "code": "if (text?.toLowerCase()?.includes(\"incarnation\")) { return \"I am sorry, I cannot comment on that\"; }; return text;"
                        }
                    }
                }
            }
        }
    }
}
*/

describe("WORKFLOWS", () => {
  const env = {};
  const onSuccess = (message, idx) => console.log(message, idx);
  const onError = (message, idx) => console.error("Error: ", message, idx);
  test("run()", async () => {
    const responses = await run(workflows, { fetcher: fetch, onSuccess, onError });
    console.log(responses);
  });
});
