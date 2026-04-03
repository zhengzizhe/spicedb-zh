::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/protecting-a-blog)  
English: [View English version](/en/spicedb/getting-started/protecting-a-blog)
:::

# 保护博客应用

本指南以博客应用为例，介绍如何将应用程序与 SpiceDB 集成。提供了跨多种编程语言的独立代码片段，展示了集成要点。

## 前提条件

您需要以下之一：

- 一个 [Authzed Cloud](https://authzed.com) 权限系统
- 一个正在运行的已配置预共享密钥的 SpiceDB 实例

本地 SpiceDB 设置：

```bash
# 使用二进制文件
spicedb serve --grpc-preshared-key "t_your_token_here_1234567deadbeef"

# 使用 Docker
docker run --rm -p 50051:50051 authzed/spicedb serve \
  --grpc-preshared-key "t_your_token_here_1234567deadbeef"
```

## 安装客户端

::: code-group

```bash [zed]
brew install authzed/tap/zed
zed context set <name> <endpoint> <token>
```

```bash [Node.js]
npm i @authzed/authzed-node
```

```bash [Go]
mkdir first_app && cd first_app
go mod init first_app
go get github.com/authzed/authzed-go
go get github.com/authzed/grpcutil
go mod tidy
```

```bash [Python]
pip install authzed
```

```bash [Ruby]
gem install authzed
```

```groovy [Java (build.gradle)]
dependencies {
  implementation "com.authzed.api:authzed:0.6.0"
  implementation 'io.grpc:grpc-protobuf:1.54.1'
  implementation 'io.grpc:grpc-stub:1.54.1'
}
```

:::

## 编写模式

模式定义了对象、它们的关系以及可检查的权限。下面是一个建模博客的示例模式：

```txt
definition user {}

definition post {
  relation reader: user
  relation writer: user

  permission read = reader + writer
  permission write = writer
}
```

此模式定义了：

- 两种对象类型：`user` 和 `post`
- 帖子上的两种关系：`reader` 和 `writer`
- 两种权限：`read`（读者和写者的并集）和 `write`（仅限写者）

### 通过 zed 写入模式

```bash
zed schema write <(cat << EOF
definition user {}

definition post {
  relation reader: user
  relation writer: user

  permission read = reader + writer
  permission write = writer
}
EOF
)
```

每个客户端库都提供 `WriteSchemaRequest` 来以编程方式写入模式。使用您的端点和令牌实例化客户端，使用模式字符串创建请求，然后调用 `WriteSchema` 方法。

## 写入关系

关系是对象之间关系的实时实例。它们在运行时启用动态访问控制。

示例：将 Emilia 设为帖子 1 的写者，将 Beatrice 设为帖子 1 的读者。

```bash
zed relationship create post:1 writer user:emilia
zed relationship create post:1 reader user:beatrice
```

每个客户端库都提供 `WriteRelationshipsRequest`，其中包含 `RelationshipUpdate` 对象，指定操作（`OPERATION_CREATE`）、资源、关系和主体。

::: warning
`WriteRelationships` 返回一个 `ZedToken`，它对于确保性能和一致性至关重要。请保存并在后续读取中使用它。
:::

## 检查权限

权限检查同时测试直接和传递关系。例如，写者隐式地拥有读取权限以及写入权限。

```bash
zed permission check post:1 read user:emilia      # true（有权限）
zed permission check post:1 write user:emilia     # true（有权限）
zed permission check post:1 read user:beatrice    # true（有权限）
zed permission check post:1 write user:beatrice   # false（无权限）
```

每个客户端库都提供 `CheckPermissionRequest`，包含资源、权限和主体引用。响应包含一个 `permissionship` 值，指示权限是否被授予。

## 重要说明

- 对于没有 TLS 的本地开发，请使用 `INSECURE_PLAINTEXT_CREDENTIALS` 或您所用语言的等效配置
- 在部署到生产环境之前，务必使用安全凭据
- 建议检查**权限**而非直接关系检查——权限提供更好的契约，并支持向后兼容的模式变更
- 对于写后读一致性，请提供来自 `WriteRelationships` 响应的 `ZedToken`，或请求完全一致性
