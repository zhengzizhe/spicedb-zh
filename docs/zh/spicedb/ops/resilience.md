::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/resilience)
English: [View English version](/en/spicedb/ops/resilience)
:::

# 提升弹性

建议在为 SpiceDB 部署实施弹性改进之前，先建立可观测性。

## 重试

在向 SpiceDB 发送请求时，实现正确的重试逻辑至关重要，因为 gRPC 可能会遇到临时故障，这些故障可以通过重试来解决。建议对所有 gRPC 方法进行重试。

### 实现重试策略

使用 gRPC Service Config 的推荐重试策略配置：

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

**配置详情：**

- **maxAttempts: 3** - 允许最多 3 次总尝试（1 次初始 + 2 次重试），防止无限循环同时允许瞬态问题解决
- **initialBackoff: "1s"** - 设置首次重试前 1 秒的延迟
- **maxBackoff: "4s"** - 限制重试之间的最大延迟为 4 秒
- **backoffMultiplier: 2** - 每次重试时退避时间翻倍（模式：1s -> 2s -> 4s）
- **retryableStatusCodes** - 仅对特定的瞬态故障代码进行重试：
  - `UNAVAILABLE`：SpiceDB 暂时不可用
  - `RESOURCE_EXHAUSTED`：SpiceDB 过载
  - `DEADLINE_EXCEEDED`：请求超时
  - `ABORTED`：操作被中止，重试可能解决

官方示例仓库中提供了 Python 重试示例。

## ResourceExhausted 及其原因

SpiceDB 在保护自身资源时会返回 `ResourceExhausted` 错误。这些是瞬态条件，应使用退避策略进行重试以允许恢复。

### 内存压力

SpiceDB 实现了内存保护中间件，会拒绝可能导致内存溢出（OOM）的请求。

**可能的原因：**

- 实例配置的内存不足 -- 需要配置更多内存
- 大型 `CheckBulk` 或 `LookupResources` 请求在内存中收集结果 -- 识别有问题的客户端并添加分页或拆分请求

### 连接池争用

CockroachDB 和 Postgres 实现使用 pgx 连接池。当连接池耗尽时，SpiceDB 会返回 `ResourceExhausted` 而不是让客户端等待。

**诊断方法：** 检查 `pgxpool_empty_acquire` Prometheus 指标或 `authzed_cloud.spicedb.datastore.pgx.waited_connections` Datadog 指标。正值表示 SpiceDB 正在等待数据库连接。

**配置标志：**

- `--datastore-conn-pool-read-max-open`
- `--datastore-conn-pool-read-min-open`
- `--datastore-conn-pool-write-max-open`
- `--datastore-conn-pool-write-min-open`

SpiceDB 使用独立的读写连接池，通过标志设置最小和最大连接数。

## 如何修复 Postgres 连接池争用

### 确保 Postgres 有足够的可用连接

Postgres 连接开销较大，因为每个连接都是一个独立的进程。最大连接数取决于实例大小。

**错误示例：**

```json
{
  "level": "error",
  "error": "failed to create datastore: failed to create primary datastore: failed to connect to `user=spicedbchULNkGtmeQPUFV database=thumper-pg-db`: 10.96.125.205:5432 (spicedb-dedicated.postgres.svc.cluster.local): server error: FATAL: remaining connection slots are reserved for non-replication superuser connections (SQLSTATE 53300)",
  "time": "2025-11-24T20:32:43Z",
  "message": "terminated with errors"
}
```

这表示没有可用连接；需要扩大 Postgres 实例规模。

### 使用连接池管理器

如果数据库负载相对较低但使用了较多连接，可以考虑使用 pgbouncer。它在 SpiceDB 和 Postgres 等客户端之间复用连接，降低连接开销。

### 配置连接标志

设置标志确保请求的最大连接数在可用连接范围内：

```
(read_max_open + write_max_open) * num_spicedb_instances < total_available_postgres_connections
```

根据部署模型，为新加入服务的实例留出额外余量。

## 如何修复 CockroachDB 连接池争用

### 确保 CockroachDB 有足够的可用 CPU

CockroachDB 为 Basic/Standard 和 Advanced 部署提供了不同的连接池大小建议。这些启发式方法需要反复试验才能找到特定工作负载的最佳连接池大小。

### 配置连接标志

设置标志确保请求的连接数与期望数量匹配：

```
(read_max_open + write_max_open) * num_spicedb_instances < total_available_cockroach_connections
```

::: info
SpiceDB 可以暴露 HTTP API；但推荐使用 gRPC。
:::
