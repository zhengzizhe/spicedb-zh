::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/install/macos)  
English: [View English version](/en/spicedb/getting-started/install/macos)
:::

# 在 macOS 上安装 SpiceDB

本文档介绍如何在运行 Apple macOS 的系统上安装 SpiceDB。

每个 SpiceDB 版本都会发布 Intel (AMD64) 和 M 系列 (ARM64) 两个 macOS 版本。

## 使用 Homebrew 安装 SpiceDB

在 macOS 上开始使用 SpiceDB 最快的方式是使用 Homebrew。这将同时安装 zed 命令行工具和 SpiceDB 服务器二进制文件。

```sh
brew install authzed/tap/spicedb authzed/tap/zed
```

## 使用 Homebrew 更新 SpiceDB

如果您运行的是过时版本，SpiceDB 会记录一条警告。为确保使用最新的稳定版本，您可以运行以下命令来升级现有的 SpiceDB 安装：

```sh
brew upgrade authzed/tap/spicedb
```

## 手动安装 macOS 版 SpiceDB 二进制文件

手动安装 SpiceDB 的 macOS 用户可以使用以下命令下载适合其平台和架构的最新版本：

```sh
curl https://api.github.com/repos/authzed/spicedb/releases | \
  jq --arg platform $(uname | tr '[:upper:]' '[:lower:]') \
     --arg arch $(uname -m) \
     '.[0].assets.[] | select (.name | contains($platform+"_"+$arch)) | .browser_download_url' -r | \
  xargs curl -LO
```

之后，用户需要自行解压归档文件并决定将其内容放置在系统的何处。

::: info
如果您不打算在系统范围内安装 SpiceDB，建议遵循 [XDG 基础目录规范](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html)。
:::
