::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/modeling/access-control-management)
English: [View English version](/en/spicedb/modeling/access-control-management)
:::

# 访问控制管理

本页说明如何在应用程序中实现访问控制管理界面，允许特权用户使用 SpiceDB API 来可视化和修改其他用户的权限。

## 资源级访问控制管理

在构建用于管理用户资源访问权限的 UI 工具时，常见功能包括：

- 列出所有已分配角色的用户
- 列出用户可能拥有的细粒度权限

## 粗粒度访问控制

粗粒度访问控制使用传统的基于角色的访问控制（类似 GitHub 的模型），其中角色通过资源分配给用户。

### Schema 示例

```txt
definition user {}

definition team {
  relation member: user
}

definition repository {
  relation role_reader: user | team#member
  relation role_writer: user | team#member
  relation role_adminer: user | team#member

  permission read = role_reader + write
  permission write = role_writer + admin
  permission admin = role_adminer
}
```

### 实现方式

使用 `ReadRelationships` API。对于有限的角色集合，逐个查询每个角色：

```bash
zed relationship read repository:kubernetes role_reader
zed relationship read repository:kubernetes role_writer
zed relationship read repository:kubernetes role_adminer
```

### 动态角色发现

无需硬编码角色，可以使用 `ExperimentalReflectSchema` 配合 Schema 过滤器来动态发现可用的关系：

- 设置 `optional_definition_name_filter` 为 `repository`
- 设置 `optional_relation_name_filter` 为 `role_`

这将返回所有匹配的角色关系，然后为每个返回的角色发起 `ReadRelationships` 请求。

## 细粒度访问控制

细粒度访问控制实现了自定义角色模型，其中每个角色的各项权限都可以单独定制，而不是使用预定义的角色。

### Schema 示例

```txt
definition user {}

definition repository {
  relation grants: role_grant

  permission create_issue = grants->create_issue
}

definition role_grant {
  relation role: role
  relation grantee: user | team#user

  permission create_issue = role->create_issue & grantee
  permission delete_issue = role->delete_issue & grantee
}

definition role {
  relation create_issue: user:*
  relation delete_issue: user:*
}
```

### 实现方式

查询资源的角色授权：

```bash
# 返回 kubernetes 仓库的角色授权
zed relationship read repository:kubernetes grants
```

要列出单个权限而非角色：

```bash
# 返回该授权的角色
zed relationship read role_grant:my_role_grant role

# 返回角色的细粒度权限
zed relationship read role:my_role
```

每个列表项的资源关系代表了该角色的所有细粒度权限。
