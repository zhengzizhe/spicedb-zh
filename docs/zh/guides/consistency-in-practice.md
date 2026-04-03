# 一致性与缓存实战

::: info 原创内容
本文为社区原创，通过真实业务场景帮你理解 SpiceDB 的一致性模型和 ZedToken 的正确用法。
:::

"一致性"是 SpiceDB 中最容易被忽略、但最容易踩坑的概念。这篇文章用具体场景告诉你：什么时候用哪种一致性级别，为什么不能无脑用 `fully_consistent`。

> 本文是 [一致性](/zh/spicedb/concepts/consistency) 翻译文档的实战补充，建议先阅读翻译文档了解基础概念。

## 新敌人问题：一个真实的安全漏洞

### 场景

你在做一个文档协作系统，产品经理提了一个需求：**用户可以移除文档协作者**。

```
时间线：
T1: 张三移除李四的 document:secret 的 viewer 权限
T2: 李四发起请求，查看 document:secret
```

你的代码：

```go
// T1: 移除权限
spicedb.DeleteRelationships(ctx, &v1.DeleteRelationshipsRequest{
    RelationshipFilter: &v1.RelationshipFilter{
        ResourceType: "document",
        OptionalResourceId: "secret",
        OptionalRelation: "viewer",
        OptionalSubjectFilter: &v1.SubjectFilter{
            SubjectType: "user",
            OptionalSubjectId: "lisi",
        },
    },
})

// T2: 检查权限（在另一个请求中）
resp, _ := spicedb.CheckPermission(ctx, &v1.CheckPermissionRequest{
    Resource:   &v1.ObjectReference{ObjectType: "document", ObjectId: "secret"},
    Permission: "view",
    Subject:    &v1.SubjectReference{Object: &v1.ObjectReference{ObjectType: "user", ObjectId: "lisi"}},
    // 没有指定 consistency ← 问题在这里
})
```

### 发生了什么

默认情况下，`CheckPermission` 使用 `minimize_latency`，这意味着它**可能读取缓存中的旧数据**。如果 T2 的请求恰好命中了 T1 之前的缓存，李四仍然能看到文档。

**这就是"新敌人问题"**（New Enemy Problem）——Google Zanzibar 论文中专门讨论的安全威胁。

> 关于新敌人问题的理论背景，参见翻译文档 [Google Zanzibar](/zh/spicedb/concepts/zanzibar)。

### 正确做法

```go
// T1: 移除权限，保存返回的 ZedToken
delResp, _ := spicedb.DeleteRelationships(ctx, &v1.DeleteRelationshipsRequest{...})
zedToken := delResp.WrittenAt

// 把 ZedToken 存到你的数据库（和文档一起）
db.UpdateDocToken(ctx, "secret", zedToken)

// T2: 检查权限时，使用保存的 ZedToken
savedToken := db.GetDocToken(ctx, "secret")
resp, _ := spicedb.CheckPermission(ctx, &v1.CheckPermissionRequest{
    Resource:   &v1.ObjectReference{ObjectType: "document", ObjectId: "secret"},
    Permission: "view",
    Subject:    &v1.SubjectReference{Object: &v1.ObjectReference{ObjectType: "user", ObjectId: "lisi"}},
    Consistency: &v1.Consistency{
        Requirement: &v1.Consistency_AtLeastAsFresh{
            AtLeastAsFresh: savedToken,
        },
    },
})
```

`at_least_as_fresh` 告诉 SpiceDB：**返回的结果至少要包含这个 ZedToken 时间点之后的所有变更**。这样就能保证李四的权限已经被移除。

## 四种一致性级别：什么时候用哪个

### 级别一：`minimize_latency` — 最快，但可能过时

```go
Consistency: &v1.Consistency{
    Requirement: &v1.Consistency_MinimizeLatency{MinimizeLatency: true},
}
```

**适合**：
- 非安全关键的 UI 展示（比如侧边栏的文件夹树）
- 读取远多于写入的场景
- 用户不太可能注意到短暂不一致的场景

**例子**：展示"你有权限的项目列表"。即使列表落后几秒，用户也不会有安全风险——最坏情况是看到一个已经没权限的项目，点进去再被拦截。

### 级别二：`at_least_as_fresh` — 最佳平衡点

```go
Consistency: &v1.Consistency{
    Requirement: &v1.Consistency_AtLeastAsFresh{
        AtLeastAsFresh: savedZedToken,
    },
}
```

**适合**：
- 写后读场景（用户刚修改了权限，立刻看到效果）
- 安全关键的权限检查
- 大多数生产场景的默认选择

**例子**：用户把同事从文档中移除后，页面刷新应该立刻反映变更。通过保存 `WriteRelationships` 返回的 ZedToken 并在后续读取中使用，确保一致性。

### 级别三：`at_exact_snapshot` — 精确快照

```go
Consistency: &v1.Consistency{
    Requirement: &v1.Consistency_AtExactSnapshot{
        AtExactSnapshot: specificZedToken,
    },
}
```

**适合**：
- 审计场景（"在这个时间点，谁有权限？"）
- 需要可重复读的批量操作
- 调试和排查权限问题

**例子**：安全审计时，需要回答"上周三下午 3 点，哪些用户能访问财务报表？"使用当时保存的 ZedToken 可以精确重现那个时间点的权限状态。

::: warning 注意
快照有过期时间（由数据库的垃圾回收决定）。过期后会返回 `FAILED_PRECONDITION` 错误。CockroachDB 默认 GC 窗口是 25 小时。
:::

### 级别四：`fully_consistent` — 最强，最慢

