::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/observability)
English: [View English version](/en/spicedb/ops/observability)
:::

# 可观测性工具

SpiceDB 提供多种可观测性机制，确保可靠和高效运行，通过多个通道暴露元数据。

## Prometheus

每个 SpiceDB 命令都包含一个可配置的 HTTP 服务器，用于提供可观测性数据。Prometheus 指标端点位于 `/metrics`，提供关于 Go 运行时和已启用服务器的运行信息。还提供了用于可视化这些指标的 Grafana 仪表板。

## 性能分析

同一 HTTP 服务器在 `/debug/pprof` 提供 pprof 端点，支持多种分析类型：

- **cpu**：运行时主动消耗 CPU 周期的时间
- **heap**：当前和历史内存监控，内存泄漏检测
- **threadcreate**：导致操作系统线程创建的程序部分
- **goroutine**：所有当前 goroutine 的堆栈跟踪
- **block**：goroutine 在同步原语和计时器通道上的阻塞情况
- **mutex**：锁争用分析

示例命令：

```sh
go tool pprof 'http://spicedb.local:9090/debug/pprof/profile'
```

这会将分析文件下载到 `$HOME/pprof`，并提供 REPL 探索功能。分析文件可以通过 pprof.me 共享。

## OpenTelemetry 链路追踪

SpiceDB 使用 OpenTelemetry 进行请求追踪，可通过以 `otel` 为前缀的命令标志进行配置。

## 结构化日志

日志以 zerolog 格式输出到标准流，支持两种格式：控制台和 JSON。通过 `--log-format` 标志进行配置。非交互式输出默认使用 NDJSON 格式。

## 审计日志

审计日志是 AuthZed 产品的专属功能，将 SpiceDB API 操作的日志发布到日志汇集器。详情请参阅审计日志文档。

## 遥测

SpiceDB 报告指标以了解集群配置和性能，优先进行对社区有影响的开发。遥测永远不会共享存储在 SpiceDB 中可能包含敏感信息的数据。

可以通过 `--telemetry-endpoint=""` 禁用遥测。以 `spicedb_telemetry` 为前缀的指标通过 Prometheus Remote Write 协议每小时报告到 `telemetry.authzed.com`。实现细节在 TELEMETRY.md 和 `internal/telemetry` 目录中。
