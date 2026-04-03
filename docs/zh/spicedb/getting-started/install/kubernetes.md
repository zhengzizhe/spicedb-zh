::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/getting-started/install/kubernetes)  
English: [View English version](/en/spicedb/getting-started/install/kubernetes)
:::

# 在 Kubernetes 上安装 SpiceDB

SpiceDB 在许多环境中都能很好地运行，但我们建议在生产部署中使用 Kubernetes。

SpiceDB 团队拥有深厚的 Kubernetes 专业知识，源自 CoreOS 和 OpenShift 社区，在此环境中提供增强的支持。该平台包含针对 Kubernetes 部署优化的附加逻辑，例如对等发现等。

## 安装方式

### 1. SpiceDB Operator（推荐用于生产环境）

SpiceDB Operator 是生产环境中首选的部署方式。

**安装 Operator：**

```bash
kubectl apply --server-side -f https://github.com/authzed/spicedb-operator/releases/latest/download/bundle.yaml
```

**创建 SpiceDB 集群：**

```bash
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

如需详细信息，请查阅 [Operator 文档](https://github.com/authzed/spicedb-operator)。

### 2. 使用 kubectl 和自定义清单

对于偏好手动配置的用户：

```bash
kubectl apply --server-side -f https://raw.githubusercontent.com/authzed/examples/main/kubernetes/example.yaml
```

示例清单中包含配置注释。但是，对于生产就绪性，建议使用 Operator。

### 3. Helm（社区维护）

::: warning
没有官方的 Helm chart。社区维护的替代方案可通过 Bushel 获取，不提供官方支持保证。
:::

```bash
helm repo add spicedb-operator-chart https://bushelpowered.github.io/spicedb-operator-chart/
helm repo update
helm upgrade --install $RELEASE spicedb-operator-chart/spicedb-operator
```
