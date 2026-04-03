::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/datastore-migrations)
中文版: [查看中文版](/zh/spicedb/concepts/datastore-migrations)
:::

# Datastore Migrations

## Overview

SpiceDB releases occur regularly with updates published to the GitHub releases page and announced via Twitter and Discord. While transitioning between versions is often straightforward, releases involving datastore changes require users to execute migration commands.

This page addresses migrating the datastore schema underlying SpiceDB. For information about migrating between SpiceDB instances, refer to the instance migration documentation. For SpiceDB schema changes requiring migration, see the schema migration guide.

## Migration Requirements

Before using a datastore with SpiceDB or running a new version, all available migrations must be executed. All supported datastores (CockroachDB, MySQL, PostgreSQL, Spanner) support migrations, with memdb being the exception since it doesn't persist data.

**Migration Command:**

```bash
spicedb datastore migrate head \
  --datastore-engine $DESIRED_ENGINE \
  --datastore-conn-uri $CONNECTION_STRING
```

In most cases, this command avoids downtime, though verification in non-production environments is recommended before production execution.

## Migration Compatibility

SpiceDB verifies on startup that its desired datastore migration tag matches the tag stored in the datastore. If they differ, SpiceDB returns an error. This check occurs only at startup, meaning new migrations won't break existing instances unless they restart, provided DDL remains compatible.

SpiceDB maintains compatibility across each version and its following minor version. For major version updates, users should consult the target release's upgrade notes for additional requirements.

### Overriding Migration Compatibility

In specific circumstances, running a SpiceDB version against a different datastore migration is possible. If compatibility is confirmed, use the `--datastore-allowed-migrations` flag:

```bash
spicedb serve <...> \
  --datastore-allowed-migrations add-expiration-support \
  --datastore-allowed-migrations add-transaction-metadata-table
```

## Recommendations

**Managed Service:** AuthZed offers SpiceDB as a managed service where zero-downtime migrations are always performed.

**Operator:** The SpiceDB Operator is the recommended update approach for self-operated instances.

**Sequential Updates:** Users should update sequentially through SpiceDB minor versions to avoid missing critical release instructions. The SpiceDB Operator automates this process.

**Rolling Deployments:** A deployment orchestrator coordinating rolling updates prevents traffic loss. SpiceDB was developed with Kubernetes in mind but supports other platforms.
