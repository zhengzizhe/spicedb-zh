::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/install/debian)  
中文版: [查看中文版](/zh/spicedb/getting-started/install/debian)
:::

# Installing SpiceDB on Ubuntu or Debian

This document outlines how to install SpiceDB for systems running Debian-based Linux distributions.

SpiceDB publishes `.deb` packages, snap packages, and tarballs for AMD64 and ARM64 architectures. For `.rpm` package installations, refer to the [RHEL/CentOS guide](/en/spicedb/getting-started/install/rhel).

## Installing SpiceDB using APT

First, download the repository's public signing key:

```bash
curl -sS https://pkg.authzed.com/apt/gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/authzed.gpg
```

Then configure the repository source:

```bash
echo "deb [signed-by=/etc/apt/keyrings/authzed.gpg] https://pkg.authzed.com/apt/ * *" | sudo tee /etc/apt/sources.list.d/authzed.list
sudo chmod 644 /etc/apt/sources.list.d/authzed.list
```

Alternatively, use the newer deb822 format by adding to `/etc/apt/sources.list.d/authzed.sources`:

```
Types: deb
URIs: https://pkg.authzed.com/apt/
Suites: *
Components: *
Signed-By: /etc/apt/keyrings/authzed.gpg
```

Finally, install the package:

```bash
sudo apt update
sudo apt install -y spicedb
```

## Installing SpiceDB using Snap

SpiceDB is available through the Snap Store:

```bash
sudo snap install spicedb
```

## Manually Installing SpiceDB Binary for Linux

Download the latest release automatically:

```bash
curl https://api.github.com/repos/authzed/spicedb/releases | \
  jq --arg platform $(uname | tr '[:upper:]' '[:lower:]') \
     --arg arch $(uname -m) \
     '.[0].assets.[] | select (.name | contains($platform+"_"+$arch)) | .browser_download_url' -r | \
  xargs curl -LO
```

Extract the archive and decide where to place its contents on your system.

::: info
It is recommended to follow the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html) if you're not trying to install SpiceDB system-wide.
:::
