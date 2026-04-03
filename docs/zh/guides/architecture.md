# SpiceDB 架构深度解析

::: info 原创内容
本文为社区原创，帮你理解 SpiceDB 作为分布式系统的内部工作原理。
:::

很多人第一次接触 SpiceDB 时会问：它和普通数据库有什么区别？为什么不直接用 Redis + MySQL 实现权限缓存？

这篇文章从架构层面回答这些问题。

## 整体架构

```
                    客户端（你的应用）
                         │
                    gRPC / HTTP
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ SpiceDB  │ │ SpiceDB  │ │ SpiceDB  │   ← 无状态，可水平扩展
      │  Node 1  │ │  Node 2  │ │  Node 3  │
      └────┬─────┘ └────┬─────┘ └────┬─────┘
           │    dispatch │            │
           │  (节点间调度) │           │
           └──────┬──────┘────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
 ┌─────────┐ ┌─────────┐ ┌─────────┐
 │  CRDB   │ │  CRDB   │ │  CRDB   │         ← 存储层
 │  Node 1 │ │  Node 2 │ │  Node 3 │
 └─────────┘ └─────────┘ └─────────┘
```

SpiceDB 是一个**无状态的计算层**，所有持久化数据都存储在底层数据库中。这意味着：

- 任何 SpiceDB 节点都可以处理任何请求
- 添加更多节点即可提升吞吐量
- 单个节点故障不影响服务可用性

> 关于存储层的选择（CockroachDB、PostgreSQL、Spanner 等），参见翻译文档 [数据存储](/zh/spicedb/concepts/datastores)。

## Dispatch：分布式图遍历

SpiceDB 最巧妙的设计之一是 **dispatch（调度）机制**。

### 问题

当你检查一个权限时，SpiceDB 需要遍历关系图。对于复杂的 Schema，一次权限检查可能需要遍历多层关系：

```
document:readme 的 view 权限
  → editor 关系 → 直接匹配
  → viewer 关系 → team:backend#member → 遍历 team 成员
  → workspace->access → 找到 workspace → 遍历 workspace 成员
```

如果所有遍历都在一个节点上完成，面对深层嵌套的权限模型，延迟会很高。

### 解决方案

SpiceDB 把一次权限检查**拆分成多个子查询**，分发到不同节点上并行执行：

```
              Node 1: CheckPermission(document:readme, view, user:zhangsan)
                │
      ┌─────────┼──────────┐
      ▼         ▼          ▼
  Node 2:    Node 3:     Node 1:
  检查 editor  检查 viewer   检查 workspace->access
  关系         关系          关系
      │         │           │
      ▼         ▼           ▼
   直接匹配   → Node 2:    → Node 3:
              遍历 team     遍历 workspace
              成员列表       成员列表
```

每个节点维护自己的缓存。通过**一致性哈希**，相同类型的子查询总是被路由到同一个节点，最大化缓存命中率。

> 详细的 dispatch 配置和 Kubernetes 部署方式，参见翻译文档 [提升性能](/zh/spicedb/ops/performance)。

### 为什么不用 Redis？

你可能想：我用 Redis 缓存权限结果不就行了？区别在于：

| | Redis + 自建 | SpiceDB dispatch |
|---|---|---|
| **缓存粒度** | 缓存最终结果（"张三能编辑 doc1"） | 缓存子查询（"张三是 team:backend 的成员"） |
| **缓存复用** | doc1 的缓存不能用于 doc2 | "张三是 backend 成员"这个子查询可以被所有 backend 团队的文档复用 |
| **失效策略** | 关系变更时，你需要找出所有受影响的缓存键并逐一失效 | SpiceDB 基于时间戳和 ZedToken 自动处理 |
| **正确性** | 缓存失效是计算机科学两大难题之一 | SpiceDB 的一致性模型从协议层保证正确性 |

**SpiceDB 缓存的是图遍历的中间结果，而不是最终答案。** 这意味着一个用户加入团队后，不需要为该团队有权限的每个文档逐一清除缓存——子查询级别的缓存会自动让新关系生效。

## 缓存层详解

SpiceDB 有多层缓存：

```
请求到达
    │
    ▼
┌──────────────────┐
│ 1. 结果缓存       │  CheckPermission 的最终结果
│    (per-node)     │  命中 → 直接返回
└────────┬─────────┘
         │ 未命中
         ▼
┌──────────────────┐
│ 2. Dispatch 缓存  │  子查询的中间结果
│    (per-node)     │  命中 → 跳过该子图遍历
└────────┬─────────┘
         │ 未命中
         ▼
┌──────────────────┐
│ 3. 数据库查询     │  从 CockroachDB/PostgreSQL 读取关系
└──────────────────┘
```

### 缓存的关键设计

