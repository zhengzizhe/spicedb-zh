::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/coming-from/cancancan)  
English: [View English version](/en/spicedb/getting-started/coming-from/cancancan)
:::

# 面向 Ruby on Rails CanCanCan 用户的 SpiceDB 指南

::: info
以下内容的重点不是竞争分析，而是帮助现有 Rails 用户理解 SpiceDB 的桥梁。
:::

## 权限系统的三个核心组件

每个完整的权限系统都包含三个主要元素：

- **模型（Models）** — 定义系统中控制操作的逻辑和规则
- **数据（Data）** — 为操作本身提供上下文（谁在执行操作、操作的对象等）
- **引擎（Engine）** — 解释模型和数据以做出访问控制决策

SpiceDB 和 CanCanCan 都通过这些组件运作，但实现方式不同。

## SpiceDB 与 CanCanCan 对比

### 模型

- **CanCanCan** 使用 Ruby 类和方法来定义能力（abilities）。能力定义用纯 Ruby 代码编写，使其灵活但与 Rails 应用紧密耦合。
- **SpiceDB** 使用专用的模式语言将权限定义为关系。模式独立于任何应用框架。

### 数据

- **CanCanCan** 将关系数据存储在应用程序数据库中。授权数据与应用数据共存。
- **SpiceDB** 维护一个为权限查询优化的专用关系存储。授权数据与应用数据分离。

### 引擎

- **CanCanCan** 在 Rails 应用进程内同步评估权限。授权在进程内发生。
- **SpiceDB** 提供专用服务来评估复杂的权限查询。授权作为服务被外部化。

## 何时使用 SpiceDB 而非 CanCanCan

当您的应用有以下需求时，请考虑使用 SpiceDB：

- **复杂的层级权限** — 跨组织结构的多个层级管理权限
- **动态关系管理** — 权限频繁变化且需要实时更新
- **大规模性能** — 拥有数百万权限关系的系统
- **跨服务授权** — 多个微服务需要一致的权限评估
- **基于关系的访问控制（ReBAC）** — 基于用户和资源之间关系的权限
- **审计需求** — 对所有权限决策和变更进行详细跟踪
- **多租户** — 为不同客户或组织提供隔离的权限模型

## 何时使用 CanCanCan 而非 SpiceDB

CanCanCan 仍然适用于以下场景：

- **简单的权限模型** — 具有简单的基于角色或基于属性的访问控制的应用
- **单体 Rails 应用** — 不需要微服务架构的单一应用
- **低权限量** — 权限关系数量可控的系统
- **开发速度** — 快速原型开发，gem 提供更快的初始实现
- **最小运维开销** — 不需要外部服务依赖
- **团队熟悉度** — 开发团队已有 CanCanCan 使用经验
- **资源限制** — 没有额外基础设施预算的项目
