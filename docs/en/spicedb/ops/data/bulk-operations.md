::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/data/bulk-operations)
中文版: [查看中文版](/zh/spicedb/ops/data/bulk-operations)
:::

# Bulk Importing Relationships

When initially setting up a SpiceDB cluster, a data ingest process is typically needed to establish initial relations. While `WriteRelationships` can be used in a loop, it has limitations: you can only create 1,000 relationships (by default) at a time with this approach, and each transaction creates a new revision which incurs a bit of overhead.

For faster ingest, SpiceDB provides `ImportBulkRelationships`, which takes advantage of client-side gRPC streaming to accelerate the process and removes the cap on the number of relations that can be written at once.

## Batching

Two batch sizes require consideration:

1. **Request chunk size** - relationships in each chunk written to the stream (network optimization)
2. **Transaction size** - total relationships per request lifetime

The overall number of relationships should reflect how many rows can easily be written in a single transaction by your datastore. Avoid pushing all relationships through a single request to prevent datastore timeouts.

## Example

### .NET Implementation

```csharp
var TOTAL_RELATIONSHIPS_TO_WRITE = 1000;
var RELATIONSHIPS_PER_TRANSACTION = 100;
var RELATIONSHIPS_PER_REQUEST_CHUNK = 10;

// Start by breaking the full list into a sequence of chunks where each chunk fits easily
// into a datastore transaction.
var transactionChunks = allRelationshipsToWrite.Chunk(RELATIONSHIPS_PER_TRANSACTION);

foreach (var relationshipsForRequest in transactionChunks) {
    // For each of those transaction chunks, break it down further into chunks that
    // optimize for network throughput.
    var requestChunks = relationshipsForRequest.Chunk(RELATIONSHIPS_PER_REQUEST_CHUNK);
    // Open up a client stream to the server for this transaction chunk
    using var importCall = permissionsService.ImportBulkRelationships();
    foreach (var requestChunk in requestChunks) {
        // For each network chunk, write to the client stream.
        // NOTE: this makes the calls sequentially rather than concurrently; this could be
        // optimized further by using tasks.
        await importCall.RequestStream.WriteAsync(new ImportBulkRelationshipsRequest{
                Relationships = { requestChunk }
                });
    }
    // When we're done with the transaction chunk, complete the call and process the response.
    await importCall.RequestStream.CompleteAsync();
    var importResponse = await importCall;
    Console.WriteLine("request successful");
    Console.WriteLine(importResponse.NumLoaded);
    // Repeat!
}
```

### Python Implementation

```python
from itertools import batched

TOTAL_RELATIONSHIPS_TO_WRITE = 1_000

RELATIONSHIPS_PER_TRANSACTION = 100
RELATIONSHIPS_PER_REQUEST_CHUNK = 10

# NOTE: batched takes a larger iterator and makes an iterator of smaller chunks out of it.
# We iterate over chunks of size RELATIONSHIPS_PER_TRANSACTION, and then we break each request into
# chunks of size RELATIONSHIPS_PER_REQUEST_CHUNK.
transaction_chunks = batched(
    all_relationships_to_write, RELATIONSHIPS_PER_TRANSACTION
)
for relationships_for_request in transaction_chunks:
    request_chunks = batched(relationships_for_request, RELATIONSHIPS_PER_REQUEST_CHUNK)
    response = client.ImportBulkRelationships(
        (
            ImportBulkRelationshipsRequest(relationships=relationships_chunk)
            for relationships_chunk in request_chunks
        )
    )
    print("request successful")
    print(response.num_loaded)
```

The complete example code is available in the authzed-dotnet repository.

## Retrying and Resuming

`ImportBulkRelationships` semantics only permit relationship creation. If a relationship is imported that already exists in the database, it will error. This becomes problematic during retries after transient failures.

The authzed-go client provides a `RetryableClient` with built-in retry logic. It works by either skipping offending batches using the `Skip` strategy or falling back to `WriteRelationships` with touch semantics using the `Touch` strategy. Similar logic can be implemented in other client libraries.

## Why Does It Work This Way?

SpiceDB's `ImportBulkRelationships` uses gRPC client streaming as a network optimization. Importantly, it does not commit those relationships to your datastore as it receives them, but rather opens a database transaction at the start of the call and then commits that transaction when the client ends the stream.

This design choice addresses error handling challenges. A commit-as-you-go approach creates ambiguous semantics: you might receive an error that closes the stream, but that doesn't necessarily mean that the last chunk you sent is where the error happened.

While gRPC bidirectional streaming with per-chunk acknowledgments could improve this, it requires substantial client-side bookkeeping. Requiring multiple client-streaming requests means that you can use normal language error-handling flows and know exactly what has been written to the server.
