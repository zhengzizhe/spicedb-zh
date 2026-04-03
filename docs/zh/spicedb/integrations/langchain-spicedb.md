# 在 LangChain 和 LangGraph 中使用 SpiceDB 实现 RAG 与 AI Agent 授权

::: tip
原文：[authzed.com/docs](https://authzed.com/docs/spicedb/integrations/langchain-spicedb) | [English](/en/spicedb/integrations/langchain-spicedb)
:::

## 概述

本文档介绍如何将 SpiceDB 的细粒度授权集成到 LangChain 和 LangGraph 管道中。该方案实现了"后置过滤授权"——先通过语义搜索检索文档，再通过 SpiceDB 权限检查进行过滤，最后才将结果传递给 LLM。

## 安装

```bash
pip install langchain-spicedb
```

## 核心组件

### 1. SpiceDBRetriever

对现有 LangChain 检索器的封装，添加了授权过滤功能：

```python
from langchain_spicedb import SpiceDBRetriever

retriever = SpiceDBRetriever(
    base_retriever=vector_store.as_retriever(),
    subject_id="alice",
    subject_type="user",
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    resource_type="article",
    resource_id_key="article_id",
    permission="view",
)

docs = await retriever.ainvoke("query")
```

**适用场景：** 具有固定用户上下文的简单 RAG 链

### 2. SpiceDBAuthFilter

可复用的过滤器，在运行时接受用户上下文，适用于多用户系统：

```python
from langchain_spicedb import SpiceDBAuthFilter
from langchain_core.runnables import RunnableParallel, RunnablePassthrough

auth_filter = SpiceDBAuthFilter(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    resource_type="document",
    resource_id_key="doc_id",
)

chain = (
    RunnableParallel({
        "context": retriever | auth_filter,
        "question": RunnablePassthrough(),
    })
    | prompt
    | llm
    | StrOutputParser()
)

answer_alice = await chain.ainvoke(
    "What are the Q4 results?",
    config={"configurable": {"subject_id": "user:alice"}}
)
```

**适用场景：** 服务多用户的多租户系统

### 3. LangGraph 授权节点

适用于具有显式状态管理的复杂多步骤工作流：

```python
from langgraph.graph import StateGraph, END
from langchain_spicedb import create_auth_node, RAGAuthState

graph = StateGraph(RAGAuthState)

def retrieve_node(state):
    docs = retriever.invoke(state["question"])
    return {"retrieved_documents": docs}

def generate_node(state):
    context = "\n\n".join([
        doc.page_content
        for doc in state["authorized_documents"]
    ])
    # 生成逻辑

graph.add_node("retrieve", retrieve_node)
graph.add_node("authorize", create_auth_node(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    resource_type="article",
    resource_id_key="article_id",
))
graph.add_node("generate", generate_node)

graph.set_entry_point("retrieve")
graph.add_edge("retrieve", "authorize")
graph.add_edge("authorize", "generate")
graph.add_edge("generate", END)

app = graph.compile()
result = await app.ainvoke({
    "question": "What is SpiceDB?",
    "subject_id": "user:alice",
})
```

**适用场景：** 具有条件分支和状态跟踪的多步骤管道

#### 扩展 RAGAuthState

```python
from langchain_spicedb import RAGAuthState
from typing import List

class CustomerSupportState(RAGAuthState):
    conversation_history: List[dict]
    customer_tier: str
    sentiment_score: float
```

### 4. 权限检查工具

#### SpiceDBPermissionTool

检查单个资源的权限：

```python
from langchain_spicedb import SpiceDBPermissionTool

tool = SpiceDBPermissionTool(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    subject_type="user",
    resource_type="article",
)

result = await tool.ainvoke({
    "subject_id": "alice",
    "resource_id": "123",
    "permission": "view"
})
# 返回值: "true" 或 "false"
```

#### SpiceDBBulkPermissionTool

批量检查多个资源的权限：

```python
from langchain_spicedb import SpiceDBBulkPermissionTool

tool = SpiceDBBulkPermissionTool(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    subject_type="user",
    resource_type="article",
)

result = await tool.ainvoke({
    "subject_id": "tim",
    "resource_ids": "123,456,789",
    "permission": "view"
})
```

**Agent 集成方式：**

```python
from langchain.agents import create_react_agent, AgentExecutor
from langchain_openai import ChatOpenAI
from langchain_spicedb import SpiceDBPermissionTool

llm = ChatOpenAI(model="gpt-4o-mini")
permission_tool = SpiceDBPermissionTool(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    subject_type="user",
    resource_type="article",
)

tools = [permission_tool]
agent = create_agent(
    llm=llm,
    tools=tools,
    system_prompt=(
        "You are a helpful assistant. "
        "Before providing information about a resource, "
        "check whether the user has the required permission."
    ),
)
```

## 文档元数据要求

每个文档必须在元数据中包含资源标识符：

```python
from langchain_core.documents import Document

doc = Document(
    page_content="SpiceDB is an open-source permissions database...",
    metadata={
        "doc_id": "123",  # 资源标识符
        "title": "SpiceDB Introduction",
        "author": "alice"
    }
)
```

`resource_id_key` 参数指定元数据中哪个字段包含资源 ID。缺少该字段的文档会被静默排除。

## 授权指标

### LangChain 组件

通过 `return_metrics=True` 启用：

```python
auth_filter = SpiceDBAuthFilter(
    spicedb_endpoint="localhost:50051",
    spicedb_token="sometoken",
    resource_type="document",
    resource_id_key="doc_id",
    subject_id="user:alice",
    return_metrics=True
)

result = await auth_filter.ainvoke(documents)

print(f"检索文档数: {result.total_retrieved}")
print(f"已授权文档数: {result.total_authorized}")
print(f"授权率: {result.authorization_rate:.1%}")
print(f"被拒绝的文档: {result.denied_resource_ids}")
print(f"检查延迟: {result.check_latency_ms}ms")
```

### LangGraph 组件

指标自动包含在状态的 `auth_results` 字段中：

```python
result = await app.ainvoke({
    "question": "What is SpiceDB?",
    "subject_id": "user:alice",
})

auth_metrics = result["auth_results"]
print(f"总检索数: {auth_metrics['total_retrieved']}")
print(f"总授权数: {auth_metrics['total_authorized']}")
print(f"授权率: {auth_metrics['authorization_rate']:.1%}")
print(f"被拒绝的 ID: {auth_metrics['denied_resource_ids']}")
print(f"延迟: {auth_metrics['check_latency_ms']}ms")
```

## 生产环境部署

```python
from authzed.api.v1 import Client

spicedb_client = Client(
    "spicedb.production.example.com:443",
    "your-production-token",
    cert_path="/path/to/ca-cert.pem",
    timeout_seconds=5.0,
)
```

## 向量数据库兼容性

兼容任何 LangChain 支持的向量数据库：

- Pinecone
- FAISS
- Weaviate
- Chroma
- Qdrant

## 错误处理

授权失败时绝不应回退到未过滤的结果：

```python
from langchain_spicedb import SpiceDBAuthFilter
from authzed.api.v1 import AuthzedError

try:
    result = await auth_filter.ainvoke(documents)
except AuthzedError as e:
    logger.error(f"Authorization failed: {e}")
    result = []
```

## 后置过滤 vs 元数据过滤

通过 SpiceDB 进行后置过滤授权优于向量数据库的元数据过滤，因为它：

- 不会重复授权逻辑
- 支持基于关系的权限
- 维护审计跟踪
- 权限变更时不需要重新索引

## 调试日志

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("langchain_spicedb")
logger.setLevel(logging.DEBUG)
```

## 相关资源

- [LangChain 文档](https://python.langchain.com/)
- [库代码仓库](https://github.com/authzed/langchain-spicedb)
- [PyPI 包](https://pypi.org/project/langchain-spicedb/)
