::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/schema)
中文版: [查看中文版](/zh/spicedb/concepts/schema)
:::

# Schema Language

## Overview

A SpiceDB schema defines object types, their relationships, and computed permissions. Schemas use the `.zed` file extension and can be tested in real-time at the [Authzed Playground](https://play.authzed.com).

## Definitions

### Object Type Definitions

Object type definitions represent classes of objects, analogous to class definitions in object-oriented programming. Basic syntax:

```txt
definition document {}
definition group {}
definition user {}
```

Definitions support prefixes for multi-product organizations:

```txt
definition docs/document {}
definition docs/folder {}
definition iam/group {}
definition iam/user {}
```

### Caveat Definitions

Caveats are conditional expressions (true/false) attached to relationships by name. They only consider relationships present when the caveat evaluates to true during permission checks.

```txt
caveat ip_allowlist(user_ip ipaddress, cidr string) {
  user_ip.in_cidr(cidr)
}

definition document {
  relation reader: user with ip_allowlist
}
```

## Relations

Relations define how objects or subjects relate to one another, always requiring a name and allowed subject types.

### Relations to Specific Objects

```txt
definition user {}

definition group {
  /**
   * member defines who is part of a group
   */
  relation member: user
}

definition document {
  /**
   * reader relates a user that is a reader on the document
   */
  relation reader: user
}
```

### Subject Relations

Subject relations allow grants to specific subjects and sets of subjects:

```txt
definition document {
  /**
   * an owner can be a specific user, or the set of members
   * which have that relation to the group
   */
  relation owner: user | group#member
}
```

### Wildcards

Wildcards indicate grants to entire resource types, enabling public access:

```txt
definition document {
  /**
   * viewer can be granted to a specific user or all users
   */
  relation viewer: user | user:*
}
```

::: warning
Use wildcards carefully; only grant to read permissions unless universal writing is intended.
:::

### Naming Relations

Relations should be named as nouns, read as "{relation name} (of the object)":

| Name | Read as |
|------|---------|
| `reader` | reader of the document |
| `writer` | writer of the document |
| `member` | member of the group |
| `parent` | parent of the folder |

## Permissions

Permissions define computed sets of subjects with specific authorization. They require a name and expression using operations:

```txt
definition document {
  relation writer: user
  relation reader: user

  /**
   * edit determines whether a user can edit the document
   */
  permission edit = writer

  /**
   * view determines whether a user can view the document
   */
  permission view = reader + writer
}
```

::: info
Relationships reference relations only, not permissions, allowing permission changes without schema modifications.
:::

### Operations

#### Union (`+`)

Combines relations/permissions into allowed subject sets:

```txt
permission admin = reader + writer
```

#### Intersection (`&`)

Includes only subjects in both relations/permissions:

```txt
permission admin = reader & writer
```

#### Exclusion (`-`)

Removes right-side subjects from left-side results:

```txt
permission can_only_read = reader - writer
```

#### Arrow (`->`)

Traverses parent object permissions:

```txt
definition folder {
  relation reader: user
  permission read = reader
}

definition document {
  relation parent_folder: folder

  permission read = parent_folder->read
}
```

Combined with union:

```txt
permission read = reader + parent_folder->read
```

::: tip
Use permissions (not relations) on arrow right-sides for better readability and nested computation.
:::

##### Subject Relations and Arrows

Arrows operate on relation subjects' objects, not the relation/permission itself. For `parent: group#member`, the arrow `parent->something` refers to the group's `something` permission, ignoring `#member`.

#### .any (Arrow Alias)

`.any` aliases the arrow operation:

```txt
permission read_same = reader + parent_folder.any(read)
```

#### .all (Intersection Arrow)

Intersection arrow requires all left-side subjects have the requested permission/relation:

```txt
definition document {
  relation group: group
  permission view = group.all(member)
}
```

::: warning
Intersection arrows impact performance by loading all results.
:::

### The `self` Keyword

Available in SpiceDB v1.49.0+. Allows subjects to access themselves without explicit relationships:

```txt
use self

definition user {
  relation viewer: user
  permission view = viewer + self
}
```

### Typechecking

The `use typechecking` feature declares and validates permission types, catching silent bugs:

```txt
use typechecking

definition user {}
definition document {
  relation viewer: user
  permission view: user = viewer
}
```

Type annotation syntax:

```
permission <name>: <type1> | <type2> | ... = <expression>
```

Annotations must include all reachable types. Gradual adoption is supported through mixing annotated and non-annotated permissions.

**Single Type Example:**

```txt
use typechecking

definition user {}

definition document {
  relation viewer: user
  permission view: user = viewer
}
```

**Multiple Types Example:**

```txt
use typechecking

definition user {}
definition team {}

definition document {
  relation viewer: user | team
  relation owner: user | team
  permission view: user | team = viewer + owner
}
```

**Arrow Operations Example:**

```txt
use typechecking

definition user {}
definition team {}

definition organization {
  relation member: user | team
}

definition document {
  relation org: organization
  permission view: user | team = org->member
}
```

### Naming Permissions

Permissions should be named as verbs or nouns, read as "(is/can) {permission name} (the object)":

| Name | Read as |
|------|---------|
| `read` | can read the object |
| `write` | can write the object |
| `delete` | can delete the object |
| `member` | is member of the object |

### Private/Internal Identifiers

Underscore-prefixed identifiers (`_`) establish naming conventions for private/internal items:

```txt
definition document {
  relation viewer: user
  relation _internal_viewer: user  // private: internal use only

  permission _can_view = viewer + _internal_viewer  // private: synthetic
  permission view = _can_view  // public API
}
```

Uses include synthetic permissions, internal relations, and implementation details.

#### Identifier Rules

- Begin with lowercase letter (a-z) or underscore (`_`)
- Contain lowercase letters, numbers, underscores after first character
- Length: 3-64 characters, ending with alphanumeric
- Valid: `_ab`, `_private`, `_internal_relation`, `_helper123`
- Invalid: `_` (too short), `_a` (too short), `_trailing_` (ends with underscore)

## Comments

### Documentation Comments

Highly recommended on all definitions, relations, and permissions:

```txt
/**
 * something has some doc comment
 */
```

### Non-doc Comments

```txt
// Some comment
/* Some comment */
```

## Common Patterns

### Group Membership

Apply users or group members to object permissions:

```txt
definition user {}
definition group {
  relation admin: user
  relation member: user
  permission membership = admin + member
}
definition role {
  relation granted_to: user | group#membership
  permission allowed = granted_to
}
```

### Global Admin Permissions

Implement super-admin permissions spanning organizational hierarchies:

```txt
definition platform {
  relation super_admin: user
}

definition organization {
  relation admin: user
  relation platform: platform
  permission admin = admin + platform->super_admin
}
```

### Synthetic Relations

Model relation traversals using intermediate synthetic relations for complex hierarchies.

### Recursive Permissions

Apply permissions recursively across nested objects:

```txt
definition folder {
  relation reader: user
  relation parent: folder
  permission read = reader + parent->read
}
```

### Recursive Permissions Across Different Resource Types

::: warning
Use the same permission name on both resource types for recursive lookups to function correctly.
:::
