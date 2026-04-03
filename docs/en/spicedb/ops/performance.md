::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/performance)
中文版: [查看中文版](/zh/spicedb/ops/performance)
:::

# Improving Performance

This page documents three primary methods for enhancing SpiceDB performance in production environments.

## By Enabling Cross-Node Communication

SpiceDB supports clustered deployments where multiple nodes can collaborate to serve API requests. A feature called **dispatch** allows nodes to decompose single API requests into smaller sub-queries and forward them to other cluster nodes, reducing latency.

### How It Works

Each SpiceDB node maintains an in-memory cache of permissions queries it has resolved in the past. When a new permissions query is encountered by one node, its answer may be present on another node, so SpiceDB will forward the request onward to the other node to check the shared cache.

For technical details, refer to the Consistent Hash Load Balancing for gRPC article.

### Kubernetes Configuration

When using the SpiceDB Operator, dispatch is enabled automatically. Without the operator, set:

```sh
--dispatch-upstream-addr=kubernetes:///spicedb.default:50053
```

Replace `spicedb.default` with your actual Kubernetes Service name.

### Non-Kubernetes Configuration

::: warning
Non-Kubernetes dispatch relies on DNS updates, which can become stale. Only recommended when DNS changes are infrequent.
:::

Enable dispatch with these flags:

```sh
spicedb serve \
  --dispatch-cluster-enabled=true \
  --dispatch-upstream-addr=upstream-addr \
  ...
```

Or via environment variables:

```sh
SPICEDB_DISPATCH_CLUSTER_ENABLED=true \
SPICEDB_DISPATCH_UPSTREAM_ADDR=upstream-addr \
spicedb serve ...
```

The `upstream-addr` should reference the load balancer DNS address where all SpiceDB nodes are accessible at port `:50053`.

## By Enabling Materialize

Materialize is a separate service enabling precomputation of permission query results. When operational, SpiceDB can dispatch sub-queries to Materialize, which can significantly speed up permission checks.

## By Enabling the Schema Cache

The schema cache stores type and caveat definitions, avoiding repeated datastore fetches.

### Caching Modes

1. **Just-In-Time (JIT) Caching**: Default mode that loads definitions on-demand. Uses minimal memory but incurs cold-start penalties on first definition access.

2. **Watching Cache**: Experimental mode that proactively maintains an always-current cache. Higher memory usage but eliminates cold-start penalties. Recommended for frequent schema changes.

### Configuration Flags

```bash
# Enable namespace cache (default: true)
--ns-cache-enabled=true

# Maximum memory (default: 32 MiB)
--ns-cache-max-cost=32MiB

# Enable experimental watchable schema cache (default: false)
# When true: uses watching cache if datastore supports it
# When false: always uses JIT caching
--enable-experimental-watchable-schema-cache=false
```
