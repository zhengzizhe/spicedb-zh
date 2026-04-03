# 关系与权限

## 关系（Relationship）

关系是 SpiceDB 中的核心数据，表示"谁和什么资源有什么联系"。

### 关系的格式

```
<资源类型>:<资源ID>#<关系名>@<主体类型>:<主体ID>
```

例如：

```
document:readme#viewer@user:alice
// alice 是 readme 文档的 viewer

folder:projects#parent@organization:acme
// acme 组织是 projects 文件夹的 parent
```

### 写入关系

使用 zed CLI：

```bash
zed relationship create document:readme viewer user:alice
```

使用 gRPC API（Go 示例）：

```go
client.WriteRelationships(ctx, &v1.WriteRelationshipsRequest{
    Updates: []*v1.RelationshipUpdate{
        {
            Operation: v1.RelationshipUpdate_OPERATION_CREATE,
            Relationship: &v1.Relationship{
                Resource: &v1.ObjectReference{
                    ObjectType: "document",
                    ObjectId:   "readme",
                },
                Relation: "viewer",
                Subject: &v1.SubjectReference{
                    Object: &v1.ObjectReference{
                        ObjectType: "user",
                        ObjectId:   "alice",
                    },
                },
            },
        },
    },
})
```

### 删除关系

```bash
zed relationship delete document:readme viewer user:alice
```

### 查询关系

```bash
# 查看某个资源的所有关系
zed relationship read document:readme

# 查看某个用户的所有关系
zed relationship read --subject-filter user:alice
```

## 权限检查

### 基本检查

```bash
zed permission check document:readme view user:alice
```

返回结果：
- `true` — 有权限
- `false` — 无权限

### API 调用（Go 示例）

```go
resp, err := client.CheckPermission(ctx, &v1.CheckPermissionRequest{
    Resource: &v1.ObjectReference{
        ObjectType: "document",
        ObjectId:   "readme",
    },
    Permission: "view",
    Subject: &v1.SubjectReference{
        Object: &v1.ObjectReference{
            ObjectType: "user",
            ObjectId:   "alice",
        },
    },
})

if resp.Permissionship == v1.CheckPermissionResponse_PERMISSIONSHIP_HAS_PERMISSION {
    // 有权限
}
```

## ZedToken 与一致性

SpiceDB 通过 ZedToken 提供一致性保证。每次写入操作都会返回一个 ZedToken，后续的权限检查可以使用它来确保读到最新数据。

```go
// 写入后获取 token
writeResp, _ := client.WriteRelationships(ctx, req)
token := writeResp.WrittenAt

// 使用 token 进行一致性检查
checkResp, _ := client.CheckPermission(ctx, &v1.CheckPermissionRequest{
    Consistency: &v1.Consistency{
        Requirement: &v1.Consistency_AtLeastAsFresh{
            AtLeastAsFresh: token,
        },
    },
    // ... 其他字段
})
```

## 下一步

- [API 接口](/concepts/api) — 完整的 API 说明
- [RBAC 权限模型](/tutorials/rbac) — 实战教程
