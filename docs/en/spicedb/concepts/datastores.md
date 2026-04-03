::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/datastores)
中文版: [查看中文版](/zh/spicedb/concepts/datastores)
:::

# Datastores

## Overview

SpiceDB uses existing, popular database systems for persisting data. AuthZed standardized managed services on CockroachDB but offers self-hosted customers multiple options based on operational requirements.

**Available datastores:**

- **CockroachDB** — Recommended for self-hosted deployments with high throughput and/or multi-region requirements
- **Cloud Spanner** — Recommended for self-hosted Google Cloud deployments
- **PostgreSQL** — Recommended for self-hosted single-region deployments
- **MySQL** — Not recommended; only use if PostgreSQL is unavailable
- **memdb** — Recommended for local development and integration testing

---

## CockroachDB

### Usage Notes

- Recommended for multi-region deployments with configurable region awareness
- Enables horizontal scalability by adding more SpiceDB and CockroachDB instances
- Resiliency to individual CockroachDB instance failures
- Query and data balanced across CockroachDB
- Setup and operational complexity of running CockroachDB

### Consistency Considerations

::: warning
`fully_consistent` does not guarantee read-after-write consistency on CockroachDB.
:::

SpiceDB picks revisions using CockroachDB's `cluster_logical_timestamp()`, which can differ across nodes by up to the cluster's `max_offset` (default: 500ms). A read may not see recently committed writes if the reading node's timestamp lags the writing node's.

This is specific to CockroachDB's distributed clock model and doesn't apply to single-node datastores like PostgreSQL. For read-after-write guarantees, use a ZedToken with `at_least_as_fresh`.

### Configuration

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `datastore-engine` | The datastore engine | `--datastore-engine=cockroachdb` |
| `datastore-conn-uri` | Connection string for CRDB | `--datastore-conn-uri="postgres://user:password@localhost:26257/spicedb?sslmode=disable"` |

#### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `datastore-max-tx-retries` | Maximum query retry attempts | 50 |
| `datastore-tx-overlap-strategy` | Overlap strategy to prevent New Enemy | `static` |
| `datastore-tx-overlap-key` | Key for overlap strategy | — |
| `datastore-conn-pool-read-max-idletime` | Max idle time for read connections | 30m |
| `datastore-conn-pool-read-max-lifetime` | Max lifetime for read connections | 30m |
| `datastore-conn-pool-read-max-lifetime-jitter` | Jitter for read connection closure | — |
| `datastore-conn-pool-read-max-open` | Concurrent read connections | 20 |
| `datastore-conn-pool-read-min-open` | Minimum read connections | 20 |
| `datastore-conn-pool-write-healthcheck-interval` | Write health check interval | 30s |
| `datastore-conn-pool-write-max-idletime` | Max idle time for write connections | 30m |
| `datastore-conn-pool-write-max-lifetime` | Max lifetime for write connections | 30m |
| `datastore-conn-pool-write-max-lifetime-jitter` | Jitter for write connection closure | — |
| `datastore-conn-pool-write-max-open` | Concurrent write connections | 10 |
| `datastore-conn-pool-write-min-open` | Minimum write connections | 10 |
| `datastore-query-split-size` | Query size threshold for splitting | — |
| `datastore-gc-window` | GC window for relationships | — |
| `datastore-revision-fuzzing-duration` | Fuzzing window for tokens | — |
| `datastore-readonly` | Read-only mode | false |
| `datastore-follower-read-delay-duration` | Follower read delay | — |

#### Overlap Strategy

In distributed systems, consistency can be traded for performance. CockroachDB users can configure `--datastore-tx-overlap-strategy`:

| Strategy | Description |
|----------|-------------|
| `static` (default) | All writes overlap to guarantee safety; costs write throughput |
| `prefix` | Only writes with same prefix overlap |
| `request` | Only writes with same `io.spicedb.requestoverlapkey` header overlap |
| `insecure` | No writes overlap for best throughput; vulnerable to New Enemy Problem |

#### Garbage Collection Window

As of February 2023, the default GC window changed to 1.25 hours for CockroachDB Serverless and 4 hours for Dedicated.

SpiceDB warns if the configured GC window is smaller than SpiceDB's configuration. To adjust:

```sql
ALTER ZONE default CONFIGURE ZONE USING gc.ttlseconds = 90000;
```

#### Relationship Integrity

Relationship Integrity ensures data written to CockroachDB is validated as written by SpiceDB or by authorized callers with access keys. Prevents unauthorized relationship injection if datastore access is compromised.

##### Setting up Relationship Integrity

```bash
spicedb serve ...existing flags... \
  --datastore-relationship-integrity-enabled \
  --datastore-relationship-integrity-current-key-id="somekeyid" \
  --datastore-relationship-integrity-current-key-filename="some.key"
```

Place HMAC-compatible key contents in `some.key`.

::: warning
Requires a clean datastore. Migration from existing installations is not supported.
:::

---

## Cloud Spanner

### Usage Notes

- Requires Google Cloud Account with active Cloud Spanner instance
- Takes advantage of Google's TrueTime
- Spanner driver assumes database is linearizable; skips transaction overlap strategy required by CockroachDB

### Configuration

Authentication via service accounts: the migration account needs `Cloud Spanner Database Admin`; SpiceDB needs `Cloud Spanner Database User`.

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `datastore-engine` | The datastore engine | `--datastore-engine=spanner` |
| `datastore-conn-uri` | Cloud Spanner database identifier | `--datastore-conn-uri="projects/project-id/instances/instance-id/databases/database-id"` |

#### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `datastore-spanner-credentials` | JSON service account token | Application default credentials |
| `datastore-gc-interval` | Time between GC passes | 3m |
| `datastore-gc-window` | GC window for relationships | — |
| `datastore-revision-fuzzing-duration` | Fuzzing window for tokens | — |
| `datastore-readonly` | Read-only mode | false |
| `datastore-follower-read-delay-duration` | Follower read delay | — |

