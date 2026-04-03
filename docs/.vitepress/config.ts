import { defineConfig, type DefaultTheme } from 'vitepress'

function sidebarGettingStarted(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '入门指南' : 'Getting Started',
      items: [
        { text: zh ? '了解 SpiceDB' : 'Discovering SpiceDB', link: `${prefix}/spicedb/getting-started/discovering-spicedb` },
        { text: zh ? '第一步' : 'First Steps', link: `${prefix}/spicedb/getting-started/first-steps` },
        { text: zh ? '安装 CLI' : 'Installing the CLI', link: `${prefix}/spicedb/getting-started/installing-zed` },
        { text: zh ? '客户端库' : 'Client Libraries', link: `${prefix}/spicedb/getting-started/client-libraries` },
        { text: zh ? '教程：保护博客' : 'Tutorial: Protecting a Blog', link: `${prefix}/spicedb/getting-started/protecting-a-blog` },
        { text: zh ? '常见问题' : 'FAQ', link: `${prefix}/spicedb/getting-started/faq` },
      ],
    },
    {
      text: zh ? '安装' : 'Installation',
      collapsed: false,
      items: [
        { text: 'macOS', link: `${prefix}/spicedb/getting-started/install/macos` },
        { text: 'Docker', link: `${prefix}/spicedb/getting-started/install/docker` },
        { text: 'Kubernetes', link: `${prefix}/spicedb/getting-started/install/kubernetes` },
        { text: 'Ubuntu/Debian', link: `${prefix}/spicedb/getting-started/install/debian` },
        { text: 'RHEL/CentOS', link: `${prefix}/spicedb/getting-started/install/rhel` },
        { text: 'Windows', link: `${prefix}/spicedb/getting-started/install/windows` },
      ],
    },
    {
      text: zh ? '从其他系统迁移' : 'Coming From',
      collapsed: false,
      items: [
        { text: zh ? '从 OPA 迁移' : 'Coming from OPA', link: `${prefix}/spicedb/getting-started/coming-from/opa` },
        { text: zh ? '从 Rails CanCanCan 迁移' : 'Coming from CanCanCan', link: `${prefix}/spicedb/getting-started/coming-from/cancancan` },
      ],
    },
  ]
}

function sidebarConcepts(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '核心概念' : 'Concepts',
      items: [
        { text: 'Google Zanzibar', link: `${prefix}/spicedb/concepts/zanzibar` },
        { text: zh ? 'Schema 语言参考' : 'Schema Language', link: `${prefix}/spicedb/concepts/schema` },
        { text: zh ? '写入关系' : 'Writing Relationships', link: `${prefix}/spicedb/concepts/relationships` },
        { text: zh ? '带条件的关系 (Caveats)' : 'Caveats', link: `${prefix}/spicedb/concepts/caveats` },
        { text: zh ? '过期关系' : 'Expiring Relationships', link: `${prefix}/spicedb/concepts/expiring-relationships` },
        { text: zh ? '查询数据' : 'Querying Data', link: `${prefix}/spicedb/concepts/querying-data` },
        { text: zh ? '命令与参数' : 'Commands & Parameters', link: `${prefix}/spicedb/concepts/commands` },
        { text: zh ? '一致性' : 'Consistency', link: `${prefix}/spicedb/concepts/consistency` },
        { text: zh ? '数据存储' : 'Datastores', link: `${prefix}/spicedb/concepts/datastores` },
        { text: zh ? '数据存储迁移' : 'Datastore Migrations', link: `${prefix}/spicedb/concepts/datastore-migrations` },
        { text: zh ? '反射 API' : 'Reflection APIs', link: `${prefix}/spicedb/concepts/reflection-apis` },
        { text: zh ? '监听变更' : 'Watching Changes', link: `${prefix}/spicedb/concepts/watch` },
      ],
    },
  ]
}

