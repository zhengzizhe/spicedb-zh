::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/postgres-fdw)
English: [View English version](/en/spicedb/ops/postgres-fdw)
:::

# 使用 Postgres FDW 与 SpiceDB

Postgres FDW 充当转换层，实现 PostgreSQL 线协议，将 SQL 查询转换为 SpiceDB API 调用。这使得可以使用标准 SQL 语法查询权限、关系和 Schema。

::: warning
这是一个实验性功能，可能会发生变化，在生产环境中使用时请务必谨慎。
:::

## 前提条件

- 运行中的 SpiceDB 实例（本地或远程）
- 可访问 SpiceDB gRPC 端点
- SpiceDB 预共享密钥或令牌
- PostgreSQL 安装
- Docker 或支持 FDW 的 SpiceDB 二进制文件

## 设置流程

### 1. 启动 SpiceDB 实例

**内存存储（开发环境）：**

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --datastore-engine memory
```

**PostgreSQL 后端（生产环境）：**

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --datastore-engine postgres \
  --datastore-conn-uri "postgres://user:password@localhost:5432/spicedb?sslmode=disable"
```

### 2. 启动 FDW 代理服务器

**使用 Docker（推荐）：**

```bash
docker run --rm -p 5432:5432 \
  authzed/spicedb \
  postgres-fdw \
  --spicedb-api-endpoint localhost:50051 \
  --spicedb-access-token-secret "somerandomkeyhere" \
  --spicedb-insecure \
  --postgres-endpoint ":5432" \
  --postgres-username "postgres" \
  --postgres-access-token-secret "fdw-password"
```

**使用 SpiceDB 二进制文件：**

```bash
spicedb postgres-fdw \
  --spicedb-api-endpoint localhost:50051 \
  --spicedb-access-token-secret "somerandomkeyhere" \
  --spicedb-insecure \
  --postgres-endpoint ":5432" \
  --postgres-username "postgres" \
  --postgres-access-token-secret "fdw-password"
```

**使用环境变量：**

```bash
export SPICEDB_SPICEDB_API_ENDPOINT="localhost:50051"
export SPICEDB_SPICEDB_ACCESS_TOKEN_SECRET="somerandomkeyhere"
export SPICEDB_SPICEDB_INSECURE="true"
export SPICEDB_POSTGRES_ENDPOINT=":5432"
export SPICEDB_POSTGRES_USERNAME="postgres"
export SPICEDB_POSTGRES_ACCESS_TOKEN_SECRET="fdw-password"

spicedb postgres-fdw
```

**配置选项：**

| 标志 | 描述 | 默认值 |
|------|------|--------|
| `--spicedb-api-endpoint` | SpiceDB gRPC 端点 | `localhost:50051` |
| `--spicedb-access-token-secret` | 预共享密钥或令牌（必需） | - |
| `--spicedb-insecure` | 禁用 TLS 验证（仅限开发环境） | `false` |
| `--postgres-endpoint` | FDW 服务器监听地址 | `:5432` |
| `--postgres-username` | Postgres 认证用户名 | `postgres` |
| `--postgres-access-token-secret` | Postgres 认证密码（必需） | - |
| `--shutdown-grace-period` | 优雅关闭超时时间 | `0s` |

### 3. 配置 PostgreSQL FDW

```sql
-- 安装扩展
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 创建外部服务器
CREATE SERVER spicedb_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'localhost',
    port '5432',
    dbname 'ignored'
  );

-- 创建用户映射
CREATE USER MAPPING FOR CURRENT_USER
  SERVER spicedb_server
  OPTIONS (
    user 'postgres',
    password 'fdw-password'
  );

-- 导入外部表
IMPORT FOREIGN SCHEMA public
  LIMIT TO (permissions, relationships, schema)
  FROM SERVER spicedb_server
  INTO public;
```

### 4. 加载 Schema 和数据

**示例 Schema（schema.zed）：**

```txt
definition user {}

definition document {
  relation viewer: user
  relation editor: user

  permission view = viewer + editor
  permission edit = editor
}
```

**加载 Schema：**

```bash
zed schema write schema.zed \
  --endpoint localhost:50051 \
  --insecure \
  --token "somerandomkeyhere"
```