---

## PostgreSQL

### Usage Notes

- Recommended for single-region deployments
- PostgreSQL 15 or newer required for optimal performance
- Resiliency only with follower and proper failover
- No non-standard PostgreSQL extensions required
- Compatible with managed services (AWS RDS, etc.)
- Scalable on read workloads using read replicas

::: warning
SpiceDB's Watch API requires PostgreSQL's Commit Timestamp tracking enabled. Enable via `--track_commit_timestamp=on` flag, `postgresql.conf` configuration, or execute `ALTER SYSTEM SET track_commit_timestamp = on;` and restart.
:::

### Read Replicas

SpiceDB supports Postgres read replicas while retaining consistency guarantees.

**Typical use cases:**

- Scale read workloads; offload from primary
- Deploy SpiceDB in other regions with read-focused workloads

Read replicas configured with asynchronous replication involve replication lag. SpiceDB addresses this by checking if revisions replicated to target replicas; falls back to primary if missing.

All consistency options leverage replicas, but those with staleness benefit most: `minimize_latency`, `at_least_as_fresh`, `at_exact_snapshot` modes have the highest replica redirection likelihood.

SpiceDB supports replicas behind load-balancers and/or individual host listings. Round-robin querying is used for multiple URIs. Maximum 16 replica URIs supported.

#### Transaction IDs and MVCC

PostgreSQL MVCC stores internal transaction ID counts in written rows. Instance-specific counters can desync via `pg_dump`/`pg_restore` transfers or logical replication setups.

SpiceDB may behave as though no schema exists since data associates with future transaction IDs.

### Configuration

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `datastore-engine` | The datastore engine | `--datastore-engine=postgres` |
| `datastore-conn-uri` | PostgreSQL connection string | `--datastore-conn-uri="postgres://postgres:password@localhost:5432/spicedb?sslmode=disable"` |

#### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `datastore-conn-pool-read-max-idletime` | Max idle time for read connections | 30m |
| `datastore-conn-pool-read-max-lifetime` | Max lifetime for read connections | 30m |
| `datastore-conn-pool-read-max-lifetime-jitter` | Jitter for read connection closure | — |
| `datastore-conn-pool-read-max-open` | Concurrent read connections | 20 |
| `datastore-conn-pool-read-min-open` | Minimum read connections | 20 |
| `datastore-conn-pool-write-healthcheck-interval` | Write health check interval | 30s |
| `datastore-conn-pool-write-max-idletime` | Max idle time for write connections | 30m |
| `datastore-conn-pool-write-max-lifetime` | Max lifetime for write connections | 30m |
| `datastore-conn-pool-write-max-lifetime-jitter` | Jitter for write connection closure | — |
| `datastore-conn-pool-write-max-open` | Concurrent write connections | 10 |
| `datastore-conn-pool-write-min-open` | Minimum write connections | 10 |
| `datastore-query-split-size` | Query split threshold | — |
| `datastore-gc-window` | GC window for relationships | — |
| `datastore-revision-fuzzing-duration` | Fuzzing window for tokens | — |
| `datastore-readonly` | Read-only mode | false |
| `datastore-read-replica-conn-uri` | Read replica connection string | — |

---

## MySQL

### Usage Notes

- Recommended for single-region deployments
- No non-standard MySQL extensions required
- Compatible with managed services
- Scalable on read workloads using read replicas

::: warning
Do not use a load balancer between SpiceDB and MySQL replicas — consistency guarantees will be compromised.
:::

::: warning
SpiceDB requires `--datastore-conn-uri` to contain the `parseTime=True` query parameter.
:::

### Read Replicas

SpiceDB supports MySQL read replicas while retaining consistency guarantees. SpiceDB does **not** support replicas behind load-balancers — only individual host listings.

### Configuration

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `datastore-engine` | The datastore engine | `--datastore-engine=mysql` |
| `datastore-conn-uri` | MySQL connection string | `--datastore-conn-uri="user:password@(localhost:3306)/spicedb?parseTime=True"` |

#### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `datastore-conn-pool-read-max-idletime` | Max idle time for read connections | 30m |
| `datastore-conn-pool-read-max-lifetime` | Max lifetime for read connections | 30m |
| `datastore-conn-pool-read-max-open` | Concurrent read connections | 20 |
| `datastore-conn-pool-read-min-open` | Minimum read connections | 20 |
| `datastore-conn-pool-write-max-idletime` | Max idle time for write connections | 30m |
| `datastore-conn-pool-write-max-lifetime` | Max lifetime for write connections | 30m |
| `datastore-conn-pool-write-max-open` | Concurrent write connections | 10 |
| `datastore-conn-pool-write-min-open` | Minimum write connections | 10 |
| `datastore-query-split-size` | Query split threshold | — |
| `datastore-gc-window` | GC window for relationships | — |
| `datastore-revision-fuzzing-duration` | Fuzzing window for tokens | — |
| `datastore-mysql-table-prefix` | Table name prefix | — |
| `datastore-readonly` | Read-only mode | false |
| `datastore-read-replica-conn-uri` | Read replica connection string | — |

---

## memdb

### Usage Notes

- Fully ephemeral; all data lost when process terminates
- Intended for SpiceDB usage and application integration testing
- Cannot run highly-available; multiple instances don't share in-memory data

### Configuration

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `datastore-engine` | The datastore engine | `--datastore-engine memory` |

#### Optional Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `datastore-revision-fuzzing-duration` | Fuzzing window for tokens | — |
| `datastore-gc-window` | GC window for relationships | — |
| `datastore-readonly` | Read-only mode | false |
