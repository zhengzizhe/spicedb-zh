# Google Docs 权限模型

Google Docs 的共享模型是 Zanzibar 论文中的经典案例。本教程展示如何用 SpiceDB 实现类似的权限系统。

## 需求

- 文档可以放在文件夹中
- 文件夹的权限会被文件夹内的文档继承
- 文档可以单独共享给个人或团队
- 支持"知道链接的人可查看"的公开共享

## Schema

```zed
definition user {}

definition team {
    relation member: user
    relation admin: user

    permission membership = member + admin
}

definition folder {
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member

    permission edit = owner + editor
    permission view = edit + viewer
}

definition document {
    relation parent: folder
    relation owner: user
    relation editor: user | team#member
    relation viewer: user | team#member
    relation public_viewer: user:*

    // 编辑权限：文档编辑者 + 文件夹编辑者
    permission edit = owner + editor + parent->edit

    // 查看权限：所有编辑者 + 查看者 + 文件夹查看者 + 公开查看
    permission view = edit + viewer + parent->view + public_viewer

    // 只有 owner 可以分享和删除
    permission share = owner
    permission delete = owner + parent->edit
}
```

## 模拟场景

### 1. 创建团队

```bash
zed relationship create team:engineering member user:alice
zed relationship create team:engineering member user:bob
zed relationship create team:engineering admin user:charlie
```

### 2. 创建文件夹结构

```bash
# charlie 拥有项目文件夹
zed relationship create folder:project-x owner user:charlie

# 工程团队可以编辑
zed relationship create folder:project-x editor team:engineering#member
```

### 3. 创建文档

```bash
# 设计文档 — alice 拥有，放在 project-x 文件夹下
zed relationship create document:design-doc owner user:alice
zed relationship create document:design-doc parent folder:project-x

# 会议纪要 — bob 拥有，单独共享给 dave
zed relationship create document:meeting-notes owner user:bob
zed relationship create document:meeting-notes viewer user:dave

# 公开文档 — 所有人可查看
zed relationship create document:public-faq owner user:charlie
zed relationship create document:public-faq public_viewer user:*
```

### 4. 验证权限

```bash
# alice 拥有设计文档 ✅
zed permission check document:design-doc edit user:alice

# bob 是 engineering 成员，通过文件夹继承获得编辑权 ✅
zed permission check document:design-doc edit user:bob

# dave 没有相关关系 ❌
zed permission check document:design-doc view user:dave

# dave 可以查看会议纪要（被单独共享）✅
zed permission check document:meeting-notes view user:dave

# 任何用户都可以查看公开文档 ✅
zed permission check document:public-faq view user:anyone
```

## 关键设计点

### 权限继承

通过 `parent->view` 实现文件夹到文档的权限继承，无需手动复制权限。

### 团队共享

`user | team#member` 语法允许关系指向团队成员，实现"共享给整个团队"。

### 公开共享

`user:*` 通配符表示所有用户，实现"知道链接的人可查看"。

## 与实际 Google Docs 的对比

| 功能 | Google Docs | 本示例 |
|------|------------|--------|
| 所有者 | ✅ | ✅ `owner` |
| 编辑者 | ✅ | ✅ `editor` |
| 查看者 | ✅ | ✅ `viewer` |
| 评论者 | ✅ | 可扩展 |
| 文件夹继承 | ✅ | ✅ `parent->` |
| 链接共享 | ✅ | ✅ `user:*` |
| 域内共享 | ✅ | 可通过 `organization` 扩展 |

## 总结

这个示例展示了 SpiceDB 最强大的特性：

1. **声明式权限继承** — 不需要递归查询
2. **灵活的主体类型** — 用户、团队、通配符
3. **组合式权限计算** — 多来源权限自动合并

这正是 Google 设计 Zanzibar 的初衷。
