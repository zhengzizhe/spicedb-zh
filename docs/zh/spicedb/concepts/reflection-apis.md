::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/concepts/reflection-apis)
English: [View English version](/en/spicedb/concepts/reflection-apis)
:::

# 反射 API（Reflection APIs）

## 概述

SpiceDB 中的反射 API（从 v1.33.0 版本开始）支持对存储的 Schema 和类型信息进行内省，以回答有关 Schema 结构、权限和关系的问题。

## ReflectSchema

`ReflectSchema` 提供了一种 API 驱动的方法来检索当前存储在 SpiceDB 中的 Schema 结构。它旨在允许调用者根据 Schema 结构做出动态决策，例如查看为特定资源类型定义的所有权限。

请求接受可选的过滤器，而响应提供包含名称、关系和权限的定义。

### 过滤

`ReflectSchemaRequest` 支持过滤器，将结果缩小到特定的 Schema 子集。例如，过滤可以针对以特定字母开头的定义。

## DiffSchema

`DiffSchema` 提供了当前存储在 SpiceDB 中的 Schema 与另一个 Schema 之间的 API 驱动比较。这个工具对于需要识别当前 Schema 和未来 Schema 之间存在哪些变更的 CI/CD 工具非常有价值。

响应包括具体的差异，例如文档注释的变更或权限表达式的修改。

## DependentRelations

此反射 API 列出用于计算特定权限的关系和权限。例如，查询 "resource" 上的 "view" 权限会返回它所依赖的所有关系和权限，包括来自相关定义的那些。

## ComputablePermissions

`ComputablePermissions` 与 `DependentRelations` 操作相反。它识别哪些权限会受到特定关系或权限变更的影响，帮助追踪 Schema 修改的下游效果。
