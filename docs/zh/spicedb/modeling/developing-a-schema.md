::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/developing-a-schema)
English: [View English version](/en/spicedb/modeling/developing-a-schema)
:::

# 开发 Schema

本文档将介绍从零开始开发新 Schema 的完整过程。

本文档的有用参考资料是 [Schema 语言参考](../concepts/schema)。

## 定义对象类型

开发新 Schema 的第一步是编写一个或多个对象类型定义。

在本示例中，我们假设一个基本系统，包含需要保护的资源（如 `document`）以及可能访问它们的 `users`。

我们首先使用 `definition` 关键字定义每种对象类型：

```txt
definition user {}

definition document {}
```

目前，我们的 Schema 和对象定义还没有实际作用；它们定义了系统中的两种对象类型，但由于没有定义任何关系（relation）或权限（permission），对象之间无法以任何形式相互关联，我们也无法对它们进行任何权限检查。

## 定义关系

下一步是决定对象之间如何相互关联，从而定义可以存储在 SpiceDB 中的关系类型。

在本示例中，我们选择了一个简单的 RBAC 风格权限模型，其中 `users` 可以被授予资源 `document` 上的*角色*，如 `reader`。

这种模型选择意味着资源 `document` 和 `users` 之间的关系将由我们想要的角色来定义。因此，我们可以从在 `document` 类型上定义一个关系开始，以表示其中一个角色：以下示例中的 `reader`。

```txt
definition user {}

definition document {
  relation reader: user
}
```

注意 `reader` 关系右侧包含 `user`：只有 `user` 类型的对象才能通过 `reader` 关系与 `document` 建立关联。

如果我们希望允许多种对象类型，可以使用 `|` 字符：

```txt
definition user {}
definition bot {}

definition document {
  relation reader: user | bot
}
```

## 验证 Schema

要验证 Schema 是否正确，`zed` 和 Playground 都支持编写*测试关系*作为针对 Schema 的数据写入测试。创建测试关系后，我们可以通过三种方式定义测试：

- **Check Watches**：在编辑 Schema 时进行实时检查
- **断言（Assertions）**：在运行验证时验证的正向或反向断言
- **预期关系（Expected Relations）**：在运行验证时对 Schema 的所有预期权限和关系的完整列举

### Check Watches

Check Watches 提供实时验证，在您于 Playground 中编辑 Schema 时自动更新。

### 断言

当您有了基本的 Schema 和一些需要验证的数据后，可以编写*断言*来确保 Schema 符合预期。

断言以两个 YAML 列表的形式编写，包含零个或多个需要验证的关系：`assertTrue` 和 `assertFalse`。

在本示例中，我们希望验证被赋予 `reader` 角色的特定用户确实拥有该角色，因此可以编写一个断言来验证：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertFalse: []
```

类似地，如果我们想验证*另一个*用户没有该角色，可以将该非预期关系添加到 `assertFalse` 分支：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
```

可以通过点击 Playground 中的 `Validate` 按钮或使用 `zed validate` 命令来运行验证。

### 预期关系

除了 Check Watches 和断言之外，还有*预期关系*的概念，它可以用来**完整地**检查关系或权限的成员资格。

预期关系由 YAML 格式的映射组成，每个键代表一个关系，值是一个字符串列表，包含完整的预期关系集合。

例如，我们可以编写一个空的首项预期关系：

```yaml
document:specificdocument#reader: []
```

在 Playground 中点击 `Update` 按钮后，我们会得到完整展开的形式：

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
```

虽然这个示例没有展示出比基本断言更多的功能，但当我们向 Schema 添加更多关系和权限时，预期关系会变得更加强大。

## 扩展 Schema

虽然能够查询用户是否是文档的读者非常有用，但大多数权限系统都会包含不止一个角色。

在本示例中，我们希望添加第二个角色 `writer`，以便检查用户是否是文档的写入者。

### 添加 writer 关系

首先，我们再添加一个关系，即 `writer`：

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
}
```

接下来，为了测试新关系，我们为另一个用户添加测试关系：

```
document:specificdocument#reader@user:specificuser
document:specificdocument#writer@user:differentuser
```

为了验证测试关系是否生效，我们可以添加另一个断言，并且断言原始用户（`specificuser`）*不是* writer：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

最后，我们可以为新关系添加预期关系来进行验证：

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

## 定义权限

但是，上述配置和验证暴露了一个问题：用户被分配到单个关系 `writer` 或 `reader`，但如果我们希望所有能写入文档的用户也能阅读文档呢？

一个简单的解决方案是，每次创建 `writer` 关系时也创建一个 `reader` 关系，但这很快就会变得难以维护。

理想的方案是，拥有 `writer` 角色的用户**隐式地**被允许阅读文档，这样我们只需要编写*一个*关系来代表用户对文档的**实际**关系/角色。

解决这个问题的方案是 Schema 语言中的第二个概念：**权限（permissions）**。Schema 中的权限定义了从一个或多个其他关系或权限*计算*得出的权限。

让我们再次看看上面的 Schema：

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
}
```

之前，我们检查的是特定用户是否在文档上拥有特定**角色**（如 `reader`）。现在，我们想检查特定用户是否在文档上拥有特定**权限**，例如查看文档的能力。

为了支持这个用例，我们可以定义一个 `permission`：

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
  permission view = reader + writer
}
```

