::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/consistency)
中文版: [查看中文版](/zh/spicedb/concepts/consistency)
:::

# Consistency

## Overview

Consistency is fundamental to distributed systems and authorization. SpiceDB, as an authorization system inspired by Google's Zanzibar, provides fine-grained control over consistency levels.

## Consistency in SpiceDB

### The Core Challenge

SpiceDB implements multiple caching layers for performance, but caches can become stale. If relationships change and caches aren't updated, the system risks returning incorrect permission information — a problem known as the "[New Enemy Problem](./zanzibar#new-enemy-problem)."

### The Solution

SpiceDB allows developers to specify consistency levels per-request using ZedTokens, enabling dynamic trade-offs between fresh data and performance.

## Default Consistency Levels by API

| API Call | Default |
|----------|---------|
| WriteRelationships, DeleteRelationships, ReadSchema, WriteSchema | `fully_consistent` |
| All other APIs | `minimize_latency` |

## Consistency Modes

### Minimize Latency

Prioritizes speed by using cached data. Risks the New Enemy Problem if used exclusively.

### At Least As Fresh

Ensures data is at least as fresh as a specified point-in-time (via ZedToken). Uses newer data if available.

### At Exact Snapshot

Uses data from an exact point-in-time. Can fail with "Snapshot Expired" error due to garbage collection.

### Fully Consistent

Ensures complete consistency with the latest datastore data. Bypasses caching and significantly increases latency.

::: warning
`fully_consistent` does not guarantee read-after-write consistency on CockroachDB due to distributed database clock skew between nodes, with a default clock offset of 500ms.
:::

## ZedTokens

ZedTokens are opaque tokens representing datastore snapshots, comparable to Google Zanzibar's "Zookie" concept. They are returned by CheckPermission, BulkCheckPermission, WriteRelationships, and DeleteRelationships APIs.

### Storage Strategy

Developers should store ZedTokens in application databases alongside protected resources, updating them when:

- Resources are created/deleted
- Resource contents change
- Access permissions change

For PostgreSQL, store as standard `text` or `varchar(1024)` columns.

### Practical Guidance

**For Complex Hierarchies:** Reference parent resources when storing tokens for hierarchical data structures.

**Simpler Alternative:** Use read-after-write queries with full consistency. Suitable for experimentation but potentially suboptimal for production.

**Ignoring ZedTokens:** Some workloads aren't sensitive to permission race conditions and can safely ignore ZedTokens. This is configurable via the `--datastore-revision-quantization-interval` flag.
