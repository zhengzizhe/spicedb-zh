::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/protecting-a-blog)  
中文版: [查看中文版](/zh/spicedb/getting-started/protecting-a-blog)
:::

# Protecting a Blog Application

This guide walks through integrating an application with SpiceDB using a blog application as an example. It provides standalone code snippets demonstrating integration points across multiple programming languages.

## Prerequisites

You need one of the following:

- An [Authzed Cloud](https://authzed.com) Permission System
- A running SpiceDB instance with a configured preshared key

For local SpiceDB setup:

```bash
# Using the binary
spicedb serve --grpc-preshared-key "t_your_token_here_1234567deadbeef"

# Using Docker
docker run --rm -p 50051:50051 authzed/spicedb serve \
  --grpc-preshared-key "t_your_token_here_1234567deadbeef"
```

## Installing the Client

::: code-group

```bash [zed]
brew install authzed/tap/zed
zed context set <name> <endpoint> <token>
```

```bash [Node.js]
npm i @authzed/authzed-node
```

```bash [Go]
mkdir first_app && cd first_app
go mod init first_app
go get github.com/authzed/authzed-go
go get github.com/authzed/grpcutil
go mod tidy
```

```bash [Python]
pip install authzed
```

```bash [Ruby]
gem install authzed
```

```groovy [Java (build.gradle)]
dependencies {
  implementation "com.authzed.api:authzed:0.6.0"
  implementation 'io.grpc:grpc-protobuf:1.54.1'
  implementation 'io.grpc:grpc-stub:1.54.1'
}
```

:::

## Writing a Schema

Schemas define objects, their relations, and checkable permissions. Here is an example schema that models a blog:

```txt
definition user {}

definition post {
  relation reader: user
  relation writer: user

  permission read = reader + writer
  permission write = writer
}
```

This schema defines:

- Two object types: `user` and `post`
- Two relations on posts: `reader` and `writer`
- Two permissions: `read` (union of readers and writers) and `write` (writers only)

### Writing Schema via zed

```bash
zed schema write <(cat << EOF
definition user {}

definition post {
  relation reader: user
  relation writer: user

  permission read = reader + writer
  permission write = writer
}
EOF
)
```

Each client library provides a `WriteSchemaRequest` to write the schema programmatically. Instantiate the client with your endpoint and token, create the request with the schema string, and call the `WriteSchema` method.

## Writing Relationships

Relationships are live instances of relations between objects. They enable dynamic access control at runtime.

Example: Making Emilia a writer and Beatrice a reader of post 1.

```bash
zed relationship create post:1 writer user:emilia
zed relationship create post:1 reader user:beatrice
```

Each client library provides a `WriteRelationshipsRequest` with `RelationshipUpdate` objects specifying the operation (`OPERATION_CREATE`), resource, relation, and subject.

::: warning
`WriteRelationships` returns a `ZedToken` that is essential for ensuring performance and consistency. Store and use it for subsequent reads.
:::

## Checking Permissions

Permission checks test both direct and transitive relationships. For example, writers implicitly have read permissions alongside write permissions.

```bash
zed permission check post:1 read user:emilia      # true
zed permission check post:1 write user:emilia     # true
zed permission check post:1 read user:beatrice    # true
zed permission check post:1 write user:beatrice   # false
```

Each client library provides a `CheckPermissionRequest` with resource, permission, and subject references. The response contains a `permissionship` value indicating whether the permission is granted.

## Key Notes

- For local development without TLS, use `INSECURE_PLAINTEXT_CREDENTIALS` or the equivalent for your language
- Always use secure credentials before deploying to production
- Prefer checking **permissions** over direct relation checks — permissions provide better contracts and enable backward-compatible schema changes
- For read-after-write consistency, provide a `ZedToken` from the `WriteRelationships` response or request full consistency
