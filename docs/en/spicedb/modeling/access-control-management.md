::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/access-control-management)
中文版: [查看中文版](/zh/spicedb/modeling/access-control-management)
:::

# Access Control Management

This page explains how to implement access control management interfaces in applications, allowing privileged users to visualize and modify permissions for other users using SpiceDB APIs.

## Resource-Specific Access Control Management

When building UI tools for managing user access over resources, common features include:

- Listing all users assigned with their role
- Listing fine-grained permissions a user may have

## Coarse-Grained Access Control

Coarse-grained access control uses traditional role-based access control (like GitHub's model) where roles are assigned to users over resources.

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

### Implementation

Use the `ReadRelationships` API. For limited role sets, query each role individually:

```bash
zed relationship read repository:kubernetes role_reader
zed relationship read repository:kubernetes role_writer
zed relationship read repository:kubernetes role_adminer
```

### Dynamic Role Discovery

Instead of hard-coding roles, use `ExperimentalReflectSchema` with schema filters to dynamically discover available relations:

- Set `optional_definition_name_filter` to `repository`
- Set `optional_relation_name_filter` to `role_`

This returns all matching role relations, then issue `ReadRelationships` requests for each returned role.

## Fine-Grained Access Control

Fine-grained access control implements a custom role model where individual permissions are customizable per role, rather than using pre-defined roles.

### Schema Example

```txt
definition user {}

definition repository {
  relation grants: role_grant

  permission create_issue = grants->create_issue
}

definition role_grant {
  relation role: role
  relation grantee: user | team#user

  permission create_issue = role->create_issue & grantee
  permission delete_issue = role->delete_issue & grantee
}

definition role {
  relation create_issue: user:*
  relation delete_issue: user:*
}
```

### Implementation

Query role grants for a resource:

```bash
# Returns the role grants over the kubernetes repository
zed relationship read repository:kubernetes grants
```

To list individual permissions instead of roles:

```bash
# Returns the role of the grant
zed relationship read role_grant:my_role_grant role

# Returns the fine-grained permissions of the role
zed relationship read role:my_role
```

The resource relation of each list item represents all fine-grained permissions for that role.
