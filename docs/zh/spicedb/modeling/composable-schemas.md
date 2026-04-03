::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/composable-schemas)
English: [View English version](/en/spicedb/modeling/composable-schemas)
:::

# 可组合 Schema

为了便于 Schema 的组织和跨团队协作，`zed` v0.27.0 版本引入了 Schema 编译命令，支持 Schema 模块化：

```bash
zed schema compile root.zed
```

此命令将分布在多个文件中的 Schema 合并为一个统一的 Schema。

## 示例结构

### root.zed

```txt
use import
use partial

import "./subjects.zed"

partial view_partial {
 relation user: user
 permission view = user
}

definition resource {
 ...view_partial

 relation organization: organization
 permission manage = organization
}
```

### subjects.zed

```txt
definition user {}
definition organization {}
```

### 编译输出

```txt
definition user {}

definition organization {}

definition resource {
 relation user: user
 permission view = user

 relation organization: organization
 permission manage = organization
}
```

编译输出可被 SpiceDB 的 `WriteSchema` API 理解。

## 核心概念

引入了三个新的语法元素：导入语句、partial 声明和 partial 引用。

## 破坏性变更

### `use import` 和 `use partial`

_`zed` v0.36.0 版本_

从 v0.36.0 开始，启用 `import` 和 `partial` 语法需要相应的 `use` 标志：

```txt
use import
use partial

import "foo.zed"
partial something {}
```

`use` 标志仅在使用这些关键字的文件中需要。没有自身 `import` 或 `partial` 语法的导入文件不需要标志，但即使存在也不会导致错误。

### 新关键字

_`zed` v0.27.0 至 v0.35.0 版本_

::: info
此内容已被上述 `use import` 和 `use partial` 取代。
:::

可组合 Schema 编译器相对于 SpiceDB 内部的 `WriteSchema` 编译器引入了破坏性变更。虽然新版本的 SpiceDB 不应破坏现有 Schema，但编译器引入了新的关键字，可能导致以前有效的 Schema 编译失败。

`import` 和 `partial` 成为了关键字，因此以这些名称命名的权限或关系将无法编译。保留关键字包括 `use`、`and`、`or` 和 `not`。意外的 `TokenTypeKeyword` 错误很可能源于此问题。保留关键字在 [lexer 定义](https://github.com/authzed/spicedb/blob/main/pkg/composableschemadsl/lexer/lex_def.go#L74) 中有文档说明。

## 导入语句

导入语句沿着顶层声明边界分解 Schema。

### root.zed

```txt
use import

// import 关键字后跟带引号的相对文件路径
import "./one.zed"

// 注意裸文件名可以作为相对路径使用
import "two.zed"

// 导入通过编译过程包含进来，这意味着
// 它们可以被其他定义引用
definition resource {
 relation user: user
 relation organization: organization

 permission view = user + organization
}
```

### one.zed

```txt
definition user {}
```

### two.zed

```txt
definition organization {}
```

### 须知

- 导入引用必须在调用 `zed` 的文件夹内。
- 循环导入会被视为错误。
- 所有导入文件中的所有定义都会被引入。任何重复的定义都会导致错误。

## Partial

Partial 声明和引用提供了跨定义边界的 Schema 分解能力。

### Partial 声明

Partial 声明是使用 `partial` 关键字声明的顶层块。它可以像 `definition` 块一样包含关系、权限和 partial 引用，但其内容必须被 partial 引用才能出现在编译后的 Schema 中。

```txt
use partial

partial view_partial {
 ...some_other_partial

 relation user: user
 permission view = user
}
```

#### 须知

- 任何未被引用的 partial 在编译时会被忽略。
- Partial 声明可以包含 partial 引用，从而实现 partial 的组合。

### Partial 引用

Partial 引用将 partial 中的关系和权限包含进来，其功能类似于 JavaScript 展开语法或 Python 字典解包。

以下语法：

```txt
use partial

partial view_partial {
 relation viewer: user
 permission view = viewer
}

partial edit_partial {
 relation editor: user
 permission edit = editor
}

definition resource {
 ...view_partial
 ...edit_partial
}
```

等价于：

```txt
definition resource {
 relation user: user
 permission view = user

 relation editor: user
 permission edit = editor
}
```

#### 须知

- 来自 partial 引用的重复关系和权限会被视为错误。
- partial 之间的循环引用会被视为错误。
- 只有 partial 声明可以被引用。尝试使用 partial 引用来引用其他声明类型（定义、caveat）会导致错误。
- 一个 partial 可以被多次引用，partial 或定义可以包含任意数量的 partial 引用。

## 示例工作流

1. 修改多文件 Schema
2. 运行 `zed validate` 确保更改有效
3. 向 Schema 仓库提交 PR
4. CI 再次运行 `zed validate`

然后在合并时：

1. CI 运行 `zed schema compile`
2. CI 使用编译后的 Schema 调用 SpiceDB 的 WriteSchema API
