::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/commands)
English: [View English version](/en/spicedb/concepts/commands)
:::

# 命令与参数

## 主命令：`spicedb`

SpiceDB 被描述为"一个存储和计算权限的数据库。"

### 全局选项

三个父级标志适用于所有命令：

| 标志 | 描述 |
|------|-------------|
| `--log-format` | 日志输出格式（`auto`、`console` 或 `json`） |
| `--log-level` | 日志详细程度（`trace`、`debug`、`info`、`warn`、`error`） |
| `--skip-release-check` | 禁用版本检查 |

## 子命令

### 数据存储操作（`spicedb datastore`）

四个专用命令管理数据库操作：

#### `spicedb datastore gc`

垃圾回收，移除过期的 relationship 和事务。

#### `spicedb datastore head`

计算最新可用的迁移版本。

#### `spicedb datastore migrate`

执行 Schema 迁移。接受 "head" 表示最新版本：

```bash
spicedb datastore migrate head \
  --datastore-engine $DESIRED_ENGINE \
  --datastore-conn-uri $CONNECTION_STRING
```

#### `spicedb datastore repair`

执行数据存储修复操作。

### 服务器命令

#### `spicedb serve`

启动主 SpiceDB 权限服务器，提供 gRPC、HTTP、数据存储、缓存和指标的丰富配置选项。

**使用内存数据存储的基本用法（仅限开发）：**

```bash
spicedb serve --grpc-preshared-key "somerandomkeyhere" --datastore-engine memory
```

**使用 PostgreSQL 和 TLS 的生产用法：**

```bash
spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --grpc-tls-cert-path /path/to/cert \
  --grpc-tls-key-path /path/to/key \
  --datastore-engine postgres \
  --datastore-conn-uri "postgres://user:password@localhost:5432/spicedb?sslmode=require"
```

`serve` 命令支持 100 多个配置选项，涵盖：

- 多种数据存储后端（Postgres、MySQL、CockroachDB、Spanner）
- TLS/加密设置
- 连接池参数
- 缓存管理
- 指标和可观测性
- 调度集群
- 速率限制和资源约束

#### `spicedb serve-testing`

隔离的内存测试服务器，支持每个令牌独立的数据存储。适用于集成测试。

### 实用命令

#### `spicedb lsp`

用于编辑器集成的语言服务器协议（LSP）实现，支持 SpiceDB Schema 文件。

#### `spicedb man`

生成系统 man 手册页以供安装使用。

#### `spicedb postgres-fdw`

实验性功能：Postgres 外部数据包装器代理。

#### `spicedb version`

显示 SpiceDB 版本信息。
