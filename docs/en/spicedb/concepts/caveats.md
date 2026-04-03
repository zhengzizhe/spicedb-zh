::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/caveats)
中文版: [查看中文版](/zh/spicedb/concepts/caveats)
:::

# Caveats

## Overview

Caveats are conditional expressions that can be attached to relationships in SpiceDB. They evaluate to true or false and allow relationships to be defined conditionally during permission checks. Caveats allow for an elegant way to model dynamic policies and ABAC-style (Attribute Based Access Control) decisions while still providing scalability and performance guarantees.

## Defining Caveats

Caveats are named expressions defined in the schema alongside object type definitions. Each caveat includes a name, typed parameters, and a CEL (Common Expression Language) expression returning a boolean value.

### Parameter Types

| Type | Description |
|------|-------------|
| `any` | Any value allowed; useful for varying types |
| `int` | 64-bit signed integer |
| `uint` | 64-bit unsigned integer |
| `bool` | Boolean value |
| `string` | UTF-8 encoded string |
| `double` | Double-width floating point |
| `bytes` | Sequence of uint8 |
| `duration` | Duration of time |
| `timestamp` | Specific moment in time |
| `list<T>` | Generic sequence |
| `map<T>` | String-to-value mapping |
| `ipaddress` | SpiceDB-specific IP type |

### Example Caveats

**Basic comparison:**

```txt
caveat is_tuesday(today string) {
  today == 'tuesday'
}
```

**IP address checking:**

```txt
caveat ip_allowlist(user_ip ipaddress, cidr string) {
  user_ip.in_cidr(cidr)
}
```

## Allowing Caveats on Relations

Caveats must be specified on relations using the `with` keyword:

```txt
definition resource {
  relation viewer: user | user with ip_allowlist
}
```

This allows relationships to be written either without caveat or with the named caveat. Remove `user |` to make the caveat required.

## Writing Relationships with Caveats

When creating relationships, both the caveat name and context (partial data) can be specified:

```
OptionalCaveat: {
  CaveatName: "ip_allowlist",
  Context: structpb{ "cidr": "1.2.3.0/24" }
}
```

**Key points:**

- Context comes from both the relationship and the CheckPermissionRequest; relationship values take precedence
- Context stored with relationships enables partial binding at write time
- Context is represented as `structpb` (JSON-like data)
- 64-bit integers should be encoded as strings
- Relationships cannot be duplicated with/without caveats
- Deletion doesn't require specifying the caveat

## Providing Caveat Context via API

### CheckPermission

When issuing CheckPermission requests, additional context can be specified:

```
CheckPermissionRequest {
  context: { "user_ip": "1.2.3.4" }
}
```

Returns one of three states:

- `PERMISSIONSHIP_NO_PERMISSION` — No access
- `PERMISSIONSHIP_HAS_PERMISSION` — Access confirmed
- `PERMISSIONSHIP_CONDITIONAL_PERMISSION` — Missing context needed

### LookupResources and LookupSubjects

Both support context parameters and return permission states for each result (has permission or conditionally has permission).

## Using zed CLI

Provide context via the `--caveat-context` flag with JSON matching schema types:

```bash
zed check -r resource:specificresource#view -p view -s user:specificuser \
  --caveat-context '{"first_parameter": 42, "second_parameter": "hello world"}'
```

Use single quotes to escape JSON characters (not needed in Authzed Playground).

## Full Example

**Schema:**

```txt
definition user {}

caveat has_valid_ip(user_ip ipaddress, allowed_range string) {
  user_ip.in_cidr(allowed_range)
}

definition resource {
  relation viewer: user | user with has_valid_ip
  permission view = viewer
}
```

**Write Relationships:**

```
OptionalCaveat: {
  CaveatName: "has_valid_ip",
  Context: structpb{ "allowed_range": "10.20.30.0/24" }
}
```

**Check Permission:**

```
CheckPermissionRequest {
  context: { "user_ip": "10.20.30.42" }
}
```

## Validation with Caveats

### Assertions

Use `assertCaveated` block for caveated permissions:

```yaml
assertTrue:
  - "document:specificdocument#reader@user:specificuser"
assertCaveated:
  - "document:specificdocument#reader@user:caveateduser"
assertFalse:
  - "document:specificdocument#reader@user:anotheruser"
```

Provide context using `with` keyword for conditional assertions.

### Expected Relations

Caveated subjects are marked with `[...]` notation and do NOT evaluate caveats even with full context specified on relationships.
