::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/migrating-schema)
中文版: [查看中文版](/zh/spicedb/modeling/migrating-schema)
:::

# Migrating a Schema

SpiceDB processes all calls to the WriteSchema API in a **safe** manner: it is not possible to break the type safety of a schema.

This page covers SpiceDB schema migrations specifically. It does not cover datastore schema migrations (Postgres, CockroachDB, etc.) or migrations between SpiceDB instances.

## Safe Migrations (Always Allowed)

### Adding a New Relation

New relations can be added without affecting existing types or computations:

```txt
definition resource {
  relation existing: user
  relation newrelation: user
  permission view = existing
}
```

### Changing a Permission

Permission computation can be modified as long as the expression references defined permissions or relations:

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer + editor
}
```

### Adding Subject Types to Relations

New allowed subject types can be added to existing relations:

```txt
definition resource {
  relation viewer: user | group#member
  permission view = viewer
}
```

### Deleting a Permission

Permissions can be removed if not referenced by other permissions or relations. However, external API callers must be verified through CI systems to ensure they're not still using removed permissions.

## Contingent Migrations (Require Additional Steps)

### Removing a Relation

A relation can only be removed if:
- ALL relationships referencing it are deleted
- It's not referenced by other relations or permissions

**Process:**

1. Update schema to remove the relation from permissions, call WriteSchema
2. Execute `DeleteRelationships` API call to remove all relationships for that relation
3. Update schema to remove the relation entirely, call WriteSchema

**Example:** Removing `relation editor`:

Starting schema:

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer + editor
}
```

Step 1 -- Remove from permission:

```txt
definition resource {
  relation viewer: user
  relation editor: user
  permission view = viewer
}
```

Step 2 -- Delete all editor relationships via API.

Step 3 -- Remove the relation:

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

### Removing an Allowed Subject Type

Subject types can only be removed after deleting all relationships using that type.

**Process:**

1. Execute `DeleteRelationships` API call to remove all relationships with that subject type
2. Update schema to remove the subject type, call WriteSchema

**Example:** Removing `group#member` from viewer:

Before:

```txt
definition resource {
  relation viewer: user | group#member
  permission view = viewer
}
```

After:

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

## Migrating Data Between Relations

To migrate relationships from one relation to another, follow this structured multi-step approach:

**Example:** Migrating from `relation viewer` to `relation new_viewer`.

Starting schema:

```txt
definition resource {
  relation viewer: user
  permission view = viewer
}
```

**Steps:**

1. **Add the new relation** and include it in relevant permissions:

```txt
definition resource {
  relation viewer: user
  relation new_viewer: user2
  permission view = viewer + new_viewer
}
```

2. **Update the application** to write to both relations simultaneously, ensuring complete data coverage.

3. **Backfill relationships** by copying all relevant data to the new relation.

4. **Drop the old relation from permissions:**

```txt
definition resource {
  relation viewer: user
  relation new_viewer: user2
  permission view = new_viewer
}
```

5. **Update the application** to stop writing to the old relation.

6. **Delete the old relation** following the removal process outlined above.
