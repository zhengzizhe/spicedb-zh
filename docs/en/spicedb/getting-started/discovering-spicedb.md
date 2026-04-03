::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/discovering-spicedb)  
中文版: [查看中文版](/zh/spicedb/getting-started/discovering-spicedb)
:::

# SpiceDB Documentation

Welcome to the official documentation for the SpiceDB ecosystem.

- **New?** Follow our [first steps guide](/en/spicedb/getting-started/first-steps)
- **Got questions?** Our [FAQ](/en/spicedb/getting-started/faq) has answers

## What is SpiceDB?

SpiceDB is an open-source, [Google Zanzibar](https://research.google/pubs/pub48190/)-inspired database system for real-time, security-critical application permissions.

Developers create a schema that models their application's resources and permissions, and then use client libraries to insert relationships or check permissions in their applications.

Building modern authorization from scratch is non-trivial and requires years of development from domain experts. Until SpiceDB, the only developers with access to these workflows were employed by massive tech companies.

Now we have a community organized around sharing this technology so the entire industry can benefit.

::: info
In some scenarios, SpiceDB can be challenging to operate because it is a critical, low-latency, distributed system. For folks interested in managed SpiceDB services and enterprise functionality, there are [AuthZed's products](https://authzed.com).
:::

## SpiceDB History

The founders left Red Hat (which had acquired their previous company CoreOS) in August 2020. They created project Arrakis, the first API-complete Zanzibar implementation in Python, and demonstrated it during their Y Combinator application in September 2020. The project was rewritten in Go as "Caladan" in March 2021, then open-sourced as SpiceDB in September 2021.

You can also read the history of Google's Zanzibar project, the spiritual predecessor and inspiration for SpiceDB.

## SpiceDB Features

Features that distinguish SpiceDB from other systems include:

- **Expressive APIs**: gRPC and HTTP/JSON APIs for checking permissions, listing access, and powering devtools
- **Distributed Architecture**: A distributed, parallel graph engine faithful to the architecture described in Google's Zanzibar paper
- **Flexible Consistency**: A flexible consistency model configurable per-request with resistance to the "New Enemy Problem"
- **Schema Language**: An expressive schema language with a playground and CI/CD integrations for validation and integration testing
- **Pluggable Storage**: A pluggable storage system supporting in-memory, Spanner, CockroachDB, PostgreSQL, and MySQL
- **Deep Observability**: Prometheus metrics, pprof profiles, structured logging, and OpenTelemetry tracing
