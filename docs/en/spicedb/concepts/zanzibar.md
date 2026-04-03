::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/zanzibar)
中文版: [查看中文版](/zh/spicedb/concepts/zanzibar)
:::

# Google Zanzibar

## Introduction

SpiceDB is founded on Google Zanzibar, a groundbreaking authorization framework created by Google for managing authorization at massive scale. The system handles access control for Google's extensive suite of products like Google Docs and Gmail.

A research paper documenting this system was presented at the 2019 USENIX Annual Technical Conference. An [annotated version](https://authzed.com/zanzibar) is available that explains the design concepts and implementation details.

## History

During the 2010s, Google assembled a team to secure objects across SaaS products and internal systems. Since single objects could be managed by multiple systems (core product and search systems), handling end-user access controls required building a new distributed access control system.

In summer 2019, Google researchers published "Zanzibar: Google's Consistent, Global Authorization system," documenting the project that became responsible for authorization across Google's product portfolio.

Originally called "Spice" internally, the project's mission was ensuring "ACLs must flow" — a reference to Dune. Lea Kissner, a co-creator and Dune enthusiast, inspired this naming convention. AuthZed maintained this Dune-themed naming for their own projects.

## Significance

### Popularizing ReBAC

**Relationship-based Access Control (ReBAC)** represents one authorization design paradigm where chains of relationships between subjects and resources determine access. This abstraction can model all existing paradigms, including popular RBAC and ABAC designs.

Carrie Gates originally described this concept in a 2006 paper titled "Access Control Requirements for Web 2.0 Security and Privacy," with Facebook cited as an early adopter. However, ReBAC didn't achieve widespread popularity until the 2019 Zanzibar publication.

Since "Broken Access Control" now ranks highest in OWASP Top 10, ReBAC has become the recommended approach for building correct authorization systems.

For more ReBAC information, see the [Relationships](./relationships) documentation.

### New Enemy Problem

The New Enemy Problem occurs when unauthorized access happens because permission changes and resource updates aren't synchronized consistently. SpiceDB solves this using configurable [consistency](./consistency) and ZedTokens (analogous to Zookies).

The Zanzibar paper introduced "Zookies" to solve this fundamental design challenge:

> "ACL checks must respect the order in which users modify ACLs and object contents to avoid unexpected sharing behaviors. Specifically, our clients care about preventing the 'new enemy' problem, which can arise when we fail to respect the ordering between ACL updates or when we apply old ACLs to new content."

**Example A: Neglecting ACL update order**

1. Alice removes Bob from a folder's ACL
2. Alice asks Charlie to move new documents to the folder with inherited ACLs
3. Bob shouldn't see new documents but might if ACL checks ignore update ordering

**Example B: Misapplying old ACL to new content**

1. Alice removes Bob from a document's ACL
2. Alice asks Charlie to add new content to the document
3. Bob shouldn't see new content but might if the check uses stale ACLs

### Papers We Love Presentation

On June 28, 2021, Zanzibar was presented to Papers We Love's New York City chapter via video.

## Differences with SpiceDB

SpiceDB maintains fidelity to Zanzibar's design principles while removing assumptions about Google's internal infrastructure. This flexibility accommodates different users and software stacks. For instance, SpiceDB supports complex user systems, while Zanzibar requires uint64 user identifiers.

SpiceDB prioritizes developer experience since it's not mandated company-wide. The Schema Language and Playground significantly improve upon directly manipulating Protocol Buffers like Google does.

The [Annotated Zanzibar paper](https://authzed.com/zanzibar) highlights specific differences between SpiceDB and Zanzibar.

### Schema Language

Zanzibar examples use Protocol Buffers text-format for Namespace Configs. Google developed extensive Protocol Buffer tooling for generating these.

SpiceDB provides a [Schema Language](./schema) that internally compiles into Namespace Configs.

### Distinguishing Relations from Permissions

Zanzibar doesn't disambiguate between relations defining access and abstract relationships. SpiceDB introduces distinct concepts: Relations and Permissions.

Permissions function as the "public API" for applications to check access, using set semantics called "computed usersets."

Relations are purely abstract object relationships in SpiceDB. While queryable through the API, the recommendation is calling only Permissions, which can be updated backwards compatibly.

This distinction allowed SpiceDB to eliminate the confusing `_this` keyword from Zanzibar userset rewrites.

### Reverse Indices

Both Zanzibar and SpiceDB implement a "Reverse Index Expand" API. However, this returns an awkward tree structure for applications, especially when avoiding permission logic in application code.

SpiceDB offers additional APIs: LookupResources and LookupSubjects, answering:

- "What resources can this subject access?"
- "What subjects can access this resource?"

These APIs return flattened result lists for easier consumption.

### Datastores

Zanzibar supports only Google's internal Spanner service for tuple-storage.

SpiceDB supports multiple [datastores](./datastores), including Cloud Spanner.

### Consistency

Zanzibar supports ContentChangeCheck API and "at least as fresh" Zookie specifications.

SpiceDB simplifies this by allowing API requests to specify [consistency](./consistency) behavior while implementing ZedTokens, Zanzibar's Zookie equivalent.

### Identifiers

SpiceDB allows more flexible character-sets for Object IDs than Zanzibar.

Object Types follow: `^([a-z][a-z0-9_]{1,61}[a-z0-9]/)*[a-z][a-z0-9_]{1,62}[a-z0-9]$`

Object IDs follow: `^(([a-zA-Z0-9/_|\-=+]{1,})|\*)$`

### Users

At Google, GAIA (Google Accounts and ID Administration) provides 64-bit integer identifiers for all users and services. Zanzibar assumes users can be represented by GAIA IDs.

Since users aren't rigidly defined externally, SpiceDB treats users as regular objects, supporting more complex user systems and powerful queries.

Example schema modeling users and API keys:

```txt
definition ApiKey {}
definition User {
  relation keys: ApiKey
}
```

Relations and permissions now work with either type:

```txt
definition Post {
  relation viewer: User
  ...
  permission view = viewer + viewer->keys
}
```

Developers don't need per-app logic resolving API Keys since SpiceDB handles it.

### Terminology

| Zanzibar Term | SpiceDB Term |
|---|---|
| Tuple | Relationship |
| Namespace | Object Type |
| Namespace Config | Object Definition |
| Userset | Subject Reference |
| User | Subject Reference |
| Zookie | ZedToken |
| Tupleset | Relationship Set |
| Tupleset Filter | Relationship Filter |

## FAQ

### Is Zanzibar the same as ReBAC?

Though closely associated, they differ. Zanzibar is Google's authorization system while ReBAC is an authorization model emphasizing object relationships for access determination.

Zanzibar uses ReBAC as its underlying authorization model — making Zanzibar a ReBAC system plus infrastructure, algorithms, and optimizations enabling operation at Google's scale.

## Related Technologies

- **Spanner**: Zanzibar's datastore
- **CockroachDB**: Open-source Spanner-inspired database used by SpiceDB
- **Slicer**: Zanzibar's dynamic sharding system preventing hotspots
- **F1**: Google Ads backend cited in Spanner performance metrics
