# Secure Your RAG Pipelines With Fine Grained Authorization

::: tip
Original page: [authzed.com/docs](https://authzed.com/docs/spicedb/tutorials/secure-rag-pipelines) | [中文版](/zh/spicedb/tutorials/secure-rag-pipelines)
:::

## Overview

This tutorial demonstrates how to use SpiceDB to safeguard sensitive data in RAG (Retrieval-Augmented Generation) pipelines. The guide teaches pre-filtering and post-filtering of vector database queries using authorized object IDs to enhance both security and efficiency.

**Technologies Used:** OpenAI, Pinecone, LangChain, Jupyter Notebook, and SpiceDB

## Why This Matters

Building enterprise-ready AI systems presents significant challenges around data security, accuracy, scalability, and integration -- particularly in regulated industries like healthcare and finance. Organizations are implementing guardrails around RAG to mitigate risks associated with LLMs, specifically regarding sensitive data exfiltration and personally identifiable information leakage.

The primary mitigation strategy involves constructing permissions systems with "advanced fine grained authorization capabilities such as returning lists of authorized subjects and accessible resources." This ensures timely access to authorized data while preventing sensitive information exfiltration and improving RAG efficiency and performance at scale.

## Prerequisites

- Access to a SpiceDB instance ([installation instructions](/en/spicedb/getting-started/install/macos))
- Pinecone account with API key
- OpenAI Platform account with API key
- Jupyter Notebook running locally

## Setup Instructions

### Running SpiceDB

Launch a local SpiceDB instance with:

```bash
spicedb serve --grpc-preshared-key rag-rebac-walkthrough
```

### Getting the Jupyter Notebook

1. Clone the [workshops repository](https://github.com/authzed/workshops) from GitHub
2. Navigate to the `secure-rag-pipelines` directory
3. Start the notebook using `jupyter 01-rag.ipynb` or `python3 -m notebook`

## Implementation Guide

The tutorial includes a step-by-step Jupyter Notebook with complete implementation instructions for adding fine-grained authorization to RAG pipelines.

## Alternative LLM Options

To substitute OpenAI with DeepSeek or other LLMs, refer to the DeepSeek branch of the workshops repository. This alternative implementation uses DeepSeek LLM via OpenRouter while maintaining the same core approach.

## Related Resources

- [AI Agent Authorization Tutorial](/en/spicedb/tutorials/ai-agent-authorization)
- [Access Control in RAG with Pinecone](/en/spicedb/integrations/pinecone)
- [LangChain & LangGraph Integration](/en/spicedb/integrations/langchain-spicedb)
