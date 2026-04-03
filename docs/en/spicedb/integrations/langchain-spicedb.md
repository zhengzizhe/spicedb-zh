# Use SpiceDB with LangChain & LangGraph for RAG & AI Agent Authorization

::: tip
Original page: [authzed.com/docs](https://authzed.com/docs/spicedb/integrations/langchain-spicedb) | [中文版](/zh/spicedb/integrations/langchain-spicedb)
:::

## Overview

This documentation covers integrating SpiceDB's fine-grained authorization into LangChain and LangGraph pipelines. The approach implements "post-filter authorization" where documents are retrieved via semantic search, then filtered through SpiceDB permission checks before reaching the LLM.

## Installation

```bash
pip install langchain-spicedb
```

## Core Components

### 1. SpiceDBRetriever

A wrapper for existing LangChain retrievers that adds authorization filtering:

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

**Best for:** Simple RAG chains with fixed user context

### 2. SpiceDBAuthFilter

Reusable filter accepting user context at runtime for multi-user systems:

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

**Best for:** Multi-tenant systems serving multiple users

### 3. LangGraph Authorization Node

For complex multi-step workflows with explicit state management:

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
    # Generation logic here

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

**Best for:** Multi-step pipelines with conditional branching and state tracking

#### Extending RAGAuthState

```python
from langchain_spicedb import RAGAuthState
from typing import List

class CustomerSupportState(RAGAuthState):
    conversation_history: List[dict]
    customer_tier: str
    sentiment_score: float
```

### 4. Permission Check Tools

#### SpiceDBPermissionTool

Check single-resource permissions:

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
# Returns: "true" or "false"
```

#### SpiceDBBulkPermissionTool

Check permissions for multiple resources:

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

**Agentic Integration:**

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

## Document Metadata Requirements

Each document must include a resource identifier in metadata:

```python
from langchain_core.documents import Document

doc = Document(
    page_content="SpiceDB is an open-source permissions database...",
    metadata={
        "doc_id": "123",  # Resource identifier
        "title": "SpiceDB Introduction",
        "author": "alice"
    }
)
```

The `resource_id_key` parameter specifies which metadata field contains the resource ID. Documents missing this field are silently excluded.

## Authorization Metrics

### LangChain Components

Enable with `return_metrics=True`:

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

print(f"Documents retrieved: {result.total_retrieved}")
print(f"Documents authorized: {result.total_authorized}")
print(f"Authorization rate: {result.authorization_rate:.1%}")
print(f"Denied documents: {result.denied_resource_ids}")
print(f"Check latency: {result.check_latency_ms}ms")
```

### LangGraph Components

Metrics automatically included in state under `auth_results`:

```python
result = await app.ainvoke({
    "question": "What is SpiceDB?",
    "subject_id": "user:alice",
})

auth_metrics = result["auth_results"]
print(f"Total retrieved: {auth_metrics['total_retrieved']}")
print(f"Total authorized: {auth_metrics['total_authorized']}")
print(f"Authorization rate: {auth_metrics['authorization_rate']:.1%}")
print(f"Denied IDs: {auth_metrics['denied_resource_ids']}")
print(f"Latency: {auth_metrics['check_latency_ms']}ms")
```

## Production Deployment

```python
from authzed.api.v1 import Client

spicedb_client = Client(
    "spicedb.production.example.com:443",
    "your-production-token",
    cert_path="/path/to/ca-cert.pem",
    timeout_seconds=5.0,
)
```

## Vector Store Compatibility

Works with any LangChain-compatible vector store:

- Pinecone
- FAISS
- Weaviate
- Chroma
- Qdrant

## Error Handling

Never fall back to unfiltered results on authorization failure:

```python
from langchain_spicedb import SpiceDBAuthFilter
from authzed.api.v1 import AuthzedError

try:
    result = await auth_filter.ainvoke(documents)
except AuthzedError as e:
    logger.error(f"Authorization failed: {e}")
    result = []
```

## Post-Filter vs Metadata Filtering

Post-filter authorization through SpiceDB is superior to vector store metadata filtering because it:

- Doesn't duplicate authorization logic
- Supports relationship-based permissions
- Maintains audit trails
- Doesn't require re-indexing on permission changes

## Debug Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("langchain_spicedb")
logger.setLevel(logging.DEBUG)
```

## Resources

- [LangChain Documentation](https://python.langchain.com/)
- [Library Repository](https://github.com/authzed/langchain-spicedb)
- [PyPI Package](https://pypi.org/project/langchain-spicedb/)
