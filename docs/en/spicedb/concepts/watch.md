::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/concepts/watch)
中文版: [查看中文版](/zh/spicedb/concepts/watch)
:::

# Watch API

## Overview

The Watch API in SpiceDB enables clients to monitor changes made to Relationships within the system. Watch events are generated when relationships are created, touched, or deleted through the WriteRelationships, DeleteRelationships, or ImportBulkRelationships APIs.

## Calling Watch

To receive watch changes, call the `Watch` API. This is a streaming API that will continually return all updates to relationships from the time at which the API call was made.

```python
from authzed.api.v1 import (
    Client, WatchRequest
)
from grpcutil import bearer_token_credentials

client = Client(
    "localhost:50051",
    bearer_token_credentials("your-token-here"),
)

watcher = client.Watch(WatchRequest{})
for resp in watcher:
    # process the update
```

### Receiving Historical Updates

Historical updates (i.e. relationship changes in the past) can be retrieved by specifying a ZedToken in the `WatchRequest`:

```python
from authzed.api.v1 import (
    Client, WatchRequest
)
from grpcutil import bearer_token_credentials

client = Client(
    "localhost:50051",
    bearer_token_credentials("your-token-here"),
)

watcher = client.Watch(WatchRequest(
    optional_start_cursor=last_zed_token
))
for resp in watcher:
    # process the update
```

::: info
Historical changes can only be requested until the configured garbage collection window on the underlying datastore. This is typically 24 hours, but may differ based on the datastore used.
:::

### Ensuring Continuous Processing

Because Watch is a streaming API, your code should handle disconnections gracefully.

To ensure continuous processing, the calling client *should* execute the `Watch` call in a loop, sending in the last received ZedToken from `ChangesThrough` if the call disconnects:

```python
from authzed.api.v1 import (
    Client, WatchRequest
)
from grpcutil import bearer_token_credentials

client = Client(
    "localhost:50051",
    bearer_token_credentials("your-token-here"),
)

last_zed_token = None
while not_canceled:
    try:
        watcher = client.Watch(WatchRequest(
            optional_start_cursor=last_zed_token
        ))
        for resp in watcher:
            # process the update
            last_zed_token = resp.changes_through
    except Exception:
        # log exception
        continue
```

### Requesting Checkpoints

If your datastore supports checkpoints, you can also request them. This will help keep the stream alive during periods of inactivity, which is helpful if your SpiceDB instance sits behind a proxy that terminates idle connections.

```python
from authzed.api.v1 import (
    Client,
    WatchRequest,
)
from authzed.api.v1.watch_service_pb2 import WATCH_KIND_INCLUDE_CHECKPOINTS
from grpcutil import bearer_token_credentials

client = Client(
    "localhost:50051",
    bearer_token_credentials("your-token-here"),
)

last_zed_token = None
while not_canceled:
    try:
        watcher = client.Watch(WatchRequest(
            optional_start_cursor=last_zed_token,
            optional_update_kinds=[WATCH_KIND_INCLUDE_CHECKPOINTS]
        ))
        for resp in watcher:
            # process the update
            last_zed_token = resp.changes_through
    except Exception:
        # log exception
        continue
```

## Transaction Metadata

SpiceDB's WriteRelationships and DeleteRelationships APIs support an optional metadata block called Transaction Metadata.

When `optional_transaction_metadata` is specified on the WriteRelationships or DeleteRelationships request, it will be stored and returned alongside the relationships in the Watch API:

```python
from authzed.api.v1 import (
    Client, WatchRequest
)
from grpcutil import bearer_token_credentials

client = Client(
    "localhost:50051",
    bearer_token_credentials("your-token-here"),
)
metadata = Struct()
metadata.update({"request_id": "12345"})
client.WriteRelationships(WriteRelationshipsRequest(
    updates=[
        RelationshipUpdate(
            operation=RelationshipUpdate.Operation.OPERATION_CREATE,
            relationship=Relationship(
                resource=ObjectReference(object_type="document", object_id="somedoc"),
                relation="viewer",
                subject=SubjectReference(
                    object=ObjectReference(
                        object_type="user",
                        object_id="tom",
                    )
                ),
            ),
        ),
    ],
    optional_transaction_metadata=metadata,
))
```

The Watch API response will include the metadata:

```
WatchResponse{
    Updates: [
        { Relationship: "document:somedoc#viewer@user:tom" }
    ],
    OptionalTransactionMetadata: {
        "request_id": "12345"
    }
}
```

This allows callers to correlate write operations and the updates that come from the Watch API.