**添加关系：**

```bash
zed relationship create document:readme viewer user:alice \
  --endpoint localhost:50051 \
  --insecure \
  --token "somerandomkeyhere"

zed relationship create document:readme editor user:bob \
  --endpoint localhost:50051 \
  --insecure \
  --token "somerandomkeyhere"
```

## 查询权限

**检查权限：**

```sql
SELECT has_permission
FROM permissions
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

**查找资源：**

```sql
SELECT resource_id
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

**查找主体：**

```sql
SELECT subject_id
FROM permissions
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND permission = 'view'
  AND subject_type = 'user';
```

**查询关系：**

```sql
SELECT resource_type, resource_id, relation, subject_type, subject_id
FROM relationships
WHERE resource_type = 'document'
  AND resource_id = 'readme';
```

**读取 Schema：**

```sql
SELECT definition FROM schema;
```

## 可用表

### Permissions 表

用于检查权限和资源/主体查找。

| 列 | 类型 | 描述 |
|----|------|------|
| `resource_type` | text | 资源类型（例如 'document'） |
| `resource_id` | text | 资源 ID |
| `permission` | text | 权限名称 |
| `subject_type` | text | 主体类型（例如 'user'） |
| `subject_id` | text | 主体 ID |
| `optional_subject_relation` | text | 可选的主体关系 |
| `has_permission` | boolean | 是否授予权限 |
| `consistency` | text | 一致性令牌（ZedToken） |

**支持的操作：** 仅 SELECT

FDW 会自动将查询路由到相应的 API：

- **CheckPermission**：指定所有字段时
- **LookupResources**：未指定 `resource_id` 时
- **LookupSubjects**：未指定 `subject_id` 时

### Relationships 表

用于读取、写入和删除关系。

| 列 | 类型 | 描述 |
|----|------|------|
| `resource_type` | text | 资源类型 |
| `resource_id` | text | 资源 ID |
| `relation` | text | 关系名称 |
| `subject_type` | text | 主体类型 |
| `subject_id` | text | 主体 ID |
| `optional_subject_relation` | text | 可选的主体关系 |
| `optional_caveat_name` | text | 可选的条件名称 |
| `optional_caveat_context` | jsonb | 可选的条件上下文 |
| `consistency` | text | 一致性令牌（ZedToken） |

**支持的操作：** SELECT、INSERT、DELETE

### Schema 表

用于读取 Schema 定义。

| 列 | 类型 | 描述 |
|----|------|------|
| `definition` | text | Zed 格式的 Schema 定义 |

**支持的操作：** 仅 SELECT

## 高级功能

### 一致性控制

```sql
SELECT resource_id, consistency
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice'
  AND consistency = 'fully_consistent';
```

**可用的一致性模式：**

- `minimize_latency`：默认模式，使用最新可用快照
- `fully_consistent`：等待完全一致的视图
- `<zedtoken>`：使用特定的一致性令牌
- `@<zedtoken>`：使用精确的快照匹配

### 写入关系

**插入：**

```sql
INSERT INTO relationships (resource_type, resource_id, relation, subject_type, subject_id)
VALUES ('document', 'readme', 'viewer', 'user', 'alice');
```

**删除：**

```sql
DELETE FROM relationships
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND relation = 'viewer'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

### 与本地表关联

```sql
CREATE TABLE document (
  id text PRIMARY KEY,
  title text NOT NULL,
  contents text NOT NULL
);

INSERT INTO document (id, title, contents) VALUES
  ('firstdoc', 'Document 1', 'Contents of document 1'),
  ('seconddoc', 'Document 2', 'Contents of document 2'),
  ('thirddoc', 'Document 3', 'Contents of document 3');

SELECT document.id, document.title
FROM document
JOIN permissions ON permissions.resource_id = document.id
WHERE permissions.resource_type = 'document'
  AND permissions.permission = 'view'
  AND permissions.subject_type = 'user'
  AND permissions.subject_id = 'alice'
ORDER BY document.title DESC;
```

### 使用游标处理大结果集

```sql
BEGIN;

DECLARE my_cursor CURSOR FOR
  SELECT resource_id FROM permissions
  WHERE resource_type = 'document'
    AND permission = 'view'
    AND subject_type = 'user'
    AND subject_id = 'alice';

