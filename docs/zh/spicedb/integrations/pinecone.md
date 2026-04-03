# 使用 Pinecone 和 SpiceDB 实现 RAG 访问控制

::: tip
原文：[authzed.com/docs](https://authzed.com/docs/spicedb/integrations/pinecone) | [English](/en/spicedb/integrations/pinecone)
:::

## 概述

RAG 系统将向量搜索与大语言模型相结合，利用组织数据来回答问题。然而，如果没有适当的授权控制，这些系统可能会在组织边界之间泄露敏感信息。

本指南演示如何使用 SpiceDB 和 Pinecone（一个用于大规模相似性搜索的云原生向量数据库）在 RAG 管道中实现基于关系的授权。

## 缺少授权的安全风险

标准 RAG 管道纯粹基于语义相似度检索文档，这会产生 OWASP 基金会列出的"LLM 应用十大风险"中提到的多种漏洞。主要风险包括：

- **敏感信息泄露**：用户可能从未授权的文档中获取答案
- **过度代理**：意外的 LLM 输出执行非预期操作
- **向量嵌入弱点**：嵌入可能编码敏感信息

示例场景：一名初级员工询问"我们 Q4 的营收是多少？"时，可能会收到来自他从未直接访问过的高管专属财务文档中的答案。

## SpiceDB 基础知识

SpiceDB 将访问关系存储为图结构，其中节点代表实体（用户、组、文档），边代表关系（查看者、编辑者、所有者）。

授权归结为一个简单的问题："该参与者是否被允许对此资源执行此操作？"

### Schema 示例

```
definition user {}

definition article {
  relation viewer: user
  relation editor: user

  permission view = viewer + editor
  permission edit = editor
}
```

在此模型中，文章有两种关系：`viewer`（读取权限）和 `editor`（修改权限）。`view` 权限授予拥有任一关系的用户，而 `edit` 则要求具有 `editor` 关系。

**关键区别**：关系（relation）定义直接的关联；权限（permission）基于关系计算访问。你不能直接写入权限——只能写入关系。

## 授权策略

### 前置过滤授权

在搜索向量数据库**之前**查询 SpiceDB。

**流程：**

1. 调用 SpiceDB 的 `LookupResources` API 获取用户可以访问的所有文档 ID
2. 使用这些 ID 通过元数据过滤来筛选 Pinecone 查询
3. 仅检索已授权的文档并嵌入 LLM 上下文

**Python 示例：**

```python
from authzed.api.v1 import Client, LookupResourcesRequest, SubjectReference, ObjectReference

client = Client("spicedb.example.com:443", bearer_token)

subject = SubjectReference(
    object=ObjectReference(object_type="user", object_id="alice")
)

response = client.LookupResources(
    LookupResourcesRequest(
        resource_object_type="article",
        permission="view",
        subject=subject
    )
)

authorized_article_ids = [r.resource_object_id async for r in response]
# 结果: ['123', '456', '789']

from pinecone import Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("documents")

results = index.query(
    vector=query_embedding,
    filter={"article_id": {"$in": authorized_article_ids}},
    top_k=10,
    include_metadata=True
)
```

**适用场景：**

- 大型文档语料库（数十万或数百万级别）
- 用户仅访问总文档的较小比例
- 检索命中率较低
- 需要可预测的授权开销

**权衡：**

- 每次检查计算成本更高（需要枚举可访问的文档）
- 授权延迟随用户可访问的文档数量增长
- 对窄访问模式非常高效

### 后置过滤授权

**先**从 Pinecone 检索文档，然后通过 SpiceDB 权限检查进行过滤。

**流程：**

1. 正常查询 Pinecone 获取语义相关的文档
2. 从结果中提取文档 ID
3. 调用 SpiceDB 的 `CheckBulkPermissions` API 验证用户访问权限
4. 在传递给 LLM 之前过滤掉未授权的文档

**Python 示例：**

```python
from authzed.api.v1 import Client, CheckBulkPermissionsRequest, CheckBulkPermissionsItem
from authzed.api.v1 import SubjectReference, ObjectReference, Relationship

from pinecone import Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("documents")

results = index.query(
    vector=query_embedding,
    top_k=20,  # 多获取一些以弥补过滤后的损失
    include_metadata=True
)

client = Client("spicedb.example.com:443", bearer_token)

check_items = [
    CheckBulkPermissionsItem(
        resource=ObjectReference(
            object_type="article",
            object_id=match["metadata"]["article_id"]
        ),
        permission="view",
        subject=SubjectReference(
            object=ObjectReference(object_type="user", object_id="alice")
        )
    )
    for match in results["matches"]
]

permission_response = await client.CheckBulkPermissions(
    CheckBulkPermissionsRequest(items=check_items)
)

authorized_documents = [
    match for match, pair in zip(results["matches"], permission_response.pairs)
    if pair.item.permissionship == CheckBulkPermissionsResponseItem.PERMISSIONSHIP_HAS_PERMISSION
]
```

**适用场景：**

- 较小的文档语料库
- 搜索命中率高（大多数检索到的文档是相关的）
- 用户拥有广泛的文档访问权限
- 需要最佳向量搜索质量

**权衡：**

- 需要过度获取文档以确保过滤后有足够的结果
- 授权延迟随搜索结果数量增长（而非整个语料库）
- 在广泛访问模式下更高效

## 相关资源

- [LangChain-SpiceDB 官方库](https://pypi.org/project/langchain-spicedb/) -- 用于 LangChain 和 LangGraph 的后置过滤授权库
- [安全 RAG 管道仓库与工作坊](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines) -- 使用 Pinecone 和 LangChain 的前置/后置过滤技术实战工作坊
- [Pinecone 文档](https://docs.pinecone.io/) -- 官方向量数据库文档
