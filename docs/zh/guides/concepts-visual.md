# 核心概念图解

::: info 原创内容
本文为社区原创，通过 ASCII 图和具体例子帮你直观理解 SpiceDB 的三个核心概念。
:::

SpiceDB 的核心只有三个概念：**Schema**、**Relationship**、**Permission**。理解了它们的关系，就理解了 SpiceDB。

## 一句话总结

> **Schema 定义规则，Relationship 存储事实，Permission 是规则作用于事实后的计算结果。**

```
┌─────────────────────────────────────────────────────┐
│                     SpiceDB                          │
│                                                      │
│   Schema (规则)          Relationships (事实)         │
│   ┌──────────────┐      ┌──────────────────────┐    │
│   │ definition   │      │ doc:readme#editor     │    │
│   │   relation   │  +   │   @user:zhangsan      │    │
│   │   permission │      │ doc:readme#viewer     │    │
│   └──────┬───────┘      │   @team:dev#member    │    │
│          │              └──────────┬───────────┘    │
│          │                         │                 │
│          └────────┬────────────────┘                 │
│                   ▼                                  │
│          ┌────────────────┐                          │
│          │  Permissions   │                          │
│          │  (计算结果)     │                          │
│          │                │                          │
│          │  "张三能编辑    │                          │
│          │   readme 吗？" │                          │
│          │   → 允许       │                          │
│          └────────────────┘                          │
└─────────────────────────────────────────────────────┘
```

## 概念一：Schema — 规则蓝图

Schema 定义了你系统中"存在什么类型的东西"以及"它们之间能有什么关系"。

### 类比

把 Schema 想象成数据库的表结构定义（DDL）：

```
Schema                          数据库类比
──────────────                  ──────────────
definition user {}              CREATE TABLE users (...)
definition document {           CREATE TABLE documents (
    relation editor: user           editor_id REFERENCES users
    relation viewer: user           viewer_id REFERENCES users
}                               )
```

但 Schema 比数据库表结构多了一样东西：**permission**。

```zed
definition document {
    relation editor: user
    relation viewer: user

    permission edit = editor
    permission view = edit + viewer   // 能编辑的人也能查看
}
```

`permission view = edit + viewer` 这行表示：**view 权限 = 拥有 edit 权限的人 + 拥有 viewer 关系的人**。这是一个计算规则，不需要存储。

### Schema 不存储数据

这一点很重要：Schema 只定义结构和规则，不包含任何具体数据。就像 `CREATE TABLE` 不包含任何行一样。

## 概念二：Relationship — 具体事实

Relationship 是系统中的具体事实。每条 Relationship 的格式是：

```
资源:ID#关系@主体:ID
```

例子：

```
document:readme#editor@user:zhangsan
├── 资源 ──┘       │     └── 主体 ──┘
                    └── 关系
```

读作：**"用户张三是文档 readme 的 editor"**

### 关系可以指向一组人

```
document:readme#viewer@team:backend#member
├── 资源 ──┘       │     └── 主体（一组人）──┘
                    └── 关系
```

读作：**"backend 团队的所有成员都是文档 readme 的 viewer"**

这意味着你不需要为 backend 团队的每个人单独写一条关系。

### Relationship 构成一张图

多条 Relationship 组合在一起，形成一张有向图：

```
            ┌─────────────────┐
            │ document:readme │
            └────┬───────┬────┘
         editor  │       │  viewer
                 │       │
        ┌────────▼┐   ┌──▼──────────────┐
        │  user:   │   │ team:backend    │
        │ zhangsan │   │    #member      │
        └──────────┘   └───┬────────┬───┘
                    member  │        │  member
                            │        │
                   ┌────────▼┐  ┌───▼──────┐
                   │  user:   │  │  user:    │
                   │   lisi   │  │  wangwu   │
                   └──────────┘  └──────────┘
```

这张图就是 SpiceDB 回答权限问题的基础。

## 概念三：Permission — 图上的可达性

当你问"王五能查看 readme 吗？"，SpiceDB 做的事情是：

**从 `document:readme` 出发，沿着 `view` 权限定义的路径，能不能到达 `user:wangwu`？**

回忆 Schema 中的定义：

```zed
permission view = edit + viewer
permission edit = editor
```

展开就是：`view = editor + viewer`

SpiceDB 的求解过程：

