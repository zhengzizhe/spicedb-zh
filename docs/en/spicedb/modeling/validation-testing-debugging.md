::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/validation-testing-debugging)
中文版: [查看中文版](/zh/spicedb/modeling/validation-testing-debugging)
:::

# Validation, Testing, Debugging

Whether you're designing the first iteration of your schema or you're running SpiceDB in production, you'll want tools to build confidence in performance, correctness, and design choices. SpiceDB provides comprehensive validation, testing, and debugging tools for authorization schemas.

## SpiceDB Tools

### Integration Test Server

The integration test server provides an isolated, empty datastore for each unique preshared key used to authenticate an API request. This enables parallel testing against a single SpiceDB instance.

- Standard port: `50051`
- Read-only port: `50052`

Run with:

```bash
spicedb serve-testing
```

The integration test server is also available through GitHub Actions.

### CheckPermission Tracing Header

The v1 CheckPermission API supports debugging via the `io.spicedb.requestdebuginfo` header set to `true`. This traces the full set of relations and permissions traversed while computing the check.

::: warning
Collecting traces has notable performance overhead. Use `zed`'s explain flag instead for debugging.
:::

The response includes a trailer `io.spicedb.respmeta.debuginfo` with JSON-encoded trace data.

## Playground Features

### Assertions

Assertions validate that particular invariants are maintained in a schema through positive and negative checks:

```yaml
assertTrue:
  - "document:validation-testing-debugging#reader@user:you"
assertFalse: []
```

#### Caveat Context in Assertions

Caveat context can be included using single quotes to escape JSON:

```yaml
assertTrue:
  - 'document:validation-testing-debugging#reader@user:you with {"somecondition": 42, "anothercondition": "hello world"}'
assertFalse: []
```

Use `assertCaveated` to require caveat context:

```yaml
assertTrue: []
assertCaveated:
  - "document:validation-testing-debugging#reader@user:you"
assertFalse: []
```

### Check Watches

Check Watches are real-time assertions that update with Playground changes. Possible states:

- Permission Allowed
- Permission Caveated
- Permission Denied
- Invalid Check

### Expected Relations

Expected Relations enumerate all ways to acquire access to a specific relation:

```yaml
document:validation-testing-debugging#reader:
  - "[user:you] is <document:validation-testing-debugging#reader>"
```

Transitive access shows the hierarchical path:

```yaml
project:docs#admin:
  - "[organization:authzed] is <project:docs#owner>"
  - "[user:rauchg] is <platform:vercel#admin>"
```

### Caveats in Expected Relations

With caveats, expected relations use "maybe" semantics with `[...]` notation:

```yaml
project:docs#admin:
  - "[user:rauchg[...]] is <platform:vercel#admin>"
```

### Exceptions in Expected Relations

Expected relations can include exceptions:

```yaml
project:docs#admin:
  - "[user:rauchg[...]] is <platform:vercel#admin>/<platform:vercel#banned>"
```

This reads as: user has admin permission unless the user is banned.

## Check Tracing

Enable check tracing by setting `with_tracing: true` in request messages to view paths and timing information in responses.

::: info
Versions older than v1.31.0 use header-based tracing with JSON footer responses.
:::

## Zed CLI Tools

### Zed Validate

Validates schemas locally and in CI:

```bash
zed validate my-schema.zed
```

Validates functionality using YAML files exported from the Playground:

```bash
zed validate schema-and-validations.yaml
```

Validation file structure:

```yaml
schema: |-
  // schema goes here
# -- OR --
schemaFile: "./path/to/schema.zed"

relationships: |-
  object:foo#relation@subject:bar
  object:baz#relation@subject:qux

assertions:
  assertTrue:
    - object:foo#relation@subject:bar
  assertFalse:
    - object:foo#relation@subject:qux
validation:
  object:foo#relation:
    - "[subject:bar] is <object:foo#user>"
```

Multiple files are supported (v0.25.0+):

```bash
zed validate some-validations.yaml some-other-validations.yaml
zed validate validations/*
```

::: info
Schema writes can still fail if removing relations with existing instances.
:::

### Explain Flag

The `zed permission check --explain` command will cause SpiceDB to collect the actual paths taken against the live system to compute a permission check:

```
$ zed permission check --explain document:firstdoc view user:fred
true
  document:firstdoc view (66.333us)
    document:firstdoc writer (12.375us)
    document:firstdoc reader (20.667us)
       user:fred
```

The explain output highlights cached traversals and detects cycles.

## GitHub Actions

### authzed/action-spicedb

Runs the integration test server with configurable versions:

```yaml
steps:
  - uses: "authzed/action-spicedb@v1"
    with:
      version: "latest"
```

### authzed/action-spicedb-validate

This tool is highly recommended because it can prevent deployments of unverified changes.

```yaml
steps:
  - uses: "actions/checkout@v4"
  - uses: "authzed/action-spicedb-validate@v1"
    with:
      validationfile: "your-schema.yaml"
```
