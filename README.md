# SpiceDB 中文文档

> 基于 [Google Zanzibar](https://research.google/pubs/pub48190/) 的开源权限管理系统 [SpiceDB](https://github.com/authzed/spicedb) 的非官方中文社区文档。

**在线阅读**: https://zhengzizhe.github.io/spicedb-zh/

## 声明

本站为独立的非官方社区项目，由中文社区志愿者维护，与 [Authzed](https://authzed.com) 官方无隶属关系。官方文档请访问 [authzed.com/docs](https://authzed.com/docs)。

品牌素材的使用遵循 [Authzed Brand Kit](https://authzed.com/brand) 规范。

## 内容

### 翻译文档

完整翻译了 SpiceDB 官方文档，包括：

- **入门指南** — 安装、快速开始、客户端库、FAQ
- **核心概念** — Schema 语言、Relationships、一致性、数据存储、Watch API
- **权限建模** — Schema 开发、验证测试、迁移、访问控制管理
- **运维操作** — Kubernetes Operator、性能优化、可观测性、弹性配置
- **集成** — LangChain、Pinecone、Testcontainers
- **教程** — AI Agent 授权、RAG 管道安全
- **API 参考** — HTTP API

### 社区原创

专门为中文开发者编写的内容：

- **五分钟理解 SpiceDB** — 以 SaaS 多租户为例的快速入门
- **核心概念图解** — 用图解直观理解 Schema / Relationship / Permission
- **SpiceDB vs Casbin** — 与国内最常用的权限库的详细对比和选型建议
- **架构深度解析** — 分布式架构、dispatch 机制、缓存层、存储选型、部署模式
- **一致性与缓存实战** — 新敌人问题、ZedToken 策略、四种一致性级别的实战选择
- **真实场景建模** — SaaS 多租户、Google Docs 共享、电商权限、临时权限

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 参与贡献

欢迎任何形式的贡献：

1. **翻译改进** — 修正翻译错误或优化措辞
2. **内容同步** — 官方文档更新后同步翻译
3. **原创内容** — 编写面向中文开发者的教程和指南
4. **问题反馈** — 在 [Issues](https://github.com/zhengzizhe/spicedb-zh/issues) 中报告问题

### 贡献流程

1. Fork 本仓库
2. 创建分支 (`git checkout -b improve-xxx`)
3. 提交修改 (`git commit -m 'improve: xxx'`)
4. 推送分支 (`git push origin improve-xxx`)
5. 提交 Pull Request

## 技术栈

- [VitePress](https://vitepress.dev/) — 静态站点生成
- [GitHub Pages](https://pages.github.com/) — 托管
- [GitHub Actions](https://github.com/features/actions) — 自动构建部署

## 相关链接

- [SpiceDB GitHub](https://github.com/authzed/spicedb)
- [SpiceDB 官方文档](https://authzed.com/docs)
- [SpiceDB Playground](https://play.authzed.com)
- [SpiceDB Discord 社区](https://authzed.com/discord)
- [Authzed Brand Kit](https://authzed.com/brand)

## 许可

文档内容基于官方文档翻译和社区原创，遵循 [Apache 2.0](https://github.com/authzed/spicedb/blob/main/LICENSE) 许可协议。
