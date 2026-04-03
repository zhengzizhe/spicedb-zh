::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/client-libraries)  
English: [View English version](/en/spicedb/getting-started/client-libraries)
:::

# 官方客户端库

SpiceDB 主要通过 gRPC API 进行访问，这使得可以为任何编程语言生成客户端库。

## 官方维护的库

AuthZed 为以下语言构建并维护 gRPC 客户端库：

- **Go** — [authzed-go](https://github.com/authzed/authzed-go)
- **Node.js** — [authzed-node](https://github.com/authzed/authzed-node)
- **Python** — [authzed-py](https://github.com/authzed/authzed-py)
- **Ruby** — [authzed-rb](https://github.com/authzed/authzed-rb)
- **Java** — [authzed-java](https://github.com/authzed/authzed-java)
- **.NET** — [authzed-dotnet](https://github.com/authzed/authzed-dotnet)

这些库是从 [API 仓库](https://github.com/authzed/api)中的 protobuf 定义生成的，主要文档可通过 [buf 文档](https://buf.build/authzed/api/docs/main)获取。

## 本地开发配置

### 无 TLS（最常见）

在 localhost、Docker、OrbStack 和其他没有 TLS 的本地环境中使用不安全的明文凭据：

| 语言 | 配置 |
|------|------|
| Node.js | `v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS` |
| Go | `grpcutil.WithInsecureBearerToken()` 和 `grpc.WithTransportCredentials(insecure.NewCredentials())` |
| Python | `insecure_bearer_token_credentials()` |
| Ruby | `credentials: :this_channel_is_insecure` |
| Java | `.usePlaintext()` |
| .NET | `ChannelCredentials.Insecure` 配合 `UnsafeUseInsecureChannelCallCredentials = true` |

### 使用自签名 TLS 证书

- **Node.js**：使用 `v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED` 允许 localhost 连接而无需 CA 验证。
- **Go**：使用 `grpcutil.WithCustomCerts()` 显式加载自签名 CA，或仅在 localhost 使用 `InsecureSkipVerify`（不建议在生产环境中使用）。

## HTTP 客户端

SpiceDB 在使用 `--http-enabled` 标志运行时会暴露 HTTP API。虽然 AuthZed 不官方维护 HTTP 客户端库，但提供了 OpenAPI 文档，可以使用 [openapi-ts](https://github.com/hey-api/openapi-ts) 或 [openapi-python-client](https://github.com/openapi-generators/openapi-python-client) 等工具将其转换为客户端。

## 其他资源

- **zed**：AuthZed 的[命令行客户端](/zh/spicedb/getting-started/installing-zed)，用于与 SpiceDB API 交互
- **社区客户端**：在 [Awesome SpiceDB](https://github.com/authzed/awesome-spicedb) 仓库的客户端部分发现更多语言和集成
