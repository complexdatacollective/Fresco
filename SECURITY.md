# Security Policy

## Supported Versions

We only actively support the latest version of the software. All bug fixes and security updates will be made by patching or releasing new versions against the current latest version. No backporting will be carried out. With that said, the community is welcome to backport fixes and security updates to older versions, and we will be happy to review and release them.

## Security Model

Fresco is a **single-tenant, single-trust-level** application. Understanding this is important when reasoning about the codebase:

- **Administrators** authenticate (password, with optional TOTP or passkey two-factor) and are all fully trusted — there is no role hierarchy. Anyone who can sign in can manage every protocol, participant, and interview. "Any logged-in user can do X" is therefore by design, not a privilege-escalation flaw.
- **Participants** take interviews **without authenticating**. A participant is authorized purely by possession of their interview URL, which contains an unguessable interview id. **Treat interview URLs as secrets**: do not post them publicly, and Fresco does not write them to logs.
- **Account creation** is only possible during initial setup. Once the app is configured, the signup actions reject all new accounts (the check is enforced inside the actions, not only on the setup page).

## Data at rest

- Passwords are hashed with scrypt; TOTP secrets and recovery codes are stored hashed and are single-use; API tokens are stored only as a SHA-256 hash (the plaintext is shown once, at creation).
- **Storage credentials** (S3 access key/secret, the UploadThing token) must remain reversible for the app to use them, so when configured through the **setup UI** they are stored **unencrypted** in the database. If database-at-rest exposure is part of your threat model, configure storage through **environment variables** instead — `STORAGE_PROVIDER`, `S3_ENDPOINT`, `S3_PUBLIC_URL`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, or `UPLOADTHING_TOKEN`. Env-provided values are read from the environment and never written to the database, and the setup UI locks the corresponding fields. See the `docker-compose.*.yml` deployment files.

## Transport & headers

Responses carry `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, and `Referrer-Policy` (set to `no-referrer` on `/interview/*` and `/onboard/*` so capability-bearing interview URLs are never leaked via the `Referer` header). User-uploaded assets are served with a validated content type and are forced to download (rather than render inline) for script-capable types such as SVG/HTML. Terminate TLS in front of the app (the bundled `docker-compose.prod.yml` does this with Traefik).

## Reporting a Vulnerability

To let us know about a security issue you have found. please email info@networkcanvas.com. Although we do not have the resources to offer any kind of reward, we would be extremely grateful for any instances of responsible disclosure that enable the community of network researchers to be more safe when collecting data using our software.
