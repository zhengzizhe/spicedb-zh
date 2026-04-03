# 什么是 SpiceDB

SpiceDB 是一个开源的权限管理数据库，受 [Google Zanzibar](https://research.google/pubs/pub48190/) 论文启发而设计。它提供了一种统一的方式来管理应用程序中的权限和访问控制。

## 为什么选择 SpiceDB

- **统一权限模型**：用一套 Schema 定义所有权限关系，替代散落在代码各处的权限判断逻辑
- **全球一致性**：无论在哪里检查权限，结果都是一致的
- **灵活的权限模型**：支持 RBAC、ABAC、ReBAC 等多种权限模型
- **高性能**：亚毫秒级权限检查，支持水平扩展
- **开源免费**：Apache 2.0 协议，可自由使用和修改

## 核心架构

```
应用程序 → SpiceDB API → Schema + 关系数据 → 权限决策
```

SpiceDB 的工作原理很简单：

1. **定义 Schema**：声明你的资源类型和权限关系
2. **写入关系**：告诉 SpiceDB 谁和什么资源之间有什么关系
3. **检查权限**：向 SpiceDB 查询某个用户是否有权执行某个操作

## 适用场景

- 多租户 SaaS 应用
- 文档协作系统（类似 Google Docs 的权限模型）
- 组织架构与部门权限
- API 网关的访问控制
- 微服务间的权限管理

## 下一步

- [快速开始](/guide/getting-started) — 5 分钟跑起来
- [安装部署](/guide/installation) — 生产环境部署指南
- [核心概念](/concepts/overview) — 深入理解 SpiceDB
