::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/consistency)
English: [View English version](/en/spicedb/concepts/consistency)
:::

# 一致性（Consistency）

## 概述

一致性是分布式系统和授权的基础。SpiceDB 作为一个受 Google Zanzibar 启发的授权系统，提供了对一致性级别的细粒度控制。

## SpiceDB 中的一致性

### 核心挑战

SpiceDB 为了性能实现了多层缓存，但缓存可能会变得过时。如果 relationship 发生变化而缓存未更新，系统就有返回错误权限信息的风险——这个问题被称为"[新敌人问题](./zanzibar#新敌人问题)"。

### 解决方案

SpiceDB 允许开发者使用 ZedToken 按请求指定一致性级别，实现数据新鲜度和性能之间的动态权衡。

## 各 API 的默认一致性级别

| API 调用 | 默认值 |
|----------|---------|
| WriteRelationships、DeleteRelationships、ReadSchema、WriteSchema | `fully_consistent` |
| 所有其他 API | `minimize_latency` |

## 一致性模式

### Minimize Latency（最小化延迟）

通过使用缓存数据优先保证速度。如果单独使用，存在新敌人问题的风险。

### At Least As Fresh（至少同样新）

确保数据至少与指定时间点（通过 ZedToken）一样新。如果有更新的数据则使用更新的。

### At Exact Snapshot（精确快照）

使用精确时间点的数据。由于垃圾回收，可能会出现 "Snapshot Expired" 错误。

### Fully Consistent（完全一致）

确保与最新数据存储数据完全一致。绕过缓存，显著增加延迟。

::: warning
由于分布式数据库节点间的时钟偏移（默认时钟偏移为 500ms），`fully_consistent` 在 CockroachDB 上不保证写后读一致性。
:::

## ZedToken

ZedToken 是代表数据存储快照的不透明令牌，类似于 Google Zanzibar 的 "Zookie" 概念。它们由 CheckPermission、BulkCheckPermission、WriteRelationships 和 DeleteRelationships API 返回。

### 存储策略

开发者应将 ZedToken 存储在应用数据库中，与受保护资源一起存放，并在以下情况更新：

- 资源被创建/删除时
- 资源内容发生变化时
- 访问权限发生变化时

对于 PostgreSQL，建议存储为标准 `text` 或 `varchar(1024)` 列。

### 实践指南

**复杂层次结构：** 在为层次数据结构存储令牌时，引用父资源。

**更简单的替代方案：** 使用完全一致性的写后读查询。适合实验，但可能不适合生产环境。

**忽略 ZedToken：** 某些工作负载对权限竞态条件不敏感，可以安全地忽略 ZedToken。可通过 `--datastore-revision-quantization-interval` 标志进行配置。
