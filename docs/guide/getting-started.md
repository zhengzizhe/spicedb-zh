# 快速开始

本指南将帮助你在 5 分钟内启动 SpiceDB 并完成第一次权限检查。

## 前置要求

- Docker（推荐）或 Go 1.20+
- [zed CLI 工具](https://github.com/authzed/zed)（SpiceDB 的命令行客户端）

## 启动 SpiceDB

使用 Docker 快速启动一个 SpiceDB 实例：

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "somerandomkeyhere"
```

## 安装 zed CLI

```bash
# macOS
brew install authzed/tap/zed

# Linux
curl https://cmd.authzed.com | sh

# Go
go install github.com/authzed/zed@latest
```

配置 zed 连接到本地 SpiceDB：

```bash
zed context set local localhost:50051 somerandomkeyhere --insecure
```

## 编写第一个 Schema

创建一个简单的文档权限模型：

```zed
definition user {}

definition document {
    relation viewer: user
    relation editor: user

    permission view = viewer + editor
    permission edit = editor
}
```

写入 Schema：

```bash
zed schema write <(cat <<'EOF'
definition user {}

definition document {
    relation viewer: user
    relation editor: user

    permission view = viewer + editor
    permission edit = editor
}
EOF
)
```

## 创建关系

```bash
# 让 user:alice 成为 document:readme 的 editor
zed relationship create document:readme editor user:alice

# 让 user:bob 成为 document:readme 的 viewer
zed relationship create document:readme viewer user:bob
```

## 检查权限

```bash
# alice 能编辑吗？✅ 可以
zed permission check document:readme edit user:alice

# bob 能查看吗？✅ 可以
zed permission check document:readme view user:bob

# bob 能编辑吗？❌ 不行
zed permission check document:readme edit user:bob
```

## 下一步

- [安装部署](/guide/installation) — 生产环境部署
- [Schema 语法](/concepts/schema) — 深入学习 Schema
- [编写第一个 Schema](/tutorials/first-schema) — 完整教程
