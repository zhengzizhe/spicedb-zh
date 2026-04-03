::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/observability)
中文版: [查看中文版](/zh/spicedb/ops/observability)
:::

# Observability Tooling

SpiceDB provides multiple observability mechanisms for reliable and performant operation, exposing metadata through several channels.

## Prometheus

Every SpiceDB command includes a configurable HTTP server serving observability data. A Prometheus metrics endpoint is available at `/metrics`, offering operational information about the Go runtime and enabled servers. A Grafana dashboard is available for visualizing these metrics.

## Profiling

The same HTTP server provides pprof endpoints at `/debug/pprof` for various profile types:

- **cpu**: Runtime spent actively consuming CPU cycles
- **heap**: Current and historical memory monitoring, memory leak detection
- **threadcreate**: Program sections leading to OS thread creation
- **goroutine**: Stack traces of all current goroutines
- **block**: Goroutine blocking on synchronization primitives and timer channels
- **mutex**: Lock contention analysis

Example command:

```sh
go tool pprof 'http://spicedb.local:9090/debug/pprof/profile'
```

This downloads profiles to `$HOME/pprof` with REPL exploration capabilities. Profiles can be shared via pprof.me.

## OpenTelemetry Tracing

SpiceDB uses OpenTelemetry for request tracing, configurable via command flags prefixed with `otel`.

## Structured Logging

Logs emit to standard streams using zerolog in two formats: console and JSON. Configuration uses the `--log-format` flag. Non-interactive outputs default to NDJSON format.

## Audit Logs

Audit Logging is exclusive to AuthZed products and publishes logs of SpiceDB API operations to a log sink. Details are available in the Audit Logging documentation.

## Telemetry

SpiceDB reports metrics to understand cluster configuration and performance, prioritizing community-impacting development. Telemetry never shares data stored in SpiceDB that may contain anything sensitive.

Telemetry can be disabled with `--telemetry-endpoint=""`. Metrics prefixed with `spicedb_telemetry` are reported hourly via the Prometheus Remote Write protocol to `telemetry.authzed.com`. Implementation details are in TELEMETRY.md and the `internal/telemetry` directory.