```go
Consistency: &v1.Consistency{
    Requirement: &v1.Consistency_FullyConsistent{FullyConsistent: true},
}
```

**适合**：
- 不持有 ZedToken 但需要最新数据的场景
- 安全关键操作（删除账户、撤销所有权限）
- 调试和测试

**不适合**：
- 高频调用的权限检查（延迟惩罚很大）
- 作为所有请求的默认选择（这是初学者最常犯的错误）

> 完整的一致性级别说明和 API 默认值，参见翻译文档 [一致性](/zh/spicedb/concepts/consistency)。

## ZedToken 存储策略

### 策略一：和资源一起存（推荐）

```sql
-- 在你的业务数据库中
ALTER TABLE documents ADD COLUMN spicedb_token TEXT;
```

```go
// 写入权限时
resp, _ := spicedb.WriteRelationships(ctx, req)
db.Exec("UPDATE documents SET spicedb_token = $1 WHERE id = $2",
    resp.WrittenAt.Token, docID)

// 读取权限时
var token string
db.QueryRow("SELECT spicedb_token FROM documents WHERE id = $1", docID).Scan(&token)
spicedb.CheckPermission(ctx, &v1.CheckPermissionRequest{
    // ...
    Consistency: &v1.Consistency{
        Requirement: &v1.Consistency_AtLeastAsFresh{
            AtLeastAsFresh: &v1.ZedToken{Token: token},
        },
    },
})
```

**好处**：每个资源独立追踪，粒度最细，一致性最好。

### 策略二：按用户会话存

```go
// 登录时获取一个基准 token
session.SpiceDBToken = latestZedToken

// 会话中的所有请求使用这个 token
```

**好处**：简单，适合用户不频繁修改权限的场景。
**风险**：如果其他用户在会话期间修改了权限，当前用户看不到变更。

### 策略三：不存（用 `minimize_latency`）

**好处**：最简单，零额外存储。
**风险**：存在新敌人问题的窗口（通常几秒内收敛）。

### 怎么选？

```
你的场景有安全敏感的权限变更吗？
    ├── 是 → 策略一（和资源一起存）
    └── 否 → 用户会频繁修改权限吗？
              ├── 是 → 策略二（按会话存）
              └── 否 → 策略三（minimize_latency 就够了）
```

## 实战案例：电商多租户平台

```zed
definition merchant {
    relation owner: user
    relation staff: user
    permission admin = owner
    permission access = owner + staff
}

definition product {
    relation merchant: merchant
    relation manager: user

    permission edit = manager + merchant->admin
    permission view = edit + merchant->access
}
```

### 场景 1：店主移除员工

```go
// 1. 移除员工的 merchant 关系
resp, _ := spicedb.DeleteRelationships(ctx, &v1.DeleteRelationshipsRequest{
    RelationshipFilter: &v1.RelationshipFilter{
        ResourceType: "merchant",
        OptionalResourceId: "shop_001",
        OptionalRelation: "staff",
        OptionalSubjectFilter: &v1.SubjectFilter{
            SubjectType: "user",
            OptionalSubjectId: "employee_123",
        },
    },
})

// 2. 保存 ZedToken 到商户记录
db.UpdateMerchantToken("shop_001", resp.WrittenAt)

// 3. 后续检查该商户下任何商品的权限时，使用这个 token
token := db.GetMerchantToken("shop_001")
// CheckPermission with at_least_as_fresh(token)
```

**要点**：移除的是 merchant 级别的关系，但影响了该商户下所有商品的权限。ZedToken 应该存在 merchant 层级。

### 场景 2：展示商品列表

```go
// 对于商品列表页，使用 minimize_latency 即可
// 即使短暂不一致，用户点击商品后的详情页会再次检查权限
products := spicedb.LookupResources(ctx, &v1.LookupResourcesRequest{
    ResourceObjectType: "product",
    Permission: "view",
    Subject: currentUser,
    Consistency: &v1.Consistency{
        Requirement: &v1.Consistency_MinimizeLatency{MinimizeLatency: true},
    },
})
```

**要点**：列表页用宽松一致性（快），详情页/操作用严格一致性（安全）。两层检查是常见的最佳实践。

## 常见错误

### 错误 1：所有请求都用 `fully_consistent`

```go
// ❌ 不要这样做
Consistency: &v1.Consistency{
    Requirement: &v1.Consistency_FullyConsistent{FullyConsistent: true},
}
```

这会绕过所有缓存，每次请求都直接查数据库。在高并发场景下，数据库会成为瓶颈，延迟急剧上升。

### 错误 2：不存 ZedToken，安全关键场景用 `minimize_latency`

```go
// ❌ 删除权限后立刻检查，但没有传 ZedToken
spicedb.DeleteRelationships(ctx, req)  // 没有保存返回值
spicedb.CheckPermission(ctx, checkReq) // 可能读到旧缓存
```

### 错误 3：ZedToken 存错层级

```go
// ❌ 把 merchant 级别的变更的 token 只存在 product 上
// 移除员工影响的是 merchant 下所有 product，但你只更新了一个 product 的 token
```

## 下一步

- [一致性](/zh/spicedb/concepts/consistency) — 官方文档翻译，包含完整的 API 默认值表
- [SpiceDB 架构深度解析](/zh/guides/architecture) — 理解缓存层和 dispatch 机制
- [查询数据](/zh/spicedb/concepts/querying-data) — 各个查询 API 的详细说明
- [监听变更](/zh/spicedb/concepts/watch) — 使用 Watch API 实时追踪权限变更
