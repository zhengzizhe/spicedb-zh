::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/data/writing-relationships)
中文版: [查看中文版](/zh/spicedb/ops/data/writing-relationships)
:::

# Writing Relationships

This page provides practical recommendations for writing relationships to SpiceDB. For conceptual information about relationships, refer to the relationships concept page. For improving write resilience, see the resilience documentation.

## Writes: Touch vs Create

### Understanding the Operations

**CREATE** - Inserts a new relationship. If the relationship already exists, the operation will fail with an error.

**TOUCH** - Upserts a relationship. If the relationship already exists, it will do nothing. If it doesn't exist, it will create it.

### Key Differences

| Operation | Behavior on Existing Relationship | Performance | Use Case |
|-----------|-----------------------------------|-------------|----------|
| CREATE | Fails with error | Faster (single insert) | Initial relationship creation |
| TOUCH | Updates/overwrites | Slower (delete + insert) | Idempotent operations |

### Special Considerations

**Expiring Relationships:** When working with expiring relationships, always use TOUCH. If a relationship has expired but hasn't been garbage collected yet, using CREATE will return an error.

**Error Handling:** When using CREATE, be prepared to handle duplicate relationship errors appropriately in your application logic.

## Deleting Relationships

SpiceDB provides two methods for deleting relationships: using the WriteRelationships API with the DELETE operation or using the DeleteRelationships API. Each approach has different behaviors and use cases.

### WriteRelationships with the DELETE Operation

The WriteRelationships API supports a DELETE operation type that allows you to remove specific relationships as part of a batch of relationship updates.

**DELETE** - Removes a relationship. If the relationship does not exist, the operation will silently succeed (no-op).

#### Characteristics

- **Atomic Operations**: Can be combined with other relationship operations (CREATE, TOUCH) in a single atomic transaction
- **Granular Control**: Delete specific relationships alongside creating or updating others
- **Silent Failure**: Does not fail if the relationship doesn't exist
- **Batch Limit**: Subject to the same batch size limits as other WriteRelationships operations (1,000 updates by default)

### DeleteRelationships API

The DeleteRelationships API is a dedicated method for bulk deletion of relationships based on filters rather than specifying individual relationships.

#### Characteristics

- **Filter-Based**: Delete relationships based on resource type, relation, subject type, or combinations thereof
- **Bulk Operations**: Can delete many relationships matching the filter criteria in a single call
- **Separate Transaction**: Operates independently from WriteRelationships
- **Efficient for Mass Deletion**: Optimized for removing large numbers of relationships

## Bulk Import

Check out the Bulk Importing Relationships documentation for additional information.
