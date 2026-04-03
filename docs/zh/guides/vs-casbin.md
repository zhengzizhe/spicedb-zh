# SpiceDB vs Casbin：如何选择

::: info 原创内容
本文为社区原创，帮助熟悉 Casbin 的开发者理解 SpiceDB 的设计差异和适用场景。
:::

[Casbin](https://github.com/casbin/casbin) 是国内开发者最熟悉的开源权限框架，Go 语言编写，生态丰富。很多团队在评估 SpiceDB 时的第一个问题就是：**它和 Casbin 有什么不同？我该选哪个？**

## 核心定位不同

| | Casbin | SpiceDB |
|---|---|---|
| **定位** | 嵌入式权限库 | 独立的权限服务 |
| **部署方式** | 作为 SDK 嵌入应用 | 独立部署，通过 gRPC/HTTP 调用 |
| **数据存储** | 依赖应用的数据库 | 自带存储层（PostgreSQL/CockroachDB/Spanner） |
| **设计思想** | 基于策略模型（ACL/RBAC/ABAC） | 基于关系图（ReBAC），源自 Google Zanzibar |

简单说：**Casbin 是一个库，SpiceDB 是一个数据库。**

## 权限模型表达力

### Casbin：策略驱动

Casbin 用 **模型文件 + 策略规则** 定义权限：

```ini
# model.conf — 定义 RBAC 模型
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act

[role_definition]
g = _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub) && r.obj == p.obj && r.act == p.act
```

```csv
# policy.csv — 策略数据
p, editor, document:roadmap, read
p, editor, document:roadmap, write
g, zhangsan, editor
```

这种模式对 **扁平的 RBAC** 非常简洁。但当你需要表达层级关系时就会变得复杂。

### SpiceDB：关系驱动

```zed
definition document {
    relation parent_folder: folder
    relation owner: user
    relation editor: user | group#member

    permission edit = owner + editor + parent_folder->edit
    permission view = edit + parent_folder->view
}
```

SpiceDB 的权限是通过**关系图的可达性**计算的。`parent_folder->edit` 表示"如果你能编辑父文件夹，你就能编辑这个文档"——权限沿关系链自动传递，不需要为每个资源显式添加策略。

## 关键差异详解

### 1. 层级权限传递

**场景**：公司 → 部门 → 项目 → 文档，上级的管理员自动拥有下级资源的权限。

**Casbin**：需要手动维护每一层的角色映射，或者写复杂的 matcher 函数。当层级变深或资源量变大时，策略条目会爆炸式增长。

**SpiceDB**：用箭头操作符天然表达：

```zed
definition document {
    relation project: project
    permission manage = project->manage
}

definition project {
    relation department: department
    permission manage = department->manage
}

definition department {
    relation company: company
    relation manager: user
    permission manage = manager + company->admin
}
```

写入一条关系 `company:acme#admin@user:ceo`，CEO 自动拥有公司下所有部门、项目、文档的管理权限。**不需要为每个资源单独写策略。**

### 2. 反向查询

**场景**：查询"张三能访问哪些文档？"（用于渲染 UI 列表）

**Casbin**：没有内置支持。通常需要遍历所有资源逐个检查，或者在应用层维护反向索引。

**SpiceDB**：内置 `LookupResources` API，直接返回用户有权限的所有资源列表。SpiceDB 的图引擎会高效地遍历关系图，不需要逐个检查。

### 3. 一致性保证

**Casbin**：策略数据存在应用数据库里，一致性取决于你的数据库和缓存策略。多实例部署时需要自己处理策略同步。

**SpiceDB**：内置 ZedToken 机制，支持按请求指定一致性级别。可以选择"完全一致"（牺牲延迟）或"最终一致"（优先性能），API 层面原生支持，不需要额外实现。

### 4. 多租户

**Casbin**：需要应用层实现租户隔离，通常是给资源 ID 加租户前缀，或者每个租户一套策略。

**SpiceDB**：关系图天然支持多租户。工作空间/租户只是图中的一个节点，权限通过关系传递自动隔离：

```
document:doc1#workspace@workspace:tenant_a
document:doc1#viewer@user:user1

// user1 只能在 tenant_a 的上下文中看到 doc1
```

### 5. 性能特征

| | Casbin | SpiceDB |
|---|---|---|
| 单次检查延迟 | 微秒级（内存中） | 毫秒级（网络调用） |
| 适合的数据规模 | 万级策略条目 | 亿级关系 |
| 扩展方式 | 随应用扩展 | 独立水平扩展 |
| 缓存 | 应用内存 | 分布式多级缓存 |

Casbin 在小规模下更快（它就在进程内），但当关系复杂度和数据量增长后，SpiceDB 的图引擎和分布式架构优势就会体现。

## 什么时候选 Casbin

- 权限模型简单、扁平（纯 RBAC，没有层级嵌套）
- 不需要反向查询（"用户能访问哪些资源"）
- 应用规模较小，单体架构
- 希望零外部依赖，不想单独维护一个权限服务
- 团队对 Casbin 生态已经很熟悉

## 什么时候选 SpiceDB

- 权限模型有层级关系（组织→团队→项目→资源）
- 需要 Google Docs 式的共享和权限传递
- 需要反向查询（渲染用户的资源列表）
- 多个微服务共享同一套权限数据
- 数据量大、需要独立扩展权限服务
- 需要权限变更的审计追踪
- 需要强一致性保证（如金融、医疗场景）

## 从 Casbin 迁移到 SpiceDB

如果你已经在用 Casbin 并考虑迁移，核心思路是：

1. **角色定义 → Schema 中的 relation**：Casbin 的 `g = zhangsan, editor` 变成 `document:xxx#editor@user:zhangsan`
2. **策略规则 → Relationships**：每条 `p` 策略对应一条或多条 relationship
3. **matcher → Permission 表达式**：Casbin 的 matcher 逻辑用 SpiceDB 的 `+`（并集）和 `&`（交集）和 `-`（排除）表达
4. **enforce() → CheckPermission()**：调用方式从本地函数调用变为 gRPC/HTTP 调用

::: warning 注意
迁移不是简单的一对一映射。SpiceDB 的关系模型可能需要你重新思考权限结构。建议先在 [Playground](https://play.authzed.com) 中验证新的 Schema 设计。
:::

## 进一步阅读

- [五分钟理解 SpiceDB](/zh/guides/quickstart-5min) — 用一个完整例子建立直觉
- [核心概念图解](/zh/guides/concepts-visual) — 图解 SpiceDB 的核心概念
- [Schema 语言参考](/zh/spicedb/concepts/schema) — 完整的 Schema 语法说明
