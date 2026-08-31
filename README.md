# Fresco

Fresco helps researchers conduct Network Canvas interviews online. Researchers
create an interview in Architect, add it to Fresco, and invite participants by
sharing a link. From one dashboard, a research team can organize participants,
follow interview progress, and download collected data.

Fresco is run separately for each research team. The team decides where its
study data is kept and who has access to it. The Network Canvas project does
not host or have access to that data.

## Start here

- [About Fresco](https://documentation.networkcanvas.com/en/collect-data/fresco/about)
  explains its purpose, features, and known limitations.
- [Using Fresco](https://documentation.networkcanvas.com/en/collect-data/fresco/using-fresco)
  covers the complete study workflow, from uploading a protocol to exporting
  interview data.
- [Fresco Sandbox](https://documentation.networkcanvas.com/en/collect-data/fresco/sandbox)
  provides a shared demonstration environment. Do not upload real study or
  participant data.
- [Survey-tool integration](https://documentation.networkcanvas.com/en/collect-data/fresco/integration)
  covers linking Fresco with tools such as Qualtrics and Prolific.
- [Fresco API](https://documentation.networkcanvas.com/en/analyze-data/fresco-api)
  documents read-only programmatic access to protocol and interview data.

## Security

Fresco protects the researcher dashboard with user accounts. Accounts can use
passwords, optional two-factor authentication, or passkeys. Every signed-in
researcher has the same level of access, including access to all protocols,
participants, and interviews.

Participants do not sign in. Access to an interview is controlled by its unique
link, so participant links should be kept private and treated like sensitive
information.

The team running Fresco is responsible for securing and maintaining its site.
Only the latest release receives security updates. Read the following before
collecting study data:

- [Accounts and security](https://documentation.networkcanvas.com/en/collect-data/fresco/accounts)
- [Fresco security policy](./SECURITY.md)
- [FAQ for IT departments](https://documentation.networkcanvas.com/en/collect-data/fresco/it-faq)
- [Upgrading Fresco](https://documentation.networkcanvas.com/en/collect-data/fresco/upgrading)

Report suspected vulnerabilities privately using the contact information in
the [security policy](./SECURITY.md).

## Deployment

Start with the supported
[Deployment Guide](https://documentation.networkcanvas.com/en/collect-data/fresco/guide).
It explains the recommended cloud deployment and the services Fresco requires.

For institutional infrastructure, a private cloud, or a VPS, use the
[Advanced Deployment guide](https://documentation.networkcanvas.com/en/collect-data/fresco/advanced).
It covers Docker, PostgreSQL, object storage, TLS, and maintenance.
Additional resources include:

- [FAQ for IT departments](https://documentation.networkcanvas.com/en/collect-data/fresco/it-faq)
- [Upgrading Fresco](https://documentation.networkcanvas.com/en/collect-data/fresco/upgrading)
- [Deployment troubleshooting](https://documentation.networkcanvas.com/en/collect-data/fresco/deployment-troubleshooting)
- [Published container images](https://github.com/complexdatacollective/Fresco/pkgs/container/fresco/versions)

The repository contains three production Docker Compose configurations:

| Resource                                                             | Storage configuration                  |
| -------------------------------------------------------------------- | -------------------------------------- |
| [`docker-compose.prod.yml`](./docker-compose.prod.yml)               | Bundled, private MinIO storage         |
| [`docker-compose.external-s3.yml`](./docker-compose.external-s3.yml) | An external S3-compatible object store |
| [`docker-compose.uploadthing.yml`](./docker-compose.uploadthing.yml) | UploadThing-managed object storage     |

See [`.env.example`](./.env.example) for application settings and storage
variables, and [`SECURITY.md`](./SECURITY.md) for Fresco's security model and
vulnerability-reporting process. Follow the deployment documentation before
using these files in production.

## Development

Fresco is developed in the
[Network Canvas monorepo](https://github.com/complexdatacollective/network-canvas-monorepo/tree/main/apps/fresco).
The standalone `complexdatacollective/Fresco` repository is a release mirror,
not the source of truth for development.

Follow the monorepo
[Getting Started](https://github.com/complexdatacollective/network-canvas-monorepo#getting-started)
instructions to install the required Node.js and pnpm versions. From the
monorepo root, the main Fresco commands are:

```bash
pnpm --filter fresco dev
pnpm --filter fresco test
pnpm --filter fresco typecheck
pnpm --filter fresco build
```

Before contributing, read the project-wide
[contribution guidance](https://github.com/complexdatacollective/network-canvas-monorepo#contributing).
Bug reports and feature requests belong in the monorepo's
[issue tracker](https://github.com/complexdatacollective/network-canvas-monorepo/issues).

## Project resources

- [Network Canvas project overview](https://documentation.networkcanvas.com/en/get-started/project-information/project-overview)
- [Network Canvas website](https://networkcanvas.com/)
- [User community and support](https://community.networkcanvas.com/)
- [Fresco changelog](./CHANGELOG.md)
- [License](./LICENSE)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
