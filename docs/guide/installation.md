# 安装部署

## Docker（推荐开发环境）

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  -p 8443:8443 \
  -p 9090:9090 \
  authzed/spicedb serve \
  --grpc-preshared-key "your-secret-key"
```

端口说明：
- `50051` — gRPC API
- `8443` — HTTP/REST API
- `9090` — Metrics（Prometheus）

## Docker Compose

适合本地开发，搭配 PostgreSQL 作为存储后端：

```yaml
version: "3"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: spicedb
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: spicedb
    ports:
      - "5432:5432"

  spicedb-migrate:
    image: authzed/spicedb
    command: migrate head
    environment:
      SPICEDB_DATASTORE_ENGINE: postgres
      SPICEDB_DATASTORE_CONN_URI: "postgres://spicedb:secret@postgres:5432/spicedb?sslmode=disable"
    depends_on:
      - postgres

  spicedb:
    image: authzed/spicedb
    command: serve
    environment:
      SPICEDB_GRPC_PRESHARED_KEY: "your-secret-key"
      SPICEDB_DATASTORE_ENGINE: postgres
      SPICEDB_DATASTORE_CONN_URI: "postgres://spicedb:secret@postgres:5432/spicedb?sslmode=disable"
    ports:
      - "50051:50051"
      - "8443:8443"
      - "9090:9090"
    depends_on:
      - spicedb-migrate
```

## Kubernetes (Helm)

```bash
helm repo add authzed https://charts.authzed.com
helm repo update
helm install spicedb authzed/spicedb \
  --set spicedb.grpcPresharedKey="your-secret-key"
```

详细的 Helm 配置请参考 [官方 Helm Chart 文档](https://github.com/authzed/helm-charts)。

## 存储后端

SpiceDB 支持以下存储后端：

| 后端 | 适用场景 | 说明 |
|------|---------|------|
| memory | 开发测试 | 数据不持久化，重启后丢失 |
| PostgreSQL | 生产环境 | 推荐，稳定可靠 |
| CockroachDB | 大规模生产 | 支持全球分布式部署 |
| MySQL | 生产环境 | 支持，但推荐 PostgreSQL |

## 下一步

- [快速开始](/guide/getting-started) — 第一次使用
- [核心概念](/concepts/overview) — 理解 SpiceDB 的设计
