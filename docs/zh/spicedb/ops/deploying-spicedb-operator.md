::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/deploying-spicedb-operator)
English: [View English version](/en/spicedb/ops/deploying-spicedb-operator)
:::

# 部署 SpiceDB Operator

SpiceDB Operator 是生产环境 SpiceDB 部署的推荐方式。本指南将引导你将其部署到 Kubernetes 集群，并通过基本的 SpiceDB 设置验证功能。

## 步骤

### 创建或配置 Kubernetes 集群

你需要一个已配置 `kubectl` 的可用 Kubernetes 集群。对于生产环境部署，请使用托管服务，如 EKS、GKE 或 AKS。对于本地开发，可以使用 kind、OrbStack、Docker Desktop 或 minikube。

### 应用 Operator 清单

验证当前集群上下文：

```sh
kubectl config current-context
```

部署 Operator：

```sh
kubectl apply --server-side -k github.com/authzed/spicedb-operator/config
```

所有资源将部署到 `spicedb-operator` 命名空间。

确认部署状态：

```sh
kubectl -n spicedb-operator get pods
```

### 创建 SpiceDBCluster

::: warning
以下配置是基础配置，不适合生产环境使用。请勿在生产环境中使用这些值。
:::

应用集群和 Secret：

```sh
kubectl apply --server-side -f - <<EOF
apiVersion: authzed.com/v1alpha1
kind: SpiceDBCluster
metadata:
  name: dev
spec:
  config:
    datastoreEngine: memory
    secretName: dev-spicedb-config
---
apiVersion: v1
kind: Secret
metadata:
  name: dev-spicedb-config
stringData:
  preshared_key: "averysecretpresharedkey"
EOF
```

### 连接和验证

转发端口：

```sh
kubectl port-forward deployment/dev-spicedb 50051:50051
```

如需安装 Zed CLI，然后创建本地上下文：

```sh
zed context set local localhost:50051 "averysecretpresharedkey" --insecure
```

测试部署：

```sh
zed schema read
```

预期错误输出（表示连接成功）：

```
code = NotFound
desc = No schema has been defined; please call WriteSchema to start
```

### 生产环境部署

本指南创建的是单节点、内存存储的部署，没有持久化。生产环境部署需要配置以下内容：

- TLS 支持
- 持久化数据存储后端
- Ingress 配置

请参考 SpiceDB Operator 文档或社区示例仓库获取完整的生产环境示例。
