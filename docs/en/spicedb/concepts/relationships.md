::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/relationships)
中文版: [查看中文版](/zh/spicedb/concepts/relationships)
:::

# Relationships

## Overview

In SpiceDB, a functioning permissions system combines **Schema** (which defines data structure) with **Relationships** (which represents the actual data).

## Understanding Relationships

### Core Concepts

A **relation** is like a class definition — it represents a possible type of connection defined in your schema. For example: "documents have editors."

A **relationship** is a specific instance of a relation representing actual data. For example: "user `emilia` is an editor of document `readme`"

### Relationship Syntax

The standard relationship syntax follows this pattern:

```
document:readme#editor@user:emilia
```

Breaking this down:

- **Resource**: `document:readme`
- **Relation**: `editor`
- **Subject**: `user:emilia`

Relationships can also link objects to sets of objects:

```
document:readme#editor@team:engineering#member
```

This reads as: "every member of team:engineering can edit document:readme"

::: warning
Object IDs must be unique and stable within their type. They're typically computer-friendly strings (UUIDs, integers, JWT `sub` fields) rather than human-readable names.
:::

### Graph Traversals

Authorization fundamentally answers: "Is this actor allowed to perform this action on this resource?"

SpiceDB transforms authorization into graph reachability problems. For example, checking "Can user `emilia` edit document `readme`?" with these relationships:

- `team:engineering#member@user:emilia`
- `document:readme#editor@team:engineering#member`

SpiceDB:

1. Starts at `document:readme#editor`
2. Follows the `editor` relation to `team:engineering#member`
3. Follows the `member` relation to find `user:emilia`

The power of relationships: they are both "the question you ask" and "the answer" by creating traversable graph paths.

## Writing Relationships

Applications must keep SpiceDB relationships current with application state.

### SpiceDB-Only Relationships

Sometimes permissions don't need storage in your relational database at all. Information can exist solely in SpiceDB, accessed via `ReadRelationships` or `ExpandPermissionsTree` API calls when needed.

### Two Writes & Commit

The most common approach uses 2-phase commit-like logic:

```python
try:
    tx = db.transaction()
    resp = spicedb_client.WriteRelationships(...)
    tx.add(db_models.Document(
        id=request.document_id,
        owner=user_id,
        zedtoken=resp.written_at
    ))
    tx.commit()
except:
    tx.abort()
    spicedb_client.DeleteRelationships(...)
    raise
```

### Streaming Commits

Stream updates via third-party systems (like Kafka) using CQRS patterns. Relationship updates are published as events to streaming services, consumed by systems performing updates in both databases.

### Asynchronous Updates

For applications tolerating replication lag in permissions checking, background synchronization processes can asynchronously write relationships to SpiceDB.

::: warning
Carefully consider consistency implications before adopting this approach.
:::
