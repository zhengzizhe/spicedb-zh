::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/faq)  
English: [View English version](/en/spicedb/getting-started/faq)
:::

# 常见问题

## SpiceDB 是开源的吗？

SpiceDB 是以 Apache 2.0 许可证开发的开源、社区优先的项目。无论贡献者身份如何，大型贡献都需要经过提案和反馈流程。其他 AuthZed 项目通常也使用 Apache 2.0 许可证（除非是从其他代码库分叉的），而示例代码使用 MIT 许可证以便于采用。

并非所有 AuthZed 代码都是开源的。当功能符合以下情况时，专有代码将保持私有：

- 对社区的适用性极低，且与企业环境绑定
- 与 AuthZed 的基础设施相关，且更广泛的适用性有限

## SpiceDB 能保护 IT 基础设施吗？

SpiceDB 是一个设计用于集成到应用程序中的数据库，而非 IT 基础设施安全工具。虽然一些组织将 SpiceDB 用于自建的 IT 用例，但对于大多数 IT 场景来说，它通常是一个比所需更底层的解决方案。

对于 IT 特定的用例，AuthZed 推荐使用围绕特定工作流程设计的工具，例如安全态势管理（Orca、PrismaCloud）、治理系统和访问管理平台（Indent、ConductorOne）。

## SpiceDB 是策略引擎吗？

SpiceDB 不是策略引擎。它受 Google Zanzibar 的启发，Zanzibar 推广了基于关系的访问控制（ReBAC）。ReBAC 系统提供了在纯粹基于策略设计的系统中不可能实现的正确性、性能和扩展性保证。策略引擎无法实现反向索引。

不过，SpiceDB 支持[条件约束（Caveats）](/zh/spicedb/concepts/caveats)作为一种轻量级的策略形式，避免了许多其他系统中存在的陷阱，适用于需要动态执行的场景。

## 如何在 SpiceDB 中基于访问决策过滤资源？

存在三种资源过滤方法：

### 1. LookupResources

适用于可访问资源数量相对较少的情况。调用 `LookupResources` 获取所有可访问的资源 ID，然后使用数据库查询进行过滤（例如 `WHERE id = ANY(ARRAY[...])`）。这是最简单的起步方法。

### 2. CheckBulkPermissions

当可访问资源超出 `LookupResources` 的容量时使用。从数据库获取候选结果页面，然后调用 `CheckBulkPermissions` 确定哪些项目可访问。持续迭代直到获得完整的已授权结果页面。与基于游标的分页配合使用效果良好。

### 3. Materialize（抢先体验）

适用于大数据集或高流量场景以实现最大可扩展性。监视权限变更并维护本地反规范化的权限视图，实现简单的数据库 JOIN 过滤。

根据规模选择：从 `LookupResources` 开始，在需要时过渡到 `CheckBulkPermissions`，对于最高性能要求则考虑 `Materialize`。

## 如何获取一个主体对某个资源的所有权限？

没有直接的 API 能回答这个问题。相反，请使用 `CheckBulkPermissions` API，为您想验证的每个权限发送一个检查请求。这需要在添加新权限时更新权限检查——不过调用代码无论如何都需要更新以在概念上处理新权限。

## 如何参与 SpiceDB 社区？

建议的第一步是加入 [Discord 社区](https://authzed.com/discord)，这是一个与其他社区成员和软件维护者交流的好地方。

对于代码贡献，请查阅开源项目中的 `CONTRIBUTING.md`，了解贡献详情、适合新手的 issue 和开发工作流程。
