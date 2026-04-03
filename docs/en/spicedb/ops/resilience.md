::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/resilience)
中文版: [查看中文版](/zh/spicedb/ops/resilience)
:::

# Improving Resilience

It is recommended to establish observability before implementing resilience improvements for SpiceDB deployments.

## Retries

Implementing proper retry logic is essential when making requests to SpiceDB, as gRPC can experience temporary failures that can be resolved through retries. Retries are recommended for all gRPC methods.

### Implementing Retry Policies

A recommended retry policy configuration using gRPC Service Config:

```json
"retryPolicy": {
  "maxAttempts": 3,
  "initialBackoff": "1s",
  "maxBackoff": "4s",
  "backoffMultiplier": 2,
  "retryableStatusCodes": [
    "UNAVAILABLE",
    "RESOURCE_EXHAUSTED",
    "DEADLINE_EXCEEDED",
    "ABORTED"
  ]
}
```

**Configuration Details:**

- **maxAttempts: 3** - Permits up to 3 total attempts (1 initial + 2 retries), preventing infinite loops while allowing transient issues to resolve
- **initialBackoff: "1s"** - Sets 1-second delay before first retry attempt
- **maxBackoff: "4s"** - Limits maximum delay between retries at 4 seconds
- **backoffMultiplier: 2** - Doubles backoff with each retry (pattern: 1s -> 2s -> 4s)
- **retryableStatusCodes** - Only retries on specific transient failure codes:
  - `UNAVAILABLE`: SpiceDB temporarily unavailable
  - `RESOURCE_EXHAUSTED`: SpiceDB overloaded
  - `DEADLINE_EXCEEDED`: Request timed out
  - `ABORTED`: Operation aborted, may resolve on retry

A Python retry example is available in the official examples repository.

## ResourceExhausted and Its Causes

SpiceDB returns `ResourceExhausted` errors when protecting its own resources. These are transient conditions that should be retried with backoff to allow recovery.

### Memory Pressure

SpiceDB implements memory protection middleware that rejects requests potentially causing Out Of Memory conditions.

**Potential Causes:**

- Instances provisioned with insufficient memory -- provision more memory
- Large `CheckBulk` or `LookupResources` requests collecting results in memory -- identify offending clients and add pagination or break up requests

### Connection Pool Contention

CockroachDB and Postgres implementations use pgx connection pools. When exhausted, SpiceDB returns `ResourceExhausted` rather than making clients wait.

**Diagnosis:** Check the `pgxpool_empty_acquire` Prometheus metric or `authzed_cloud.spicedb.datastore.pgx.waited_connections` Datadog metric. Positive values indicate SpiceDB is awaiting database connections.

**Configuration Flags:**

- `--datastore-conn-pool-read-max-open`
- `--datastore-conn-pool-read-min-open`
- `--datastore-conn-pool-write-max-open`
- `--datastore-conn-pool-write-min-open`

SpiceDB uses separate read and write pools with flags describing minimum and maximum connections.

## How To Fix Postgres Connection Pool Contention

### Ensure Postgres Has Enough Available Connections

Postgres connections are expensive as each is a separate process. Maximum connections depend on instance size.

**Error Example:**

```json
{
  "level": "error",
  "error": "failed to create datastore: failed to create primary datastore: failed to connect to `user=spicedbchULNkGtmeQPUFV database=thumper-pg-db`: 10.96.125.205:5432 (spicedb-dedicated.postgres.svc.cluster.local): server error: FATAL: remaining connection slots are reserved for non-replication superuser connections (SQLSTATE 53300)",
  "time": "2025-11-24T20:32:43Z",
  "message": "terminated with errors"
}
```

This indicates no available connections; scale up your Postgres instance.

### Use a Connection Pooler

For relatively low database load compared to connections used, consider pgbouncer. It multiplexes connections between clients like SpiceDB and Postgres, mitigating connection costs.

### Configure Connection Flags

Set flags ensuring maximum connections requested fits within available connections:

```
(read_max_open + write_max_open) * num_spicedb_instances < total_available_postgres_connections
```

Leave additional headroom for new instances coming into service depending on deployment model.

## How To Fix CockroachDB Connection Pool Contention

### Ensure CockroachDB Has Enough Available CPU

CockroachDB provides connection pool sizing recommendations differing for Basic/Standard and Advanced deployments. These heuristics require trial-and-error to find the optimal pool size for specific workloads.

### Configure Connection Flags

Set flags ensuring requested connections match the desired amount:

```
(read_max_open + write_max_open) * num_spicedb_instances < total_available_cockroach_connections
```

::: info
SpiceDB can expose an HTTP API; however, gRPC is recommended.
:::
