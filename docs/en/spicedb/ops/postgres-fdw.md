::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/postgres-fdw)
中文版: [查看中文版](/zh/spicedb/ops/postgres-fdw)
:::

# Using Postgres FDW with SpiceDB

The Postgres FDW acts as a translation layer implementing the PostgreSQL wire protocol, converting SQL queries into SpiceDB API calls. This enables querying permissions, relationships, and schema using standard SQL syntax.

::: warning
This is an experimental feature subject to change and should be used cautiously in production environments.
:::

## Prerequisites

- Running SpiceDB instance (local or remote)
- Access to SpiceDB gRPC endpoint
- SpiceDB preshared key or token
- PostgreSQL installation
- Docker or SpiceDB binary with FDW support

## Setup Process

### 1. Start SpiceDB Instance

**In-memory storage (development):**

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --datastore-engine memory
```

**PostgreSQL backend (production):**

```bash
docker run -d \
  --name spicedb \
  -p 50051:50051 \
  authzed/spicedb serve \
  --grpc-preshared-key "somerandomkeyhere" \
  --datastore-engine postgres \
  --datastore-conn-uri "postgres://user:password@localhost:5432/spicedb?sslmode=disable"
```

### 2. Start FDW Proxy Server

**Using Docker (recommended):**

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

**Using SpiceDB binary:**

```bash
spicedb postgres-fdw \
  --spicedb-api-endpoint localhost:50051 \
  --spicedb-access-token-secret "somerandomkeyhere" \
  --spicedb-insecure \
  --postgres-endpoint ":5432" \
  --postgres-username "postgres" \
  --postgres-access-token-secret "fdw-password"
```

**Using environment variables:**

```bash
export SPICEDB_SPICEDB_API_ENDPOINT="localhost:50051"
export SPICEDB_SPICEDB_ACCESS_TOKEN_SECRET="somerandomkeyhere"
export SPICEDB_SPICEDB_INSECURE="true"
export SPICEDB_POSTGRES_ENDPOINT=":5432"
export SPICEDB_POSTGRES_USERNAME="postgres"
export SPICEDB_POSTGRES_ACCESS_TOKEN_SECRET="fdw-password"

spicedb postgres-fdw
```

**Configuration Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--spicedb-api-endpoint` | SpiceDB gRPC endpoint | `localhost:50051` |
| `--spicedb-access-token-secret` | Preshared key or token (required) | - |
| `--spicedb-insecure` | Disable TLS verification (dev only) | `false` |
| `--postgres-endpoint` | FDW server listen address | `:5432` |
| `--postgres-username` | Username for Postgres auth | `postgres` |
| `--postgres-access-token-secret` | Password for Postgres auth (required) | - |
| `--shutdown-grace-period` | Graceful shutdown timeout | `0s` |

### 3. Configure PostgreSQL FDW

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server
CREATE SERVER spicedb_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (
    host 'localhost',
    port '5432',
    dbname 'ignored'
  );

-- Create user mapping
CREATE USER MAPPING FOR CURRENT_USER
  SERVER spicedb_server
  OPTIONS (
    user 'postgres',
    password 'fdw-password'
  );

-- Import foreign tables
IMPORT FOREIGN SCHEMA public
  LIMIT TO (permissions, relationships, schema)
  FROM SERVER spicedb_server
  INTO public;
```

### 4. Load Schema and Data

**Example schema (schema.zed):**

```txt
definition user {}

definition document {
  relation viewer: user
  relation editor: user

  permission view = viewer + editor
  permission edit = editor
}
```

**Load schema:**

```bash
zed schema write schema.zed \
  --endpoint localhost:50051 \
  --insecure \
  --token "somerandomkeyhere"
```

**Add relationships:**

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

## Querying Permissions

**Check permissions:**

```sql
SELECT has_permission
FROM permissions
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

**Lookup resources:**

```sql
SELECT resource_id
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

**Lookup subjects:**

```sql
SELECT subject_id
FROM permissions
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND permission = 'view'
  AND subject_type = 'user';
```

**Query relationships:**

```sql
SELECT resource_type, resource_id, relation, subject_type, subject_id
FROM relationships
WHERE resource_type = 'document'
  AND resource_id = 'readme';
