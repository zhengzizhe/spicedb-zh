# Access Control in RAG with Pinecone and SpiceDB

::: tip
Original page: [authzed.com/docs](https://authzed.com/docs/spicedb/integrations/pinecone) | [中文版](/zh/spicedb/integrations/pinecone)
:::

## Overview

RAG systems combine vector search with large language models to answer questions using organizational data. However, without proper authorization controls, these systems risk leaking sensitive information across organizational boundaries.

This guide demonstrates how to implement relationship-based authorization in RAG pipelines using SpiceDB and Pinecone -- a cloud-native vector database for similarity searches at scale.

## Security Risks Without Authorization

Standard RAG pipelines retrieve documents based purely on semantic similarity, creating vulnerabilities the OWASP Foundation identifies as "Top 10 risks for LLM applications." Key risks include:

- **Sensitive Information Disclosure**: Users may receive answers from unauthorized documents
- **Excessive Agency**: Unexpected LLM outputs performing unintended actions
- **Vector Embedding Weaknesses**: Embeddings can encode sensitive information

Example scenario: An entry-level employee asking "What was our Q4 revenue?" might receive answers derived from executive-only financial documents they never accessed directly.

## SpiceDB Fundamentals

SpiceDB stores access relationships as a graph where nodes represent entities (users, groups, documents) and edges represent relationships (viewer, editor, owner).

Authorization reduces to a single question: "Is this actor allowed to perform this action on this resource?"

### Example Schema

```
definition user {}

definition article {
  relation viewer: user
  relation editor: user

  permission view = viewer + editor
  permission edit = editor
}
```

In this model, articles have two relations: `viewer` (read access) and `editor` (modify access). The `view` permission grants access to anyone in either relation, while `edit` requires the `editor` relation.

**Key distinction**: Relations define direct relationships; permissions compute access based on relations. You cannot write directly to permissions -- only relations.

## Authorization Strategies

### Pre-Filter Authorization

Queries SpiceDB **before** searching the vector database.

**Process:**

1. Call SpiceDB's `LookupResources` API to retrieve all document IDs the user can access
2. Use those IDs to filter the Pinecone query via metadata filtering
3. Only authorized documents are retrieved and embedded in LLM context

**Python Example:**

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
# Result: ['123', '456', '789']

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

**When to Use:**

- Large document corpus (hundreds of thousands or millions)
- Users access small percentage of total documents
- Low retrieval hit-rate
- Predictable authorization overhead desired

**Trade-offs:**

- More computationally expensive per check (must enumerate accessible documents)
- Authorization latency scales with documents a user can access
- Highly efficient for narrow access patterns

### Post-Filter Authorization

Retrieves documents from Pinecone **first**, then filters through SpiceDB permission checks.

**Process:**

1. Query Pinecone normally for semantically relevant documents
2. Extract document IDs from results
3. Call SpiceDB's `CheckBulkPermissions` API to verify user access
4. Filter out unauthorized documents before passing to LLM

**Python Example:**

```python
from authzed.api.v1 import Client, CheckBulkPermissionsRequest, CheckBulkPermissionsItem
from authzed.api.v1 import SubjectReference, ObjectReference, Relationship

from pinecone import Pinecone
pc = Pinecone(api_key="your-api-key")
index = pc.Index("documents")

results = index.query(
    vector=query_embedding,
    top_k=20,  # Fetch more than needed to account for filtering
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

**When to Use:**

- Smaller document corpus
- High search hit-rate (most retrieved documents are relevant)
- Users have broad document access
- Optimal vector search quality desired

**Trade-offs:**

- Requires over-fetching documents to ensure sufficient results after filtering
- Authorization latency scales with search results (not total corpus)
- More efficient with broad access patterns

## Related Resources

- [LangChain-SpiceDB Official Library](https://pypi.org/project/langchain-spicedb/) -- Post-filter authorization library for LangChain and LangGraph
- [Secure RAG Pipelines Repo & Workshop](https://github.com/authzed/workshops/tree/main/secure-rag-pipelines) -- Hands-on workshop covering pre-filter and post-filter techniques using Pinecone and LangChain
- [Pinecone Documentation](https://docs.pinecone.io/) -- Official vector database documentation
