::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/commands)
中文版: [查看中文版](/zh/spicedb/concepts/commands)
:::

# Commands & Parameters

## Main Command: `spicedb`

SpiceDB is described as "A database that stores and computes permissions."

### Global Options

Three parent-level flags apply across all commands:

| Flag | Description |
|------|-------------|
| `--log-format` | Log output format (`auto`, `console`, or `json`) |
| `--log-level` | Logging verbosity (`trace`, `debug`, `info`, `warn`, `error`) |
| `--skip-release-check` | Disable version checking |

## Subcommands

### Datastore Operations (`spicedb datastore`)

Four specialized commands manage database operations:

#### `spicedb datastore gc`

Garbage collection removing stale/expired relationships and transactions.

#### `spicedb datastore head`

Computes the latest available migration revision.

#### `spicedb datastore migrate`

Executes schema migrations. Accepts "head" for the latest version:

```bash
spicedb datastore migrate head \
  --datastore-engine $DESIRED_ENGINE \
  --datastore-conn-uri $CONNECTION_STRING
```

#### `spicedb datastore repair`

Performs datastore repair operations.

### Server Commands

#### `spicedb serve`

Launches the main SpiceDB permissions server with extensive configuration options for gRPC, HTTP, datastores, caching, and metrics.

**Basic usage with in-memory datastore (development only):**

```bash
spicedb serve --grpc-preshared-key "somerandomkeyhere" --datastore-engine memory
```

**Production usage with PostgreSQL and TLS:**

```bash
spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --grpc-tls-cert-path /path/to/cert \
  --grpc-tls-key-path /path/to/key \
  --datastore-engine postgres \
  --datastore-conn-uri "postgres://user:password@localhost:5432/spicedb?sslmode=require"
```

The `serve` command supports 100+ configuration options covering:

- Multiple datastore backends (Postgres, MySQL, CockroachDB, Spanner)
- TLS/encryption settings
- Connection pooling parameters
- Cache management
- Metrics and observability
- Dispatch clustering
- Rate limiting and resource constraints

#### `spicedb serve-testing`

Isolated in-memory test server supporting per-token datastores. Useful for integration testing.

### Utility Commands

#### `spicedb lsp`

Language Server Protocol implementation for editor integration with SpiceDB schema files.

#### `spicedb man`

Generates system man pages for installation.

#### `spicedb postgres-fdw`

EXPERIMENTAL: Postgres Foreign Data Wrapper proxy.

#### `spicedb version`

Displays SpiceDB version information.
