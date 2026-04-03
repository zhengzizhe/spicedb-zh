::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/eks)
中文版: [查看中文版](/zh/spicedb/ops/eks)
:::

# Installing SpiceDB on Amazon EKS

This guide walks through deploying SpiceDB on Amazon EKS with high availability. Amazon EKS is AWS's managed Kubernetes service. TLS is managed by cert-manager and Amazon Route53.

## Prerequisites

- kubectl configured for an operational EKS cluster
- Route53 External Hosted Zone

## Steps

### 1. Creating an IAM Policy

Grant the cluster access to dynamically configure DNS by creating an IAM Policy for pod roles:

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

### 2. Deploying cert-manager

Verify your current context:

```sh
kubectl config current-context
```

Install cert-manager:

```sh
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
```

Verify pods are healthy:

```sh
kubectl -n cert-manager get pods
```

### 3. Creating a Namespace

```sh
kubectl apply --server-side -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: spicedb
EOF
```

### 4. Creating an Issuer & Certificate

Configure ACME with Let's Encrypt DNS challenge. Update email, domain, region, and hosted zone ID as needed:

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

Verify secret creation (approximately one minute):

```sh
kubectl -n spicedb get secrets
```

### 5. Configuring Cross-Pod TLS

Secure pod-to-pod communication with internal certificates:

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

Apply configuration:

```sh
kubectl apply -f internal-dispatch.yaml
```

### 6. Deploying a Datastore

Deploy a Postgres RDS instance accessible from the EKS cluster.

### 7. Initializing the Operator

Install the SpiceDB operator:

```sh
kubectl apply --server-side -f https://github.com/authzed/spicedb-operator/releases/latest/download/bundle.yaml
```

### 8. Configuring SpiceDB Settings

Create a configuration file with your custom values:

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

Apply configuration:

```sh
kubectl apply -f spicedb-config.yaml -n spicedb
```

### 9. Deploying Load Balancer Service

Create an external load balancer:

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

Apply service:

```sh
kubectl apply -f spicedb-lb.yaml
```

Retrieve external IP:

```sh
kubectl get -n spicedb services spicedb-external-lb -o json | jq '.status.loadBalancer.ingress[0].hostname'
```

Add the hostname as a CNAME record in Route 53 Hosted Zone matching the certificate's dnsNames.

### 10. Testing

Configure Zed CLI context:

```sh
zed context set eks-guide demo.example.com:50051 averysecretpresharedkey
```

Write schema:

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

Create a relationship:

```sh
zed relationship create doc:1 owner user:emilia
```

Check permission:

```sh
zed permission check doc:1 view user:emilia
```
