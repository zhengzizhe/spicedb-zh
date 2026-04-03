::: tip
原文: [查看英文原文](https://authzed.com/docs/spicedb/ops/eks)
English: [View English version](/en/spicedb/ops/eks)
:::

# 在 Amazon EKS 上安装 SpiceDB

本指南介绍如何在 Amazon EKS 上部署高可用的 SpiceDB。Amazon EKS 是 AWS 的托管 Kubernetes 服务。TLS 由 cert-manager 和 Amazon Route53 管理。

## 前提条件

- 已配置 kubectl 的可用 EKS 集群
- Route53 外部托管区域

## 步骤

### 1. 创建 IAM 策略

授予集群动态配置 DNS 的权限，为 Pod 角色创建 IAM 策略：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "route53:GetChange",
      "Resource": "arn:aws:route53:::change/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/*"
    },
    {
      "Effect": "Allow",
      "Action": "route53:ListHostedZonesByName",
      "Resource": "*"
    }
  ]
}
```

### 2. 部署 cert-manager

验证当前上下文：

```sh
kubectl config current-context
```

安装 cert-manager：

```sh
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

验证 Pod 是否健康：

```sh
kubectl -n cert-manager get pods
```

### 3. 创建命名空间

```sh
kubectl apply --server-side -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: spicedb
EOF
```

### 4. 创建 Issuer 和 Certificate

配置 ACME 与 Let's Encrypt DNS 挑战。请根据实际情况更新邮箱、域名、区域和托管区域 ID：

```sh
kubectl apply --server-side -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: spicedb-tls-issuer
  namespace: spicedb
spec:
  acme:
    email: example@email.com
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-production
    solvers:
    - selector:
        dnsZones:
          - "example.com"
      dns01:
        route53:
          region: us-east-1
          hostedZoneID: ABC123ABC123
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: spicedb-le-certificate
  namespace: spicedb
spec:
  secretName: spicedb-le-tls
  issuerRef:
    name: spicedb-tls-issuer
    kind: ClusterIssuer
  commonName: demo.example.com
  dnsNames:
  - demo.example.com
EOF
```

验证 Secret 创建（大约需要一分钟）：

```sh
kubectl -n spicedb get secrets
```

### 5. 配置跨 Pod TLS

使用内部证书保护 Pod 间通信：

```sh
kubectl apply --server-side -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: dispatch-selfsigned-issuer
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: dispatch-ca
  namespace: spicedb
spec:
  isCA: true
  commonName: dev.spicedb
  dnsNames:
  - dev.spicedb
  secretName: dispatch-root-secret
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: dispatch-selfsigned-issuer
    kind: ClusterIssuer
    group: cert-manager.io
---
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: my-ca-issuer
  namespace: cert-manager
spec:
  ca:
    secretName: dispatch-root-secret
EOF
```

应用配置：

```sh
kubectl apply -f internal-dispatch.yaml
```

### 6. 部署数据存储

部署一个可从 EKS 集群访问的 Postgres RDS 实例。

### 7. 初始化 Operator

安装 SpiceDB Operator：

```sh
kubectl apply --server-side -f https://github.com/authzed/spicedb-operator/releases/latest/download/bundle.yaml
```

### 8. 配置 SpiceDB 设置

使用自定义值创建配置文件：

```yaml
cat << EOF > spicedb-config.yaml
apiVersion: authzed.com/v1alpha1
kind: SpiceDBCluster
metadata:
  name: dev
spec:
  config:
    datastoreEngine: postgres
    replicas: 2
    tlsSecretName: spicedb-le-tls
    dispatchUpstreamCASecretName: dispatch-root-secret
    dispatchClusterTLSCertPath: "/etc/dispatch/tls.crt"
    dispatchClusterTLSKeyPath: "/etc/dispatch/tls.key"
  secretName: dev-spicedb-config
  patches:
  - kind: Deployment
    patch:
      spec:
        template:
          spec:
            containers:
            - name: spicedb
              volumeMounts:
              - name: custom-dispatch-tls
                readOnly: true
                mountPath: "/etc/dispatch"
            volumes:
            - name: custom-dispatch-tls
              secret:
                secretName: dispatch-root-secret
---
apiVersion: v1
kind: Secret
metadata:
  name: dev-spicedb-config
stringData:
  preshared_key: "averysecretpresharedkey"
  datastore_uri: "postgresql://user:password@postgres.com:5432"
EOF
```

应用配置：

```sh
kubectl apply -f spicedb-config.yaml -n spicedb
```

### 9. 部署负载均衡器服务

创建外部负载均衡器：

```yaml
cat << EOF > spicedb-lb.yaml
apiVersion: v1
kind: Service
metadata:
  name: spicedb-external-lb
  namespace: spicedb
spec:
  ports:
  - name: grpc
    port: 50051
    protocol: TCP
    targetPort: 50051
  - name: gateway
    port: 8443
    protocol: TCP
    targetPort: 8443
  - name: metrics
    port: 9090
    protocol: TCP
    targetPort: 9090
  selector:
    app.kubernetes.io/instance: dev-spicedb
  sessionAffinity: None
  type: LoadBalancer
EOF
```

应用服务：

```sh
kubectl apply -f spicedb-lb.yaml
```

获取外部 IP：

```sh
kubectl get -n spicedb services spicedb-external-lb -o json | jq '.status.loadBalancer.ingress[0].hostname'
```

将该主机名作为 CNAME 记录添加到 Route 53 托管区域中，与证书的 dnsNames 匹配。

### 10. 测试

配置 Zed CLI 上下文：

```sh
zed context set eks-guide demo.example.com:50051 averysecretpresharedkey
```

写入 Schema：

```sh
zed schema write <(cat << EOF
definition user {}

definition doc {
  relation owner: user
  permission view = owner
}
EOF
)
```

创建关系：

```sh
zed relationship create doc:1 owner user:emilia
```

检查权限：

```sh
zed permission check doc:1 view user:emilia
```
