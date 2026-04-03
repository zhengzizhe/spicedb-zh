# 五分钟理解 SpiceDB

::: info 原创内容
本文为社区原创，用一个贴近国内开发者的例子帮你快速建立对 SpiceDB 的直觉。
:::

你在开发一个 SaaS 协作平台。用户可以创建工作空间，邀请成员，创建文档，设置谁能看、谁能编辑。

你会怎么实现权限？

## 传统做法的痛点

大多数团队的第一反应是在业务代码里写 `if` 判断：

```go
func canEdit(userID, docID string) bool {
    doc := db.GetDoc(docID)
    if doc.OwnerID == userID {
        return true
    }
    if db.IsWorkspaceMember(doc.WorkspaceID, userID, "editor") {
        return true
    }
    return false
}
```

这段代码有几个问题：

1. **权限逻辑分散在业务代码各处**，改一个权限规则要改 N 个文件
2. **无法回答"用户能访问哪些文档"**，只能逐个查询
3. **无法审计**，出了安全问题查不出谁有什么权限
4. **越来越复杂**，加上组织层级、共享链接、临时权限，代码就失控了

## SpiceDB 的思路

SpiceDB 把权限拆成三个东西：

```
Schema（定义规则） + Relationships（存储事实） = Permissions（计算结果）
```

用你熟悉的类比：

| SpiceDB 概念 | 类比 | 说明 |
|---|---|---|
| **Schema** | 数据库表结构 | 定义有哪些对象类型、它们之间能有什么关系 |
| **Relationship** | 数据库里的行 | 具体的事实，比如"张三是文档A的编辑者" |
| **Permission** | 视图/计算列 | 由 Schema 中的规则自动计算，比如"能编辑的人也能查看" |

## 用 Schema 描述你的 SaaS

```zed
/** 用户，SpiceDB 中的基础主体 */
definition user {}

/** 工作空间，SaaS 的核心租户单元 */
definition workspace {
    relation owner: user
    relation member: user

    permission admin = owner
    permission access = owner + member
}

/** 文档，工作空间内的资源 */
definition document {
    relation workspace: workspace
    relation owner: user
    relation editor: user
    relation viewer: user

    /** 能编辑 = 文档的 owner/editor + 工作空间的 admin */
    permission edit = owner + editor + workspace->admin

    /** 能查看 = 能编辑的人 + viewer + 工作空间的所有成员 */
    permission view = edit + viewer + workspace->access
}
```

注意 `workspace->admin` 这个箭头语法：它表示"如果用户是这个文档所属工作空间的 admin，那么就有这个权限"。这就是 **ReBAC（基于关系的访问控制）** 的核心威力——权限可以沿着关系链传递。

## 写入 Relationships

Schema 只是规则，还需要写入具体的事实：

```
// 张三拥有工作空间
workspace:acme#owner@user:zhangsan

// 李四是工作空间成员
workspace:acme#member@user:lisi

// 文档属于工作空间
document:roadmap#workspace@workspace:acme

// 王五是文档的 editor
document:roadmap#editor@user:wangwu
```

## 检查权限

现在 SpiceDB 可以回答这些问题：

| 问题 | API | 结果 |
|---|---|---|
| 张三能编辑 roadmap 吗？ | `CheckPermission` | 允许（他是 workspace owner → admin → edit） |
| 李四能查看 roadmap 吗？ | `CheckPermission` | 允许（他是 workspace member → access → view） |
| 王五能查看 roadmap 吗？ | `CheckPermission` | 允许（他是 editor → edit → view） |
| 谁能编辑 roadmap？ | `LookupSubjects` | 张三、王五 |
| 李四能访问哪些文档？ | `LookupResources` | roadmap（以及工作空间下的所有文档） |

注意张三没有被直接赋予 `document:roadmap` 的任何关系，但他通过 `workspace→admin→edit` 这条关系链获得了编辑权限。**这就是图遍历**——SpiceDB 的核心能力。

## 和你原来的代码对比

之前写在业务代码里的 `if` 逻辑，现在变成了：

```go
func canEdit(userID, docID string) bool {
    resp, _ := spicedbClient.CheckPermission(ctx, &v1.CheckPermissionRequest{
        Resource:   &v1.ObjectReference{ObjectType: "document", ObjectId: docID},
        Permission: "edit",
        Subject:    &v1.SubjectReference{Object: &v1.ObjectReference{ObjectType: "user", ObjectId: userID}},
    })
    return resp.Permissionship == v1.CheckPermissionResponse_PERMISSIONSHIP_HAS_PERMISSION
}
```

**一行调用，所有权限逻辑都在 Schema 里。** 业务代码不再关心"为什么有权限"，只关心"有没有权限"。

## 接下来

- [Schema 语言参考](/zh/spicedb/concepts/schema) — 完整的 Schema 语法
- [核心概念图解](/zh/guides/concepts-visual) — 用图帮你理解 Schema、Relationship、Permission 的关系
- [与 Casbin 的对比](/zh/guides/vs-casbin) — 如果你用过 Casbin，看看 SpiceDB 的不同
- [安装 SpiceDB](/zh/spicedb/getting-started/install/docker) — 用 Docker 在本地跑起来
