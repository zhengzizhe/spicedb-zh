::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/reflection-apis)
中文版: [查看中文版](/zh/spicedb/concepts/reflection-apis)
:::

# Reflection APIs

## Overview

The Reflection APIs in SpiceDB (starting at version v1.33.0) enable introspection of stored schema and type information to answer questions about schema structure, permissions, and relations.

## ReflectSchema

`ReflectSchema` offers an API-driven method to retrieve the current schema structure stored in SpiceDB. It's designed to allow callers to make dynamic decisions based on schema structure, such as viewing all permissions defined for a particular resource type.

The request accepts optional filters, while the response provides definitions including names, relations, and permissions.

### Filtering

The `ReflectSchemaRequest` supports filters to narrow results to specific schema subsets. For example, filtering can target definitions starting with particular letters.

## DiffSchema

`DiffSchema` provides an API-driven comparison between the currently stored schema in SpiceDB and another schema. This utility is valuable for CI/CD tooling that needs to identify what changes exist between current and future schemas.

The response includes specific diffs, such as documentation comment changes or permission expression modifications.

## DependentRelations

This reflection API lists the relations and permissions used to compute a particular permission. For example, querying the "view" permission on a "resource" returns all relations and permissions it depends on, including those from related definitions.

## ComputablePermissions

`ComputablePermissions` operates inversely to `DependentRelations`. It identifies which permissions are impacted by changes to a specific relation or permission, helping trace downstream effects of schema modifications.
