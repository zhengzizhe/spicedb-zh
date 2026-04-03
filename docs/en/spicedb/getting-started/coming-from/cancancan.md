::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/coming-from/cancancan)  
中文版: [查看中文版](/zh/spicedb/getting-started/coming-from/cancancan)
:::

# SpiceDB for Ruby on Rails CanCanCan Users

::: info
The focus of the content below is not intended to be a competitive analysis, but rather a bridge to understand SpiceDB for existing Rails users.
:::

## Three Core Components of Permissions Systems

Every complete permissions system comprises three major elements:

- **Models** — Define the logic and rules governing actions in the system
- **Data** — Provide context for the action itself (who's doing it, the object of the action, and more)
- **Engine** — Interprets models and data to make access control decisions

Both SpiceDB and CanCanCan function through these components but implement them differently.

## SpiceDB vs CanCanCan

### Models

- **CanCanCan** uses Ruby classes and methods to define abilities. Ability definitions are written in pure Ruby code, making them flexible but tightly coupled to the Rails application.
- **SpiceDB** uses a dedicated schema language to define permissions as relationships. The schema is independent of any application framework.

### Data

- **CanCanCan** stores relationship data within your application database. Authorization data lives alongside your application data.
- **SpiceDB** maintains a dedicated relationship store optimized for permission queries. Authorization data is separated from application data.

### Engine

- **CanCanCan** evaluates permissions synchronously within your Rails application process. Authorization happens in-process.
- **SpiceDB** provides a dedicated service for evaluating complex permission queries. Authorization is externalized as a service.

## When to Use SpiceDB Instead of CanCanCan

Consider SpiceDB when your application requires:

- **Complex hierarchical permissions** — Managing permissions across multiple levels of organizational structure
- **Dynamic relationship management** — Permissions that change frequently and need real-time updates
- **Performance at scale** — Systems with millions of permission relationships
- **Cross-service authorization** — Multiple microservices that need consistent permission evaluation
- **Relationship-based access control (ReBAC)** — Permissions based on relationships between users and resources
- **Audit requirements** — Detailed tracking of all permission decisions and changes
- **Multi-tenancy** — Isolated permission models for different customers or organizations

## When to Use CanCanCan Instead of SpiceDB

CanCanCan remains well-suited for:

- **Simple permission models** — Applications with straightforward role-based or attribute-based access
- **Monolithic Rails applications** — Single applications without microservice architecture needs
- **Low permission volume** — Systems with manageable numbers of permission relationships
- **Development speed** — Rapid prototyping where gems offer faster initial implementation
- **Minimal operational overhead** — No external service dependencies required
- **Team familiarity** — Existing expertise with CanCanCan across your development team
- **Resource constraints** — Projects without budget for additional infrastructure
