::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/coming-from/opa)  
中文版: [查看中文版](/zh/spicedb/getting-started/coming-from/opa)
:::

# SpiceDB for Open Policy Agent (OPA) Users

::: info
The focus of the content below is not intended to be a competitive analysis, but rather a bridge to understand SpiceDB for existing OPA users.
:::

## Three Core Components of Permissions Systems

Every complete permissions system comprises three major elements:

- **Models** — Define the logic and rules governing actions in the system
- **Data** — Provide context for the action itself (who's doing it, the object of the action, and more)
- **Engine** — Interprets models and data to make access control decisions

## SpiceDB vs OPA

While comparing SpiceDB and OPA is like comparing apples and oranges, both can be analyzed through the lens of these three components to understand each design's approach. SpiceDB and OPA represent fundamentally two different approaches to authorization.

### Models

- **OPA** uses Rego, a declarative query language, for policy definition. Policies are flexible and can express arbitrary logic across many domains.
- **SpiceDB** employs a schema-based approach defining relationships and permissions. The schema language is purpose-built for authorization and models resources, relations, and permissions.

### Data

- **OPA** typically works with structured JSON input data provided at query time or loaded from external sources.
- **SpiceDB** maintains a dedicated relationship-based data model inspired by Google Zanzibar. Relationships are stored within SpiceDB itself and represent connections between objects.

### Engine

- **OPA** evaluates policies against input data using logical inference. It is a general-purpose policy engine.
- **SpiceDB** queries relationship graphs to determine access permissions through specialized, optimized database operations designed for authorization at scale.

## When to Use SpiceDB Instead of OPA

SpiceDB is a better fit when your use case requires:

- **Relationship-based access control at scale** — Permissions modeled as relationships between users and resources
- **Fine-grained permission queries across large datasets** — Efficiently checking and listing access across millions of relationships
- **Built-in relationship storage and versioning** — A dedicated store for authorization data with consistency guarantees
- **Real-time permission evaluation with consistency guarantees** — Resistance to the "New Enemy Problem" and configurable consistency levels

## When to Use OPA Instead of SpiceDB

OPA is a better fit when you need:

- **General-purpose policy evaluation across diverse domains** — Policies that go beyond authorization (e.g., admission control, data filtering, configuration validation)
- **Flexible policy logic without schema constraints** — Arbitrary policy logic expressed in Rego
- **Integration with existing JSON-based systems** — Policy evaluation against existing data structures
- **Simpler deployment for non-relationship-heavy use cases** — Lightweight sidecar or library deployment
