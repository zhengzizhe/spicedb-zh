# 真实场景建模实战

::: info 原创内容
本文为社区原创，通过四个国内开发者常见的业务场景，演示如何用 SpiceDB 建模权限。
:::

> 每个例子都包含完整的 Schema、Relationships 和 API 调用示例。建议对照 [Schema 语言参考](/zh/spicedb/concepts/schema) 和 [写入关系](/zh/spicedb/concepts/relationships) 阅读。

## 场景一：SaaS 多租户 + 角色体系

### 需求

一个项目管理 SaaS（类似 Teambition）：
- 组织下有多个项目
- 用户在组织内有角色（管理员、成员）
- 项目有自己的角色（负责人、参与者、观察者）
- 组织管理员自动拥有所有项目的管理权限
- 任务属于项目，权限从项目继承

### Schema

```zed
definition user {}

definition organization {
    relation admin: user
    relation member: user

    permission manage = admin
    permission access = admin + member
}

definition project {
    relation org: organization
    relation lead: user
    relation contributor: user
    relation observer: user

    /** 项目管理 = 项目负责人 + 组织管理员 */
    permission manage = lead + org->manage

    /** 项目编辑 = 管理者 + 参与者 */
    permission edit = manage + contributor

    /** 项目查看 = 编辑者 + 观察者 + 组织所有成员 */
    permission view = edit + observer + org->access
}

definition task {
    relation project: project
    relation assignee: user
    relation creator: user

    /** 任务编辑 = 创建者 + 指派人 + 项目编辑权限 */
    permission edit = creator + assignee + project->edit

    /** 任务查看 = 编辑者 + 项目查看权限 */
    permission view = edit + project->view
}
```

### Relationships 示例

```
// 组织结构
organization:acme#admin@user:ceo
organization:acme#member@user:zhangsan
organization:acme#member@user:lisi

// 项目
project:mobile_app#org@organization:acme
project:mobile_app#lead@user:zhangsan
project:mobile_app#contributor@user:lisi

// 任务
task:fix_login_bug#project@project:mobile_app
task:fix_login_bug#assignee@user:lisi
task:fix_login_bug#creator@user:zhangsan
```

### 权限推导

| 用户 | 任务 fix_login_bug 的 edit 权限？ | 推导路径 |
|------|---|---|
| zhangsan | 允许 | creator 直接匹配 |
| lisi | 允许 | assignee 直接匹配 |
| ceo | 允许 | task→project→org→admin→manage→edit |

CEO 没有任何直接关系，但通过 `task→project→org` 三层穿越获得了权限。这正是 SpiceDB 的强大之处。

> 关于箭头操作符 `->` 的图解说明，参见 [核心概念图解](/zh/guides/concepts-visual)。

## 场景二：Google Docs 式文档共享

### 需求

- 文档可以放在文件夹里，文件夹可以嵌套
- 文件夹的权限自动传递给子文件夹和文档
- 文档可以单独共享给个人或团队
- 支持"任何人可查看"的公开链接

### Schema

```zed
definition user {}

definition team {
    relation member: user
}

definition folder {
    relation parent: folder
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member

    permission edit = owner + editor + parent->edit
    permission view = edit + viewer + parent->view
}

definition document {
    relation parent_folder: folder
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member | user:*

    permission edit = owner + editor + parent_folder->edit
    permission view = edit + viewer + parent_folder->view
}
```

### 关键设计点

**1. 文件夹嵌套**

`folder` 有 `relation parent: folder`，形成递归结构。权限通过 `parent->edit` 和 `parent->view` 逐层向下传递。

```
公司文件夹（CEO 是 owner）
  └── 技术部文件夹（CTO 是 editor）
        └── 后端文件夹（张三是 editor）
              └── API文档.md（自动继承上面所有人的权限）
```

> 关于递归深度限制，参见翻译文档 [递归与最大深度](/zh/spicedb/modeling/recursion-and-max-depth)。

**2. 公开链接**

`user:*` 是 SpiceDB 的通配符语法，表示"所有用户"：

```
// 设置文档为"任何人可查看"
document:public_report#viewer@user:*
```

**3. 团队共享**

```
// backend 团队可以编辑
document:api_spec#editor@team:backend#member
```

这比逐人添加高效得多。当有人加入 backend 团队时，自动获得所有该团队有权限的文档的访问权。

## 场景三：电商平台的店铺权限

### 需求

- 商家有多个店铺
- 店铺有店长和员工，权限不同
- 商品属于店铺
- 订单关联买家和卖家
- 买家只能看自己的订单

### Schema

