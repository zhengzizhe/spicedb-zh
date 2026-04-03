::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/data/bulk-operations)
English: [View English version](/en/spicedb/ops/data/bulk-operations)
:::

# 批量导入关系

在初始设置 SpiceDB 集群时，通常需要一个数据导入流程来建立初始关系。虽然可以在循环中使用 `WriteRelationships`，但它有一些限制：使用此方法每次最多只能创建 1,000 个关系（默认），而且每个事务都会创建一个新版本，产生一定的开销。

为了更快地导入，SpiceDB 提供了 `ImportBulkRelationships`，它利用客户端 gRPC 流来加速流程，并消除了一次可写入关系数量的上限。

## 批处理

需要考虑两种批次大小：

1. **请求块大小** - 每个块中写入流的关系数量（网络优化）
2. **事务大小** - 每次请求生命周期中的总关系数量

总关系数量应反映数据存储在单个事务中可以轻松写入的行数。避免将所有关系通过单个请求推送，以防止数据存储超时。

## 示例

### .NET 实现

```csharp
var TOTAL_RELATIONSHIPS_TO_WRITE = 1000;
var RELATIONSHIPS_PER_TRANSACTION = 100;
var RELATIONSHIPS_PER_REQUEST_CHUNK = 10;

// 首先将完整列表分解为一系列块，每个块可以轻松放入数据存储事务中。
var transactionChunks = allRelationshipsToWrite.Chunk(RELATIONSHIPS_PER_TRANSACTION);

foreach (var relationshipsForRequest in transactionChunks) {
    // 对于每个事务块，进一步分解为优化网络吞吐量的块。
    var requestChunks = relationshipsForRequest.Chunk(RELATIONSHIPS_PER_REQUEST_CHUNK);
    // 为此事务块打开到服务器的客户端流
    using var importCall = permissionsService.ImportBulkRelationships();
    foreach (var requestChunk in requestChunks) {
        // 对于每个网络块，写入客户端流。
        // 注意：这里是顺序调用而非并发；可以通过使用任务进一步优化。
        await importCall.RequestStream.WriteAsync(new ImportBulkRelationshipsRequest{
                Relationships = { requestChunk }
                });
    }
    // 完成事务块后，结束调用并处理响应。
    await importCall.RequestStream.CompleteAsync();
    var importResponse = await importCall;
    Console.WriteLine("request successful");
    Console.WriteLine(importResponse.NumLoaded);
    // 重复！
}
```

### Python 实现

```python
from itertools import batched

TOTAL_RELATIONSHIPS_TO_WRITE = 1_000

RELATIONSHIPS_PER_TRANSACTION = 100
RELATIONSHIPS_PER_REQUEST_CHUNK = 10

# 注意：batched 接收一个较大的迭代器，并将其拆分为较小块的迭代器。
# 我们按 RELATIONSHIPS_PER_TRANSACTION 大小迭代块，然后将每个请求分解为
# RELATIONSHIPS_PER_REQUEST_CHUNK 大小的块。
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

完整示例代码可在 authzed-dotnet 仓库中找到。

## 重试和恢复

`ImportBulkRelationships` 的语义仅允许创建关系。如果导入的关系在数据库中已存在，将会报错。这在瞬态故障后的重试中会变得问题突出。

authzed-go 客户端提供了内置重试逻辑的 `RetryableClient`。它通过使用 `Skip` 策略跳过有问题的批次，或使用 `Touch` 策略回退到具有 touch 语义的 `WriteRelationships` 来工作。类似的逻辑可以在其他客户端库中实现。

## 为什么这样设计？

SpiceDB 的 `ImportBulkRelationships` 使用 gRPC 客户端流作为网络优化。重要的是，它不会在接收关系时就将其提交到数据存储，而是在调用开始时打开数据库事务，然后在客户端结束流时提交该事务。

这一设计选择解决了错误处理的挑战。逐步提交的方式会产生语义歧义：你可能收到一个关闭流的错误，但这并不一定意味着你发送的最后一个块就是错误发生的位置。

虽然带有逐块确认的 gRPC 双向流可以改善这一点，但它需要大量的客户端簿记工作。要求使用多个客户端流请求意味着你可以使用正常的语言错误处理流程，并确切地知道哪些数据已写入服务器。
