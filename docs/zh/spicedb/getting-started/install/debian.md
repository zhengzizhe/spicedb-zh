::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/install/debian)  
English: [View English version](/en/spicedb/getting-started/install/debian)
:::

# 在 Ubuntu 或 Debian 上安装 SpiceDB

本文档介绍如何在运行 Debian 系列 Linux 发行版的系统上安装 SpiceDB。

SpiceDB 发布 `.deb` 包、snap 包以及适用于 AMD64 和 ARM64 架构的 tarball。如需安装 `.rpm` 包，请参阅 [RHEL/CentOS 指南](/zh/spicedb/getting-started/install/rhel)。

## 使用 APT 安装 SpiceDB

首先，下载仓库的公共签名密钥：

```bash
curl -sS https://pkg.authzed.com/apt/gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/authzed.gpg
```

然后配置仓库源：

```bash
echo "deb [signed-by=/etc/apt/keyrings/authzed.gpg] https://pkg.authzed.com/apt/ * *" | sudo tee /etc/apt/sources.list.d/authzed.list
sudo chmod 644 /etc/apt/sources.list.d/authzed.list
```

或者，使用较新的 deb822 格式，添加到 `/etc/apt/sources.list.d/authzed.sources`：

```
Types: deb
URIs: https://pkg.authzed.com/apt/
Suites: *
Components: *
Signed-By: /etc/apt/keyrings/authzed.gpg
```

最后，安装软件包：

```bash
sudo apt update
sudo apt install -y spicedb
```

## 使用 Snap 安装 SpiceDB

SpiceDB 可通过 Snap 商店获取：

```bash
sudo snap install spicedb
```

## 手动安装 Linux 版 SpiceDB 二进制文件

自动下载最新版本：

```bash
curl https://api.github.com/repos/authzed/spicedb/releases | \
  jq --arg platform $(uname | tr '[:upper:]' '[:lower:]') \
     --arg arch $(uname -m) \
     '.[0].assets.[] | select (.name | contains($platform+"_"+$arch)) | .browser_download_url' -r | \
  xargs curl -LO
```

解压归档文件并决定将其内容放置在系统的何处。

::: info
如果您不打算在系统范围内安装 SpiceDB，建议遵循 [XDG 基础目录规范](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)。
:::
