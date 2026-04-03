::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/schema)
English: [View English version](/en/spicedb/concepts/schema)
:::

# Schema 语言

## 概述

SpiceDB Schema 定义了对象类型、它们之间的关系以及计算权限。Schema 使用 `.zed` 文件扩展名，可以在 [Authzed Playground](https://play.authzed.com) 中实时测试。

## 定义

### 对象类型定义

对象类型定义代表对象的类别，类似于面向对象编程中的类定义。基本语法：

```txt
definition document {}
definition group {}
definition user {}
```

定义支持使用前缀来区分多产品组织：

```txt
definition docs/document {}
definition docs/folder {}
definition iam/group {}
definition iam/user {}
```

### Caveat 定义

Caveat 是附加到关系上的条件表达式（真/假）。它们仅在权限检查期间 caveat 评估为真时，才将相关关系纳入考虑。

```txt
caveat ip_allowlist(user_ip ipaddress, cidr string) {
  user_ip.in_cidr(cidr)
}

definition document {
  relation reader: user with ip_allowlist
}
```

## 关系（Relations）

关系定义了对象或主体之间的关联方式，始终需要名称和允许的主体类型。

### 与特定对象的关系

```txt
definition user {}

definition group {
  /**
   * member 定义了谁是组的成员
   */
  relation member: user
}

definition document {
  /**
   * reader 关联了作为文档读者的用户
   */
  relation reader: user
}
```

### 主体关系

主体关系允许授权给特定主体和主体集合：

```txt
definition document {
  /**
   * owner 可以是特定用户，也可以是
   * 与组具有该关系的成员集合
   */
  relation owner: user | group#member
}
```

### 通配符

通配符表示对整个资源类型的授权，实现公共访问：

```txt
definition document {
  /**
   * viewer 可以授予特定用户或所有用户
   */
  relation viewer: user | user:*
}
```

::: warning
请谨慎使用通配符；除非确实需要全局写入，否则仅用于读取权限。
:::

### 关系命名

关系应命名为名词，读作 "{关系名称}（属于某对象）"：

| 名称 | 读作 |
|------|---------|
| `reader` | 文档的读者 |
| `writer` | 文档的写者 |
| `member` | 组的成员 |
| `parent` | 文件夹的父级 |

## 权限（Permissions）

权限定义了具有特定授权的计算主体集合。它们需要名称和使用操作符的表达式：

```txt
definition document {
  relation writer: user
  relation reader: user

  /**
   * edit 确定用户是否可以编辑文档
   */
  permission edit = writer

  /**
   * view 确定用户是否可以查看文档
   */
  permission view = reader + writer
}
```

::: info
Relationship 仅引用 relation，不引用 permission，这使得可以在不修改 Schema 的情况下更改权限。
:::

### 操作符

#### 并集（`+`）

将关系/权限组合为允许的主体集合：

```txt
permission admin = reader + writer
```

#### 交集（`&`）

仅包含同时存在于两个关系/权限中的主体：

```txt
permission admin = reader & writer
```

#### 排除（`-`）

从左侧结果中移除右侧的主体：

```txt
permission can_only_read = reader - writer
```

#### 箭头（`->`）

遍历父对象的权限：

```txt
definition folder {
  relation reader: user
  permission read = reader
}

definition document {
  relation parent_folder: folder

  permission read = parent_folder->read
}
```

与并集组合使用：

```txt
permission read = reader + parent_folder->read
```

::: tip
在箭头右侧使用 permission（而非 relation），以获得更好的可读性和嵌套计算能力。
:::

##### 主体关系与箭头

箭头操作的是关系主体的对象，而非关系/权限本身。对于 `parent: group#member`，箭头 `parent->something` 引用的是 group 的 `something` 权限，忽略 `#member`。

#### .any（箭头别名）

`.any` 是箭头操作的别名：

```txt
permission read_same = reader + parent_folder.any(read)
```

#### .all（交集箭头）

交集箭头要求所有左侧主体都具有请求的权限/关系：

```txt
definition document {
  relation group: group
  permission view = group.all(member)
}
```

::: warning
交集箭头会加载所有结果，影响性能。
:::

### `self` 关键字

在 SpiceDB v1.49.0+ 中可用。允许主体在无需显式关系的情况下访问自身：

```txt
use self

definition user {
  relation viewer: user
  permission view = viewer + self
}
```

### 类型检查

`use typechecking` 功能声明并验证权限类型，捕获隐蔽的错误：

```txt
use typechecking

definition user {}
definition document {
  relation viewer: user
  permission view: user = viewer
}
```

类型注解语法：

```
permission <名称>: <类型1> | <类型2> | ... = <表达式>
```

注解必须包含所有可达类型。支持通过混合注解和非注解权限来逐步采用。

**单类型示例：**

```txt
use typechecking

definition user {}

definition document {
  relation viewer: user
  permission view: user = viewer
}
```

**多类型示例：**

```txt
use typechecking

definition user {}
definition team {}

definition document {
  relation viewer: user | team
  relation owner: user | team
  permission view: user | team = viewer + owner
}
```

**箭头操作示例：**

```txt
use typechecking

definition user {}
definition team {}

definition organization {
  relation member: user | team
}

definition document {
  relation org: organization
  permission view: user | team = org->member
}
```

### 权限命名

权限应命名为动词或名词，读作 "（是/可以）{权限名称}（某对象）"：

| 名称 | 读作 |
|------|---------|
| `read` | 可以读取该对象 |
| `write` | 可以写入该对象 |
| `delete` | 可以删除该对象 |
| `member` | 是该对象的成员 |

### 私有/内部标识符

以下划线 (`_`) 为前缀的标识符建立了私有/内部项的命名约定：

```txt
definition document {
  relation viewer: user
  relation _internal_viewer: user  // 私有：仅供内部使用

  permission _can_view = viewer + _internal_viewer  // 私有：合成的
  permission view = _can_view  // 公共 API
}
```

用途包括合成权限、内部关系和实现细节。

#### 标识符规则

- 以小写字母 (a-z) 或下划线 (`_`) 开头
- 首字符之后可包含小写字母、数字、下划线
- 长度：3-64 个字符，以字母或数字结尾
- 有效：`_ab`、`_private`、`_internal_relation`、`_helper123`
- 无效：`_`（太短）、`_a`（太短）、`_trailing_`（以下划线结尾）

## 注释

### 文档注释

强烈建议在所有定义、关系和权限上添加文档注释：

```txt
/**
 * something 有一些文档注释
 */
```

### 非文档注释

```txt
// 一些注释
/* 一些注释 */
```

## 常见模式

### 组成员关系

将用户或组成员应用于对象权限：

```txt
definition user {}
definition group {
  relation admin: user
  relation member: user
  permission membership = admin + member
}
definition role {
  relation granted_to: user | group#membership
  permission allowed = granted_to
}
```

### 全局管理员权限

实现跨组织层次结构的超级管理员权限：

```txt
definition platform {
  relation super_admin: user
}

definition organization {
  relation admin: user
  relation platform: platform
  permission admin = admin + platform->super_admin
}
```

### 合成关系

使用中间合成关系为复杂层次结构建模关系遍历。

### 递归权限

在嵌套对象之间递归应用权限：

```txt
definition folder {
  relation reader: user
  relation parent: folder
  permission read = reader + parent->read
}
```

### 跨不同资源类型的递归权限

::: warning
在两种资源类型上使用相同的权限名称，以确保递归查找正常工作。
:::