FETCH 100 FROM my_cursor;
FETCH 100 FROM my_cursor;

CLOSE my_cursor;
COMMIT;
```

## Docker Compose 示例

```yaml
version: "3"

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: spicedb
    ports:
      - "5433:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  spicedb:
    image: authzed/spicedb
    command: serve
    environment:
      SPICEDB_GRPC_PRESHARED_KEY: "somerandomkeyhere"
      SPICEDB_DATASTORE_ENGINE: "postgres"
      SPICEDB_DATASTORE_CONN_URI: "postgres://postgres:password@postgres:5432/spicedb?sslmode=disable"
    ports:
      - "50051:50051"
    depends_on:
      - postgres

  spicedb-fdw:
    image: authzed/spicedb
    command: postgres-fdw
    environment:
      SPICEDB_SPICEDB_API_ENDPOINT: "spicedb:50051"
      SPICEDB_SPICEDB_ACCESS_TOKEN_SECRET: "somerandomkeyhere"
      SPICEDB_SPICEDB_INSECURE: "true"
      SPICEDB_POSTGRES_ENDPOINT: ":5432"
      SPICEDB_POSTGRES_USERNAME: "postgres"
      SPICEDB_POSTGRES_ACCESS_TOKEN_SECRET: "fdw-password"
    ports:
      - "5432:5432"
    depends_on:
      - spicedb

volumes:
  postgres-data:
```

**启动并连接：**

```bash
docker-compose up -d
psql -h localhost -p 5432 -U postgres -d ignored
# 密码: fdw-password
```

## 限制

- **FDW 表之间的 JOIN**：不支持（例如 `permissions` JOIN `relationships`）
- **与本地表的 JOIN**：完全支持
- **聚合**：由 PostgreSQL 在客户端执行（SUM、COUNT 等）
- **排序**：ORDER BY 在客户端处理
- **子查询**：不支持
- **复杂 WHERE 子句**：仅简单等值谓词和 AND 条件会被推送到 SpiceDB

对于复杂分析，可以考虑使用批量操作或 Watch API 进行数据仓库流处理。

## 性能注意事项

### 查询规划

```sql
EXPLAIN SELECT resource_id
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

FDW 提供基本统计信息但使用估算值。使用 EXPLAIN 来理解查询执行情况。

### 大数据集

对于大数据集上的快速关联，可以考虑使用 AuthZed Materialize，它与 FDW 无缝集成。

## 故障排除

### 连接被拒绝

请验证：
1. FDW 代理服务器正在运行且可访问
2. 端口未被防火墙阻止
3. 主机和端口与 PostgreSQL 配置匹配

```bash
psql -h localhost -p 5432 -U postgres -d ignored
```

### SpiceDB 连接错误

请验证：
1. SpiceDB 正在运行且可访问
2. 端点和端口正确
3. 预共享密钥匹配
4. 远程连接的 TLS 配置正确

```bash
zed context set local localhost:50051 "somerandomkeyhere" --insecure
zed schema read
```

### 空结果

请检查：
1. Schema 已加载：`SELECT definition FROM schema;`
2. 关系存在：`SELECT * FROM relationships;`
3. 资源类型和权限与 Schema 匹配

### 性能问题

1. 通过可观测性工具检查 SpiceDB 性能
2. 检查数据存储性能
3. 优化查询（使用特定的资源 ID 而非查找）
4. 对大结果集使用游标
5. 对于大数据集考虑使用 AuthZed Materialize

## 安全注意事项

### 网络安全

- **开发环境**：使用 `--spicedb-insecure` 方便开发
- **生产环境**：始终为 SpiceDB 和 FDW 连接使用 TLS
- **防火墙**：限制 FDW 代理端口仅允许受信任的客户端访问

### 认证

- 安全存储预共享密钥（使用环境变量/密钥管理系统）
- 定期轮换密钥
- 在不同环境（开发、预发布、生产）使用不同的密钥

### 访问控制

考虑以下方案：
- 使用 AuthZed 产品的受限 API 访问
- 应用层访问控制
- 使用 PostgreSQL 角色进行 FDW 访问控制
