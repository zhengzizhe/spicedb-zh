::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/faq)  
中文版: [查看中文版](/zh/spicedb/getting-started/faq)
:::

# Frequently Asked Questions

## Is SpiceDB Open Source?

SpiceDB is developed as an Apache 2.0-licensed open-source, community-first effort. Large contributions follow a proposal and feedback process regardless of contributor status. Other AuthZed projects are typically Apache 2.0 licensed unless forked from other codebases, while example code uses MIT licensing for easy adoption.

Not all AuthZed code is open source. Proprietary code is kept private when functionality is:

- Minimally applicable to the community and tied to enterprise environments
- Connected to AuthZed's infrastructure with limited broader applicability

## Does SpiceDB Secure IT Infrastructure?

SpiceDB is a database designed to be integrated into applications, rather than an IT infrastructure security tool. While some organizations use SpiceDB for homegrown IT use-cases, it typically represents a lower-level solution than needed for most IT scenarios.

For IT-specific use cases, AuthZed recommends tools designed around specific workflows, such as security posture management (Orca, PrismaCloud), governance systems, and access management platforms (Indent, ConductorOne).

## Is SpiceDB a Policy Engine?

SpiceDB is not a policy engine. It was inspired by Google Zanzibar, which popularized Relationship-based Access Control (ReBAC). ReBAC systems provide correctness, performance, and scaling guarantees that are not possible in systems designed purely around policy. Policy engines cannot implement Reverse Indices.

However, SpiceDB supports [Caveats](/en/spicedb/concepts/caveats) as a light-weight form of policy that avoids pitfalls present in many other systems, for scenarios requiring dynamic enforcement.

## How Do I Filter Resources Based on Access Decisions in SpiceDB?

Three approaches exist for resource filtering:

### 1. LookupResources

Use for relatively small numbers of accessible resources. Call `LookupResources` to retrieve all accessible resource IDs, then filter using database queries (e.g., `WHERE id = ANY(ARRAY[...])`). This is the simplest starting approach.

### 2. CheckBulkPermissions

Use when accessible resources exceed `LookupResources` capacity. Fetch candidate result pages from your database, then call `CheckBulkPermissions` to determine which items are accessible. Continue iterating until you have a full page of permitted results. Works well with cursor-based pagination.

### 3. Materialize (Early Access)

For maximum scalability with large datasets or high traffic. Watches permission changes and maintains a local denormalized permission view, enabling simple database JOINs for filtering.

Choose based on scale: start with `LookupResources`, transition to `CheckBulkPermissions` when needed, and consider `Materialize` for the highest performance requirements.

## How Do I Get All Permissions a Subject Has on a Resource?

No direct API answers this question. Instead, use the `CheckBulkPermissions` API, sending a check for each permission you want to verify. This requires updating permission checks when adding new permissions — though calling code would need updating anyway to handle the new permission conceptually.

## How Can I Get Involved with SpiceDB?

The recommended first step is joining the [Discord community](https://authzed.com/discord), a great place to chat with other community members and the maintainers of the software.

For code contributions, consult `CONTRIBUTING.md` in open source projects for details on contributing, good first issues, and development workflows.
