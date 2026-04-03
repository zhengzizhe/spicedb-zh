::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/operator)
English: [View English version](/en/spicedb/ops/operator)
:::

# SpiceDB Operator

SpiceDB Operator 是一个 Kubernetes Operator，用于管理 SpiceDB 集群的安装和生命周期。它是生产环境部署的推荐方式，所有 AuthZed 托管产品都在内部使用该 Operator。

## 主要功能

安装后，Operator 会引入一个名为 `SpiceDBCluster` 的新 Kubernetes 资源，支持以下功能：

- 集中式集群配置管理
- 自动化 SpiceDB 版本升级
- 升级期间零停机数据存储迁移

## 配置

### 标志参数

SpiceDB 配置使用 `SpiceDBCluster` 对象上的 `.spec.config` 字段。CLI 标志会转换为驼峰式格式（例如，`--log-level` 变为 `logLevel`）。

**Operator 专用标志：**

| 标志 | 类型 | 描述 |
|------|------|------|
| `image` | string | 容器镜像规格 |
| `replicas` | string 或 int | 节点数量 |
| `skipMigrations` | string 或 bool | 禁用自动迁移 |
| `tlsSecretName` | string | TLS 凭证 Secret 引用 |
| `dispatchUpstreamCASecretName` | string | CA 验证 Secret |
| `datastoreTLSSecretName` | string | 数据存储 TLS Secret |
| `spannerCredentials` | string | Cloud Spanner 凭证 Secret |
| `extraPodLabels` | string 或 map | 附加 Pod 标签 |
| `extraPodAnnotations` | string 或 map | 附加 Pod 注解 |

### 全局配置

Operator 内置了一个配置文件，位于 `/opt/operator/config.yaml`，定义了允许的镜像、标签和默认值。`disableImageValidation` 设置控制未列出镜像的警告行为。

### 补丁

用户可以通过 `patches` 字段使用 Strategic Merge Patch 或 JSON6902 操作来修改 Operator 创建的资源。多个补丁可以针对同一资源，后面的补丁会覆盖前面的补丁。通配符（`*`）可将补丁应用于所有资源。

### 附加选项

- **CRD 引导**：可选的 `--crds=true` 标志（通常不推荐）
- **静态集群**：`--bootstrap-spicedbs` 标志用于启动时创建集群
- **监控**：调试端点位于 `--debug-addr`（默认 `:8080`），提供 `/metrics`、`/debug/pprof/` 和 `/healthz`

## 更新

### Operator 更新

更新 Operator 非常简单，只需在新版本发布时重新运行 `kubectl apply` 命令即可。

### 集群更新策略

**自动更新**：默认的 SpiceDB 版本将应用于所有未指定明确镜像的集群。仅推荐用于开发环境。

**手动升级**：从 SpiceDB 发布版本中指定明确的容器镜像可以实现受控更新。每个 Operator 版本只了解之前的 SpiceDB 版本，并尽力提供向前兼容性。
