::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/querying-data)
中文版: [查看中文版](/zh/spicedb/concepts/querying-data)
:::

# Querying Data

## Overview

SpiceDB provides several APIs for querying permission data, listed in order of typical usage frequency and performance expectations. Choose the API that matches your specific use case.

::: tip
In most of the APIs below, if you want to be able to read your write, you can pass a `consistency` parameter to the queries. Use either `fully_consistent` or `at_least_as_fresh(revision)` depending on how strict you need to be.

You can also send an `X-Request-ID=somevalue` header with API requests for easier log correlation and request tracing.
:::

## CheckPermission

**Send:**

- Subject Type
- Subject ID
- Permission (or relation)
- Object Type
- Object ID

**Receive:**

- Yes/no response (or provisional response if caveat data is missing)

This is the primary API for access checks, designed for high-traffic workloads. Debug locally using:

```bash
zed permission check resource:someresource somepermission user:someuser --explain
```

The subject can be either a single user (e.g., `user:someuser`) or a group of users (e.g., `group:engineering#member`).

When schemas include caveats without complete context, the API returns "conditional" instead of a direct allow/deny decision.

## CheckBulkPermissions

**Send Many:**

- Subject Type, Subject ID, Permission, Object Type, Object ID

**Receive Many:**

- Yes/no responses (or provisional responses for missing caveat data)

Ideal for UI workloads requiring multiple simultaneous permission checks — think tables, lists, and dashboards. This is the recommended approach to determine what permissions a subject has on a resource: check each permission in your schema. Performance is superior to multiple `CheckPermission` calls.

## LookupResources

**Send:**

- Subject Type
- Subject ID
- Permission (or relation)
- Object Type

**Receive Many:**

- Object ID

Find all resources of a specific type accessible to a particular subject. Supports cursoring and works well for moderate result sets. Useful for prefiltering in list endpoints, but performance degrades significantly beyond 10,000 results. For larger sets, consider postfiltering with `CheckBulkPermissions` or evaluating the Materialize feature.

## LookupSubjects

**Send:**

- Subject Type
- Permission (or relation)
- Object Type
- Object ID

**Receive Many:**

- Subject ID

Returns all subjects with access to a specific resource without cursor support. Commonly used for UIs showing users with particular permissions, such as admin lists.

::: info
LookupSubjects performs full path walking between objects and subjects, considering all valid paths. To find subjects on a specific relation, use `ReadRelationships` instead.
:::

When schemas include exclusions and wildcards, the response may include explicitly excluded subjects in the format: `{user:* - [user:anne,user:bob]}`.

**Example:** With schema defining `permission viewer = view - blocked` and relationships showing `document:finance#view@user:*`, `document:finance#blocked@user:anne`, and `document:finance#blocked@user:bob`, LookupSubjects returns the excluded subjects format above.

## ReadRelationships

::: warning
ReadRelationships is intended as an escape hatch, and should only be considered if no other API matches your use case.
:::

Highly flexible — accepts any combination of subject type/ID, permission, object type/ID and returns matching relationships. However, significant caveats apply:

- Less optimized than Check and Lookup APIs due to flexibility
- No result caching (Check and Lookup APIs cache subproblem computation)
- Database indexes optimize for Check and Lookup patterns, making some ReadRelationships queries potentially require full table scans

Valid use cases:

- Deleting all relationships in a subtree where simple filtering proves insufficient
- Admin UIs displaying role or relationship lists between objects

## Watch

Not designed for answering permission questions; intended for auditing and similar use cases. Refer to the [Watch API](./watch) documentation for details.

## ExpandPermissionTree

Based on the Zanzibar Paper, this API examines relationship subtrees around specific graph points — useful when UIs need to display which users and groups have access to resources.

Practical limitations: Only resolves one "hop" at a time and requires repeated calls for complete subtree visibility, limiting its practical application frequency.
