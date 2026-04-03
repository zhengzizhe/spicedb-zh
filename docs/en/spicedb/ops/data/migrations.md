::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/data/migrations)
中文版: [查看中文版](/zh/spicedb/ops/data/migrations)
:::

# Migrating from SpiceDB to SpiceDB

This documentation covers migrating data between SpiceDB instances with minimal downtime, such as when moving to AuthZed Cloud.

## Important Notes

This guide addresses SpiceDB-to-SpiceDB data migration only. For schema migrations of underlying datastores (Postgres, CockroachDB), or SpiceDB schema changes, refer to separate documentation sections.

::: warning
Direct database-level migration using tools like `pg_dump`/`pg_restore` is not recommended and can break SpiceDB MVCC. When migrating between different datastore types (e.g., Postgres to CockroachDB), you must use SpiceDB APIs (`exportBulk`/`importBulk` or `zed backup`).
:::

## Prerequisites

- zed CLI tool

## Migration Options

### Option 1: With Write Downtime Migration

A straightforward approach incurring write downtime (not read downtime) during backup and restore.

**Steps:**

1. Spin up your new SpiceDB instance
2. Stop writes to the old SpiceDB
3. Run `zed backup create <filename>` against the old SpiceDB
4. Run `zed backup restore <filename>` against the new SpiceDB using the generated backup file
5. Switch reads to the new SpiceDB
6. Start writing to the new SpiceDB

### Option 2: With Near Zero Write Downtime Migration

A more complex approach minimizing write downtime through continuous synchronization.

**Steps:**

1. Spin up your new SpiceDB instance
2. Run `zed backup create <filename>` against the old SpiceDB
3. Run `zed backup restore <filename>` against the new SpiceDB
4. Run `zed backup parse-revision <filename>` to obtain the zed token pointing to the backup revision
5. Using your chosen SpiceDB client library, create a script calling the Watch API continuously, writing each relationship change from the old SpiceDB to the new instance. In the initial API call, provide the zed token as the `optional_start_cursor` in the `WatchRequest` object. Run until ready to stop old writes.
6. Stop writes to the old SpiceDB
7. Wait for the script to receive no more changes (minimal write downtime occurs here)
8. Switch reads and writes to the new SpiceDB
