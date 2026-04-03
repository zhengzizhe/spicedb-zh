::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/installing-zed)  
中文版: [查看中文版](/zh/spicedb/getting-started/installing-zed)
:::

# Installing Zed

Zed is the CLI used to interact with SpiceDB. It is distributed as a standalone executable, with several recommended installation methods available across different operating systems and platforms.

## Installation Methods

### Debian/Ubuntu Linux

Users on Debian-based systems can add AuthZed's apt repository:

1. Download the public signing key:

```bash
curl -sS https://pkg.authzed.com/apt/gpg.key | sudo gpg --dearmor --yes -o /etc/apt/keyrings/authzed.gpg
```

2. Add the repository source and install:

```bash
echo "deb [signed-by=/etc/apt/keyrings/authzed.gpg] https://pkg.authzed.com/apt/ * *" | sudo tee /etc/apt/sources.list.d/authzed.list
sudo apt update
sudo apt install -y zed
```

### RPM-based Linux (RHEL/CentOS)

RPM users can configure a yum repository and install:

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

macOS users can install packages by adding a Homebrew tap:

```bash
brew install authzed/tap/zed
```

### Docker

Container images exist for AMD64 and ARM64 architectures across three registries:

- `authzed/zed` (Docker Hub)
- `ghcr.io/authzed/zed` (GitHub)
- `quay.io/authzed/zed` (Quay)

```bash
docker pull authzed/zed
docker run --rm authzed/zed version
```

### Binary Download

Visit the [GitHub releases page](https://github.com/authzed/zed/releases/latest) and download the appropriate artifact for your system architecture.

### Building from Source

Clone and build using Go:

```bash
git clone git@github.com:authzed/zed.git
cd zed
go build ./cmd/zed
```

## Command Reference

### Context Management

Zed uses contexts to manage multiple SpiceDB deployment configurations:

```bash
zed context set dev localhost:80 testpresharedkey --insecure
zed context set prod grpc.authzed.com:443 tc_zed_my_laptop_deadbeefdeadbeef
zed context use dev
zed context list
```

### Permission Checking

Core functionality includes permission verification and expansion:

```bash
zed permission check document:firstdoc writer user:emilia
zed permission expand writer document:firstdoc
zed permission lookup-resources document view user:emilia
```

### Relationship Management

Commands for querying and modifying relationships:

```bash
zed relationship create document:budget view user:anne
zed relationship read document:%
zed relationship delete document:budget view user:anne
zed relationship watch --filter document:finance
```

### Schema Operations

```bash
zed schema read
zed schema write schema.zed
zed schema copy dev prod
zed schema diff before.zed after.zed
```

### Backup and Restore

```bash
zed backup create backup.yaml
zed backup restore backup.yaml
zed backup parse-schema backup.yaml
```

## Global Options

All commands support the following connection configuration options:

| Option | Description |
|--------|-------------|
| `--endpoint` | SpiceDB gRPC API endpoint |
| `--token` | Authentication token |
| `--insecure` | Plaintext connection mode |
| `--certificate-path` | CA certificate for verification |
| `--max-retries` | Sequential retry attempts (default: 10) |
| `--log-level` | Verbosity control (trace, debug, info, warn, error) |
| `--permissions-system` | Target permissions system |

## Additional Features

The CLI includes experimental MCP (Model Context Protocol) support via `zed mcp experimental-run`, validation tools, schema compilation with import support, and bulk operations for relationships.
