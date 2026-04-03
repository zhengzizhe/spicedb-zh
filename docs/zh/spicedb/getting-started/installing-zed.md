::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/installing-zed)  
English: [View English version](/en/spicedb/getting-started/installing-zed)
:::

# 安装 Zed

Zed 是用于与 SpiceDB 交互的命令行工具（CLI）。它以独立可执行文件的形式分发，在不同操作系统和平台上有多种推荐的安装方式。

## 安装方式

### Debian/Ubuntu Linux

Debian 系列系统的用户可以添加 AuthZed 的 apt 仓库：

1. 下载公共签名密钥：

```bash
curl -sS https://pkg.authzed.com/apt/gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/authzed.gpg
```

2. 添加仓库源并安装：

```bash
echo "deb [signed-by=/etc/apt/keyrings/authzed.gpg] https://pkg.authzed.com/apt/ * *" | sudo tee /etc/apt/sources.list.d/authzed.list
sudo apt update
sudo apt install -y zed
```

### 基于 RPM 的 Linux (RHEL/CentOS)

RPM 用户可以配置 yum 仓库并安装：

```bash
sudo cat << EOF >> /etc/yum.repos.d/Authzed-Fury.repo
[authzed-fury]
name=AuthZed Fury Repository
baseurl=https://pkg.authzed.com/yum/
enabled=1
gpgcheck=0
EOF

sudo dnf install -y zed
```

### macOS (Homebrew)

macOS 用户可以通过添加 Homebrew tap 来安装：

```bash
brew install authzed/tap/zed
```

### Docker

容器镜像支持 AMD64 和 ARM64 架构，在三个注册表中可用：

- `authzed/zed`（Docker Hub）
- `ghcr.io/authzed/zed`（GitHub）
- `quay.io/authzed/zed`（Quay）

```bash
docker pull authzed/zed
docker run --rm authzed/zed version
```

### 二进制下载

访问 [GitHub 发布页面](https://github.com/authzed/zed/releases/latest)，下载适合您系统架构的文件。

### 从源码构建

使用 Go 克隆并构建：

```bash
git clone git@github.com:authzed/zed.git
cd zed
go build ./cmd/zed
```

## 命令参考

### 上下文管理

Zed 使用上下文来管理多个 SpiceDB 部署配置：

```bash
zed context set dev localhost:80 testpresharedkey --insecure
zed context set prod grpc.authzed.com:443 tc_zed_my_laptop_deadbeefdeadbeef
zed context use dev
zed context list
```

### 权限检查

核心功能包括权限验证和展开：

```bash
zed permission check document:firstdoc writer user:emilia
zed permission expand writer document:firstdoc
zed permission lookup-resources document view user:emilia
```

### 关系管理

用于查询和修改关系的命令：

```bash
zed relationship create document:budget view user:anne
zed relationship read document:%
zed relationship delete document:budget view user:anne
zed relationship watch --filter document:finance
```

### 模式操作

```bash
zed schema read
zed schema write schema.zed
zed schema copy dev prod
zed schema diff before.zed after.zed
```

### 备份与恢复

```bash
zed backup create backup.yaml
zed backup restore backup.yaml
zed backup parse-schema backup.yaml
```

## 全局选项

所有命令都支持以下连接配置选项：

| 选项 | 说明 |
|------|------|
| `--endpoint` | SpiceDB gRPC API 端点 |
| `--token` | 认证令牌 |
| `--insecure` | 明文连接模式 |
| `--certificate-path` | 用于验证的 CA 证书 |
| `--max-retries` | 顺序重试次数（默认：10） |
| `--log-level` | 日志详细级别（trace、debug、info、warn、error） |
| `--permissions-system` | 目标权限系统 |

## 附加功能

CLI 包含实验性的 MCP（模型上下文协议）支持，可通过 `zed mcp experimental-run` 使用，还提供验证工具、支持导入的模式编译，以及关系的批量操作功能。
