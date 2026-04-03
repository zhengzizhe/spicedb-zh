::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/api/http-api)
English: [View English version](/en/spicedb/api/http-api)
:::

# HTTP API 文档

SpiceDB 提供了基于 [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway) 构建的 HTTP API。grpc-gateway 将 Authzed API 的 protobuf 定义转换为 JSON 接口，并提供一个反向代理来响应 HTTP 请求。

虽然官方推荐使用[客户端库](/zh/spicedb/getting-started/client-libraries)以获得更好的性能，但 HTTP API 是上手 SpiceDB 并探索其功能的有效方式。

## 启用 HTTP API

HTTP API 默认未启用。要在启动 SpiceDB 时启用 HTTP API，请使用 `--http-enabled` 标志：

```shell
spicedb serve --grpc-preshared-key "secrettoken" --http-enabled
```

此命令使用指定的预共享密钥启动 SpiceDB 进行身份认证，并启用 HTTP API 服务器。

### HTTP 服务器配置选项

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--http-enabled` | 启用 HTTP 代理服务器 | `false` |
| `--http-addr string` | HTTP 代理监听地址 | `:8443` |
| `--http-tls-cert-path string` | 用于 HTTP 代理的 TLS 证书本地路径 | |
| `--http-tls-key-path string` | 用于 HTTP 代理的 TLS 密钥本地路径 | |

#### 只读 HTTP 服务器

SpiceDB 还支持只读 HTTP 服务器，用于处理只读请求：

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--readonly-http-enabled` | 启用只读 HTTP 服务器 | `false` |
| `--readonly-http-addr string` | 只读 HTTP 服务器监听地址 | `:8444` |
| `--readonly-http-tls-cert-path string` | 用于只读 HTTP 服务器的 TLS 证书本地路径 | |
| `--readonly-http-tls-key-path string` | 用于只读 HTTP 服务器的 TLS 密钥本地路径 | |

### 默认行为

使用 `--http-enabled` 启动时：

- HTTP API 服务器默认监听端口 **8443**
- 除非配置了 TLS，否则 gRPC 和 HTTP 服务器之间通过**明文**通信
- 如果使用内存数据存储，数据不会在 SpiceDB 进程结束后持久化

## OpenAPI 规范

API 代理会同时生成 OpenAPI 规范。您可以从运行中的 SpiceDB 实例获取 OpenAPI JSON：

```shell
curl http://localhost:8443/openapi.json
```

您可以使用标准工具（如 [Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/authzed/authzed-go/main/proto/apidocs.swagger.json)）来浏览 API 规范。

