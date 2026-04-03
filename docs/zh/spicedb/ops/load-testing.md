::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/load-testing)
English: [View English version](/en/spicedb/ops/load-testing)
:::

# SpiceDB 负载测试

本指南帮助你了解 SpiceDB 的性能基础知识，并构建能够准确反映工作负载需求的真实负载测试。

## 1. 为 SpiceDB 负载测试准备数据

### 关系数据分布

与另一个对象关联的对象数量（基数）会显著影响 CheckPermission 和 Lookup 请求的性能。SpiceDB 会将每个 CheckPermission 请求分解为并行的子问题；子问题越多，响应时间越长。

为中间对象计算子问题的概念称为"扇出"（fanout）。查询可以在找到匹配结果后短路返回，但交集（`&`）和排除（`-`）操作会阻止此优化，对性能产生负面影响。

使用尽可能接近真实数据的关系数据来初始化 SpiceDB 实例至关重要。

### 识别关系分布模式

正确关系分布的步骤：

- 生成对象类型及其关系的列表
- 确定每种类型有多少对象
- 确定有多少百分比的资源对象与每个关系有关联
- 识别特定关系的分布模式
- 实现反映这些模式的关系生成代码

在负载测试前预先填充关系数据。测试期间的写入应仅用于衡量写入性能，而不是为 CheckPermission/Lookup 请求准备数据。

## 2. SpiceDB 检查的负载测试

被检查的特定资源、权限和主体会显著影响性能。

### SpiceDB 检查缓存利用率

SpiceDB 在当前量化窗口（默认 5 秒）内缓存计算的子问题。后续使用相同版本的请求可以从内存中获取缓存结果，避免数据存储往返和计算。

### SpiceDB 检查扇出影响

CheckPermission 请求需要不同程度的扇出。应在真实的主体、资源和权限样本中分散检查。

### SpiceDB 检查样本大小

不要同时测试整个用户群。仅为真实场景中会同时在线的用户发出 CheckPermission 请求，以提高缓存命中率的准确性。

### SpiceDB 检查否定检查性能

否定检查（返回 NO_PERMISSION）比肯定检查计算成本更高，因为它们会遍历每个图分支以搜索满足条件的答案。大多数部署执行的主要是肯定检查。

### 识别 SpiceDB 检查分布模式

通过以下方式设计真实的分布：

1. 确定同时在线用户的百分比
2. 选择有代表性的用户/资源组合（避免人工模式）
3. 当精确数据不可用时，使用帕累托分布作为近似

## 3. SpiceDB 查找的负载测试

查找比检查的计算成本更高，需要更多子问题。遍历交集和排除的查找成本更高。查找既使用缓存也填充缓存。

### 识别 Lookup Subjects 分布模式

识别跨资源对象和权限的查找分布。在具有不同请求复杂度的用户之间合理分配请求。

### 识别 Lookup Resources 分布模式

选择一部分同时在线的用户进行测试。在具有不同计算开销的用户之间合理分配请求。

## 4. SpiceDB 写入的负载测试

写入对数据存储性能的影响大于对 SpiceDB 节点性能的影响。

::: info
CockroachDB 用户有特殊的重叠策略注意事项。对于 Postgres，CREATE 比 TOUCH 性能更好（TOUCH 会先删除再插入）。
:::

### 识别 SpiceDB 写入分布模式

在负载测试前预先填充关系数据。测试期间的写入应仅用于衡量写入性能。

将写入量化为：
- 总请求的百分比（例如 0.5%）
- 每秒数量（例如每秒 30 次写入）

被写入关系的资源、主体和权限通常不影响性能。

## 5. SpiceDB Schema 性能

在建模满足业务需求的 Schema 时，性能不应作为首要考虑因素。满足需求后，再检查优化机会。

### SpiceDB Caveats 性能

Caveats（条件）应仅评估动态数据（例如基于时间的访问、基于位置的访问）。大多数场景在图中处理效果更好。Caveats 增加计算成本，因为评估结果无法缓存。

### SpiceDB 嵌套和递归性能

更多的图跳转需要更多的子问题计算。两层递归文件夹关系显示最小的性能影响；30 层递归则会产生显著的性能影响。跨不同对象类型的深层嵌套同样影响性能。

### SpiceDB 交集和排除性能

交集和排除对 Check 性能有较小的负面影响（需要在两侧验证权限关系）。

它们对 LookupResources 性能有显著的负面影响，需要计算候选主体集，然后对所有候选者进行检查。

## 6. SpiceDB 配置性能

### SpiceDB 量化性能

`datastore-revision-quantization-interval` 设置指定使用选定数据存储版本的窗口，决定缓存结果的生命周期。

`datastore-revision-quantization-max-staleness-percent` 设置指定可能选择过时版本以提高性能的百分比区间。增加任一设置都会改善缓存利用率和性能。

### SpiceDB 一致性性能

一致性对缓存利用率和性能有显著影响。大多数 SpiceDB 用户对所有请求使用 `minimize_latency`。Authzed 团队建议不要使用 `fully_consistent`；而是使用 `at_least_as_fresh` 在安全时利用缓存。

## 7. 使用 Thumper 进行负载生成

### 概述

Thumper 是 Authzed 的内部负载生成器。它灵活地分配检查、查找和写入，产生真实、均匀的请求流。使用 Thumper 便于获得 Authzed 团队的支持。

### 编写脚本

脚本包含一个或多个操作，通过权重确定执行频率：

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

### 运行脚本

通过迁移进行设置：

```sh
thumper migrate --endpoint spicedb:50051 --token t_some_token --insecure true ./scripts/schema.yaml
```

运行测试：

```sh
thumper run --endpoint spicedb:50051 --token t_some_token --insecure true ./scripts/example.yaml
```

### 调整负载

默认：每秒一个脚本。使用 `THUMPER_QPS` 环境变量或 `--qps` 标志增加请求：

```sh
thumper run --token presharedkeyhere --qps 5
```

这会启动 5 个 goroutine，每个每秒发出一次调用。

### 配置

使用命令行标志或环境变量。所有标志可通过 `thumper --help` 查看。将标志转换为环境变量的方式是大写并添加 `THUMPER_` 前缀（例如 `--qps` 变为 `THUMPER_QPS`）。

### 监控 Thumper 进程

Thumper 在 `:9090/metrics` 以 Prometheus 格式暴露指标，用于吞吐量和行为洞察。

## 8. 监控 SpiceDB 负载测试

SpiceDB 指标帮助你：

- 验证正确的请求生成速率
- 获取请求延迟信息
- 微调负载测试

AuthZed Dedicated 管理控制台提供预配置的指标。自托管的 SpiceDB 实例通过 Prometheus 端点导出指标。

## 9. 扩展 SpiceDB

### 扩展 SpiceDB 数据存储

监控底层数据库性能。高数据存储 CPU 利用率是最常见的扩展指标。

### 扩展 SpiceDB 计算

当 CPU 利用率较高时进行扩展。SpiceDB 对性能敏感的特性使其即使在 30% CPU 利用率下也能通过水平扩展获得显著收益。

## 10. Authzed 如何帮助 SpiceDB 负载测试

Authzed 团队提供的协助包括：

- Schema 优化审查
- 关系数据填充脚本的创建/审查
- CheckPermission 和 Lookup 流量生成脚本的创建/审查
- AuthZed Dedicated 试用配置，提供实时调整和优化
