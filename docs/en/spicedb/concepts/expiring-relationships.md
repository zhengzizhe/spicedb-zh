::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/expiring-relationships)
中文版: [查看中文版](/zh/spicedb/concepts/expiring-relationships)
:::

# Expiring Relationships

## Overview

A common use case involves granting users limited-time access to resources. Before SpiceDB v1.4.0, caveats were the recommended approach for time-bound permissions, but they had limitations:

- They required clients to provide a "now" timestamp, adding complexity
- Expired caveats weren't automatically garbage collected, potentially accumulating many caveated relationships in the system

After SpiceDB v1.4.0, relationships can expire after a specified time using RFC 3339 format.

## Schema Configuration

To enable expiration, add `use expiration` at the top of your schema file. Mark relations subject to expiration with `<type> with expiration`:

```txt
use expiration

definition user {}

definition resource {
  relation viewer: user with expiration
}
```

## API Implementation

Use `WriteRelationships` or `BulkImportRelationships` APIs, setting the `OptionalExpiresAt` field.

::: warning
Always use the TOUCH operation when creating or updating expiring relationships. If a relationship has expired but garbage collection hasn't occurred, using CREATE will return an error.
:::

## Playground Usage

Format relationships as:

```
resource:someresource#viewer@user:anne[expiration:2025-12-31T23:59:59Z]
```

Or specify expirations in the Expiration column of the Relationship grid editor.

## CLI Usage

```bash
zed relationship create resource:someresource viewer user:anne \
  --expiration-time "2025-12-31T23:59:59Z"
```

## Garbage Collection

Expired relationships stop being used in permission checks but aren't immediately deleted. GC behavior depends on the datastore:

- **Spanner/CockroachDB**: Built-in SQL row expiration; relationships reclaimed after 24 hours (non-configurable)
- **PostgreSQL/MySQL**: GC job runs every 5 minutes; relationships reclaimed after 24 hours by default (configurable)

::: tip
Reduce the GC window (1-30 minutes) for applications with frequent expiration to improve performance.
:::

## Migration from Caveats

A six-step migration process is available for systems previously using caveats for expiration:

1. Update schema to add `use expiration` and mark relations with `with expiration`
2. Implement dual-write logic: write both caveat-based and expiration-based relationships
3. Backfill existing caveat-based relationships with expiration timestamps
4. Validate that expiration-based relationships work correctly
5. Remove caveat-based write logic
6. Clean up old caveat-based relationships and caveat definitions

## Important Considerations

The datastore's clock determines expiration status. Distributed databases like CockroachDB introduce clock uncertainty, making clock synchronization critical. Amazon Time Sync Service is recommended for on-premises deployments.
