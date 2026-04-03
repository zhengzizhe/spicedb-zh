::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/zanzibar)
English: [View English version](/en/spicedb/concepts/zanzibar)
:::

# Google Zanzibar

## 简介

SpiceDB 基于 Google Zanzibar 构建，这是 Google 为大规模授权管理而创建的开创性授权框架。该系统为 Google Docs 和 Gmail 等 Google 旗下众多产品提供访问控制。

一篇描述该系统的研究论文在 2019 年 USENIX 年度技术大会上发表。还有一份[注释版本](https://authzed.com/zanzibar)可供参阅，其中解释了设计概念和实现细节。

## 历史

在 2010 年代，Google 组建了一个团队来保护 SaaS 产品和内部系统中的对象安全。由于单个对象可能由多个系统（核心产品和搜索系统）管理，处理终端用户的访问控制需要构建一个全新的分布式访问控制系统。

2019 年夏天，Google 研究人员发表了 "Zanzibar: Google's Consistent, Global Authorization system"，记录了这个负责 Google 整个产品组合授权的项目。

该项目最初在内部被称为 "Spice"，其使命是确保 "ACLs must flow"（ACL 必须流动）——这是对科幻小说《沙丘》的致敬。联合创始人 Lea Kissner 是《沙丘》爱好者，启发了这一命名传统。AuthZed 在自己的项目中延续了这一沙丘主题命名。

## 重要意义

### 推广 ReBAC

**基于关系的访问控制（ReBAC）** 是一种授权设计范式，通过主体与资源之间的关系链来确定访问权限。这种抽象能够建模所有现有的授权范式，包括流行的 RBAC 和 ABAC 设计。

Carrie Gates 最初在 2006 年的论文 "Access Control Requirements for Web 2.0 Security and Privacy" 中描述了这一概念，Facebook 被引用为早期采用者。然而，ReBAC 直到 2019 年 Zanzibar 论文发表后才获得广泛关注。

由于"失效的访问控制"目前在 OWASP Top 10 中排名最高，ReBAC 已成为构建正确授权系统的推荐方法。

更多 ReBAC 信息，请参阅[关系](./relationships)文档。

### 新敌人问题

新敌人问题（New Enemy Problem）发生在权限变更与资源更新未能一致同步时导致的未授权访问。SpiceDB 通过可配置的[一致性](./consistency)和 ZedToken（类似于 Zookie）来解决此问题。

Zanzibar 论文引入了 "Zookie" 来解决这一基本设计挑战：

> "ACL 检查必须尊重用户修改 ACL 和对象内容的顺序，以避免意外的共享行为。具体来说，我们的客户关心的是防止'新敌人'问题——当我们未能尊重 ACL 更新之间的顺序，或将旧 ACL 应用于新内容时，就可能出现这个问题。"

**示例 A：忽略 ACL 更新顺序**

1. Alice 将 Bob 从文件夹的 ACL 中移除
2. Alice 让 Charlie 将新文档移入具有继承 ACL 的文件夹
3. Bob 不应看到新文档，但如果 ACL 检查忽略更新顺序，他可能会看到

**示例 B：将旧 ACL 错误应用于新内容**

1. Alice 将 Bob 从文档的 ACL 中移除
2. Alice 让 Charlie 向文档添加新内容
3. Bob 不应看到新内容，但如果检查使用了过期的 ACL，他可能会看到

### Papers We Love 演讲

2021 年 6 月 28 日，Zanzibar 在 Papers We Love 纽约分会上进行了视频演讲。

## 与 SpiceDB 的区别

SpiceDB 保持了对 Zanzibar 设计原则的忠诚，同时去除了对 Google 内部基础设施的假设。这种灵活性适应了不同的用户和软件栈。例如，SpiceDB 支持复杂的用户系统，而 Zanzibar 要求使用 uint64 用户标识符。

SpiceDB 优先考虑开发者体验，因为它不是在公司内部强制使用的。Schema 语言和 Playground 显著改善了 Google 直接操作 Protocol Buffers 的方式。

[Zanzibar 注释版论文](https://authzed.com/zanzibar) 详细说明了 SpiceDB 与 Zanzibar 之间的具体区别。

### Schema 语言

Zanzibar 示例使用 Protocol Buffers 文本格式表示 Namespace Config。Google 开发了大量 Protocol Buffer 工具来生成这些配置。

SpiceDB 提供了一种 [Schema 语言](./schema)，在内部编译为 Namespace Config。

### 区分 Relation 和 Permission

Zanzibar 不区分定义访问权限的关系和抽象关系。SpiceDB 引入了不同的概念：Relation（关系）和 Permission（权限）。

Permission 作为应用程序检查访问权限的"公共 API"，使用称为"计算用户集"的集合语义。

Relation 在 SpiceDB 中是纯粹的抽象对象关系。虽然可以通过 API 查询，但建议只调用 Permission，因为它们可以向后兼容地更新。

这种区分使 SpiceDB 能够消除 Zanzibar 用户集重写中令人困惑的 `_this` 关键字。

### 反向索引

Zanzibar 和 SpiceDB 都实现了 "Reverse Index Expand" API。然而，这会为应用程序返回一个笨拙的树结构，特别是在避免将权限逻辑放入应用程序代码时。

SpiceDB 提供了额外的 API：LookupResources 和 LookupSubjects，用于回答：

- "这个主体可以访问哪些资源？"
- "哪些主体可以访问这个资源？"

这些 API 返回扁平化的结果列表，更易于使用。

### 数据存储

Zanzibar 仅支持 Google 内部的 Spanner 服务用于元组存储。

SpiceDB 支持多种[数据存储](./datastores)，包括 Cloud Spanner。

### 一致性

Zanzibar 支持 ContentChangeCheck API 和"至少与...一样新"的 Zookie 规范。

SpiceDB 通过允许 API 请求指定[一致性](./consistency)行为来简化这一点，同时实现了 ZedToken——Zanzibar Zookie 的等价物。

### 标识符

SpiceDB 允许比 Zanzibar 更灵活的 Object ID 字符集。

Object Type 遵循：`^([a-z][a-z0-9_]{1,61}[a-z0-9]/)*[a-z][a-z0-9_]{1,62}[a-z0-9]$`

Object ID 遵循：`^(([a-zA-Z0-9/_|\-=+]{1,})|\*)$`

### 用户

在 Google 中，GAIA（Google Accounts and ID Administration）为所有用户和服务提供 64 位整数标识符。Zanzibar 假设用户可以用 GAIA ID 表示。

由于用户不是由外部严格定义的，SpiceDB 将用户视为普通对象，支持更复杂的用户系统和更强大的查询。

建模用户和 API 密钥的 Schema 示例：

```txt
definition ApiKey {}
definition User {
  relation keys: ApiKey
}
```

关系和权限现在可以与任一类型一起使用：

```txt
definition Post {
  relation viewer: User
  ...
  permission view = viewer + viewer->keys
}
```

开发者无需编写每个应用的逻辑来解析 API Key，因为 SpiceDB 会处理。

### 术语对照

| Zanzibar 术语 | SpiceDB 术语 |
|---|---|
| Tuple | Relationship |
| Namespace | Object Type |
| Namespace Config | Object Definition |
| Userset | Subject Reference |
| User | Subject Reference |
| Zookie | ZedToken |
| Tupleset | Relationship Set |
| Tupleset Filter | Relationship Filter |

## 常见问题

### Zanzibar 和 ReBAC 是一回事吗？

虽然密切相关，但两者不同。Zanzibar 是 Google 的授权系统，而 ReBAC 是一种强调通过对象关系来确定访问权限的授权模型。

Zanzibar 使用 ReBAC 作为其底层授权模型——使 Zanzibar 成为一个 ReBAC 系统加上基础设施、算法和能够在 Google 规模下运行的优化。

## 相关技术

- **Spanner**：Zanzibar 的数据存储
- **CockroachDB**：受 Spanner 启发的开源数据库，SpiceDB 使用
- **Slicer**：Zanzibar 的动态分片系统，防止热点
- **F1**：Google Ads 后端，在 Spanner 性能指标中被引用
