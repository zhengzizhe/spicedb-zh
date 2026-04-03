::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/access-control-audit)
English: [View English version](/en/spicedb/modeling/access-control-audit)
:::

# 访问控制审计

除了提供管理访问控制的手段外，另一个常见功能是用于审计访问控制的工具。本页介绍如何帮助管理员和用户了解存在哪些权限以及权限如何随时间变化。

## 审计用户权限

要确定用户对某个资源拥有的计算权限，SpiceDB 提供了两个 API：

### ExperimentalReflectSchema

此 API 允许您查询特定资源可用的权限。您甚至可以按权限名称或权限名称前缀进行过滤。

### BulkCheckPermission

此 API 允许您在单次往返中执行多种权限检查。这比发出单独的检查更高效，因为 SpiceDB 会批量处理涉及的许多子问题。

## 审计访问授权

文档区分了访问授权和权限：

- **访问授权**：直接的用户分配（例如，"用户 joe 被分配为仓库 kubernetes 的读者"）
- **权限**：所有授权路径的计算结果

### Schema 示例

```txt
definition user {}

definition team {
  relation member: user
}

definition repository {
  relation role_reader: user | team#member
  relation role_writer: user | team#member
  relation role_adminer: user | team#member

  permission read = role_reader + write
  permission write = role_writer + admin
  permission admin = role_adminer
}
```

### Watch API

要了解系统中的访问授权如何随时间变化，您可以使用 SpiceDB Watch API，它允许您近乎实时地流式传输所有关系变更。

::: info
SpiceDB 默认保留最多 24 小时的变更历史，之后会自动进行垃圾回收。
:::

## 审计权限变更

::: warning
此策略计算密集度非常高，很可能需要扩展 SpiceDB 集群。
:::

该方法涉及：

1. 使用 Watch API 流式传输关系变更
2. 使用 `ExperimentalComputablePermissions` 确定受影响的权限

这两个 API 是开始重新计算权限的基础。用例越细分和可控，这种方法在规模化运行时成功的可能性就越高。

对于特定资源的变更，可以为每个受影响的权限运行 `LookupSubjects`。然而，计算所有资源的所有主体是一个开销很大的操作。

## 审计 SpiceDB API 请求

SpiceDB 缺少内置的 API 调用追踪功能。替代方案包括：

- 使用中间件框架自定义中间件
- 用服务层包装 SpiceDB
- 启用 `--grpc-log-requests-enabled` 和 `--grpc-log-response-enabled` 标志
- 使用 Authzed Audit Logging（企业版功能）
