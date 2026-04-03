# Testing RAG Pipelines with Testcontainers and SpiceDB

::: tip
Original page: [authzed.com/docs](https://authzed.com/docs/spicedb/integrations/testcontainers) | [中文版](/zh/spicedb/integrations/testcontainers)
:::

## Overview

End-to-end testing of permission-aware RAG (Retrieval-Augmented Generation) systems requires validating that authorization logic works correctly before production. Testing with real SpiceDB instances ensures permission checks behave exactly as they will in production, catching authorization bugs early in development.

This guide demonstrates how to use [Testcontainers](https://testcontainers.com/) with SpiceDB to create isolated, reproducible integration tests for RAG pipelines. Testcontainers is "an open source library for providing throwaway, lightweight instances of databases, message brokers, web browsers, or just about anything that can run in a Docker container."

## Why Test Permissions in RAG Pipelines

RAG systems retrieve documents from vector databases to augment LLM responses with organizational data. Without proper authorization testing, these systems risk exposing sensitive information to unauthorized users.

### The Testing Gap

Many RAG implementations test retrieval quality but skip authorization testing entirely.

**What most tests verify:** Semantic relevance of retrieved results

**What tests should also verify:** Permission boundaries and authorized access restrictions

Without authorization testing, permission vulnerabilities won't be discovered until production deployment.

## Understanding Testcontainers

Testcontainers provides lightweight, throwaway containers for integration tests. Instead of mocking authorization logic or maintaining shared test infrastructure, you spin up real SpiceDB instances during tests.

### How Testcontainers Works

Each test gets a fresh, isolated SpiceDB container with:

1. **Automatic startup** -- Test framework pulls the SpiceDB image and starts a container
2. **Port mapping** -- Container ports are dynamically mapped to avoid conflicts
3. **Health checks** -- Framework waits for SpiceDB readiness before running tests
4. **Automatic cleanup** -- Container is destroyed after tests complete

This approach eliminates flaky tests caused by shared state, manual setup, or mock inconsistencies.

::: warning Prerequisite
Docker must be running on your system. Install Docker Desktop or Docker Engine before running tests; the framework handles container lifecycle management automatically.
:::

## Setting Up Tests with Testcontainers

The SpiceDB Testcontainer is available in [Python](https://testcontainers.com/modules/spicedb/?language=python) and [Go](https://testcontainers.com/modules/spicedb/?language=go). This guide covers the Python module, which works with Python RAG systems built with LangChain, LlamaIndex, or custom implementations.

### Installing the Python Module

Install the SpiceDB Testcontainer for Python:

```bash
pip install testcontainers-spicedb
```

Also install the SpiceDB Python client:

```bash
pip install authzed
```

### Implementation Example

```python
from testcontainers_spicedb import SpiceDBContainer
from authzed.api.v1 import (
    InsecureClient,
    WriteSchemaRequest,
    CheckPermissionRequest,
    CheckPermissionResponse,
    ObjectReference,
    SubjectReference,
)

# Start a disposable SpiceDB instance
with SpiceDBContainer(image="authzed/spicedb:v1.47.1") as spicedb:
    # Connect using the Authzed Python client (no TLS for local containers)
    client = InsecureClient(
        spicedb.get_endpoint(),
        spicedb.get_secret_key(),
    )

    # Write a minimal schema
    client.WriteSchema(
        WriteSchemaRequest(
            schema="""
            definition user {}

            definition document {
                relation owner: user
                permission read = owner
            }
            """
        )
    )

    # Check a permission (e.g. for a RAG authorization gate)
    response = client.CheckPermission(
        CheckPermissionRequest(
            resource=ObjectReference(
                object_type="document",
                object_id="doc1",
            ),
            permission="read",
            subject=SubjectReference(
                object=ObjectReference(
                    object_type="user",
                    object_id="alice",
                )
            ),
        )
    )

    assert (
        response.permissionship
        == CheckPermissionResponse.PERMISSIONSHIP_NO_PERMISSION
    )
```

### Running Python Tests

Execute tests with pytest:

```bash
pytest test_rag_permissions.py -v
```

For full test examples including relationships, consistency tokens, and post-retrieval filtering in RAG pipelines, see the complete example linked below.

## Related Resources

- [Full example](https://github.com/sohanmaheshwar/testcontainers-spicedb-py/blob/main/examples/full-example.py) -- Complete example using the SpiceDB Testcontainer
- [Using SpiceDB Go Testcontainer](https://www.docker.com/blog/rag-permission-testing-testcontainers-spicedb/) -- Community-created Go Testcontainer module for SpiceDB
