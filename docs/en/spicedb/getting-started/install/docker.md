::: tip
Original: [View on authzed.com](https://authzed.com/docs/spicedb/getting-started/install/docker)  
中文版: [查看中文版](/zh/spicedb/getting-started/install/docker)
:::

# Installing SpiceDB with Docker

This document outlines how to install SpiceDB for systems running Docker or similar container runtimes.

## Docker Image Registries

Every release of SpiceDB publishes AMD64 and ARM64 images to multiple public registries:

- [authzed/spicedb](https://hub.docker.com/r/authzed/spicedb) (Docker Hub)
- [ghcr.io/authzed/spicedb](https://github.com/authzed/spicedb/pkgs/container/spicedb) (GitHub)
- [quay.io/authzed/spicedb](https://quay.io/authzed/spicedb) (Quay)

::: info
While the SpiceDB image on Docker Hub has millions of downloads, for production usage it is recommended to push a copy of the SpiceDB image to your own registry to avoid any outages or rate-limits impacting your deployment.
:::

## Pulling the Latest SpiceDB Docker Image

You can install the latest version of SpiceDB using the standard pull command:

```sh
docker pull authzed/spicedb:latest
```

::: warning
Production deployments should never use the `latest` tag. Instead, opt for a tag referencing a specific release. For automated upgrades, consider deploying the [SpiceDB Operator](/en/spicedb/getting-started/install/kubernetes).
:::

## Pulling the Latest SpiceDB Debug Image

By default, SpiceDB images are based on Chainguard Images to remain minimal and secure. However, this can complicate debugging since no tools are included in the image.

If you need to execute a user session into a running SpiceDB container and install packages for debugging, use the debug image:

```sh
docker pull authzed/spicedb:latest-debug
```

Every release of SpiceDB has a corresponding debug image. Add `-debug` to any release tag to pull it.
