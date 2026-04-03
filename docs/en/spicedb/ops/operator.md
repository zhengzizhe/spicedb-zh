::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/ops/operator)
中文版: [查看中文版](/zh/spicedb/ops/operator)
:::

# SpiceDB Operator

The SpiceDB Operator is a Kubernetes Operator that manages the installation and lifecycle of SpiceDB clusters. It is the recommended approach for production deployments, and all managed AuthZed products leverage it internally.

## Key Features

Once installed, the operator introduces a new Kubernetes resource called `SpiceDBCluster`, enabling:

- Centralized cluster configuration management
- Automated SpiceDB version upgrades
- Zero-downtime datastore migrations during upgrades

## Configuration

### Flags

SpiceDB configuration uses the `.spec.config` field on `SpiceDBCluster` objects. CLI flags are converted to camelCase format (e.g., `--log-level` becomes `logLevel`).

**Operator-Specific Flags:**

| Flag | Type | Description |
|------|------|-------------|
| `image` | string | Container image specification |
| `replicas` | string or int | Node count |
| `skipMigrations` | string or bool | Disable automatic migrations |
| `tlsSecretName` | string | TLS credentials secret reference |
| `dispatchUpstreamCASecretName` | string | CA validation secret |
| `datastoreTLSSecretName` | string | Datastore TLS secret |
| `spannerCredentials` | string | Cloud Spanner credentials secret |
| `extraPodLabels` | string or map | Additional pod labels |
| `extraPodAnnotations` | string or map | Additional pod annotations |

### Global Configuration

The operator includes a baked-in config at `/opt/operator/config.yaml` defining allowed images, tags, and defaults. The `disableImageValidation` setting controls warning behavior for unlisted images.

### Patches

Users can modify operator-created resources using Strategic Merge Patches or JSON6902 operations via the `patches` field. Multiple patches can target the same resource, with later patches overriding earlier ones. Wildcards (`*`) apply patches to all resources.

### Additional Options

- **CRD Bootstrapping**: Optional `--crds=true` flag (not generally recommended)
- **Static Clusters**: `--bootstrap-spicedbs` flag for startup-time cluster creation
- **Monitoring**: Debug endpoint at `--debug-addr` (default `:8080`) providing `/metrics`, `/debug/pprof/`, and `/healthz`

## Updating

### Operator Updates

Updating the operator is as simple as re-running the `kubectl apply` command when new releases become available.

### Cluster Update Strategies

**Automatic Updates**: The default SpiceDB version applies to all clusters without explicit image specifications. Recommended for development only.

**Manual Upgrades**: Specifying explicit container images from SpiceDB releases enables controlled updates. Each operator release only knows about previous SpiceDB releases, with best-effort forward compatibility.
