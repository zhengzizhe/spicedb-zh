::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/install/rhel)  
English: [View English version](/en/spicedb/getting-started/install/rhel)
:::

# 在 RHEL 或 CentOS 上安装 SpiceDB

本文档介绍如何在运行基于 RPM 的 Linux 发行版的系统上安装 SpiceDB。

每个 SpiceDB 版本都会发布适用于 AMD64 和 ARM64 Linux 架构的 `.rpm` 包和 tarball。如果是 Debian/Ubuntu 系统，请参阅 [Ubuntu/Debian 安装指南](/zh/spicedb/getting-started/install/debian)。

## 使用 dnf 安装 SpiceDB

首先，添加官方 SpiceDB RPM 仓库：

```sh
sudo cat << EOF >> /etc/yum.repos.d/authzed.repo
[authzed]
name=AuthZed Fury Repository
baseurl=https://pkg.authzed.com/yum/
enabled=1
gpgcheck=0
EOF
```

然后安装 SpiceDB 和 zed（命令行工具）：

```sh
sudo dnf install -y spicedb zed
```

## 手动安装 Linux 版 SpiceDB 二进制文件

对于手动安装，使用以下命令下载适合您平台和架构的最新版本：

```sh
curl https://api.github.com/repos/authzed/spicedb/releases | \
  jq --arg platform $(uname | tr '[:upper:]' '[:lower:]') \
     --arg arch $(uname -m) \
     '.[0].assets.[] | select (.name | contains($platform+"_"+$arch)) | .browser_download_url' -r | \
  xargs curl -LO
```

下载后，解压归档文件并将内容放置在您的系统上。

::: info
如果您不打算在系统范围内安装 SpiceDB，建议遵循 [XDG 基础目录规范](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)。
:::
