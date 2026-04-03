::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/install/docker)  
English: [View English version](/en/spicedb/getting-started/install/docker)
:::

# 使用 Docker 安装 SpiceDB

本文档介绍如何在运行 Docker 或类似容器运行时的系统上安装 SpiceDB。

## Docker 镜像注册表

每个 SpiceDB 版本都会将 AMD64 和 ARM64 镜像发布到多个公共注册表：

- [authzed/spicedb](https://hub.docker.com/r/authzed/spicedb)（Docker Hub）
- [ghcr.io/authzed/spicedb](https://github.com/authzed/spicedb/pkgs/container/spicedb)（GitHub）
- [quay.io/authzed/spicedb](https://quay.io/authzed/spicedb)（Quay）

::: info
虽然 Docker Hub 上的 SpiceDB 镜像已有数百万次下载，但对于生产使用，建议将 SpiceDB 镜像推送到您自己的注册表，以避免任何中断或速率限制影响您的部署。
:::

## 拉取最新的 SpiceDB Docker 镜像

您可以使用标准的 pull 命令安装最新版本的 SpiceDB：

```sh
docker pull authzed/spicedb:latest
```

::: warning
生产部署绝不应使用 `latest` 标签。请改用引用特定版本的标签。如需自动升级，请考虑部署 [SpiceDB Operator](/zh/spicedb/getting-started/install/kubernetes)。
:::

## 拉取最新的 SpiceDB 调试镜像

默认情况下，SpiceDB 镜像基于 Chainguard Images 构建，以保持最小化和安全。但是，这可能会使调试变得复杂，因为镜像中不包含任何工具。

如果您需要进入正在运行的 SpiceDB 容器执行用户会话并安装调试包，请使用调试镜像：

```sh
docker pull authzed/spicedb:latest-debug
```

每个 SpiceDB 版本都有对应的调试镜像。在任何版本标签后添加 `-debug` 即可拉取。