```
问：user:wangwu 能 view document:readme 吗？

view = edit + viewer
     = editor + viewer

1. 检查 editor 路径：
   document:readme#editor → user:zhangsan
   zhangsan ≠ wangwu ✗

2. 检查 viewer 路径：
   document:readme#viewer → team:backend#member
   team:backend#member → user:lisi, user:wangwu
   找到 wangwu ✓

结果：允许 ✓
```

**这就是为什么 SpiceDB 说自己是"图数据库"**——权限检查本质上是图的可达性问题。

## 箭头操作符 `->` ：跨类型的关系穿越

这是 SpiceDB 最强大的特性之一。来看一个真实场景：

```zed
definition workspace {
    relation admin: user
    relation member: user
}

definition document {
    relation workspace: workspace
    relation editor: user

    permission manage = workspace->admin
    permission edit = editor + manage
}
```

`workspace->admin` 的含义是：

1. 找到这个文档的 `workspace` 关系指向的工作空间
2. 在那个工作空间上检查 `admin` 权限

```
假设有这些 Relationships：
  document:readme#workspace@workspace:acme
  workspace:acme#admin@user:zhangsan

问：张三能 manage document:readme 吗？

manage = workspace->admin

1. document:readme 的 workspace 是 workspace:acme
2. workspace:acme 的 admin 包含 user:zhangsan
3. 张三 ✓

结果：允许 ✓
```

```
document:readme ──workspace──→ workspace:acme ──admin──→ user:zhangsan
     │                                                        │
     └──── manage 权限 = workspace->admin ───────────────────┘
                    （沿箭头穿越到 workspace，检查 admin）
```

**张三从未被直接赋予 document:readme 的任何关系**，但通过"文档属于工作空间，张三是工作空间管理员"这条关系链，他获得了管理权限。

这就是 ReBAC 的威力：你描述的是**关系**，权限是**推导**出来的。

## 三种权限操作符

| 操作符 | 含义 | 例子 | 说明 |
|--------|------|------|------|
| `+` | 并集（OR） | `edit + viewer` | 有 edit 权限或有 viewer 关系的人 |
| `&` | 交集（AND） | `member & allowed` | 同时满足两个条件的人 |
| `-` | 排除（NOT） | `viewer - blocked` | 有 viewer 关系但不在 blocked 列表中的人 |

一个实际例子：

```zed
definition document {
    relation viewer: user
    relation blocked: user

    /** 只有未被封禁的 viewer 才能查看 */
    permission view = viewer - blocked
}
```

## 四个核心 API

理解了上面的概念，四个 API 就很直觉了：

| API | 问题 | 类比 |
|-----|------|------|
| `CheckPermission` | 张三能编辑 readme 吗？ | 图的可达性：A 能到 B 吗？ |
| `LookupResources` | 张三能编辑哪些文档？ | 从主体出发的反向遍历 |
| `LookupSubjects` | 谁能编辑 readme？ | 从资源出发的正向遍历 |
| `WriteRelationships` | 张三现在是 readme 的编辑者 | 往图里加边 |

## 完整的心智模型

```
                    你的应用
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   WriteRelationships  CheckPermission  LookupResources
          │            │            │
          ▼            ▼            ▼
┌─────────────────────────────────────────┐
│              SpiceDB                     │
│                                          │
│  ┌──────────┐    ┌───────────────────┐  │
│  │  Schema   │    │   Relationships   │  │
│  │  (规则)   │    │   (关系图)        │  │
│  └─────┬─────┘    └────────┬──────────┘  │
│        │                   │             │
│        └────────┬──────────┘             │
│                 ▼                        │
│        ┌────────────────┐               │
│        │  Graph Engine   │               │
│        │  (图遍历引擎)   │               │
│        └────────────────┘               │
│                                          │
│  存储层：PostgreSQL / CockroachDB / ...  │
└─────────────────────────────────────────┘
```

你的应用只需要做两件事：

1. **告诉 SpiceDB 事实**（WriteRelationships）：张三加入了 backend 团队
2. **问 SpiceDB 问题**（CheckPermission / LookupResources）：张三能看哪些文档？

**所有权限推导逻辑都在 SpiceDB 内部完成**，你的业务代码里不再有任何 `if` 判断。

## 下一步

- [五分钟理解 SpiceDB](/zh/guides/quickstart-5min) — 用一个完整的 SaaS 例子动手实践
- [与 Casbin 对比](/zh/guides/vs-casbin) — 如果你用过 Casbin，理解两者的差异
- [Schema 语言参考](/zh/spicedb/concepts/schema) — 完整的语法说明
- [Playground](https://play.authzed.com) — 在线实验你自己的 Schema
