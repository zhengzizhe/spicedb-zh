::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/datastores)
English: [View English version](/en/spicedb/concepts/datastores)
:::

# 数据存储（Datastores）

## 概述

SpiceDB 使用现有的流行数据库系统来持久化数据。AuthZed 在托管服务中标准化使用 CockroachDB，但为自托管客户提供了基于运维需求的多种选择。

**可用的数据存储：**

- **CockroachDB** — 推荐用于高吞吐量和/或多区域需求的自托管部署
- **Cloud Spanner** — 推荐用于 Google Cloud 上的自托管部署
- **PostgreSQL** — 推荐用于单区域的自托管部署
- **MySQL** — 不推荐；仅在无法使用 PostgreSQL 时使用
- **memdb** — 推荐用于本地开发和集成测试

---

## CockroachDB

### 使用说明

- 推荐用于多区域部署，支持可配置的区域感知
- 通过添加更多 SpiceDB 和 CockroachDB 实例实现水平扩展
- 对单个 CockroachDB 实例故障具有容错能力
- 查询和数据在 CockroachDB 之间均衡分布
- 运行 CockroachDB 存在设置和运维复杂性

### 一致性注意事项

::: warning
`fully_consistent` 在 CockroachDB 上不保证写后读一致性。
:::

SpiceDB 使用 CockroachDB 的 `cluster_logical_timestamp()` 选择版本，不同节点之间的差异最大可达集群的 `max_offset`（默认：500ms）。如果读取节点的时间戳落后于写入节点，读取可能看不到最近提交的写入。

这是 CockroachDB 分布式时钟模型的特性，不适用于 PostgreSQL 等单节点数据存储。要获得写后读保证，请使用 ZedToken 配合 `at_least_as_fresh`。

### 配置

#### 必需参数

| 参数 | 描述 | 示例 |
|-----------|-------------|---------|
| `datastore-engine` | 数据存储引擎 | `--datastore-engine=cockroachdb` |
| `datastore-conn-uri` | CRDB 连接字符串 | `--datastore-conn-uri="postgres://user:password@localhost:26257/spicedb?sslmode=disable"` |

#### 可选参数

| 参数 | 描述 | 默认值 |
|-----------|-------------|---------|
| `datastore-max-tx-retries` | 最大查询重试次数 | 50 |
| `datastore-tx-overlap-strategy` | 防止新敌人问题的重叠策略 | `static` |
| `datastore-tx-overlap-key` | 重叠策略的键 | — |
| `datastore-conn-pool-read-max-idletime` | 读连接最大空闲时间 | 30m |
| `datastore-conn-pool-read-max-lifetime` | 读连接最大生命周期 | 30m |
| `datastore-conn-pool-read-max-lifetime-jitter` | 读连接关闭的抖动 | — |
| `datastore-conn-pool-read-max-open` | 并发读连接数 | 20 |
| `datastore-conn-pool-read-min-open` | 最小读连接数 | 20 |
| `datastore-conn-pool-write-healthcheck-interval` | 写连接健康检查间隔 | 30s |
| `datastore-conn-pool-write-max-idletime` | 写连接最大空闲时间 | 30m |
| `datastore-conn-pool-write-max-lifetime` | 写连接最大生命周期 | 30m |
| `datastore-conn-pool-write-max-lifetime-jitter` | 写连接关闭的抖动 | — |
| `datastore-conn-pool-write-max-open` | 并发写连接数 | 10 |
| `datastore-conn-pool-write-min-open` | 最小写连接数 | 10 |
| `datastore-query-split-size` | 查询拆分大小阈值 | — |
| `datastore-gc-window` | relationship 的垃圾回收窗口 | — |
| `datastore-revision-fuzzing-duration` | 令牌的模糊窗口 | — |
| `datastore-readonly` | 只读模式 | false |
| `datastore-follower-read-delay-duration` | 从节点读取延迟 | — |

#### 重叠策略

在分布式系统中，一致性可以换取性能。CockroachDB 用户可以配置 `--datastore-tx-overlap-strategy`：

| 策略 | 描述 |
|----------|-------------|
| `static`（默认） | 所有写入重叠以保证安全；牺牲写入吞吐量 |
| `prefix` | 仅具有相同前缀的写入重叠 |
| `request` | 仅具有相同 `io.spicedb.requestoverlapkey` 头的写入重叠 |
| `insecure` | 无写入重叠以获得最佳吞吐量；易受新敌人问题影响 |

