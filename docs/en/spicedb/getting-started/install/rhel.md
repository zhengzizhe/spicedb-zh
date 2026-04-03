::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/install/rhel)  
中文版: [查看中文版](/zh/spicedb/getting-started/install/rhel)
:::

# Installing SpiceDB on RHEL or CentOS

This document outlines how to install SpiceDB on systems running RPM-based Linux distributions.

Every SpiceDB release publishes `.rpm` packages and tarballs for AMD64 and ARM64 Linux architectures. For Debian/Ubuntu systems, refer to the [Ubuntu/Debian installation guide](/en/spicedb/getting-started/install/debian) instead.

## Installing SpiceDB using dnf

First, add the official SpiceDB RPM repository:

```sh
sudo cat << EOF >> /etc/yum.repos.d/authzed.repo
[authzed]
name=AuthZed Fury Repository
baseurl=https://pkg.authzed.com/yum/
enabled=1
gpgcheck=0
EOF
```

Then install SpiceDB and zed (the CLI tool):

```sh
sudo dnf install -y spicedb zed
```

## Manually Installing SpiceDB Binary for Linux

For manual installations, use this command to download the latest release for your platform and architecture:

```sh
curl https://api.github.com/repos/authzed/spicedb/releases | \
  jq --arg platform $(uname | tr '[:upper:]' '[:lower:]') \
     --arg arch $(uname -m) \
     '.[0].assets.[] | select (.name | contains($platform+"_"+$arch)) | .browser_download_url' -r | \
  xargs curl -LO
```

After downloading, extract the archive and place contents on your system.

::: info
It is recommended to follow the [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/basedir-spec-latest.html) if you're not trying to install SpiceDB system-wide.
:::