```

**Read schema:**

```sql
SELECT definition FROM schema;
```

## Available Tables

### Permissions Table

Used for checking permissions and resource/subject lookups.

| Column | Type | Description |
|--------|------|-------------|
| `resource_type` | text | Resource type (e.g., 'document') |
| `resource_id` | text | Resource ID |
| `permission` | text | Permission name |
| `subject_type` | text | Subject type (e.g., 'user') |
| `subject_id` | text | Subject ID |
| `optional_subject_relation` | text | Optional subject relation |
| `has_permission` | boolean | Whether permission is granted |
| `consistency` | text | Consistency token (ZedToken) |

**Supported Operations:** SELECT only

The FDW automatically routes queries to the appropriate API:

- **CheckPermission**: All fields specified
- **LookupResources**: When `resource_id` is not specified
- **LookupSubjects**: When `subject_id` is not specified

### Relationships Table

Used for reading, writing, and deleting relationships.

| Column | Type | Description |
|--------|------|-------------|
| `resource_type` | text | Resource type |
| `resource_id` | text | Resource ID |
| `relation` | text | Relation name |
| `subject_type` | text | Subject type |
| `subject_id` | text | Subject ID |
| `optional_subject_relation` | text | Optional subject relation |
| `optional_caveat_name` | text | Optional caveat name |
| `optional_caveat_context` | jsonb | Optional caveat context |
| `consistency` | text | Consistency token (ZedToken) |

**Supported Operations:** SELECT, INSERT, DELETE

### Schema Table

Used for reading schema definitions.

| Column | Type | Description |
|--------|------|-------------|
| `definition` | text | Schema definition in Zed format |

**Supported Operations:** SELECT only

## Advanced Features

### Consistency Control

```sql
SELECT resource_id, consistency
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice'
  AND consistency = 'fully_consistent';
```

**Available consistency modes:**

- `minimize_latency`: Default, uses newest available snapshot
- `fully_consistent`: Waits for a fully consistent view
- `<zedtoken>`: Uses a specific consistency token
- `@<zedtoken>`: Uses exact snapshot matching

### Writing Relationships

**Insert:**

```sql
INSERT INTO relationships (resource_type, resource_id, relation, subject_type, subject_id)
VALUES ('document', 'readme', 'viewer', 'user', 'alice');
```

**Delete:**

```sql
DELETE FROM relationships
WHERE resource_type = 'document'
  AND resource_id = 'readme'
  AND relation = 'viewer'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

### Joining with Local Tables

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

### Using Cursors for Large Result Sets

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

## Docker Compose Example

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

**Start and connect:**

```bash
docker-compose up -d
psql -h localhost -p 5432 -U postgres -d ignored
# Password: fdw-password
```

## Limitations

- **Joins between FDW tables**: Not supported (e.g., `permissions` JOIN `relationships`)
- **Joins with local tables**: Fully supported
- **Aggregations**: Performed client-side by PostgreSQL (SUM, COUNT, etc.)
- **Ordering**: ORDER BY processed client-side
- **Subqueries**: Not supported
- **Complex WHERE clauses**: Only simple equality predicates and AND conditions are pushed to SpiceDB

For complex analytics, consider bulk operations or the Watch API for data warehouse streaming.

## Performance Considerations

### Query Planning

```sql
EXPLAIN SELECT resource_id
FROM permissions
WHERE resource_type = 'document'
  AND permission = 'view'
  AND subject_type = 'user'
  AND subject_id = 'alice';
```

FDW provides basic statistics but uses estimates. Use EXPLAIN to understand query execution.

### Large Datasets

Consider AuthZed Materialize for fast joins on large datasets with seamless FDW integration.

## Troubleshooting

### Connection Refused

Verify:
1. FDW proxy server is running and accessible
2. Port is not blocked by a firewall
3. Host and port match PostgreSQL configuration

```bash
psql -h localhost -p 5432 -U postgres -d ignored
```

### SpiceDB Connection Errors

Verify:
1. SpiceDB is running and accessible
2. Endpoint and port are correct
3. Preshared key matches
4. TLS is configured correctly for remote connections

```bash
zed context set local localhost:50051 "somerandomkeyhere" --insecure
zed schema read
```

### Empty Results

Check:
1. Schema is loaded: `SELECT definition FROM schema;`
2. Relationships exist: `SELECT * FROM relationships;`
3. Resource types and permissions match the schema

### Performance Issues

1. Check SpiceDB performance via observability tools
2. Review datastore performance
3. Optimize queries (use specific resource IDs vs. lookups)
4. Use cursors for large result sets
5. Consider AuthZed Materialize for large datasets

## Security Considerations

### Network Security

- **Development**: Use `--spicedb-insecure` for convenience
- **Production**: Always use TLS for SpiceDB and FDW connections
- **Firewall**: Restrict FDW proxy port access to trusted clients

### Authentication

- Store preshared keys securely (environment variables/secrets management)
- Rotate keys periodically
- Use different keys per environment (dev, staging, prod)

### Access Control

Consider:
- Restricted API Access with AuthZed products
- Application-level access controls
- PostgreSQL roles for FDW access control
