::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/validation-testing-debugging)
English: [View English version](/en/spicedb/modeling/validation-testing-debugging)
:::

# 验证、测试与调试

无论您是在设计 Schema 的第一个迭代版本，还是在生产环境中运行 SpiceDB，您都需要工具来建立对性能、正确性和设计决策的信心。SpiceDB 提供了全面的验证、测试和调试工具来支持授权 Schema 的开发。

## SpiceDB 工具

### 集成测试服务器

集成测试服务器为每个用于认证 API 请求的唯一预共享密钥提供一个隔离的空数据存储。这使得可以在单个 SpiceDB 实例上进行并行测试。

- 标准端口：`50051`
- 只读端口：`50052`

运行命令：

```bash
spicedb serve-testing
```

集成测试服务器也可以通过 GitHub Actions 使用。

### CheckPermission 追踪头

v1 CheckPermission API 支持通过将 `io.spicedb.requestdebuginfo` 头设置为 `true` 来进行调试。这会追踪在计算权限检查时遍历的完整关系和权限集合。

::: warning
收集追踪信息会带来显著的性能开销。建议使用 `zed` 的 explain 标志进行调试。
:::

响应中包含一个尾部信息 `io.spicedb.respmeta.debuginfo`，其中包含 JSON 编码的追踪数据。

## Playground 功能

### 断言

断言通过正向和反向检查来验证 Schema 中特定不变量是否得到维护：

```yaml
assertTrue:
  - "document:validation-testing-debugging#reader@user:you"
assertFalse: []
```

#### 断言中的 Caveat 上下文

可以使用单引号来包含 Caveat 上下文以转义 JSON：

```yaml
assertTrue:
  - 'document:validation-testing-debugging#reader@user:you with {"somecondition": 42, "anothercondition": "hello world"}'
assertFalse: []
```

使用 `assertCaveated` 来要求 Caveat 上下文：

```yaml
assertTrue: []
assertCaveated:
  - "document:validation-testing-debugging#reader@user:you"
assertFalse: []
```

### Check Watches

Check Watches 是随 Playground 更改而实时更新的断言。可能的状态：

- 权限允许
- 权限附带条件（Caveated）
- 权限拒绝
- 无效检查

### 预期关系

预期关系列举了获取特定关系访问权的所有方式：

```yaml
document:validation-testing-debugging#reader:
  - "[user:you] is <document:validation-testing-debugging#reader>"
```

传递性访问显示层级路径：

```yaml
project:docs#admin:
  - "[organization:authzed] is <project:docs#owner>"
  - "[user:rauchg] is <platform:vercel#admin>"
```

### 预期关系中的 Caveat

带有 Caveat 的预期关系使用 `[...]` 表示"可能"语义：

```yaml
project:docs#admin:
  - "[user:rauchg[...]] is <platform:vercel#admin>"
```

### 预期关系中的例外

预期关系可以包含例外情况：

```yaml
project:docs#admin:
  - "[user:rauchg[...]] is <platform:vercel#admin>/<platform:vercel#banned>"
```

这表示：用户拥有管理员权限，除非该用户被封禁。

## 检查追踪

通过在请求消息中设置 `with_tracing: true` 来启用检查追踪，以查看响应中的路径和时间信息。

::: info
v1.31.0 之前的版本使用基于头信息的追踪，通过 JSON 尾部响应返回数据。
:::

## Zed CLI 工具

### Zed Validate

在本地和 CI 中验证 Schema：

```bash
zed validate my-schema.zed
```

使用从 Playground 导出的 YAML 文件验证功能：

```bash
zed validate schema-and-validations.yaml
```

验证文件结构：

```yaml
schema: |-
  // schema 写在这里
# -- 或者 --
schemaFile: "./path/to/schema.zed"

relationships: |-
  object:foo#relation@subject:bar
  object:baz#relation@subject:qux

assertions:
  assertTrue:
    - object:foo#relation@subject:bar
  assertFalse:
    - object:foo#relation@subject:qux
validation:
  object:foo#relation:
    - "[subject:bar] is <object:foo#user>"
```

支持多个文件（v0.25.0+）：

```bash
zed validate some-validations.yaml some-other-validations.yaml
zed validate validations/*
```

::: info
如果删除的关系仍有现存实例，Schema 写入仍可能失败。
:::

### Explain 标志

`zed permission check --explain` 命令会让 SpiceDB 收集在实时系统上计算权限检查时所经过的实际路径：

```
$ zed permission check --explain document:firstdoc view user:fred
true
  document:firstdoc view (66.333us)
    document:firstdoc writer (12.375us)
    document:firstdoc reader (20.667us)
       user:fred
```

explain 输出会高亮显示缓存的遍历路径并检测循环。

## GitHub Actions

### authzed/action-spicedb

运行集成测试服务器，支持配置版本：

```yaml
steps:
  - uses: "authzed/action-spicedb@v1"
    with:
      version: "latest"
```

### authzed/action-spicedb-validate

强烈推荐使用此工具，因为它可以防止部署未经验证的更改。

```yaml
steps:
  - uses: "actions/checkout@v4"
  - uses: "authzed/action-spicedb-validate@v1"
    with:
      validationfile: "your-schema.yaml"
```
