::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/deploying-spicedb-operator)
中文版: [查看中文版](/zh/spicedb/ops/deploying-spicedb-operator)
:::

# Deploying the SpiceDB Operator

The SpiceDB Operator is the recommended approach for production SpiceDB deployments. This guide walks through deploying it to a Kubernetes cluster and validating functionality through a basic SpiceDB setup.

## Steps

### Create or Configure a Kubernetes Cluster

You need `kubectl` configured for an available Kubernetes cluster. For production deployments, use managed services such as EKS, GKE, or AKS. For local development, options include kind, OrbStack, Docker Desktop, or minikube.

### Apply the Operator Manifests

Verify your current cluster context:

```sh
kubectl config current-context
```

Deploy the operator:

```sh
kubectl apply --server-side -k github.com/authzed/spicedb-operator/config
```

All resources deploy to the `spicedb-operator` namespace.

Confirm deployment status:

```sh
kubectl -n spicedb-operator get pods
```

### Create a SpiceDBCluster

::: warning
The following configuration is basic and not production-secure. Do not use these values in production.
:::

Apply the cluster and secret:

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

### Connect & Verify

Forward the port:

```sh
kubectl port-forward deployment/dev-spicedb 50051:50051
```

Install the Zed CLI if needed, then create a local context:

```sh
zed context set local localhost:50051 "averysecretpresharedkey" --insecure
```

Test the deployment:

```sh
zed schema read
```

Expected error output (indicating a successful connection):

```
code = NotFound
desc = No schema has been defined; please call WriteSchema to start
```

### Taking Things to Production

This guide creates a single-node, in-memory deployment without persistence. Production deployment requires configuration adjustments for:

- TLS support
- Persistent datastore backends
- Ingress configuration

Refer to the SpiceDB Operator documentation or the community examples repository for comprehensive production examples.
