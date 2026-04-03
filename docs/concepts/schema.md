# Schema 语法

Schema 是 SpiceDB 的核心，用于定义资源类型、关系和权限。

## 基本结构

```zed
definition <类型名> {
    relation <关系名>: <允许的主体类型>
    permission <权限名> = <权限表达式>
}
```

## 定义类型

```zed
// 用户类型，通常为空
definition user {}

// 文档类型
definition document {
    relation owner: user
    relation editor: user
    relation viewer: user
}
```

## 关系（Relation）

关系定义了对象和主体之间的连接类型：

```zed
definition document {
    // 直接用户关系
    relation owner: user

    // 允许多种主体类型
    relation viewer: user | team#member

    // 允许通配符（所有用户）
    relation public_viewer: user:*
}
```

## 权限（Permission）

权限通过关系的组合来计算：

```zed
definition document {
    relation owner: user
    relation editor: user
    relation viewer: user

    // 并集：owner 或 editor 都有 edit 权限
    permission edit = owner + editor

    // 并集：owner、editor、viewer 都有 view 权限
    permission view = owner + editor + viewer

    // 交集：必须同时满足两个关系
    permission admin_edit = owner & editor

    // 排除：有 viewer 但不是 banned
    relation banned: user
    permission can_view = viewer - banned
}
```

### 权限运算符

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `+` | 并集（OR） | `viewer + editor` |
| `&` | 交集（AND） | `owner & admin` |
| `-` | 排除（NOT） | `viewer - banned` |

## 嵌套权限（箭头操作符）

箭头 `->` 用于跨类型引用权限：

```zed
definition folder {
    relation viewer: user
    permission view = viewer
}

definition document {
    relation parent: folder
    relation direct_viewer: user

    // 继承 folder 的 view 权限
    permission view = direct_viewer + parent->view
}
```

含义：如果用户能查看文件夹，那么也能查看文件夹中的文档。

## 完整示例

```zed
definition user {}

definition team {
    relation member: user
    relation admin: user

    permission manage = admin
}

definition organization {
    relation member: user | team#member
    relation admin: user

    permission manage = admin
    permission access = member + admin
}

definition document {
    relation org: organization
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member | user:*

    permission edit = owner + editor + org->manage
    permission view = viewer + edit
    permission delete = owner + org->manage
}
```

## 下一步

- [关系与权限](/concepts/relationships) — 如何写入和查询关系
- [编写第一个 Schema](/tutorials/first-schema) — 动手实践
