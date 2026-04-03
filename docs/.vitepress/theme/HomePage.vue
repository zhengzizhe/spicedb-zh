<script setup lang="ts">
import { useData } from 'vitepress'

const { isDark, lang } = useData()
const zh = lang.value?.startsWith('zh')

const features = zh ? [
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    title: 'Schema 驱动',
    desc: '使用声明式 Schema 定义权限模型，一种语言覆盖 RBAC、ABAC、ReBAC 等多种访问控制模式',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    title: '全球一致性',
    desc: '基于 Google Zanzibar 论文设计，通过 ZedTokens 确保跨区域的因果一致权限检查',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    title: '极致性能',
    desc: '亚毫秒级权限检查响应，支持水平扩展，久经生产环境验证',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    title: '安全可审计',
    desc: '内置 Watch API 实时追踪权限变更，支持完整的访问控制审计',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8h2"/><path d="M15 8h2"/><path d="M7 12h10"/></svg>`,
    title: '多语言客户端',
    desc: '提供 Go、Python、Java、Ruby、Node.js 等官方客户端库，无缝集成你的技术栈',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    title: '中文社区',
    desc: '由中文开发者社区驱动的完整翻译文档与实战教程，降低学习门槛',
  },
] : [
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>`,
    title: 'Schema Driven',
    desc: 'Declaratively define authorization with a schema language covering RBAC, ABAC, ReBAC and more',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    title: 'Global Consistency',
    desc: 'Built on Google Zanzibar, providing causally consistent permission checks via ZedTokens',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    title: 'High Performance',
    desc: 'Sub-millisecond permission checks with horizontal scaling, battle-tested in production',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>`,
    title: 'Auditable & Secure',
    desc: 'Built-in Watch API for real-time change tracking with full access control audit support',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8h2"/><path d="M15 8h2"/><path d="M7 12h10"/></svg>`,
    title: 'Multi-Language SDKs',
    desc: 'Official client libraries for Go, Python, Java, Ruby, Node.js and more',
  },
  {
    icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    title: 'Chinese Community',
    desc: 'Community-driven Chinese documentation and hands-on tutorials',
  },
]

const schemaExample = `definition user {}

definition document {
    relation owner: user
    relation editor: user
    relation viewer: user

    permission edit = owner + editor
    permission view = edit + viewer
}`

const prefix = zh ? '/zh' : '/en'
</script>

<template>
  <div class="home-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-bg">
        <div class="hero-glow hero-glow-1" />
        <div class="hero-glow hero-glow-2" />
        <div class="hero-glow hero-glow-3" />
      </div>
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot" />
          {{ zh ? '开源权限管理系统' : 'Open Source Authorization' }}
        </div>
        <h1 class="hero-title">
          <span class="title-gradient">SpiceDB</span>
          <br />
          {{ zh ? '中文文档' : 'Documentation' }}
        </h1>
        <p class="hero-desc">
          {{ zh
            ? '基于 Google Zanzibar 论文构建的开源、全球一致的细粒度权限管理系统。本站由中文社区驱动维护。'
            : 'Open source, globally consistent, fine-grained authorization system inspired by Google Zanzibar. Community-driven Chinese documentation.'
          }}
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" :href="`${prefix}/spicedb/getting-started/discovering-spicedb`">
            {{ zh ? '快速开始' : 'Get Started' }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </a>
          <a class="btn btn-secondary" :href="`${prefix}/spicedb/concepts/zanzibar`">
            {{ zh ? '核心概念' : 'Concepts' }}
          </a>
          <a class="btn btn-ghost" href="https://github.com/authzed/spicedb" target="_blank">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="code-window">
          <div class="code-titlebar">
            <span class="dot dot-red" />
            <span class="dot dot-yellow" />
            <span class="dot dot-green" />
            <span class="code-filename">schema.zed</span>
          </div>
          <pre class="code-body"><code>{{ schemaExample }}</code></pre>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="features-header">
        <h2>{{ zh ? '为什么选择 SpiceDB' : 'Why SpiceDB' }}</h2>
        <p>{{ zh ? '为现代应用设计的权限基础设施' : 'Authorization infrastructure designed for modern applications' }}</p>
      </div>
      <div class="features-grid">
        <div v-for="f in features" :key="f.title" class="feature-card">
          <div class="feature-icon" v-html="f.icon" />
          <h3>{{ f.title }}</h3>
          <p>{{ f.desc }}</p>
        </div>
      </div>
    </section>

    <!-- Quick nav -->
    <section class="quick-nav">
      <div class="quick-nav-grid">
        <a :href="`${prefix}/spicedb/getting-started/discovering-spicedb`" class="nav-card">
          <div class="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <h3>{{ zh ? '入门指南' : 'Getting Started' }}</h3>
          <p>{{ zh ? '从零开始了解和部署 SpiceDB' : 'Learn and deploy SpiceDB from scratch' }}</p>
          <span class="nav-arrow">&rarr;</span>
        </a>
        <a :href="`${prefix}/spicedb/modeling/developing-a-schema`" class="nav-card">
          <div class="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          <h3>{{ zh ? '权限建模' : 'Modeling' }}</h3>
          <p>{{ zh ? '设计和开发你的权限 Schema' : 'Design and develop your permission schema' }}</p>
          <span class="nav-arrow">&rarr;</span>
        </a>
        <a :href="`${prefix}/spicedb/ops/operator`" class="nav-card">
          <div class="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
          </div>
          <h3>{{ zh ? '生产运维' : 'Operations' }}</h3>
          <p>{{ zh ? '部署、监控和优化 SpiceDB 集群' : 'Deploy, monitor, and optimize SpiceDB clusters' }}</p>
          <span class="nav-arrow">&rarr;</span>
        </a>
        <a :href="`${prefix}/spicedb/api/http-api`" class="nav-card">
          <div class="nav-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
          </div>
          <h3>{{ zh ? 'API 参考' : 'API Reference' }}</h3>
          <p>{{ zh ? 'gRPC 和 HTTP API 接口文档' : 'gRPC and HTTP API documentation' }}</p>
          <span class="nav-arrow">&rarr;</span>
        </a>
      </div>
    </section>

    <!-- Footer note -->
    <section class="home-footer-note">
      <p>
        {{ zh
          ? '本站为独立的非官方社区项目，由中文社区志愿者维护。'
          : 'This is an independent, unofficial community project maintained by Chinese community volunteers.'
        }}
        <a href="https://authzed.com/docs" target="_blank">
          {{ zh ? '查看官方文档' : 'View official docs' }} &nearr;
        </a>
      </p>
    </section>
  </div>
</template>