#### 垃圾回收窗口

自 2023 年 2 月起，CockroachDB Serverless 的默认垃圾回收窗口更改为 1.25 小时，Dedicated 版本为 4 小时。

如果配置的垃圾回收窗口小于 SpiceDB 的配置，SpiceDB 会发出警告。调整方法：

```sql
ALTER ZONE default CONFIGURE ZONE USING gc.ttlseconds = 90000;
```

#### 关系完整性

关系完整性确保写入 CockroachDB 的数据经过验证，确认是由 SpiceDB 或具有访问密钥的授权调用者写入的。防止在数据存储访问被入侵时的未授权 relationship 注入。

##### 设置关系完整性

```bash
spicedb serve ...existing flags... \
  --datastore-relationship-integrity-enabled \
  --datastore-relationship-integrity-current-key-id="somekeyid" \
  --datastore-relationship-integrity-current-key-filename="some.key"
```

将 HMAC 兼容的密钥内容放入 `some.key` 文件。

::: warning
需要一个干净的数据存储。不支持从现有安装迁移。
:::

---

## Cloud Spanner

### 使用说明

- 需要具有活动 Cloud Spanner 实例的 Google Cloud 账户
- 利用 Google 的 TrueTime 优势
- Spanner 驱动假设数据库是可线性化的；跳过 CockroachDB 所需的事务重叠策略

### 配置

通过服务账户进行身份验证：迁移账户需要 `Cloud Spanner Database Admin` 权限；SpiceDB 需要 `Cloud Spanner Database User` 权限。

#### 必需参数

| 参数 | 描述 | 示例 |
|-----------|-------------|---------|
| `datastore-engine` | 数据存储引擎 | `--datastore-engine=spanner` |
| `datastore-conn-uri` | Cloud Spanner 数据库标识符 | `--datastore-conn-uri="projects/project-id/instances/instance-id/databases/database-id"` |

#### 可选参数

| 参数 | 描述 | 默认值 |
|-----------|-------------|---------|
| `datastore-spanner-credentials` | JSON 服务账户令牌 | 应用默认凭证 |
| `datastore-gc-interval` | 垃圾回收间隔 | 3m |
| `datastore-gc-window` | relationship 的垃圾回收窗口 | — |
| `datastore-revision-fuzzing-duration` | 令牌的模糊窗口 | — |
| `datastore-readonly` | 只读模式 | false |
| `datastore-follower-read-delay-duration` | 从节点读取延迟 | — |

---

## PostgreSQL

### 使用说明

- 推荐用于单区域部署
- 需要 PostgreSQL 15 或更新版本以获得最佳性能
- 仅通过从节点和适当的故障转移实现容错
- 不需要非标准 PostgreSQL 扩展
- 兼容托管服务（AWS RDS 等）
- 使用只读副本可扩展读取工作负载

::: warning
SpiceDB 的 Watch API 需要启用 PostgreSQL 的提交时间戳跟踪。通过 `--track_commit_timestamp=on` 标志、`postgresql.conf` 配置或执行 `ALTER SYSTEM SET track_commit_timestamp = on;` 并重启来启用。
:::

### 只读副本

SpiceDB 支持 PostgreSQL 只读副本，同时保持一致性保证。

**典型使用场景：**

- 扩展读取工作负载；从主节点分流
- 在其他区域部署以读为主的 SpiceDB

配置了异步复制的只读副本存在复制延迟。SpiceDB 通过检查版本是否已复制到目标副本来处理这个问题；如果未复制则回退到主节点。

所有一致性选项都利用副本，但具有陈旧性的选项获益最多：`minimize_latency`、`at_least_as_fresh`、`at_exact_snapshot` 模式具有最高的副本重定向可能性。

SpiceDB 支持负载均衡器后面的副本和/或单独的主机列表。多个 URI 使用轮询查询。最多支持 16 个副本 URI。

#### 事务 ID 和 MVCC

PostgreSQL MVCC 在写入行中存储内部事务 ID 计数。通过 `pg_dump`/`pg_restore` 传输或逻辑复制设置，实例特定的计数器可能会不同步。

SpiceDB 可能会表现得好像不存在 Schema，因为数据关联了未来的事务 ID。

### 配置

#### 必需参数

| 参数 | 描述 | 示例 |
|-----------|-------------|---------|
| `datastore-engine` | 数据存储引擎 | `--datastore-engine=postgres` |
| `datastore-conn-uri` | PostgreSQL 连接字符串 | `--datastore-conn-uri="postgres://postgres:password@localhost:5432/spicedb?sslmode=disable"` |

