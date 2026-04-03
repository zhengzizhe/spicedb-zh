::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/data/migrations)
English: [View English version](/en/spicedb/ops/data/migrations)
:::

# SpiceDB 之间的数据迁移

本文档介绍如何在 SpiceDB 实例之间以最短停机时间迁移数据，例如迁移到 AuthZed Cloud。

## 重要说明

本指南仅涉及 SpiceDB 到 SpiceDB 的数据迁移。有关底层数据存储（Postgres、CockroachDB）的 Schema 迁移或 SpiceDB Schema 变更，请参阅相关文档章节。

::: warning
不推荐使用 `pg_dump`/`pg_restore` 等工具进行直接数据库级别的迁移，这可能会破坏 SpiceDB 的 MVCC。在不同数据存储类型之间迁移（例如从 Postgres 到 CockroachDB）时，必须使用 SpiceDB API（`exportBulk`/`importBulk` 或 `zed backup`）。
:::

## 前提条件

- zed CLI 工具

## 迁移选项

### 选项 1：带写入停机的迁移

一种直接的方法，在备份和恢复期间会产生写入停机（但不是读取停机）。

**步骤：**

1. 启动新的 SpiceDB 实例
2. 停止向旧 SpiceDB 写入
3. 对旧 SpiceDB 运行 `zed backup create <filename>`
4. 使用生成的备份文件对新 SpiceDB 运行 `zed backup restore <filename>`
5. 将读取切换到新 SpiceDB
6. 开始向新 SpiceDB 写入

### 选项 2：近零写入停机的迁移

一种更复杂的方法，通过持续同步来最小化写入停机。

**步骤：**

1. 启动新的 SpiceDB 实例
2. 对旧 SpiceDB 运行 `zed backup create <filename>`
3. 对新 SpiceDB 运行 `zed backup restore <filename>`
4. 运行 `zed backup parse-revision <filename>` 获取指向备份版本的 zed token
5. 使用你选择的 SpiceDB 客户端库，创建一个脚本持续调用 Watch API，将每个关系变更从旧 SpiceDB 写入新实例。在初始 API 调用中，将 zed token 作为 `WatchRequest` 对象中的 `optional_start_cursor` 提供。运行直到准备好停止旧的写入。
6. 停止向旧 SpiceDB 写入
7. 等待脚本不再接收到变更（此处产生最短写入停机）
8. 将读取和写入切换到新 SpiceDB