function sidebarModeling(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '权限建模' : 'Modeling',
      items: [
        { text: zh ? '开发 Schema' : 'Developing a Schema', link: `${prefix}/spicedb/modeling/developing-a-schema` },
        { text: zh ? '可组合 Schema' : 'Composable Schemas', link: `${prefix}/spicedb/modeling/composable-schemas` },
        { text: zh ? '表示用户' : 'Representing Users', link: `${prefix}/spicedb/modeling/representing-users` },
        { text: zh ? '验证与测试' : 'Validation & Testing', link: `${prefix}/spicedb/modeling/validation-testing-debugging` },
        { text: zh ? '递归与最大深度' : 'Recursion & Max Depth', link: `${prefix}/spicedb/modeling/recursion-and-max-depth` },
        { text: zh ? '保护列表端点' : 'Protecting List Endpoints', link: `${prefix}/spicedb/modeling/protecting-a-list-endpoint` },
        { text: zh ? '迁移 Schema' : 'Migrating a Schema', link: `${prefix}/spicedb/modeling/migrating-schema` },
        { text: zh ? '访问控制管理' : 'Access Control Management', link: `${prefix}/spicedb/modeling/access-control-management` },
        { text: zh ? '访问控制审计' : 'Access Control Audit', link: `${prefix}/spicedb/modeling/access-control-audit` },
        { text: zh ? '融入属性' : 'Incorporating Attributes', link: `${prefix}/spicedb/modeling/attributes` },
      ],
    },
  ]
}

function sidebarOps(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '运维操作' : 'Operations',
      items: [
        { text: 'Kubernetes Operator', link: `${prefix}/spicedb/ops/operator` },
        { text: zh ? '部署 Operator' : 'Deploying Operator', link: `${prefix}/spicedb/ops/deploying-spicedb-operator` },
        { text: zh ? '部署到 AWS EKS' : 'Deploying to AWS EKS', link: `${prefix}/spicedb/ops/eks` },
        { text: 'Postgres FDW', link: `${prefix}/spicedb/ops/postgres-fdw` },
        { text: zh ? '性能优化' : 'Performance', link: `${prefix}/spicedb/ops/performance` },
        { text: zh ? '提升弹性' : 'Resilience', link: `${prefix}/spicedb/ops/resilience` },
        { text: zh ? '可观测性' : 'Observability', link: `${prefix}/spicedb/ops/observability` },
        { text: zh ? '压力测试' : 'Load Testing', link: `${prefix}/spicedb/ops/load-testing` },
      ],
    },
    {
      text: zh ? '数据操作' : 'Data Operations',
      collapsed: false,
      items: [
        { text: zh ? '批量导入关系' : 'Bulk Importing', link: `${prefix}/spicedb/ops/data/bulk-operations` },
        { text: zh ? '写入关系' : 'Writing Relationships', link: `${prefix}/spicedb/ops/data/writing-relationships` },
        { text: zh ? '实例间迁移' : 'Migrating Instances', link: `${prefix}/spicedb/ops/data/migrations` },
      ],
    },
  ]
}

function sidebarIntegrations(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '集成' : 'Integrations',
      items: [
        { text: 'LangChain & LangGraph', link: `${prefix}/spicedb/integrations/langchain-spicedb` },
        { text: zh ? 'Pinecone 访问控制' : 'Pinecone Access Control', link: `${prefix}/spicedb/integrations/pinecone` },
        { text: zh ? 'Testcontainers 测试 RAG' : 'Testing RAG with Testcontainers', link: `${prefix}/spicedb/integrations/testcontainers` },
      ],
    },
  ]
}

function sidebarTutorials(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? '教程' : 'Tutorials',
      items: [
        { text: zh ? 'AI Agent 授权' : 'AI Agent Authorization', link: `${prefix}/spicedb/tutorials/ai-agent-authorization` },
        { text: zh ? '保护 RAG 管道' : 'Securing RAG Pipelines', link: `${prefix}/spicedb/tutorials/secure-rag-pipelines` },
      ],
    },
  ]
}

function sidebarApi(prefix: string, zh: boolean): DefaultTheme.SidebarItem[] {
  return [
    {
      text: zh ? 'API 参考' : 'API Reference',
      items: [
        { text: 'HTTP API', link: `${prefix}/spicedb/api/http-api` },
      ],
    },
  ]
}

