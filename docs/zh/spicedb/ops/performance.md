::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/performance)
English: [View English version](/en/spicedb/ops/performance)
:::

# 提升性能

本页面介绍了在生产环境中提升 SpiceDB 性能的三种主要方法。

## 通过启用跨节点通信

SpiceDB 支持集群部署，多个节点可以协作处理 API 请求。一个名为 **dispatch**（调度）的功能允许节点将单个 API 请求分解为更小的子查询，并将它们转发到其他集群节点，从而降低延迟。

### 工作原理

每个 SpiceDB 节点维护一个内存缓存，用于存储过去已解析的权限查询。当一个节点遇到新的权限查询时，其答案可能存在于另一个节点上，因此 SpiceDB 会将请求转发到另一个节点以检查共享缓存。

有关技术细节，请参阅"gRPC 一致性哈希负载均衡"文章。

### Kubernetes 配置

使用 SpiceDB Operator 时，dispatch 会自动启用。如果不使用 Operator，请设置：

```sh
--dispatch-upstream-addr=kubernetes:///spicedb.default:50053
```

将 `spicedb.default` 替换为你实际的 Kubernetes Service 名称。

### 非 Kubernetes 配置

::: warning
非 Kubernetes 的 dispatch 依赖于 DNS 更新，可能会变得过时。仅在 DNS 变更不频繁时推荐使用。
:::

使用以下标志启用 dispatch：

```sh
spicedb serve \
  --dispatch-cluster-enabled=true \
  --dispatch-upstream-addr=upstream-addr \
  ...
```

或通过环境变量：

```sh
SPICEDB_DISPATCH_CLUSTER_ENABLED=true \
SPICEDB_DISPATCH_UPSTREAM_ADDR=upstream-addr \
spicedb serve ...
```

`upstream-addr` 应指向负载均衡器的 DNS 地址，所有 SpiceDB 节点都可在端口 `:50053` 上访问。

## 通过启用 Materialize

Materialize 是一个独立的服务，支持预计算权限查询结果。运行后，SpiceDB 可以将子查询调度到 Materialize，从而显著加速权限检查。

## 通过启用 Schema 缓存

Schema 缓存存储类型和条件定义，避免重复从数据存储中获取。

### 缓存模式

1. **即时加载（JIT）缓存**：默认模式，按需加载定义。使用最少的内存，但在首次访问定义时会有冷启动延迟。

2. **监听缓存**：实验性模式，主动维护始终最新的缓存。内存使用更高，但消除了冷启动延迟。推荐在 Schema 频繁变更时使用。

### 配置标志

```bash
# 启用命名空间缓存（默认：true）
--ns-cache-enabled=true

# 最大内存（默认：32 MiB）
--ns-cache-max-cost=32MiB

# 启用实验性可监听 Schema 缓存（默认：false）
# 为 true 时：如果数据存储支持，则使用监听缓存
# 为 false 时：始终使用 JIT 缓存
--enable-experimental-watchable-schema-cache=false
```
