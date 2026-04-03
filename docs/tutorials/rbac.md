# RBAC 权限模型

基于角色的访问控制（RBAC）是最常见的权限模型。本教程展示如何用 SpiceDB 实现一个完整的 RBAC 系统。

## 场景

一个企业管理系统：

- **组织**下有多个**项目**
- 组织有管理员和成员
- 项目有管理员、编辑者和查看者
- 组织管理员自动拥有所有项目的管理权限

## Schema 设计

```zed
definition user {}

definition role {
    relation member: user
}

definition organization {
    relation admin: user
    relation member: user

    permission manage = admin
    permission access = admin + member
}

definition project {
    relation org: organization
    relation admin: user
    relation editor: user
    relation viewer: user

    // 组织管理员自动成为项目管理员
    permission manage = admin + org->manage

    // 管理员和编辑者可以编辑
    permission edit = manage + editor

    // 所有角色 + 组织成员都可以查看
    permission view = edit + viewer + org->access
}

definition resource {
    relation project: project
    relation owner: user

    permission edit = owner + project->edit
    permission view = owner + project->view
    permission delete = owner + project->manage
}
```

## 创建测试场景

```bash
# 1. 设置组织
zed relationship create organization:acme admin user:ceo
zed relationship create organization:acme member user:dev-a
zed relationship create organization:acme member user:dev-b

# 2. 创建项目，关联到组织
zed relationship create project:backend org organization:acme
zed relationship create project:backend admin user:tech-lead
zed relationship create project:backend editor user:dev-a
zed relationship create project:backend viewer user:dev-b

# 3. 创建资源
zed relationship create resource:api-spec project project:backend
zed relationship create resource:api-spec owner user:dev-a
```

## 权限验证

```bash
# CEO 是组织管理员，可以管理项目 ✅
zed permission check project:backend manage user:ceo

# tech-lead 是项目管理员 ✅
zed permission check project:backend manage user:tech-lead

# dev-a 是编辑者，可以编辑但不能管理
zed permission check project:backend edit user:dev-a     # ✅
zed permission check project:backend manage user:dev-a   # ❌

# dev-b 是查看者，只能查看
zed permission check project:backend view user:dev-b     # ✅
zed permission check project:backend edit user:dev-b     # ❌

# dev-a 拥有 api-spec，可以编辑和删除
zed permission check resource:api-spec edit user:dev-a   # ✅
zed permission check resource:api-spec delete user:dev-a # ❌（不是项目管理员）
```

## 优势

相比硬编码 RBAC，SpiceDB 方案的优势：

1. **权限逻辑集中管理**：不散落在各个微服务中
2. **层级自动继承**：组织管理员自动拥有项目权限
3. **灵活可扩展**：新增角色只需修改 Schema
4. **可审计**：所有关系数据可查询、可追溯

## 下一步

- [Google Docs 权限模型](/tutorials/google-docs) — 更复杂的共享模型
