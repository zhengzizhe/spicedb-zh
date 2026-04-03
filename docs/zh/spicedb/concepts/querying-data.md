::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/querying-data)
English: [View English version](/en/spicedb/concepts/querying-data)
:::

# 查询数据

## 概述

SpiceDB 提供了多个用于查询权限数据的 API，按典型使用频率和性能预期排序。请选择与您特定使用场景匹配的 API。

::: tip
在下面大多数 API 中，如果您希望能够读取到自己刚写入的数据，可以向查询传递 `consistency` 参数。根据您需要的严格程度，使用 `fully_consistent` 或 `at_least_as_fresh(revision)`。

您还可以在 API 请求中发送 `X-Request-ID=somevalue` 头，以便于日志关联和请求追踪。
:::

## CheckPermission

**发送：**

- Subject 类型
- Subject ID
- Permission（或 relation）
- Object 类型
- Object ID

**接收：**

- 是/否响应（如果 caveat 数据缺失则返回临时响应）

这是访问检查的主要 API，专为高流量工作负载设计。使用以下命令在本地调试：

```bash
zed permission check resource:someresource somepermission user:someuser --explain
```

subject 可以是单个用户（例如 `user:someuser`）或一组用户（例如 `group:engineering#member`）。

当 Schema 包含 caveat 但上下文不完整时，API 返回"条件性"而非直接的允许/拒绝决策。

## CheckBulkPermissions

**批量发送：**

- Subject 类型、Subject ID、Permission、Object 类型、Object ID

**批量接收：**

- 是/否响应（如果 caveat 数据缺失则返回临时响应）

适用于需要同时进行多个权限检查的 UI 工作负载——如表格、列表和仪表板。这是确定 subject 对资源拥有哪些权限的推荐方法：检查 Schema 中的每个 permission。性能优于多次 `CheckPermission` 调用。

## LookupResources

**发送：**

- Subject 类型
- Subject ID
- Permission（或 relation）
- Object 类型

**批量接收：**

- Object ID

查找特定 subject 可访问的特定类型的所有资源。支持游标分页，适用于中等规模的结果集。适合在列表端点中进行预过滤，但超过 10,000 个结果时性能会显著下降。对于更大的数据集，考虑使用 `CheckBulkPermissions` 进行后过滤，或评估 Materialize 功能。

## LookupSubjects

**发送：**

- Subject 类型
- Permission（或 relation）
- Object 类型
- Object ID

**批量接收：**

- Subject ID

返回具有特定资源访问权限的所有 subject，不支持游标。常用于显示具有特定权限的用户的 UI，例如管理员列表。

::: info
LookupSubjects 在对象和 subject 之间执行完整路径遍历，考虑所有有效路径。要查找特定 relation 上的 subject，请改用 `ReadRelationships`。
:::

当 Schema 包含排除和通配符时，响应可能包含显式排除的 subject，格式为：`{user:* - [user:anne,user:bob]}`。

**示例：** 对于定义了 `permission viewer = view - blocked` 的 Schema，以及 `document:finance#view@user:*`、`document:finance#blocked@user:anne` 和 `document:finance#blocked@user:bob` 的 relationship，LookupSubjects 返回上述排除 subject 格式。

## ReadRelationships

::: warning
ReadRelationships 是一个备用方案，仅在没有其他 API 匹配您的使用场景时才应考虑。
:::

高度灵活——接受 subject 类型/ID、permission、object 类型/ID 的任意组合，并返回匹配的 relationship。但存在重要注意事项：

- 由于灵活性，优化程度不如 Check 和 Lookup API
- 无结果缓存（Check 和 Lookup API 会缓存子问题计算）
- 数据库索引针对 Check 和 Lookup 模式优化，使某些 ReadRelationships 查询可能需要全表扫描

有效使用场景：

- 在简单过滤不足的情况下删除子树中的所有 relationship
- 显示对象之间角色或 relationship 列表的管理界面

## Watch

不用于回答权限问题；用于审计和类似的使用场景。详情请参阅 [Watch API](./watch) 文档。

## ExpandPermissionTree

基于 Zanzibar 论文，此 API 检查特定图节点周围的 relationship 子树——当 UI 需要显示哪些用户和组有权访问资源时很有用。

实际限制：每次只解析一个"跳跃"，需要重复调用才能获得完整的子树可见性，限制了其实际应用频率。
