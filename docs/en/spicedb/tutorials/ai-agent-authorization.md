# Secure AI Agents with Fine Grained Authorization

::: tip
Original page: [authzed.com/docs](https://authzed.com/docs/spicedb/tutorials/ai-agent-authorization) | [中文版](/zh/spicedb/tutorials/ai-agent-authorization)
:::

## Overview

This tutorial demonstrates building a secure Retrieval-Augmented Generation (RAG) pipeline where AI Agents can only access documents they're authorized to view, with authorization decisions enforced by SpiceDB. By the end, you will be able to get a summary of only the documents the AI Agent is authorized to view.

## Prerequisites

- **SpiceDB instance** -- Installation instructions available for [macOS](/en/spicedb/getting-started/install/macos)
- **Pinecone account** with API key
- **OpenAI Platform account** with API key
- **Jupyter Notebook** running locally

## Running SpiceDB

Launch a local SpiceDB instance using:

```bash
spicedb serve --grpc-preshared-key "agents"
```

Upon successful startup, the terminal displays initialization logs confirming the gRPC server is started serving on `addr=:50051 insecure=true network=tcp service=grpc workers=0`.

## Notebook Setup

Clone the workshops repository and navigate to the ai-agent-authorization directory:

```bash
cd ai-agent-authorization
```

Launch the Jupyter notebook with either command:

```bash
jupyter ai-agent-authz-v2.ipynb
python3 -m notebook
```

## Implementation

The tutorial provides step-by-step instructions within the Jupyter Notebook `ai-agent-authz-v2.ipynb`. The notebook contains the complete implementation for adding fine-grained authorization to AI agents, integrated with OpenAI, Pinecone, and LangChain.

## Related Resources

- [Testing RAG Pipelines with Testcontainers](/en/spicedb/integrations/testcontainers)
- [Securing RAG Pipelines with SpiceDB](/en/spicedb/tutorials/secure-rag-pipelines)
