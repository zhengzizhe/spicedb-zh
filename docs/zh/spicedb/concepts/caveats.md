::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/caveats)
English: [View English version](/en/spicedb/concepts/caveats)
:::

# Caveat（条件表达式）

## 概述

Caveat 是可以附加到 SpiceDB 中 relationship 上的条件表达式。它们评估为真或假，允许在权限检查期间有条件地定义 relationship。Caveat 提供了一种优雅的方式来建模动态策略和 ABAC 风格（基于属性的访问控制）的决策，同时仍能保证可扩展性和性能。

## 定义 Caveat

Caveat 是在 Schema 中与对象类型定义一起定义的命名表达式。每个 caveat 包括名称、带类型的参数和返回布尔值的 CEL（通用表达式语言）表达式。

### 参数类型

| 类型 | 描述 |
|------|-------------|
| `any` | 允许任何值；适用于变化的类型 |
| `int` | 64 位有符号整数 |
| `uint` | 64 位无符号整数 |
| `bool` | 布尔值 |
| `string` | UTF-8 编码字符串 |
| `double` | 双精度浮点数 |
| `bytes` | uint8 序列 |
| `duration` | 时间持续 |
| `timestamp` | 特定时间点 |
| `list<T>` | 泛型序列 |
| `map<T>` | 字符串到值的映射 |
| `ipaddress` | SpiceDB 特有的 IP 类型 |

### Caveat 示例

**基本比较：**

```txt
caveat is_tuesday(today string) {
  today == 'tuesday'
}
```

**IP 地址检查：**

```txt
caveat ip_allowlist(user_ip ipaddress, cidr string) {
  user_ip.in_cidr(cidr)
}
```

## 在 Relation 上允许 Caveat

Caveat 必须使用 `with` 关键字在 relation 上指定：

```txt
definition resource {
  relation viewer: user | user with ip_allowlist
}
```

这允许写入 relationship 时可以不带 caveat 或带命名的 caveat。移除 `user |` 可使 caveat 成为必需的。

## 写入带 Caveat 的 Relationship

创建 relationship 时，可以指定 caveat 名称和上下文（部分数据）：

```
OptionalCaveat: {
  CaveatName: "ip_allowlist",
  Context: structpb{ "cidr": "1.2.3.0/24" }
}
```

**要点：**

- 上下文同时来自 relationship 和 CheckPermissionRequest；relationship 中的值优先
- 与 relationship 一起存储的上下文在写入时实现部分绑定
- 上下文以 `structpb`（类似 JSON 的数据）表示
- 64 位整数应编码为字符串
- Relationship 不能以有/无 caveat 的方式重复
- 删除时不需要指定 caveat

## 通过 API 提供 Caveat 上下文

### CheckPermission

发出 CheckPermission 请求时，可以指定额外的上下文：

```
CheckPermissionRequest {
  context: { "user_ip": "1.2.3.4" }
}
```

返回三种状态之一：

- `PERMISSIONSHIP_NO_PERMISSION` — 无访问权限
- `PERMISSIONSHIP_HAS_PERMISSION` — 确认有访问权限
- `PERMISSIONSHIP_CONDITIONAL_PERMISSION` — 需要缺失的上下文

### LookupResources 和 LookupSubjects

两者都支持上下文参数，并为每个结果返回权限状态（有权限或条件性有权限）。

## 使用 zed CLI

通过 `--caveat-context` 标志提供与 Schema 类型匹配的 JSON 上下文：

```bash
zed check -r resource:specificresource#view -p view -s user:specificuser \
  --caveat-context '{"first_parameter": 42, "second_parameter": "hello world"}'
```

使用单引号来转义 JSON 字符（在 Authzed Playground 中不需要）。

## 完整示例

**Schema：**

```txt
definition user {}

caveat has_valid_ip(user_ip ipaddress, allowed_range string) {
  user_ip.in_cidr(allowed_range)
}

definition resource {
  relation viewer: user | user with has_valid_ip
  permission view = viewer
}
```

**写入 Relationship：**

```
OptionalCaveat: {
  CaveatName: "has_valid_ip",
  Context: structpb{ "allowed_range": "10.20.30.0/24" }
}
```

**检查权限：**

```
CheckPermissionRequest {
  context: { "user_ip": "10.20.30.42" }
}
```

## 使用 Caveat 进行验证

### 断言

使用 `assertCaveated` 块进行带 caveat 的权限断言：

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertCaveated:
  - "document:specificdocument#reader@user:caveateduser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
```

使用 `with` 关键字为条件断言提供上下文。

### 预期关系

带 caveat 的主体用 `[...]` 标记表示，即使在 relationship 上指定了完整上下文，也不会评估 caveat。