#### 可选参数

| 参数 | 描述 | 默认值 |
|-----------|-------------|---------|
| `datastore-conn-pool-read-max-idletime` | 读连接最大空闲时间 | 30m |
| `datastore-conn-pool-read-max-lifetime` | 读连接最大生命周期 | 30m |
| `datastore-conn-pool-read-max-open` | 并发读连接数 | 20 |
| `datastore-conn-pool-read-min-open` | 最小读连接数 | 20 |
| `datastore-conn-pool-write-healthcheck-interval` | 写连接健康检查间隔 | 30s |
| `datastore-conn-pool-write-max-idletime` | 写连接最大空闲时间 | 30m |
| `datastore-conn-pool-write-max-lifetime` | 写连接最大生命周期 | 30m |
| `datastore-conn-pool-write-max-open` | 并发写连接数 | 10 |
| `datastore-conn-pool-write-min-open` | 最小写连接数 | 10 |
| `datastore-query-split-size` | 查询拆分阈值 | — |
| `datastore-gc-window` | relationship 的垃圾回收窗口 | — |
| `datastore-revision-fuzzing-duration` | 令牌的模糊窗口 | — |
| `datastore-readonly` | 只读模式 | false |
| `datastore-read-replica-conn-uri` | 只读副本连接字符串 | — |

---

## MySQL

### 使用说明

- 推荐用于单区域部署
- 不需要非标准 MySQL 扩展
- 兼容托管服务
- 使用只读副本可扩展读取工作负载

::: warning
不要在 SpiceDB 和 MySQL 副本之间使用负载均衡器——一致性保证将被破坏。
:::

::: warning
SpiceDB 要求 `--datastore-conn-uri` 包含 `parseTime=True` 查询参数。
:::

### 只读副本

SpiceDB 支持 MySQL 只读副本，同时保持一致性保证。SpiceDB **不**支持负载均衡器后面的副本——仅支持单独的主机列表。

### 配置

#### 必需参数

| 参数 | 描述 | 示例 |
|-----------|-------------|---------|
| `datastore-engine` | 数据存储引擎 | `--datastore-engine=mysql` |
| `datastore-conn-uri` | MySQL 连接字符串 | `--datastore-conn-uri="user:password@(localhost:3306)/spicedb?parseTime=True"` |

#### 可选参数

| 参数 | 描述 | 默认值 |
|-----------|-------------|---------|
| `datastore-conn-pool-read-max-idletime` | 读连接最大空闲时间 | 30m |
| `datastore-conn-pool-read-max-lifetime` | 读连接最大生命周期 | 30m |
| `datastore-conn-pool-read-max-open` | 并发读连接数 | 20 |
| `datastore-conn-pool-read-min-open` | 最小读连接数 | 20 |
| `datastore-conn-pool-write-max-idletime` | 写连接最大空闲时间 | 30m |
| `datastore-conn-pool-write-max-lifetime` | 写连接最大生命周期 | 30m |
| `datastore-conn-pool-write-max-open` | 并发写连接数 | 10 |
| `datastore-conn-pool-write-min-open` | 最小写连接数 | 10 |
| `datastore-query-split-size` | 查询拆分阈值 | — |
| `datastore-gc-window` | relationship 的垃圾回收窗口 | — |
| `datastore-revision-fuzzing-duration` | 令牌的模糊窗口 | — |
| `datastore-mysql-table-prefix` | 表名前缀 | — |
| `datastore-readonly` | 只读模式 | false |
| `datastore-read-replica-conn-uri` | 只读副本连接字符串 | — |

---

## memdb

### 使用说明

- 完全临时的；进程终止时所有数据丢失
- 用于 SpiceDB 使用和应用集成测试
- 无法高可用运行；多个实例不共享内存数据

### 配置

#### 必需参数

| 参数 | 描述 | 示例 |
|-----------|-------------|---------|
| `datastore-engine` | 数据存储引擎 | `--datastore-engine memory` |

#### 可选参数

| 参数 | 描述 | 默认值 |
|-----------|-------------|---------|
| `datastore-revision-fuzzing-duration` | 令牌的模糊窗口 | — |
| `datastore-gc-window` | relationship 的垃圾回收窗口 | — |
| `datastore-readonly` | 只读模式 | false |