1. **基于时间戳的版本控制**：每条缓存都关联一个数据快照时间戳，确保不会返回过时的数据
2. **子查询级缓存**：缓存的不是"张三能编辑 doc1"，而是"张三是 backend 成员（截至时间 T）"——可以被多个权限检查复用
3. **一致性哈希路由**：通过 dispatch 将相同子查询路由到相同节点，提高缓存命中率

> 关于如何使用 ZedToken 控制缓存行为，参见翻译文档 [一致性](/zh/spicedb/concepts/consistency)。

### 缓存相关的启动参数

```bash
spicedb serve \
  --dispatch-cache-max-cost=30%      # dispatch 缓存占内存比例
  --ns-cache-max-cost=10%            # namespace(Schema) 缓存
  --dispatch-cluster-cache-max-cost=50%  # 集群级 dispatch 缓存
```

规律：读多写少的场景，增大缓存比例效果显著；写入频繁的场景，缓存命中率会下降，应该关注数据库层性能。

## 数据存储选型

不同的存储后端适合不同的场景。核心决策因素是：**你需要多区域部署吗？**

```
                        需要多区域？
                       /            \
                     是              否
                    /                  \
            需要低延迟？            PostgreSQL
           /           \           (最简单，性能够用)
         是             否
        /                 \
  CockroachDB         Cloud Spanner
  (自建多区域)        (GCP 托管，最省心)
```

### PostgreSQL：大多数团队的最佳起点

- 最容易运维，团队基本都有经验
- 单区域部署完全够用
- 适合中小规模（百万级关系）
- **限制**：不支持多区域，不支持 watch API 的全局排序

### CockroachDB：需要水平扩展时

- 支持多区域部署，自动数据复制
- 节点间 dispatch 效率最高
- 适合大规模（亿级关系）
- **代价**：运维复杂度高，写入延迟比 PostgreSQL 高（分布式事务）

> 完整的存储后端对比和配置方式，参见翻译文档 [数据存储](/zh/spicedb/concepts/datastores)。

## 生产部署模式

### 模式一：最小可用部署

```
                客户端
                  │
            ┌─────┴─────┐
            ▼           ▼
       SpiceDB x2      (负载均衡)
            │
            ▼
       PostgreSQL
       (单实例 + 备份)
```

适合：初创团队、内部工具、日请求量 < 100万
预估成本：1 台 PostgreSQL + 2 台小规格实例

### 模式二：生产级高可用部署

```
                客户端
                  │
            Load Balancer
            ┌─────┼─────┐
            ▼     ▼     ▼
         SpiceDB x3+ (dispatch 互通)
            │     │     │
            └─────┼─────┘
                  ▼
          CockroachDB x3+
          (3 节点集群)
```

适合：B2B SaaS、金融、需要高可用保证的场景
关键配置：
- SpiceDB 开启 dispatch（节点间通信）
- CockroachDB 至少 3 节点（容忍 1 节点故障）
- 开启 Prometheus 指标 + OpenTelemetry 追踪

> 关于可观测性和弹性配置的详细指南，参见翻译文档 [可观测性](/zh/spicedb/ops/observability) 和 [提升弹性](/zh/spicedb/ops/resilience)。

### 模式三：全球多区域部署

```
          北京区域                      上海区域
     ┌───────────────┐           ┌───────────────┐
     │ SpiceDB x3    │  dispatch │ SpiceDB x3    │
     │               │ ◄───────► │               │
     │ CRDB x3       │  复制     │ CRDB x3       │
     └───────────────┘ ◄───────► └───────────────┘
```

适合：跨地域的大型 SaaS、对延迟敏感的全球化应用
需要 CockroachDB 或 Cloud Spanner 支持多区域复制。

## 性能特征速查

| 操作 | 典型延迟 | 影响因素 |
|------|---------|---------|
| CheckPermission（缓存命中） | < 1ms | 缓存配置 |
| CheckPermission（缓存未命中，浅层 Schema） | 2-10ms | Schema 深度、数据库延迟 |
| CheckPermission（深层嵌套 Schema） | 10-50ms | 关系图深度、dispatch 集群规模 |
| WriteRelationships | 5-20ms | 数据库写入延迟 |
| LookupResources | 10-100ms+ | 结果集大小、关系图复杂度 |

> 更多性能优化技巧，参见翻译文档 [提升性能](/zh/spicedb/ops/performance)。

## 下一步

- [一致性与缓存实战](/zh/guides/consistency-in-practice) — 用真实场景理解 ZedToken 和一致性级别的选择
- [核心概念图解](/zh/guides/concepts-visual) — 直观理解 Schema、Relationship、Permission
- [数据存储](/zh/spicedb/concepts/datastores) — 各存储后端的详细对比
- [提升性能](/zh/spicedb/ops/performance) — dispatch 配置和缓存调优
- [提升弹性](/zh/spicedb/ops/resilience) — 重试、超时和故障恢复配置