OpenAPI 规范还可以用于通过 [openapi-ts](https://github.com/hey-api/openapi-ts) 或 [openapi-python-client](https://github.com/openapi-generators/openapi-python-client) 等工具生成 HTTP 客户端。

## 发起 API 调用

所有 API 调用均使用 `POST` 方法，并需要：

- `Content-Type: application/json` 请求头
- `Authorization: Bearer <预共享密钥>` 请求头
- JSON 格式的请求体

### 示例：读取 Schema

```shell
curl -X POST http://localhost:8443/v1/schema/read \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer secrettoken' \
  -d '{}'
```

## API 端点

### 权限服务（Permissions Service）

| 方法 | 路径 | 操作 | 描述 |
|------|------|------|------|
| POST | `/v1/permissions/check` | CheckPermission | 判断某个主体是否对资源拥有权限或是否为关系的成员 |
| POST | `/v1/permissions/checkbulk` | CheckBulkPermissions | 在单个请求中评估多个权限检查并返回结果 |
| POST | `/v1/permissions/expand` | ExpandPermissionTree | 展示资源的权限或关系的图结构 |
| POST | `/v1/permissions/resources` | LookupResources | 返回某个主体可以访问的所有指定类型的资源 |
| POST | `/v1/permissions/subjects` | LookupSubjects | 返回对某个资源拥有访问权限的所有指定类型的主体 |

### 关系服务（Relationships Service）

| 方法 | 路径 | 操作 | 描述 |
|------|------|------|------|
| POST | `/v1/relationships/read` | ReadRelationships | 读取匹配一个或多个过滤条件的关系 |
| POST | `/v1/relationships/write` | WriteRelationships | 原子性地写入和/或删除指定的关系 |
| POST | `/v1/relationships/delete` | DeleteRelationships | 原子性地批量删除匹配过滤条件的关系 |
| POST | `/v1/relationships/exportbulk` | ExportBulkRelationships | 从服务器导出关系的最快路径 |
| POST | `/v1/relationships/importbulk` | ImportBulkRelationships | 写入大批量关系的高性能路径 |

### Schema 服务（Schema Service）

| 方法 | 路径 | 操作 | 描述 |
|------|------|------|------|
| POST | `/v1/schema/read` | ReadSchema | 返回权限系统的当前对象定义 |
| POST | `/v1/schema/write` | WriteSchema | 覆盖权限系统的当前对象定义 |
| POST | `/v1/schema/diffschema` | DiffSchema | 返回指定 schema 与当前 schema 之间的差异 |
| POST | `/v1/schema/reflectschema` | ReflectSchema | 以结构化形式反映当前 schema，供客户端工具使用 |
| POST | `/v1/schema/permissions/computable` | ComputablePermissions | 返回可从给定关系计算的权限 |
| POST | `/v1/schema/permissions/dependent` | DependentRelations | 返回计算给定权限所依赖的关系/权限 |

### 监视服务（Watch Service）

| 方法 | 路径 | 操作 | 描述 |
|------|------|------|------|
| POST | `/v1/watch` | Watch | 按时间戳升序流式传输事件（关系更新、schema 更新、检查点） |

### 实验性服务（Experimental Service）

| 方法 | 路径 | 操作 | 描述 |
|------|------|------|------|
| POST | `/v1/experimental/countrelationships` | ExperimentalCountRelationships | 返回预注册过滤器的关系计数 |
| POST | `/v1/experimental/registerrelationshipcounter` | ExperimentalRegisterRelationshipCounter | 注册用于计数关系的过滤器 |
| POST | `/v1/experimental/unregisterrelationshipcounter` | ExperimentalUnregisterRelationshipCounter | 取消注册用于计数关系的过滤器 |

::: warning 已弃用的端点
以下实验性端点已被弃用，请改用上述稳定版本：

- `/v1/experimental/diffschema` - 请使用 `/v1/schema/diffschema`
- `/v1/experimental/reflectschema` - 请使用 `/v1/schema/reflectschema`
- `/v1/experimental/permissions/bulkcheckpermission` - 请使用 `/v1/permissions/checkbulk`
- `/v1/experimental/permissions/computable` - 请使用 `/v1/schema/permissions/computable`
- `/v1/experimental/permissions/dependent` - 请使用 `/v1/schema/permissions/dependent`
- `/v1/experimental/relationships/bulkexport` - 请使用 `/v1/relationships/exportbulk`
- `/v1/experimental/relationships/bulkimport` - 请使用 `/v1/relationships/importbulk`
:::

## 推荐的 API 测试顺序

首次探索 SpiceDB API 时，建议按以下顺序执行操作：

1. **Schema Write（写入 Schema）** - 写入示例 schema
2. **Schema Read（读取 Schema）** - 查看示例 schema
3. **Relationships Write（写入关系）** - 写入示例关系
4. **Relationships Read（读取关系）** - 查看示例关系
5. **Permissions Check（权限检查）** - 检查用户的计算权限
6. **Permissions Expand（权限展开）** - 查看示例文档的展开关系
7. **Lookup Resources（查找资源）** - 列出用户具有查看权限的文档
8. **Relationships Delete（删除关系）** - 删除匹配前提条件的关系

## 使用 Postman

可以使用 [Postman 集合](https://www.postman.com/authzed/authzed/collection/mosxle2/authzed-api)来探索所有 API 操作。该集合包含 Schema 和 Permissions 文件夹，其中预填了示例请求体。

::: warning
请记得将 Postman 中的 Bearer Token 值替换为启动 SpiceDB 时使用的预共享密钥。
:::

## 其他资源

- [gRPC API 参考](https://buf.build/authzed/api/docs/main:authzed.api.v1)
- [官方客户端库](/zh/spicedb/getting-started/client-libraries)
- [SpiceDB 命令与参数](/zh/spicedb/concepts/commands)
