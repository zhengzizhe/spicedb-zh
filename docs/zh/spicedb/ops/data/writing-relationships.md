::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/data/writing-relationships)
English: [View English version](/en/spicedb/ops/data/writing-relationships)
:::

# 写入关系

本页面提供向 SpiceDB 写入关系的实用建议。有关关系的概念信息，请参阅关系概念页面。有关提升写入弹性的内容，请参阅弹性文档。

## 写入操作：Touch 与 Create

### 理解操作

**CREATE** - 插入新关系。如果关系已存在，操作将失败并返回错误。

**TOUCH** - 更新插入关系。如果关系已存在，则不执行任何操作。如果不存在，则创建它。

### 主要区别

| 操作 | 对已存在关系的行为 | 性能 | 使用场景 |
|------|-------------------|------|---------|
| CREATE | 失败并返回错误 | 更快（单次插入） | 初始关系创建 |
| TOUCH | 更新/覆盖 | 较慢（先删除再插入） | 幂等操作 |

### 特殊注意事项

**过期关系：** 处理过期关系时，始终使用 TOUCH。如果关系已过期但尚未被垃圾回收，使用 CREATE 将返回错误。

**错误处理：** 使用 CREATE 时，请准备好在应用逻辑中适当处理重复关系错误。

## 删除关系

SpiceDB 提供两种删除关系的方法：使用 WriteRelationships API 的 DELETE 操作，或使用 DeleteRelationships API。每种方法有不同的行为和使用场景。

### 使用 WriteRelationships 的 DELETE 操作

WriteRelationships API 支持 DELETE 操作类型，允许你在一批关系更新中删除特定关系。

**DELETE** - 删除关系。如果关系不存在，操作将静默成功（无操作）。

#### 特性

- **原子操作**：可以在单个原子事务中与其他关系操作（CREATE、TOUCH）组合使用
- **精细控制**：在创建或更新其他关系的同时删除特定关系
- **静默失败**：如果关系不存在不会失败
- **批次限制**：受与其他 WriteRelationships 操作相同的批次大小限制（默认 1,000 次更新）

### DeleteRelationships API

DeleteRelationships API 是一个专用方法，用于基于过滤器批量删除关系，而不是指定单个关系。

#### 特性

- **基于过滤器**：根据资源类型、关系、主体类型或其组合删除关系
- **批量操作**：可以在单次调用中删除匹配过滤条件的多个关系
- **独立事务**：独立于 WriteRelationships 运行
- **高效批量删除**：针对删除大量关系进行了优化

## 批量导入

查看批量导入关系文档获取更多信息。
