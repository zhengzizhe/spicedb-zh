::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/load-testing)
中文版: [查看中文版](/zh/spicedb/ops/load-testing)
:::

# Load Testing SpiceDB

This guide helps you understand SpiceDB performance fundamentals and build realistic load tests that accurately reflect your workload requirements.

## 1. Seeding Data for SpiceDB Load Tests

### Relationship Data Distribution

The number of objects related to another object (cardinality) significantly affects CheckPermission and Lookup request performance. SpiceDB breaks each CheckPermission request into parallel sub-problems; more sub-problems mean longer response times.

The concept of computing sub-problems for intermediary objects is called "fanout" or "fanning out." Queries can short-circuit upon finding a positive match, but Intersections (`&`) and Exclusions (`-`) prevent this optimization, negatively impacting performance.

It is critical to have a SpiceDB instance seeded with relationship data that closely mimics real world data.

### Identifying Relationship Distribution Patterns

Steps for correct relationship distribution:

- Generate lists of object types and their relationships
- Identify how many objects of each type exist
- Determine what percentage of resource objects have relationships with each relation
- Identify distribution patterns for specific relations
- Implement relationship generation code reflecting these patterns

Pre-seed relationships before load testing. Writes during testing should measure write performance only, not seed data for CheckPermission/Lookup requests.

## 2. Load Testing SpiceDB Checks

The specific resources, permissions, and subjects checked significantly impact performance.

### SpiceDB Check Cache Utilization

SpiceDB caches computed subproblems for the current quantization window (default 5 seconds). Subsequent requests using the same revision can fetch cached results from memory, avoiding datastore roundtrips and computation.

### SpiceDB Check Fanout Impact

CheckPermission requests require varying amounts of fanout. Spread checks across realistic samples of subjects, resources, and permissions.

### SpiceDB Check Sample Size

Don't test entire user bases simultaneously. Only issue CheckPermission requests for users who would realistically be online, improving cache hit ratio accuracy.

### SpiceDB Check Negative Check Performance

Negative checks (returning NO_PERMISSION) are more computationally expensive than positive checks because they traverse every graph branch searching for a satisfactory answer. Most deployments execute predominantly positive checks.

### Identifying SpiceDB Check Distribution Patterns

Design realistic distributions by:

1. Determining what percentage of users would be simultaneously online
2. Selecting representative user/resource combinations (avoiding artificial patterns)
3. Using Pareto distributions as approximations when exact data is unavailable

## 3. Load Testing SpiceDB Lookups

Lookups are more computationally expensive than checks, requiring more subproblems. Those traversing intersections and exclusions cost more. Lookups both use and populate the cache.

### Identifying Lookup Subjects Distribution Patterns

Identify lookup distributions across resource objects and permissions. Distribute requests thoughtfully across users with varying request complexity.

### Identifying Lookup Resources Distribution Patterns

Select a subset of simultaneously-online users for testing. Thoughtfully distribute requests among users with varying computational expense.

## 4. Load Testing SpiceDB Writes

Writes impact datastore performance more than SpiceDB node performance.

::: info
CockroachDB users have special overlap-strategy considerations. For Postgres, CREATE is more performant than TOUCH (which deletes then inserts).
:::

### Identifying SpiceDB Write Distribution Patterns

Pre-seed relationships before load testing. Writes during tests should measure write performance only.

Quantify writes as either:
- Percentage of overall requests (e.g., 0.5%)
- Number per second (e.g., 30 writes/second)

Resource, subject, and permission of written relationships typically don't affect performance.

## 5. SpiceDB Schema Performance

Performance shouldn't be the primary concern when modeling schemas that satisfy business requirements. After requirements are met, examine optimization opportunities.

### SpiceDB Caveats Performance

Caveats should only evaluate dynamic data (e.g., time-based access, location-based access). Most scenarios work better in the graph. Caveats add computational cost since evaluations can't be cached.

### SpiceDB Nesting & Recursion Performance

More graph hops require more subproblem computation. Two-layer recursive folder relationships show minimal penalty; 30-layer recursion creates significant penalty. Deep nesting across different object types similarly impacts performance.

### SpiceDB Intersections and Exclusions Performance

Intersections and exclusions create small negative Check performance impacts (requiring permissionship verification on both sides).

They create significant negative LookupResources impacts by requiring computation of candidate subject sets followed by checks on all candidates.

## 6. SpiceDB Configuration Performance

### SpiceDB Quantization Performance

The `datastore-revision-quantization-interval` setting specifies the window for using chosen datastore revisions, determining cached result lifespan.

The `datastore-revision-quantization-max-staleness-percent` setting specifies the percentage interval where stale revisions may be selected for performance. Increasing either setting improves cache utilization and performance.

### SpiceDB Consistency Performance

Consistency significantly affects cache utilization and performance. Most SpiceDB users employ `minimize_latency` for all requests. The Authzed team recommends against `fully_consistent`; instead use `at_least_as_fresh` to utilize cache when safe.

## 7. Load Generation using Thumper

### Overview

Thumper is Authzed's in-house load generator. It distributes checks, lookups, and writes flexibly with realistic, even request flow. Using Thumper facilitates Authzed team support.

### Writing Scripts

Scripts contain one or more operations with weights determining execution frequency:

```yaml
---
name: "check"
weight: 40
steps:
  - op: "CheckPermission"
    resource: "{{ .Prefix }}resource:firstdoc"
    subject: "{{ .Prefix }}user:tom"
    permission: "view"

---
name: "read"
weight: 30
steps:
  - op: "ReadRelationships"
    resource: "{{ .Prefix }}resource:firstdoc"
    numExpected: 2
```

### Running Scripts

Setup with migration:

```sh
thumper migrate --endpoint spicedb:50051 --token t_some_token --insecure true ./scripts/schema.yaml
```

Run tests:

```sh
thumper run --endpoint spicedb:50051 --token t_some_token --insecure true ./scripts/example.yaml
```

### Changing the Load

Default: one script per second. Increase requests using `THUMPER_QPS` environment variable or `--qps` flag:

```sh
thumper run --token presharedkeyhere --qps 5
```

This spawns 5 goroutines, each issuing calls once per second.

### Configuration

Use command-line flags or environment variables. All flags are discoverable via `thumper --help`. Convert flags to environment variables by capitalizing and prepending `THUMPER_` (e.g., `--qps` becomes `THUMPER_QPS`).

### Monitoring the Thumper Process

Thumper exposes metrics at `:9090/metrics` in Prometheus format for throughput and behavior insights.

## 8. Monitoring a SpiceDB Load Test

SpiceDB metrics help you:

- Verify correct request generation rates
- Obtain request latency information
- Fine-tune load tests

AuthZed Dedicated Management Console provides pre-configured metrics. Self-hosted SpiceDB instances export metrics via the Prometheus endpoint.

## 9. Scaling SpiceDB

### Scaling the SpiceDB Datastore

Monitor underlying database performance. High datastore CPU utilization is the most common scaling indicator.

### Scaling the SpiceDB Compute

Scale when CPU utilization is high. SpiceDB's performance-sensitive nature shows significant gains from horizontal scaling even under 30% CPU utilization.

## 10. How Authzed Helps with Load Testing SpiceDB

Authzed team assistance includes:

- Schema optimization reviews
- Relationship data seeding script creation/review
- CheckPermission and Lookup traffic generation script creation/review
- AuthZed Dedicated trial provision with real-time adjustments and optimizations
