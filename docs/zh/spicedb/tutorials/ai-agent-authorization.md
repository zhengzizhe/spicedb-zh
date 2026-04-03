# 使用细粒度授权保护 AI Agent

::: tip
原文：[authzed.com/docs](https://authzed.com/docs/spicedb/tutorials/ai-agent-authorization) | [English](/en/spicedb/tutorials/ai-agent-authorization)
:::

## 概述

本教程演示如何构建一个安全的检索增强生成（RAG）管道，使 AI Agent 只能访问其被授权查看的文档，授权决策由 SpiceDB 强制执行。完成本教程后，你将能够仅获取 AI Agent 被授权查看的文档摘要。

## 前提条件

- **SpiceDB 实例** -- 安装说明请参阅 [macOS 安装指南](/zh/spicedb/getting-started/install/macos)
- **Pinecone 账户**及 API 密钥
- **OpenAI Platform 账户**及 API 密钥
- 本地运行的 **Jupyter Notebook**

## 运行 SpiceDB

使用以下命令启动本地 SpiceDB 实例：

```bash
spicedb serve --grpc-preshared-key "agents"
```

成功启动后，终端会显示初始化日志，确认 gRPC 服务器已在 `addr=:50051 insecure=true network=tcp service=grpc workers=0` 上开始服务。

## Notebook 设置

克隆 workshops 仓库并进入 ai-agent-authorization 目录：

```bash
cd ai-agent-authorization
```

使用以下任一命令启动 Jupyter notebook：

```bash
jupyter ai-agent-authz-v2.ipynb
python3 -m notebook
```

## 实现

本教程在 Jupyter Notebook `ai-agent-authz-v2.ipynb` 中提供了逐步说明。该 notebook 包含了为 AI Agent 添加细粒度授权的完整实现，集成了 OpenAI、Pinecone 和 LangChain。

## 相关资源

- [使用 Testcontainers 测试 RAG 管道](/zh/spicedb/integrations/testcontainers)
- [使用 SpiceDB 保护 RAG 管道](/zh/spicedb/tutorials/secure-rag-pipelines)
