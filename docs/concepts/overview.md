# 核心概念概览

理解 SpiceDB 需要掌握以下核心概念。

## Zanzibar 模型

SpiceDB 基于 Google 的 [Zanzibar 论文](https://research.google/pubs/pub48190/)，这是 Google 内部用于管理数十亿权限关系的系统。核心思想是：

> 将权限表达为**关系的图**，通过遍历图来判断权限。

## 四个核心概念

### 1. Object（对象）

系统中需要被保护的资源。每个对象由**类型**和 **ID** 组成：

```
document:readme
folder:projects
organization:acme
```

### 2. Subject（主体）

发起操作的实体，通常是用户，也可以是其他对象：

```
user:alice
team:engineering#member
```

### 3. Relation（关系）

对象和主体之间的连接：

```
document:readme#viewer@user:alice
// 含义：alice 是 readme 文档的 viewer
```

### 4. Permission（权限）

由关系**计算**得出的布尔结果：

```zed
permission view = viewer + editor
// 含义：viewer 或 editor 都拥有 view 权限
```

## 工作流程

```
1. 定义 Schema（类型、关系、权限）
       ↓
2. 写入关系数据（谁和什么资源有什么关系）
       ↓
3. 检查权限（某用户能否对某资源执行某操作）
```

## 与传统 RBAC 的区别

| 特性 | 传统 RBAC | SpiceDB |
|------|----------|---------|
| 权限定义 | 硬编码在代码中 | Schema 声明式定义 |
| 关系类型 | 只有角色 | 任意关系（ReBAC） |
| 权限继承 | 手动实现 | Schema 自动推导 |
| 一致性 | 取决于实现 | 全局一致性保证 |
| 可审计 | 困难 | 关系数据可查询 |

## 下一步

- [Schema 语法](/concepts/schema) — 学习如何编写 Schema
- [关系与权限](/concepts/relationships) — 深入理解关系模型
- [API 接口](/concepts/api) — 了解如何调用 SpiceDB
