::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/client-libraries)  
中文版: [查看中文版](/zh/spicedb/getting-started/client-libraries)
:::

# Official Client Libraries

SpiceDB is accessed primarily through a gRPC API, enabling client library generation for any programming language.

## Officially Maintained Libraries

AuthZed builds and maintains gRPC client libraries for:

- **Go** — [authzed-go](https://github.com/authzed/authzed-go)
- **Node.js** — [authzed-node](https://github.com/authzed/authzed-node)
- **Python** — [authzed-py](https://github.com/authzed/authzed-py)
- **Ruby** — [authzed-rb](https://github.com/authzed/authzed-rb)
- **Java** — [authzed-java](https://github.com/authzed/authzed-java)
- **.NET** — [authzed-dotnet](https://github.com/authzed/authzed-dotnet)

These libraries are generated from protobuf definitions in the [API repository](https://github.com/authzed/api), with primary documentation available through [buf documentation](https://buf.build/authzed/api/docs/main) for SpiceDB services.

## Local Development Configuration

### Without TLS (Most Common)

Use insecure plaintext credentials for localhost, Docker, OrbStack, and other local environments without TLS:

| Language | Configuration |
|----------|---------------|
| Node.js | `v1.ClientSecurity.INSECURE_PLAINTEXT_CREDENTIALS` |
| Go | `grpcutil.WithInsecureBearerToken()` and `grpc.WithTransportCredentials(insecure.NewCredentials())` |
| Python | `insecure_bearer_token_credentials()` |
| Ruby | `credentials: :this_channel_is_insecure` |
| Java | `.usePlaintext()` |
| .NET | `ChannelCredentials.Insecure` with `UnsafeUseInsecureChannelCallCredentials = true` |

### With Self-Signed TLS Certificates

- **Node.js**: Use `v1.ClientSecurity.INSECURE_LOCALHOST_ALLOWED` to allow localhost connections without CA verification.
- **Go**: Load self-signed CA explicitly with `grpcutil.WithCustomCerts()` or use `InsecureSkipVerify` for localhost only (not recommended for production).

## HTTP Clients

SpiceDB exposes an HTTP API when run with the `--http-enabled` flag. While AuthZed doesn't officially maintain HTTP client libraries, OpenAPI documentation is available and can be converted into clients using tools like [openapi-ts](https://github.com/hey-api/openapi-ts) or [openapi-python-client](https://github.com/openapi-generators/openapi-python-client).

## Additional Resources

- **zed**: AuthZed's [command-line client](/en/spicedb/getting-started/installing-zed) for SpiceDB API interaction
- **Community clients**: Discover more languages and integrations in the [Awesome SpiceDB](https://github.com/authzed/awesome-spicedb) repository's Clients section