```zed
definition user {}

definition merchant {
    relation owner: user
    relation shop_manager: user
    relation staff: user

    permission admin = owner
    permission manage_shop = admin + shop_manager
    permission access = admin + shop_manager + staff
}

definition product {
    relation merchant: merchant
    relation creator: user

    permission edit = creator + merchant->manage_shop
    permission view = edit + merchant->access
    permission publish = merchant->manage_shop
}

definition order {
    relation merchant: merchant
    relation buyer: user

    /** 查看订单 = 买家 + 商家有权限的人 */
    permission view = buyer + merchant->access

    /** 处理订单 = 商家管理者 */
    permission process = merchant->manage_shop
}
```

### 为什么不用 RBAC 表？

传统做法是建一张角色表：

```sql
CREATE TABLE merchant_roles (
    user_id INT,
    merchant_id INT,
    role ENUM('owner', 'manager', 'staff')
);
```

然后在代码里判断 `if role == 'manager' || role == 'owner'`。

问题是：
1. 每个需要权限的地方都要写 `if` 判断
2. 角色和权限的映射关系硬编码在代码中
3. 无法回答"这个员工能管理哪些商品"

SpiceDB 的 Schema 把角色到权限的映射关系**声明式**地定义出来，业务代码只需要调用 `CheckPermission`。

> 关于 Schema 的开发和测试流程，参见翻译文档 [开发 Schema](/zh/spicedb/modeling/developing-a-schema) 和 [验证与测试](/zh/spicedb/modeling/validation-testing-debugging)。

## 场景四：带审批的权限申请

### 需求

- 用户可以申请某个资源的权限
- 审批通过后自动生效
- 支持设置权限过期时间（比如临时访问）

### Schema

```zed
definition user {}

definition resource {
    relation owner: user
    relation temporary_viewer: user with expiration

    permission manage = owner
    permission view = owner + temporary_viewer
}

caveat expiration(current_time timestamp, expires_at timestamp) {
    current_time < expires_at
}
```

### 审批通过后写入临时权限

```go
// 审批通过，授予 7 天临时查看权限
expiresAt := time.Now().Add(7 * 24 * time.Hour)

spicedb.WriteRelationships(ctx, &v1.WriteRelationshipsRequest{
    Updates: []*v1.RelationshipUpdate{{
        Operation: v1.RelationshipUpdate_OPERATION_TOUCH,
        Relationship: &v1.Relationship{
            Resource: &v1.ObjectReference{ObjectType: "resource", ObjectId: "secret_report"},
            Relation: "temporary_viewer",
            Subject: &v1.SubjectReference{Object: &v1.ObjectReference{ObjectType: "user", ObjectId: "lisi"}},
            OptionalCaveat: &v1.ContextualizedCaveat{
                CaveatName: "expiration",
                Context: structpb.NewStruct(map[string]interface{}{
                    "expires_at": expiresAt.Format(time.RFC3339),
                }),
            },
        },
    }},
})
```

检查权限时需要传入当前时间：

```go
spicedb.CheckPermission(ctx, &v1.CheckPermissionRequest{
    Resource:   &v1.ObjectReference{ObjectType: "resource", ObjectId: "secret_report"},
    Permission: "view",
    Subject:    &v1.SubjectReference{Object: &v1.ObjectReference{ObjectType: "user", ObjectId: "lisi"}},
    Context: structpb.NewStruct(map[string]interface{}{
        "current_time": time.Now().Format(time.RFC3339),
    }),
})
```

7 天后，同样的检查会自动返回"拒绝"，不需要后台任务清理过期权限。

> 关于 Caveat 的完整语法和用法，参见翻译文档 [带条件的关系 (Caveats)](/zh/spicedb/concepts/caveats)。关于过期关系的专门说明，参见 [过期关系](/zh/spicedb/concepts/expiring-relationships)。

## 建模原则总结

通过这四个场景，可以提炼出几个 SpiceDB 建模原则：

1. **自上而下设计**：先定义最顶层的组织结构，再定义资源，权限通过 `->` 向下传递
2. **权限是计算出来的**：不要为每个资源-用户组合存储权限，而是用 `permission` 表达式从关系中推导
3. **利用组/团队减少关系数量**：一条 `team#member` 关系替代 N 条个人关系
4. **用 Caveat 处理条件逻辑**：时间限制、IP 限制等不要硬编码在应用里

## 下一步

- [Playground](https://play.authzed.com) — 在线验证你自己的 Schema
- [开发 Schema](/zh/spicedb/modeling/developing-a-schema) — Schema 开发的完整流程
- [验证与测试](/zh/spicedb/modeling/validation-testing-debugging) — 如何为权限模型写测试
- [一致性与缓存实战](/zh/guides/consistency-in-practice) — 在生产环境中正确处理一致性