function buildSidebar(prefix: string, zh: boolean): DefaultTheme.Sidebar {
  return {
    [`${prefix}/spicedb/getting-started/`]: sidebarGettingStarted(prefix, zh),
    [`${prefix}/spicedb/concepts/`]: sidebarConcepts(prefix, zh),
    [`${prefix}/spicedb/modeling/`]: sidebarModeling(prefix, zh),
    [`${prefix}/spicedb/ops/`]: sidebarOps(prefix, zh),
    [`${prefix}/spicedb/integrations/`]: sidebarIntegrations(prefix, zh),
    [`${prefix}/spicedb/tutorials/`]: sidebarTutorials(prefix, zh),
    [`${prefix}/spicedb/api/`]: sidebarApi(prefix, zh),
  }
}

export default defineConfig({
  title: 'SpiceDB 中文文档',
  description: 'SpiceDB 中文社区文档 - 开源权限管理系统',
  ignoreDeadLinks: true,
  // If deploying to https://<user>.github.io/spicedb-zh/, set base to '/spicedb-zh/'
  // If using a custom domain or root path, remove or set to '/'
  base: process.env.GITHUB_ACTIONS ? '/spicedb-zh/' : '/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  ],

  locales: {
    zh: {
      label: '中文',
      lang: 'zh-CN',
      link: '/zh/',
      themeConfig: {
        nav: [
          { text: '首页', link: '/zh/' },
          { text: '入门指南', link: '/zh/spicedb/getting-started/discovering-spicedb' },
          { text: '核心概念', link: '/zh/spicedb/concepts/zanzibar' },
          { text: '权限建模', link: '/zh/spicedb/modeling/developing-a-schema' },
          { text: '运维操作', link: '/zh/spicedb/ops/operator' },
          {
            text: '更多',
            items: [
              { text: '集成', link: '/zh/spicedb/integrations/langchain-spicedb' },
              { text: '教程', link: '/zh/spicedb/tutorials/ai-agent-authorization' },
              { text: 'API 参考', link: '/zh/spicedb/api/http-api' },
              { text: '官方文档', link: 'https://authzed.com/docs' },
            ],
          },
        ],
        sidebar: buildSidebar('/zh', true),
        editLink: {
          pattern: 'https://github.com/your-username/spicedb-zh/edit/main/docs/:path',
          text: '在 GitHub 上编辑此页',
        },
        lastUpdated: { text: '最后更新于' },
        outline: { label: '页面导航' },
        docFooter: { prev: '上一页', next: '下一页' },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '深色模式',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Getting Started', link: '/en/spicedb/getting-started/discovering-spicedb' },
          { text: 'Concepts', link: '/en/spicedb/concepts/zanzibar' },
          { text: 'Modeling', link: '/en/spicedb/modeling/developing-a-schema' },
          { text: 'Operations', link: '/en/spicedb/ops/operator' },
          {
            text: 'More',
            items: [
              { text: 'Integrations', link: '/en/spicedb/integrations/langchain-spicedb' },
              { text: 'Tutorials', link: '/en/spicedb/tutorials/ai-agent-authorization' },
              { text: 'API Reference', link: '/en/spicedb/api/http-api' },
              { text: 'Official Docs', link: 'https://authzed.com/docs' },
            ],
          },
        ],
        sidebar: buildSidebar('/en', false),
        editLink: {
          pattern: 'https://github.com/your-username/spicedb-zh/edit/main/docs/:path',
          text: 'Edit this page on GitHub',
        },
        lastUpdated: { text: 'Last updated' },
        outline: { label: 'On this page' },
        docFooter: { prev: 'Previous', next: 'Next' },
      },
    },
  },

  themeConfig: {
    logo: {
      light: '/spicedb-light.svg',
      dark: '/spicedb-dark.svg',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/authzed/spicedb' },
    ],
    search: { provider: 'local' },
    footer: {
      message: '本站为独立非官方社区项目 | Independent community project',
      copyright: 'SpiceDB is an open-source project by Authzed',
    },
  },
})
