::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/api/http-api)
中文版: [查看中文版](/zh/spicedb/api/http-api)
:::

# HTTP API Documentation

SpiceDB provides an HTTP API built using [grpc-gateway](https://github.com/grpc-ecosystem/grpc-gateway), which takes the Authzed API protobuf definitions, generates a JSON interface, and provides a reverse proxy to respond to HTTP requests.

While the official [client libraries](/en/spicedb/getting-started/client-libraries) are recommended for superior performance, the HTTP API serves as an effective way to get started with SpiceDB and explore its capabilities.

## Enabling the HTTP API

The HTTP API is not enabled by default. To start SpiceDB with the HTTP API enabled, use the `--http-enabled` flag:

```shell
spicedb serve --grpc-preshared-key "secrettoken" --http-enabled
```

This command starts SpiceDB with the specified preshared key for authentication and enables the HTTP API server.

### HTTP Server Configuration Options

| Flag | Description | Default |
|------|-------------|---------|
| `--http-enabled` | Enable the HTTP proxy server | `false` |
| `--http-addr string` | Address to listen on to serve the HTTP proxy | `:8443` |
| `--http-tls-cert-path string` | Local path to the TLS certificate used to serve the HTTP proxy | |
| `--http-tls-key-path string` | Local path to the TLS key used to serve the HTTP proxy | |

#### Read-Only HTTP Server

SpiceDB also supports a read-only HTTP server for serving read-only requests:

| Flag | Description | Default |
|------|-------------|---------|
| `--readonly-http-enabled` | Enable the read-only HTTP server | `false` |
| `--readonly-http-addr string` | Address to listen on to serve read-only HTTP | `:8444` |
| `--readonly-http-tls-cert-path string` | Local path to the TLS certificate for the read-only HTTP server | |
| `--readonly-http-tls-key-path string` | Local path to the TLS key for the read-only HTTP server | |

### Default Behavior

When starting with `--http-enabled`:

- The HTTP API server listens on port **8443** by default
- gRPC and HTTP servers communicate via **plaintext** unless TLS is configured
- If using the in-memory datastore, data does not persist beyond the SpiceDB process

## OpenAPI Specification

An OpenAPI specification is generated alongside the API proxy. You can access the OpenAPI JSON from a running SpiceDB instance:

```shell
curl http://localhost:8443/openapi.json
```

You can browse the API specification using standard tooling such as [Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/authzed/authzed-go/main/proto/apidocs.swagger.json).

The OpenAPI spec can also be used to generate HTTP clients using tools like [openapi-ts](https://github.com/hey-api/openapi-ts) or [openapi-python-client](https://github.com/openapi-generators/openapi-python-client).

## Making API Calls

All API calls use the `POST` method and require:

- `Content-Type: application/json` header
- `Authorization: Bearer <preshared-key>` header
- A JSON request body

### Example: Reading the Schema

```shell
curl -X POST http://localhost:8443/v1/schema/read \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer secrettoken' \
  -d '{}'
```

## API Endpoints

### Permissions Service

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/v1/permissions/check` | CheckPermission | Determines if a subject has permission or is a member of a relation on a resource |
| POST | `/v1/permissions/checkbulk` | CheckBulkPermissions | Evaluates multiple permission checks in a single request and returns results |
| POST | `/v1/permissions/expand` | ExpandPermissionTree | Reveals the graph structure for a resource's permission or relation |
| POST | `/v1/permissions/resources` | LookupResources | Returns all resources of a given type that a subject can access |
| POST | `/v1/permissions/subjects` | LookupSubjects | Returns all subjects of a given type with access to a resource |

### Relationships Service

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/v1/relationships/read` | ReadRelationships | Reads relationships matching one or more filters |
| POST | `/v1/relationships/write` | WriteRelationships | Atomically writes and/or deletes specified relationships |
| POST | `/v1/relationships/delete` | DeleteRelationships | Atomically bulk deletes relationships matching a filter |
| POST | `/v1/relationships/exportbulk` | ExportBulkRelationships | Fastest path for exporting relationships from the server |
| POST | `/v1/relationships/importbulk` | ImportBulkRelationships | High-performance path for writing large batches of relationships |

### Schema Service

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/v1/schema/read` | ReadSchema | Returns the current object definitions for a permissions system |
| POST | `/v1/schema/write` | WriteSchema | Overwrites the current object definitions for a permissions system |
| POST | `/v1/schema/diffschema` | DiffSchema | Returns the differences between a specified schema and the current schema |
| POST | `/v1/schema/reflectschema` | ReflectSchema | Reflects the current schema in structural form for client tooling |
| POST | `/v1/schema/permissions/computable` | ComputablePermissions | Returns permissions that are computable from a given relation |
| POST | `/v1/schema/permissions/dependent` | DependentRelations | Returns relations/permissions that compute a given permission |

### Watch Service

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/v1/watch` | Watch | Streams events (relationship updates, schema updates, checkpoints) in ascending timestamp order |

### Experimental Service

| Method | Path | Operation | Description |
|--------|------|-----------|-------------|
| POST | `/v1/experimental/countrelationships` | ExperimentalCountRelationships | Returns count of relationships for a pre-registered filter |
| POST | `/v1/experimental/registerrelationshipcounter` | ExperimentalRegisterRelationshipCounter | Registers a filter for counting relationships |
| POST | `/v1/experimental/unregisterrelationshipcounter` | ExperimentalUnregisterRelationshipCounter | Unregisters a filter for counting relationships |

::: warning Deprecated Endpoints
The following experimental endpoints have been deprecated. Use the stable versions listed above instead:

- `/v1/experimental/diffschema` - Use `/v1/schema/diffschema`
- `/v1/experimental/reflectschema` - Use `/v1/schema/reflectschema`
- `/v1/experimental/permissions/bulkcheckpermission` - Use `/v1/permissions/checkbulk`
- `/v1/experimental/permissions/computable` - Use `/v1/schema/permissions/computable`
- `/v1/experimental/permissions/dependent` - Use `/v1/schema/permissions/dependent`
- `/v1/experimental/relationships/bulkexport` - Use `/v1/relationships/exportbulk`
- `/v1/experimental/relationships/bulkimport` - Use `/v1/relationships/importbulk`
:::

## Recommended API Testing Sequence

When exploring the SpiceDB API for the first time, execute the following operations in order:

1. **Schema Write** - Write a sample schema
2. **Schema Read** - View the sample schema
3. **Relationships Write** - Write sample relationships
4. **Relationships Read** - View sample relationships
5. **Permissions Check** - Check computed permission for a user
6. **Permissions Expand** - View expanded relationships for a sample document
7. **Lookup Resources** - List documents with view permission for a user
8. **Relationships Delete** - Delete a relationship matching a precondition

## Using Postman

A [Postman collection](https://www.postman.com/authzed/authzed/collection/mosxle2/authzed-api) is available containing examples for all API operations. The collection includes Schema and Permissions folders with pre-filled example request bodies.

::: warning
Remember to replace the Bearer Token value in Postman with the preshared key used when starting SpiceDB.
:::

## Additional Resources

- [gRPC API Reference](https://buf.build/authzed/api/docs/main:authzed.api.v1)
- [Official Client Libraries](/en/spicedb/getting-started/client-libraries)
- [SpiceDB Commands & Parameters](/en/spicedb/concepts/commands)
