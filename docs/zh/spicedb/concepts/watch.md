::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/watch)
English: [View English version](/en/spicedb/concepts/watch)
:::

# Watch API

## 概述

SpiceDB 中的 Watch API 使客户端能够监控系统中 Relationship 的变更。当通过 WriteRelationships、DeleteRelationships 或 ImportBulkRelationships API 创建、更新或删除 relationship 时，会生成 Watch 事件。

## 调用 Watch

要接收变更通知，请调用 `Watch` API。这是一个流式 API，会持续返回从 API 调用时刻起所有 relationship 的更新。

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
    # 处理更新
```

### 接收历史更新

通过在 `WatchRequest` 中指定 ZedToken，可以检索历史更新（即过去的 relationship 变更）：

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
    # 处理更新
```

::: info
历史变更只能在底层数据存储配置的垃圾回收窗口内请求。通常为 24 小时，但可能因所使用的数据存储而异。
:::

### 确保持续处理

由于 Watch 是流式 API，您的代码应优雅地处理断开连接。

为确保持续处理，调用客户端*应该*在循环中执行 `Watch` 调用，如果连接断开，发送最后收到的来自 `ChangesThrough` 的 ZedToken：

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
            # 处理更新
            last_zed_token = resp.changes_through
    except Exception:
        # 记录异常
        continue
```

### 请求检查点

如果您的数据存储支持检查点，您也可以请求它们。这有助于在不活跃期间保持流的活动状态，当您的 SpiceDB 实例位于会终止空闲连接的代理后面时特别有用。

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
            # 处理更新
            last_zed_token = resp.changes_through
    except Exception:
        # 记录异常
        continue
```

## 事务元数据

SpiceDB 的 WriteRelationships 和 DeleteRelationships API 支持一个名为事务元数据（Transaction Metadata）的可选元数据块。

当在 WriteRelationships 或 DeleteRelationships 请求中指定 `optional_transaction_metadata` 时，它将被存储并随 Watch API 中的 relationship 一起返回：

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

Watch API 响应将包含元数据：

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

这允许调用者将写入操作与来自 Watch API 的更新进行关联。
