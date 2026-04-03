# API 接口

SpiceDB 提供 gRPC 和 HTTP API，支持多种语言的客户端 SDK。

## 客户端 SDK

| 语言 | 包名 | 安装 |
|------|------|------|
| Go | [authzed-go](https://github.com/authzed/authzed-go) | `go get github.com/authzed/authzed-go` |
| Python | [authzed-py](https://github.com/authzed/authzed-py) | `pip install authzed` |
| Node.js | [authzed-node](https://github.com/authzed/authzed-node) | `npm install @authzed/authzed-node` |
| Java | [authzed-java](https://github.com/authzed/authzed-java) | Maven/Gradle |
| Ruby | [authzed-rb](https://github.com/authzed/authzed-rb) | `gem install authzed` |

## 核心 API

### SchemaService

管理权限模型的 Schema。

```bash
# 写入 Schema
zed schema write schema.zed

# 读取当前 Schema
zed schema read
```

### PermissionsService

权限检查相关操作。

#### CheckPermission — 检查权限

```bash
zed permission check <resource> <permission> <subject>
```

#### LookupResources — 查找用户可访问的资源

```bash
# 查找 alice 可以 view 的所有 document
zed permission lookup-resources document view user:alice
```

#### LookupSubjects — 查找拥有权限的用户

```bash
# 查找谁可以 edit document:readme
zed permission lookup-subjects document:readme edit user
```

#### ExpandPermissionTree — 展开权限树

用于调试，查看权限是如何计算出来的。

### RelationshipService（实验性）

直接读写关系数据。

```bash
# 写入关系
zed relationship create <resource> <relation> <subject>

# 读取关系
zed relationship read <resource_type>:<resource_id>

# 删除关系
zed relationship delete <resource> <relation> <subject>
```

## HTTP API

SpiceDB 也通过 HTTP Gateway 提供 REST 风格的 API：

```bash
curl -X POST http://localhost:8443/v1/permissions/check \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": {
      "objectType": "document",
      "objectId": "readme"
    },
    "permission": "view",
    "subject": {
      "object": {
        "objectType": "user",
        "objectId": "alice"
      }
    }
  }'
```

## Playground

在编写 Schema 之前，可以使用在线 Playground 进行测试：

[play.authzed.com](https://play.authzed.com)

## 下一步

- [编写第一个 Schema](/tutorials/first-schema) — 实战练习
- [RBAC 教程](/tutorials/rbac) — 常见权限模型
