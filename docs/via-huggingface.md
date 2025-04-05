# Huggingface

- [Transformers](https://huggingface.co/docs/transformers/installation)
- [Flask](https://flask.palletsprojects.com/en/stable/)

## Embeddings

### Run

```python
from transformers import AutoTokenizer, AutoModel
import torch
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the model and tokenizer outside the endpoint for efficiency
model_name = "BAAI/bge-base-en-v1.5"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

def get_bge_embeddings(texts):
    """Generates embeddings for a list of texts."""
    encoded_input = tokenizer(texts, padding=True, truncation=True, return_tensors='pt').to(device)
    with torch.no_grad():
        model_output = model(**encoded_input)
        embeddings = model_output.last_hidden_state[:, 0].cpu().tolist() #Move to CPU and convert to list
    return embeddings

@app.route('/embeddings', methods=['POST'])
def embeddings_endpoint():
    """Endpoint to receive text and return embeddings."""
    try:
        data = request.get_json()
        texts = data['content']
        embeddings = get_bge_embeddings(texts)
        result = [{"index": i, "embedding": [embedding]} for i, embedding in enumerate(embeddings)]
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400  # Return error with 400 Bad Request

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8002) #make publicly available.
```

### Test

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
      "content": [ "Your text here", "another test" ]
  }' \
  http://localhost:8002/embeddings

#[{"index":0,"embedding":[[0.035710409283638,0.025016536936163902,0.0540543757379055,...]]},{"index":1,"embedding":[[0.012910409283638,0.042816536936163902,0.0226543757379055,...]]}]
```


## Chat Completions

### Run

```python
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the model and tokenizer outside the endpoint for efficiency
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
model.eval()

generator = pipeline('text-generation', model=model, tokenizer=tokenizer, device=device)

def generate_chat_completion(messages, max_tokens=1000, temperature=0.7):
    """Generates text from a list of messages."""
    try:
        # Format messages into a single prompt
        prompt = ""
        for message in messages:
            if message["role"] == "system":
                prompt += f"System: {message['content']}\n"
            elif message["role"] == "user":
                prompt += f"User: {message['content']}\n"
            elif message["role"] == "assistant":
                prompt += f"Assistant: {message['content']}\n"
        prompt += "Assistant: " #prompt the model to respond as an assistant.

        sequences = generator(
            prompt,
            max_length=max_tokens,
            temperature=temperature,
            do_sample=True,
            num_return_sequences=1
        )
        generated_text = sequences[0]['generated_text']
        #remove the prompt from the response.
        return generated_text.replace(prompt,"")
    except Exception as e:
        return f"Error: {str(e)}"

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions_endpoint():
    """Endpoint to receive messages and return generated text in OpenAI chat format."""
    try:
        data = request.get_json()
        messages = data['messages']
        max_tokens = data.get('max_tokens', 1000)  # Default max tokens
        temperature = data.get('temperature', 0.7) #default temperature

        generated_text = generate_chat_completion(messages, max_tokens, temperature, top_p)

        response = {
            "id": "chatcmpl-generated",
            "object": "chat.completion",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": generated_text
                    },
                    "index": 0,
                    "logprobs": None,
                    "finish_reason": "length" if len(generated_text) > max_tokens else "stop"
                }
            ],
            "usage": {
                "prompt_tokens": len(tokenizer.encode(str(messages))), #approximate prompt tokens.
                "completion_tokens": len(tokenizer.encode(generated_text)),
                "total_tokens": len(tokenizer.encode(str(messages))) + len(tokenizer.encode(generated_text))
            }
        }
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 400  # Return error with 400 Bad Request

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) #make publicly available.
```

### Test

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
		"messages": [ {"role": "system", "content": "You are a friendly and helpful AI assistant. You answer questions concisely."}, {"role": "user", "content": "What are the first 5 prime numbers?"}, {"role": "assistant", "content": "The first five prime numbers are 2, 3, 5, 7, and 11."}, {"role": "user", "content": "What is the square root of 144?"} ],
		"temperature": 1.0,
		"max_tokens": 100
  }' \
  http://localhost:5000/v1/chat/completions
```

