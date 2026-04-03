import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SpiceDB 中文文档',
  description: 'SpiceDB 中文社区文档 - 开源权限管理系统',
  lang: 'zh-CN',

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '快速开始', link: '/guide/getting-started' },
      { text: '核心概念', link: '/concepts/overview' },
      { text: '教程', link: '/tutorials/first-schema' },
      { text: '官方资源', link: 'https://authzed.com/docs' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '入门指南',
          items: [
            { text: '什么是 SpiceDB', link: '/guide/what-is-spicedb' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装部署', link: '/guide/installation' },
          ],
        },
      ],
      '/concepts/': [
        {
          text: '核心概念',
          items: [
            { text: '概览', link: '/concepts/overview' },
            { text: 'Schema 语法', link: '/concepts/schema' },
            { text: '关系与权限', link: '/concepts/relationships' },
            { text: 'API 接口', link: '/concepts/api' },
          ],
        },
      ],
      '/tutorials/': [
        {
          text: '实战教程',
          items: [
            { text: '编写第一个 Schema', link: '/tutorials/first-schema' },
            { text: 'RBAC 权限模型', link: '/tutorials/rbac' },
            { text: 'Google Docs 权限模型', link: '/tutorials/google-docs' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/authzed/spicedb' },
    ],

    footer: {
      message: '本站为独立非官方社区项目，与 Authzed 无隶属关系',
      copyright: 'SpiceDB 是 Authzed 的开源项目',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/your-username/spicedb-zh/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页',
    },

    lastUpdated: {
      text: '最后更新于',
    },

    outline: {
      label: '页面导航',
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },
})
