::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/install/kubernetes)  
中文版: [查看中文版](/zh/spicedb/getting-started/install/kubernetes)
:::

# Installing SpiceDB on Kubernetes

SpiceDB runs great in many environments, but our recommendation is to use Kubernetes in production deployments.

The SpiceDB team has deep Kubernetes expertise and originated from CoreOS and OpenShift communities, providing enhanced support in this environment. The platform includes additional logic for things such as peer discovery optimized for Kubernetes deployments.

## Installation Methods

### 1. SpiceDB Operator (Recommended for Production)

The SpiceDB Operator is the preferred deployment approach for production environments.

**Install the operator:**

```bash
kubectl apply --server-side -f https://github.com/authzed/spicedb-operator/releases/latest/download/bundle.yaml
```

**Create a SpiceDB cluster:**

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

For comprehensive details, consult the [operator documentation](https://github.com/authzed/spicedb-operator).

### 2. kubectl with Custom Manifests

For users preferring manual configuration:

```bash
kubectl apply --server-side -f https://raw.githubusercontent.com/authzed/examples/main/kubernetes/example.yaml
```

The example manifests include configuration comments. However, using the operator is recommended for production readiness.

### 3. Helm (Community-Maintained)

::: warning
No official Helm chart exists. A community-maintained alternative is available through Bushel and carries no official support guarantees.
:::

```bash
helm repo add spicedb-operator-chart https://bushelpowered.github.io/spicedb-operator-chart/
helm repo update
helm upgrade --install $RELEASE spicedb-operator-chart/spicedb-operator
```
