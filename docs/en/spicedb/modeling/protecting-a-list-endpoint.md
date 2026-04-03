::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/modeling/protecting-a-list-endpoint)
中文版: [查看中文版](/zh/spicedb/modeling/protecting-a-list-endpoint)
:::

# Protecting a List Endpoint

SpiceDB separates authorization from data concerns, requiring applications to make calls to both the database and SpiceDB when handling list endpoints, then combine the results.

Enforcing authorization on a list endpoint requires making a call to both the database and SpiceDB and combining the queries into a response.

## Approaches

### LookupResources

If the number of resources that a user has access to is small (e.g. less than 10,000 resources), you can use the `LookupResources` API to get the full list of resources for which a user has a particular permission, and then use that as a filtering clause in your database query.

The basic pattern:

1. Call `LookupResources` to get accessible resource IDs
2. Filter database query using those IDs (e.g., `WHERE id = ANY(ARRAY[...])`)
3. Return filtered results

**Trade-off:** This is the simplest approach but performance degrades with large datasets or complex schemas.

### CheckBulkPermissions

If the number of resources that a user has access to is sufficiently large and `LookupResources` can't satisfy the use case anymore, another approach is to fetch a page of resources from your database, and then call `CheckBulkPermissions` on those resources.

The pattern iterates until a full page of accessible results is found:

1. Fetch candidate results from database
2. Check which are accessible via `CheckBulkPermissions`
3. If insufficient accessible results, repeat with new candidates

::: info
It's recommended to run the various `CheckBulkPermissions` API calls at the same revision (using the same ZedToken) to get a consistent view of the permissions.
:::

This approach works better with cursor-based pagination than limit-offset pagination.

### Authzed Materialize

Currently in Early Access. Creates a denormalized local copy of user permissions by:

1. Watching SpiceDB cluster changes
2. Emitting permission gain/loss events
3. Allowing services to JOIN against local materialized views

This approach provides the greatest scalability of the three options.

## Design Consideration

There's a difference between "data exists but the user isn't allowed to see it" and "there is no data to be seen." In a fine-grained authorization system backed by SpiceDB, it often makes sense to treat these as the same, by returning a successful response with an empty result set rather than a 403 error.
