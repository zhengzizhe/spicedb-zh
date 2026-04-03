::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/relationships)
English: [View English version](/en/spicedb/concepts/relationships)
:::

# 关系（Relationships）

## 概述

在 SpiceDB 中，一个完整的权限系统结合了 **Schema**（定义数据结构）和 **Relationship**（表示实际数据）。

## 理解 Relationship

### 核心概念

**Relation** 类似于类定义——它代表 Schema 中定义的一种可能的连接类型。例如："文档有编辑者。"

**Relationship** 是 relation 的具体实例，代表实际数据。例如："用户 `emilia` 是文档 `readme` 的编辑者"

### Relationship 语法

标准的 relationship 语法遵循以下模式：

```
document:readme#editor@user:emilia
```

分解如下：

- **资源（Resource）**：`document:readme`
- **关系（Relation）**：`editor`
- **主体（Subject）**：`user:emilia`

Relationship 也可以将对象链接到对象集合：

```
document:readme#editor@team:engineering#member
```

读作："team:engineering 的每个成员都可以编辑 document:readme"

::: warning
Object ID 在其类型内必须唯一且稳定。它们通常是计算机友好的字符串（UUID、整数、JWT `sub` 字段），而非人类可读的名称。
:::

### 图遍历

授权从根本上回答："这个操作者是否被允许对这个资源执行这个操作？"

SpiceDB 将授权转化为图的可达性问题。例如，检查"用户 `emilia` 能否编辑文档 `readme`？"，给定以下 relationship：

- `team:engineering#member@user:emilia`
- `document:readme#editor@team:engineering#member`

SpiceDB：

1. 从 `document:readme#editor` 开始
2. 沿着 `editor` 关系到达 `team:engineering#member`
3. 沿着 `member` 关系找到 `user:emilia`

Relationship 的强大之处在于：通过创建可遍历的图路径，它们既是"你提出的问题"，也是"答案"。

## 写入 Relationship

应用程序必须保持 SpiceDB 的 relationship 与应用状态同步。

### 仅存于 SpiceDB 的 Relationship

有时权限信息完全不需要存储在关系型数据库中。信息可以仅存在于 SpiceDB 中，在需要时通过 `ReadRelationships` 或 `ExpandPermissionsTree` API 调用来访问。

### 两阶段写入与提交

最常见的方法使用类似两阶段提交的逻辑：

```python
try:
    tx = db.transaction()
    resp = spicedb_client.WriteRelationships(...)
    tx.add(db_models.Document(
        id=request.document_id,
        owner=user_id,
        zedtoken=resp.written_at
    ))
    tx.commit()
except:
    tx.abort()
    spicedb_client.DeleteRelationships(...)
    raise
```

### 流式提交

通过第三方系统（如 Kafka）使用 CQRS 模式流式传输更新。Relationship 更新作为事件发布到流服务，由在两个数据库中执行更新的系统消费。

### 异步更新

对于能够容忍权限检查中复制延迟的应用程序，后台同步进程可以异步地将 relationship 写入 SpiceDB。

::: warning
在采用此方法之前，请仔细考虑一致性影响。
:::
