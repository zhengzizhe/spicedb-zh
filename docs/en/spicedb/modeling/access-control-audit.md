::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/access-control-audit)
中文版: [查看中文版](/zh/spicedb/modeling/access-control-audit)
:::

# Access Control Audit

Aside from providing means to manage access control, another common feature is tools to audit access control. This page covers how to help administrators and users understand what permissions exist and how they've changed over time.

## Auditing User Permissions

To determine the computed permissions a user has over a resource, SpiceDB offers two APIs:

### ExperimentalReflectSchema

This API lets you query the permissions available for a specific resource. You can filter by permission name or a permission name prefix.

### BulkCheckPermission

This API lets you perform various permission checks in a single round-trip. This is more efficient than issuing individual checks because SpiceDB will batch many of the subproblems involved.

## Auditing Access Grants

The documentation distinguishes between access grants and permissions:

- **Access grants**: direct user assignments (e.g., "user joe assigned as reader on repository kubernetes")
- **Permissions**: computed results of all grant pathways

### Schema Example

```txt
definition user {}

definition team {
  relation member: user
}

definition repository {
  relation role_reader: user | team#member
  relation role_writer: user | team#member
  relation role_adminer: user | team#member

  permission read = role_reader + write
  permission write = role_writer + admin
  permission admin = role_adminer
}
```

### Watch API

To understand how access grants in the system have changed over time, you can use the SpiceDB Watch API, which lets you stream all relationship changes in near real-time.

::: info
SpiceDB retains up to 24 hours of change history before automatic garbage collection.
:::

## Auditing Permission Changes

::: warning
This strategy is very computationally intensive, and it would very likely require scaling out a SpiceDB cluster.
:::

The approach involves:

1. Using the Watch API to stream relationship changes
2. Using `ExperimentalComputablePermissions` to determine affected permissions

These two APIs serve as the foundation to start recomputing permissions. The more siloed and controlled the use case, the higher the chances this can work at scale.

For resource-specific changes, run `LookupSubjects` for each affected permission. However, computing all subjects across all resources represents an expensive operation.

## Auditing SpiceDB API Requests

SpiceDB lacks built-in API call tracking. Alternatives include:

- Custom middleware using the Middleware Framework
- Wrapping SpiceDB in a proxy service
- Enabling `--grpc-log-requests-enabled` and `--grpc-log-response-enabled` flags
- Using Authzed Audit Logging (enterprise feature)
