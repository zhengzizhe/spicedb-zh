::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/recursion-and-max-depth)
中文版: [查看中文版](/zh/spicedb/modeling/recursion-and-max-depth)
:::

# Recursion and Max Depth

Permission checks in SpiceDB traverse a tree constructed from the schema (structure) and relationships (data). A `CheckPermission` request traverses from the resource and permission requested through referenced permissions and relations until the subject is found or the maximum depth is reached.

## Max Depth

SpiceDB defaults to a maximum depth of `50` to prevent unbounded traversal. Computation halts and an error is returned to the caller upon reaching this limit. This maximum is configurable via the `--dispatch-max-depth` flag.

## Recursion in Relationships

SpiceDB does **not** support recursive data dependencies where operations like `CheckPermission` visit the same object more than once, as it expects the permissions graph to be a tree.

### Example

An unsupported nesting of groups:

```txt
definition user {}

definition group {
    relation member: user | group#member
}

definition resource {
    relation viewer: user | group#member
    permission view = viewer
}
```

With relationships:

```
resource:someresource#viewer@group:firstgroup#member
group:firstgroup#member@group:secondgroup#member
group:secondgroup#member@group:thirdgroup#member
group:thirdgroup#member@group:firstgroup#member
```

This creates a cycle: `resource:someresource#viewer` -> `group:firstgroup#member` -> `group:secondgroup#member` -> `group:thirdgroup#member` -> `group:firstgroup#member` -> ...

## Common Questions

### Why not track visited objects?

Two primary reasons prevent built-in cycle detection:

#### Nested sets have semantics issues

Zanzibar and ReBAC operate on sets -- checking if a requested subject is in the set formed by walking the permissions tree. Questions arise about whether a group containing its own members is semantically valid.

Consider this problematic schema:

```txt
definition user {}

definition group {
    relation direct_member: user | group#member
    relation banned: user | group#member
    permission member = direct_member - banned
}
```

With relationships:

```
group:firstgroup#direct_member@group:secondgroup#member
group:firstgroup#banned@group:bannedgroup#member
group:secondgroup#direct_member@user:tom
group:bannedgroup#direct_member@group:firstgroup#member
```

This creates a logical inconsistency: `user:tom` is a `direct_member` of `secondgroup`, making him a member of `firstgroup`, which makes him a member of `bannedgroup`, which makes him *not* a member of `firstgroup` -- a logical contradiction.

To prevent this, Zanzibar and SpiceDB assume the permissions graph is a tree.

#### Overhead

Tracking visited objects during `CheckPermission` queries creates significant overhead in memory and over the wire to maintain and check for duplicates.

### What to do about max depth errors?

If you receive the error: "the check request has exceeded the allowable maximum depth of 50: this usually indicates a recursive or too deep data dependency."

Run `zed --explain` with check parameters:

```bash
zed permission check resource:someresource view user:someuser --explain
```

This shows whether the issue involves recursion or simply deep trees:

```
1:36PM INF debugging requested on check
! resource:someresource viewer (4.084125ms)
  ! group:firstgroup member (3.445417ms)
    ! group:secondgroup member (3.338708ms)
      ! group:thirdgroup member (3.260125ms)
        ! group:firstgroup member (cycle) (3.194125ms)
```

### Why did my check work with recursion?

SpiceDB short-circuits `CheckPermission` when the target subject is found. If the subject is discovered before the maximum depth is reached, the operation completes successfully. However, if the subject isn't found, SpiceDB continues walking and eventually returns the depth error.

### Checking for recursion when writing relationships

Use the `CheckPermission` API to check if the subject contains the resource. For example, before writing `group:someparent#member@group:somechild#member`, check `group:somechild#member@group:someparent#member`. If the parent has permission on the child, adding this relationship would create recursion.
