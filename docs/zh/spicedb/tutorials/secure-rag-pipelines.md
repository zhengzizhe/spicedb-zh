# 使用细粒度授权保护你的 RAG 管道

::: tip
原文：[authzed.com/docs](https://authzed.com/docs/spicedb/tutorials/secure-rag-pipelines) | [English](/en/spicedb/tutorials/secure-rag-pipelines)
:::

## 概述

本教程演示如何使用 SpiceDB 保护 RAG（检索增强生成）管道中的敏感数据。本指南将教你使用授权对象 ID 对向量数据库查询进行前置过滤和后置过滤，以增强安全性和效率。

**使用的技术：** OpenAI、Pinecone、LangChain、Jupyter Notebook 和 SpiceDB

## 为什么这很重要

构建企业级 AI 系统在数据安全、准确性、可扩展性和集成方面面临重大挑战——尤其是在医疗保健和金融等受监管行业。组织正在围绕 RAG 实施护栏，以降低与 LLM 相关的风险，特别是敏感数据外泄和个人身份信息泄露方面。

主要的缓解策略是构建具有"高级细粒度授权能力（如返回已授权主体列表和可访问资源列表）"的权限系统。这确保了对已授权数据的及时访问，同时防止敏感信息外泄，并在大规模场景下提升 RAG 的效率和性能。

## 前提条件

- 可用的 SpiceDB 实例（[安装说明](/zh/spicedb/getting-started/install/macos)）
- Pinecone 账户及 API 密钥
- OpenAI Platform 账户及 API 密钥
- 本地运行的 Jupyter Notebook

## 设置说明

### 运行 SpiceDB

使用以下命令启动本地 SpiceDB 实例：

```bash
spicedb serve --grpc-preshared-key rag-rebac-walkthrough
```

### 获取 Jupyter Notebook

1. 从 GitHub 克隆 [workshops 仓库](https://github.com/authzed/workshops)
2. 进入 `secure-rag-pipelines` 目录
3. 使用 `jupyter 01-rag.ipynb` 或 `python3 -m notebook` 启动 notebook

## 实现指南

本教程包含一个逐步骤的 Jupyter Notebook，提供了为 RAG 管道添加细粒度授权的完整实现说明。

## 替代 LLM 选项

如需使用 DeepSeek 或其他 LLM 替代 OpenAI，请参阅 workshops 仓库的 DeepSeek 分支。该替代实现通过 OpenRouter 使用 DeepSeek LLM，同时保持相同的核心方法。

## 相关资源

- [AI Agent 授权教程](/zh/spicedb/tutorials/ai-agent-authorization)
- [使用 Pinecone 的 RAG 访问控制](/zh/spicedb/integrations/pinecone)
- [LangChain & LangGraph 集成](/zh/spicedb/integrations/langchain-spicedb)
