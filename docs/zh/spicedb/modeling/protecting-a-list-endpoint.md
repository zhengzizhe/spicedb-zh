::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/protecting-a-list-endpoint)
English: [View English version](/en/spicedb/modeling/protecting-a-list-endpoint)
:::

# 保护列表端点

SpiceDB 将授权与数据关注点分离，要求应用程序在处理列表端点时同时调用数据库和 SpiceDB，然后将结果合并。

在列表端点上实施授权需要同时调用数据库和 SpiceDB，并将查询结果合并为响应。

## 方法

### LookupResources

如果用户可以访问的资源数量较少（例如少于 10,000 个资源），您可以使用 `LookupResources` API 获取用户对其拥有特定权限的完整资源列表，然后将其用作数据库查询中的过滤条件。

基本模式：

1. 调用 `LookupResources` 获取可访问的资源 ID
2. 使用这些 ID 过滤数据库查询（例如 `WHERE id = ANY(ARRAY[...])`）
3. 返回过滤后的结果

**权衡：** 这是最简单的方法，但在大型数据集或复杂 Schema 下性能会下降。

### CheckBulkPermissions

如果用户可以访问的资源数量足够大，`LookupResources` 无法满足需求，另一种方法是从数据库中获取一页资源，然后对这些资源调用 `CheckBulkPermissions`。

该模式会迭代直到找到一整页可访问的结果：

1. 从数据库获取候选结果
2. 通过 `CheckBulkPermissions` 检查哪些是可访问的
3. 如果可访问的结果不足，使用新的候选结果重复操作

::: info
建议在相同的修订版本（使用相同的 ZedToken）上运行各个 `CheckBulkPermissions` API 调用，以获得一致的权限视图。
:::

这种方法与基于游标的分页配合使用效果优于 limit-offset 分页。

### Authzed Materialize

目前处于抢先体验阶段。通过以下方式创建用户权限的非规范化本地副本：

1. 监视 SpiceDB 集群的变更
2. 发出权限获取/丢失事件
3. 允许服务对本地物化视图进行 JOIN 查询

这种方法提供了三种方案中最大的可扩展性。

## 设计考虑

"数据存在但用户无权查看"与"没有数据可查看"是有区别的。在由 SpiceDB 支持的细粒度授权系统中，通常将这两者视为相同的情况是合理的——返回一个成功的响应和空的结果集，而不是 403 错误。