`permission` 与 `relation` 不同，它不能显式地写入数据库：它在查询时根据 `=` 之后的表达式*计算*得出。这里，我们将 `view` 权限计算为包含拥有 `reader` 或 `writer` 角色的所有用户，从而允许拥有任一（或两个）角色的用户查看文档。

### 更新预期关系

现在我们已经用新权限更新了 Schema，可以更新断言和预期关系来确保它按预期工作。

首先，我们添加一个断言来检查用户是否可以 `view` 文档：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
  - "document:specificdocument#view@user:specificuser"
  - "document:specificdocument#view@user:differentuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

接下来，更新预期关系以添加 `view` 权限，并确保两个用户都拥有该文档上的权限：

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#view:
  - "[user:differentuser] is <document:specificdocument#writer>"
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

注意 `differentuser` 和 `specificuser` 的尖括号内容是**不同的**：它们表示权限被传递授予的*关系*。

::: info
预期关系包含了主体被发现所通过的关系，以确保不仅权限是有效的，而且权限被验证的*方式*也符合预期。

如果一个主体可以通过多种方式获得某个权限，预期关系将要求*所有*方式都被列出才有效。
:::

### 准备继承权限

如上所述，我们可以使用 `permission` 来定义*隐式*权限，例如由拥有 `reader` 或 `writer` 角色的用户组成的 `view` 权限。但是，特定对象类型上的隐式权限往往是不够的：有时权限需要在对象类型之间**继承**。

例如：假设我们在权限系统中添加了 `organization` 的概念，任何组织的管理员用户自动获得查看该组织内所有 `document` 的能力；我们如何定义这样的权限 Schema？

### 定义组织类型

首先，我们必须定义表示组织的对象类型，包括 `administrator` 关系，用于表示用户的管理员角色：

```txt
definition user {}

definition document {
  relation reader: user
  relation writer: user
  permission view = reader + writer
}

/** organization 表示包含文档的组织 */
definition organization {
  relation administrator: user
}
```

### 连接组织和文档

为了使继承生效，我们必须定义一种方式来表示文档"属于"某个组织。幸运的是，这只是另一个关系（`document` 与其父 `organization` 之间的关系），所以我们可以在 `document` 类型中使用另一个关系：

```txt
definition user {}

/** organization 表示包含文档的组织 */
definition organization {
  relation administrator: user
}

definition document {
  /** docorg 表示该组织拥有此文档 */
  relation docorg: organization

  relation reader: user
  relation writer: user
  permission view = reader + writer
}
```

这里我们选择将这个关系称为 `docorg`，但它可以叫任何名字：通常建议使用两个命名空间的缩写，或者使用表示对象类型之间实际关系的术语（如 `parent`）。

### 添加关系

现在我们已经定义了 `relation` 来保存新的关系，可以添加一个测试关系：

```
document:specificdocument#docorg@organization:someorg
```

::: info
注意在这个关系中，组织被用作**主体（subject）**。
:::

### 继承权限

现在我们有了表明文档属于组织的方式，以及在组织本身上定义管理员角色的关系，最后的步骤是向组织添加 `view_all_documents` 权限，并编辑 `view` 权限以考虑此权限。

为此，我们使用箭头运算符（`->`），它允许*跨越*另一个关系或权限引用权限：

```txt
/** user 表示应用程序中已注册用户的账户 */
definition user {}

/** organization 表示包含文档的组织 */
definition organization {
  /** administrator 表示该用户是组织的管理员 */
  relation administrator: user

  /** view_all_documents 表示用户是否可以查看组织中的所有文档 */
  permission view_all_documents = administrator
}

/** document 表示具有访问控制的文档 */
definition document {
  /** docorg 表示该组织拥有此文档 */
  relation docorg: organization

  /** reader 表示该用户是文档的读者 */
  relation reader: user

  /** writer 表示该用户是文档的写入者 */
  relation writer: user

  /** view 表示用户是否可以查看该文档 */
  permission view = reader + writer + docorg->view_all_documents
}
```

表达式 `docorg->view_all_documents` 告诉 SpiceDB 沿着 `docorg` 关系找到文档所属的组织，然后针对 `view_all_documents` 权限检查用户。

通过使用这个表达式，任何被定义为拥有该文档的组织的管理员的用户也将能够查看该文档！

::: info
*建议*箭头的右侧始终引用**权限（permissions）**，而不是关系（relations）。这样可以方便嵌套计算，并且更具可读性。
:::

### 添加管理员用户

现在我们已经声明了组织上 `administrator` 中的所有用户也被授予 `view` 权限，让我们在测试数据中定义至少一个管理员用户：

```
organization:someorg#administrator@user:someadminuser
```

### 测试继承的权限

最后，我们可以将用户添加到断言和预期关系中的声明中，并验证继承是否有效：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
  - "document:specificdocument#writer@user:differentuser"
  - "document:specificdocument#view@user:specificuser"
  - "document:specificdocument#view@user:differentuser"
  - "document:specificdocument#view@user:someadminuser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
  - "document:specificdocument#writer@user:specificuser"
```

```yaml
document:specificdocument#reader:
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#view:
  - "[user:differentuser] is <document:specificdocument#writer>"
  - "[user:someadminuser] is <organization:someorg#administrator>"
  - "[user:specificuser] is <document:specificdocument#reader>"
document:specificdocument#writer:
  - "[user:differentuser] is <document:specificdocument#writer>"
```

::: info
注意 `someadminuser` 的预期是 `<organization:someorg#administrator>`，而不是文档上的 `reader` 或 `writer`：该权限是通过用户作为组织管理员的身份授予的。
:::
