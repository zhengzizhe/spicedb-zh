::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/recursion-and-max-depth)
English: [View English version](/en/spicedb/modeling/recursion-and-max-depth)
:::

# 递归与最大深度

SpiceDB 中的权限检查会遍历一棵由 Schema（结构）和关系（数据）构建的树。`CheckPermission` 请求从请求的资源和权限开始，遍历引用的权限和关系，直到找到主体或达到最大深度。

## 最大深度

SpiceDB 默认最大深度为 `50`，以防止无限遍历。达到此限制时，计算将停止并向调用者返回错误。此最大值可通过 `--dispatch-max-depth` 标志进行配置。

## 关系中的递归

SpiceDB **不**支持递归数据依赖，即 `CheckPermission` 等操作多次访问同一对象，因为它期望权限图是一棵树。

### 示例

不支持的嵌套分组：

```txt
definition user {}

definition group {
    relation member: user | group#member
}

definition resource {
    relation viewer: user | group#member
    permission view = viewer
}
```

对应的关系：

```
resource:someresource#viewer@group:firstgroup#member
group:firstgroup#member@group:secondgroup#member
group:secondgroup#member@group:thirdgroup#member
group:thirdgroup#member@group:firstgroup#member
```

这会创建一个循环：`resource:someresource#viewer` -> `group:firstgroup#member` -> `group:secondgroup#member` -> `group:thirdgroup#member` -> `group:firstgroup#member` -> ...

## 常见问题

### 为什么不追踪已访问的对象？

有两个主要原因阻止了内置的循环检测：

#### 嵌套集合存在语义问题

Zanzibar 和 ReBAC 基于集合运算——检查请求的主体是否在通过遍历权限树形成的集合中。关于包含自身成员的分组在语义上是否有效，存在很多争议。

考虑这个有问题的 Schema：

```txt
definition user {}

definition group {
    relation direct_member: user | group#member
    relation banned: user | group#member
    permission member = direct_member - banned
}
```

对应的关系：

```
group:firstgroup#direct_member@group:secondgroup#member
group:firstgroup#banned@group:bannedgroup#member
group:secondgroup#direct_member@user:tom
group:bannedgroup#direct_member@group:firstgroup#member
```

这会产生逻辑矛盾：`user:tom` 是 `secondgroup` 的 `direct_member`，使其成为 `firstgroup` 的成员，进而使其成为 `bannedgroup` 的成员，这又使其*不是* `firstgroup` 的成员——一个逻辑矛盾。

为了防止这种情况，Zanzibar 和 SpiceDB 假设权限图是一棵树。

#### 性能开销

在 `CheckPermission` 查询期间追踪已访问的对象会在内存和网络传输上产生显著的开销，需要维护和检查重复项。

### 遇到最大深度错误怎么办？

如果您收到错误："the check request has exceeded the allowable maximum depth of 50: this usually indicates a recursive or too deep data dependency."

使用 `zed --explain` 和检查参数运行：

```bash
zed permission check resource:someresource view user:someuser --explain
```

这将显示问题是涉及递归还是仅仅是深度过大的树：

```
1:36PM INF debugging requested on check
! resource:someresource viewer (4.084125ms)
  ! group:firstgroup member (3.445417ms)
    ! group:secondgroup member (3.338708ms)
      ! group:thirdgroup member (3.260125ms)
        ! group:firstgroup member (cycle) (3.194125ms)
```

### 为什么存在递归时我的检查仍然成功了？

SpiceDB 在找到目标主体时会短路 `CheckPermission`。如果在达到最大深度之前找到了主体，操作将成功完成。但是，如果未找到主体，SpiceDB 会继续遍历并最终返回深度错误。

### 写入关系时检查递归

使用 `CheckPermission` API 来检查主体是否包含资源。例如，在写入 `group:someparent#member@group:somechild#member` 之前，检查 `group:somechild#member@group:someparent#member`。如果父级对子级拥有权限，则添加该关系将创建递归。
