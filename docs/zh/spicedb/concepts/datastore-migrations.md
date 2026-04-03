::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/datastore-migrations)
English: [View English version](/en/spicedb/concepts/datastore-migrations)
:::

# 数据存储迁移

## 概述

SpiceDB 定期发布更新，更新发布在 GitHub 发布页面，并通过 Twitter 和 Discord 公布。虽然版本之间的过渡通常很简单，但涉及数据存储变更的版本需要用户执行迁移命令。

本页面介绍 SpiceDB 底层数据存储 Schema 的迁移。有关 SpiceDB 实例之间迁移的信息，请参阅实例迁移文档。有关需要迁移的 SpiceDB Schema 变更，请参阅 Schema 迁移指南。

## 迁移要求

在将数据存储与 SpiceDB 配合使用或运行新版本之前，必须执行所有可用的迁移。所有受支持的数据存储（CockroachDB、MySQL、PostgreSQL、Spanner）都支持迁移，memdb 是例外，因为它不持久化数据。

**迁移命令：**

```bash
spicedb datastore migrate head \
  --datastore-engine $DESIRED_ENGINE \
  --datastore-conn-uri $CONNECTION_STRING
```

在大多数情况下，此命令不会导致停机，但建议在生产环境执行前先在非生产环境中验证。

## 迁移兼容性

SpiceDB 在启动时验证其期望的数据存储迁移标签是否与数据存储中存储的标签匹配。如果不匹配，SpiceDB 会返回错误。此检查仅在启动时进行，这意味着新的迁移不会破坏现有实例（除非它们重启），前提是 DDL 保持兼容。

SpiceDB 在每个版本及其下一个小版本之间保持兼容性。对于主版本更新，用户应查阅目标版本的升级说明以了解额外要求。

### 覆盖迁移兼容性

在特定情况下，可以针对不同的数据存储迁移运行某个 SpiceDB 版本。如果已确认兼容性，请使用 `--datastore-allowed-migrations` 标志：

```bash
spicedb serve <...> \
  --datastore-allowed-migrations add-expiration-support \
  --datastore-allowed-migrations add-transaction-metadata-table
```

## 建议

**托管服务：** AuthZed 提供 SpiceDB 托管服务，始终执行零停机迁移。

**Operator：** SpiceDB Operator 是自运维实例推荐的更新方式。

**顺序更新：** 用户应按 SpiceDB 小版本顺序更新，以避免遗漏关键的版本说明。SpiceDB Operator 会自动化这个过程。

**滚动部署：** 协调滚动更新的部署编排器可防止流量丢失。SpiceDB 的设计考虑了 Kubernetes，但也支持其他平台。
