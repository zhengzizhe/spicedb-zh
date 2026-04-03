# 使用 Testcontainers 和 SpiceDB 测试 RAG 管道

::: tip
原文：[authzed.com/docs](https://authzed.com/docs/spicedb/integrations/testcontainers) | [English](/en/spicedb/integrations/testcontainers)
:::

## 概述

对具有权限感知的 RAG（检索增强生成）系统进行端到端测试，需要在上线前验证授权逻辑的正确性。使用真实的 SpiceDB 实例进行测试，可确保权限检查的行为与生产环境完全一致，在开发早期就能捕获授权相关的 bug。

本指南演示如何使用 [Testcontainers](https://testcontainers.com/) 和 SpiceDB 创建隔离的、可重现的 RAG 管道集成测试。Testcontainers 是"一个开源库，用于提供可丢弃的、轻量级的数据库、消息代理、Web 浏览器或任何能在 Docker 容器中运行的实例。"

## 为什么要测试 RAG 管道中的权限

RAG 系统从向量数据库检索文档，以增强 LLM 对组织数据的响应。如果没有适当的授权测试，这些系统可能会将敏感信息暴露给未经授权的用户。

### 测试缺口

许多 RAG 实现测试了检索质量，但完全跳过了授权测试。

**大多数测试验证的内容：** 检索结果的语义相关性

**测试还应验证的内容：** 权限边界和授权访问限制

如果没有授权测试，权限漏洞要到生产环境部署后才会被发现。

## 理解 Testcontainers

Testcontainers 为集成测试提供轻量级的、可丢弃的容器。你无需模拟授权逻辑或维护共享的测试基础设施，而是在测试期间启动真实的 SpiceDB 实例。

### Testcontainers 的工作原理

每个测试都会获得一个全新的、隔离的 SpiceDB 容器：

1. **自动启动** -- 测试框架拉取 SpiceDB 镜像并启动容器
2. **端口映射** -- 容器端口被动态映射以避免冲突
3. **健康检查** -- 框架等待 SpiceDB 就绪后再运行测试
4. **自动清理** -- 测试完成后容器被销毁

这种方法消除了由共享状态、手动设置或 mock 不一致导致的不稳定测试。

::: warning 前置条件
你的系统上必须运行 Docker。请在运行测试前安装 Docker Desktop 或 Docker Engine；框架会自动处理容器的生命周期管理。
:::

## 使用 Testcontainers 设置测试

SpiceDB Testcontainer 提供 [Python](https://testcontainers.com/modules/spicedb/?language=python) 和 [Go](https://testcontainers.com/modules/spicedb/?language=go) 版本。本指南介绍 Python 模块，适用于使用 LangChain、LlamaIndex 或自定义实现构建的 Python RAG 系统。

### 安装 Python 模块

安装 SpiceDB 的 Python Testcontainer：

```bash
pip install testcontainers-spicedb
```

同时安装 SpiceDB Python 客户端：

```bash
pip install authzed
```

### 实现示例

```python
from testcontainers_spicedb import SpiceDBContainer
from authzed.api.v1 import (
    InsecureClient,
    WriteSchemaRequest,
    CheckPermissionRequest,
    CheckPermissionResponse,
    ObjectReference,
    SubjectReference,
)

# 启动一个可丢弃的 SpiceDB 实例
with SpiceDBContainer(image="authzed/spicedb:v1.47.1") as spicedb:
    # 使用 Authzed Python 客户端连接（本地容器不需要 TLS）
    client = InsecureClient(
        spicedb.get_endpoint(),
        spicedb.get_secret_key(),
    )

    # 写入一个最小化的 schema
    client.WriteSchema(
        WriteSchemaRequest(
            schema="""
            definition user {}

            definition document {
                relation owner: user
                permission read = owner
            }
            """
        )
    )

    # 检查权限（例如用于 RAG 授权网关）
    response = client.CheckPermission(
        CheckPermissionRequest(
            resource=ObjectReference(
                object_type="document",
                object_id="doc1",
            ),
            permission="read",
            subject=SubjectReference(
                object=ObjectReference(
                    object_type="user",
                    object_id="alice",
                )
            ),
        )
    )

    assert (
        response.permissionship
        == CheckPermissionResponse.PERMISSIONSHIP_NO_PERMISSION
    )
```

### 运行 Python 测试

使用 pytest 执行测试：

```bash
pytest test_rag_permissions.py -v
```

如需包含关系、一致性令牌和 RAG 管道中后置检索过滤的完整测试示例，请参阅下方链接的完整示例。

## 相关资源

- [完整示例](https://github.com/sohanmaheshwar/testcontainers-spicedb-py/blob/main/examples/full-example.py) -- 使用 SpiceDB Testcontainer 的完整示例
- [使用 SpiceDB Go Testcontainer](https://www.docker.com/blog/rag-permission-testing-testcontainers-spicedb/) -- 社区创建的 Go Testcontainer 模块
