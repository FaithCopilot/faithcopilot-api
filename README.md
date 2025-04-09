# FaithCopilot 🐟 - "Helping you put the AI in FAITH"

FaithCopilot 🐟 (FC) API is an open source fork of [FaithCopilot Cloud 🐟☁️ ](https://faithcopilot.com) which enables local (private or even offline) usage of FC for personal, private, or enterprise use cases. It largely implements functionality available in the FC Cloud offering, but the Cloud offering will continue to move in a more public, consumer, and social direction.

While not technically required, normally FC API will deploy/run alongside the corresponding [FaithCopilot 🐟 Web App](https://github.com/FaithCopilot/faithcopilot-app)


## Highlighted Features

* Supports local and offline usage
* Interface with private models
* Workflow capabilities (ie, a "poorman's" Zapier, Make):
  - Context: Web Search, Proprietary Data, APIs, MCP, etc...
  - Safety: Guardrails, Evals, etc...
* Integrated Search support
* Access control capabilities: API Keys, Policies and more 
* Gather data to fine-tune models


## Getting Started

This section should provide a quick overview of how to get your project running.


### Prerequisites

Before you begin, ensure you have the following installed:

* Node (https://nodejs.org/)
* pnpm (https://pnpm.io/)
* nvm (https://github.com/nvm-sh/nvm)


### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/FaithCopilot/faithcopilot-api.git
    cd faithcopilot-api
    ```
2.  Initialize the Node environment: 
    ```bash
    nvm use
    ```
3.  Install the npm packages:
    ```bash
    pnpm install
    ```
4.  Start the App:
    ```bash
    pnpm run dev
    ```


### Configuring External Dependencies

This project relies on several external services that need to be set up separately. Follow the detailed instructions in the documentation for each dependency:

* [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (auto-installed above)
* [DynamoDB Local](docs/dynamodb-local.md): DynamoDB was chosen bc it is highly scalable with consistent low latency, and while that makes sense for our FC Cloud platform, this open source fork will likely migrate to something like SQLite (or Cloudflare D1 which uses SQLite and works locally in a similar way to R2 for object storage)
* [ChromaDB](docs/chromadb.md)
* [via HuggingFace](docs/via-huggingface.md) or [llama.cpp](docs/llama-cpp.md)
