::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/expiring-relationships)
English: [View English version](/en/spicedb/concepts/expiring-relationships)
:::

# 过期关系（Expiring Relationships）

## 概述

一个常见的使用场景是授予用户对资源的限时访问。在 SpiceDB v1.4.0 之前，caveat 是实现限时权限的推荐方法，但它有一些局限性：

- 需要客户端提供"当前时间"时间戳，增加了复杂性
- 过期的 caveat 不会自动被垃圾回收，可能导致系统中累积大量带 caveat 的 relationship

从 SpiceDB v1.4.0 开始，relationship 可以使用 RFC 3339 格式在指定时间后过期。

## Schema 配置

要启用过期功能，在 Schema 文件顶部添加 `use expiration`。使用 `<type> with expiration` 标记需要过期的 relation：

```txt
use expiration

definition user {}

definition resource {
  relation viewer: user with expiration
}
```

## API 实现

使用 `WriteRelationships` 或 `BulkImportRelationships` API，设置 `OptionalExpiresAt` 字段。

::: warning
创建或更新过期 relationship 时始终使用 TOUCH 操作。如果 relationship 已过期但垃圾回收尚未发生，使用 CREATE 将返回错误。
:::

## Playground 使用

relationship 格式如下：

```
resource:someresource#viewer@user:anne[expiration:2025-12-31T23:59:59Z]
```

或在 Relationship 网格编辑器的 Expiration 列中指定过期时间。

## CLI 使用

```bash
zed relationship create resource:someresource viewer user:anne \
  --expiration-time "2025-12-31T23:59:59Z"
```

## 垃圾回收

过期的 relationship 不再用于权限检查，但不会立即被删除。垃圾回收行为取决于数据存储：

- **Spanner/CockroachDB**：内置 SQL 行过期；relationship 在 24 小时后回收（不可配置）
- **PostgreSQL/MySQL**：垃圾回收作业每 5 分钟运行一次；relationship 默认在 24 小时后回收（可配置）

::: tip
对于频繁过期的应用程序，减小垃圾回收窗口（1-30 分钟）可提高性能。
:::

## 从 Caveat 迁移

对于之前使用 caveat 实现过期的系统，提供了六步迁移流程：

1. 更新 Schema，添加 `use expiration` 并使用 `with expiration` 标记 relation
2. 实现双写逻辑：同时写入基于 caveat 和基于过期的 relationship
3. 回填现有基于 caveat 的 relationship，添加过期时间戳
4. 验证基于过期的 relationship 正常工作
5. 移除基于 caveat 的写入逻辑
6. 清理旧的基于 caveat 的 relationship 和 caveat 定义

## 重要注意事项

数据存储的时钟决定过期状态。CockroachDB 等分布式数据库引入了时钟不确定性，使时钟同步变得至关重要。建议在本地部署中使用 Amazon Time Sync Service。
