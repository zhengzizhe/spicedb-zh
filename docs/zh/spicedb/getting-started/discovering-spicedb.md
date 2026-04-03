::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/discovering-spicedb)  
English: [View English version](/en/spicedb/getting-started/discovering-spicedb)
:::

# SpiceDB 文档

欢迎来到 SpiceDB 生态系统的官方文档。

- **新用户？** 请参阅我们的[入门指南](/zh/spicedb/getting-started/first-steps)
- **有疑问？** 我们的 [FAQ](/zh/spicedb/getting-started/faq) 中有解答

## 什么是 SpiceDB？

SpiceDB 是一个开源的、受 [Google Zanzibar](https://research.google/pubs/pub48190/) 启发的数据库系统，专为实时、安全关键型应用权限而设计。

开发者可以创建一个模式（schema）来建模应用程序的资源和权限，然后使用客户端库在应用程序中插入关系或检查权限。

从零开始构建现代授权系统是一项非常复杂的工作，需要领域专家多年的开发经验。在 SpiceDB 出现之前，只有在大型科技公司工作的开发者才能接触到这些工作流程。

现在，我们已经建立了一个围绕共享这项技术的社区，让整个行业都能从中受益。

::: info
在某些场景下，SpiceDB 的运维可能具有一定挑战性，因为它是一个关键的、低延迟的分布式系统。对于希望使用托管 SpiceDB 服务和企业级功能的用户，可以了解 [AuthZed 的产品](https://authzed.com)。
:::

## SpiceDB 的历史

创始人们于 2020 年 8 月离开了 Red Hat（此前 Red Hat 收购了他们的前公司 CoreOS）。他们创建了 Arrakis 项目——第一个用 Python 实现的 API 完整的 Zanzibar 实现，并在 2020 年 9 月的 Y Combinator 申请中进行了演示。该项目于 2021 年 3 月用 Go 语言重写为 "Caladan"，随后于 2021 年 9 月以 SpiceDB 的名称开源发布。

您还可以阅读 Google Zanzibar 项目的历史，它是 SpiceDB 的精神前身和灵感来源。

## SpiceDB 的特性

使 SpiceDB 区别于其他系统的特性包括：

- **丰富的 API**：提供 gRPC 和 HTTP/JSON API，用于检查权限、列出访问权限和支持开发工具
- **分布式架构**：忠实于 Google Zanzibar 论文中描述的架构的分布式并行图引擎
- **灵活的一致性**：可按请求配置的灵活一致性模型，具有对"新敌人问题"的抵抗能力
- **模式语言**：富有表达力的模式语言，配有 Playground 以及用于验证和集成测试的 CI/CD 集成
- **可插拔存储**：可插拔的存储系统，支持内存、Spanner、CockroachDB、PostgreSQL 和 MySQL
- **深度可观测性**：Prometheus 指标、pprof 性能分析、结构化日志和 OpenTelemetry 追踪
