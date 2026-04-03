::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/representing-users)
English: [View English version](/en/spicedb/modeling/representing-users)
:::

# 表示用户

在权限系统中，CheckPermission 调用始终在代表*资源*的对象和代表*主体（subject）*的对象之间进行：该 API 调用返回*主体*是否对*资源*拥有指定权限。

## 将用户表示为主体

权限系统中最常见的主体类型是某种形式的**用户**。

SpiceDB 中的用户被建模为对象类型，与资源相同。

通常是用户在访问您的应用程序或服务，因此需要为他们检查各种权限。

选择如何在 SpiceDB 中将用户表示为主体非常重要，因为错误的选择可能导致权限检查不完整，甚至在某些情况下产生错误结果。

### 使用稳定的外部标识符

将用户表示为主体的最常见和推荐方法是使用用户的**稳定**标识符作为主体的对象 ID。

例如，如果使用的认证系统是 OIDC 并提供 `sub` 字段，那么用户的对象 ID 可以是 `sub` 字段：

```
check resource:someresource view user:goog|487306745603273
```

由于 `sub` 字段**保证**对特定用户是稳定的（如果是合规的 OIDC 实现），因此可以安全地用于权限检查，不存在 `sub` 在将来代表不同用户的风险。

如果您有*多个*认证提供商，建议为*每个*提供商定义一个主体类型，以确保命名空间的清晰：

```txt
/** githubuser 表示来自 GitHub 的用户 */
definition githubuser {}

/** gitlabuser 表示来自 GitLab 的用户 */
definition gitlabuser {}
```

### 使用主键

第二种常见方法是在另一个后端数据存储（通常是关系数据库）中有用户的表示。

如果存在这样的数据库，并且每个用户对应一行记录，那么使用该行的主键 ID（通常是整数或 UUID）是另一个安全的用户 ID：

```
check resource:someresource view user:1337
```

如果使用自动生成或自动递增的整数，请确保它不能被重复使用。某些数据库允许序列重复使用 ID。

### 电子邮件地址呢？

通常**不建议**使用电子邮件地址在 SpiceDB 中表示用户主体。

原因如下：

- 电子邮件地址并非普遍稳定的，服务通常允许它们被重复使用
- 电子邮件地址并非普遍经过验证的，CheckPermission 的调用者通常可能无法*确定*用户拥有该电子邮件地址
- SpiceDB 不允许在对象 ID 中使用 `@` 字符

如果您**确定**用户的电子邮件地址既稳定又经过验证，并且仍然希望将其用作主体 ID，我们建议对电子邮件地址进行 base64 编码（去除填充）后在 SpiceDB 中使用。

## 将匿名访问者表示为主体

某些应用程序允许*匿名*访问来查看（偶尔也编辑）各种资源。

在 SpiceDB 中表示匿名访问者可以通过简单地定义另一个主体类型来代表未认证用户：

```txt
/** user 表示特定的已认证用户 */
definition user {}

/** anonymoususer 表示未认证的用户 */
definition anonymoususer {}
```

要向匿名用户授予资源访问权限，可以使用单个**静态**对象 ID 来代表*所有*匿名用户（如 `all`），或者使用通配符：

```txt
definition document {
    relation reader: user | anonymoususer:*
}
```

如果需要根据匿名用户的对象 ID 来区分不同的匿名用户，建议使用*通配符*与匿名用户定义配合。

例如，评论系统的匿名用户可能会被分配一个存储在浏览器 cookie 中的唯一 ID，从而获得编辑之前发布的评论的权限。

## 将服务表示为主体

如果您的权限检查是在机器或服务与其他服务之间进行的，建议主体类型应是该服务或其身份提供方式的表示。

例如，您可以直接表示一个服务：

```txt
definition service {}

definition resource {
    relation viewer: service
}
```

或者通过授予的令牌（token），使用*主体关系*的引用：

```txt
definition token {}

definition service {
    relation token: token
}

definition resource {
    relation viewer: service#token
}
```
