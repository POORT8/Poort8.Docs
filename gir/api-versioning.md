# API Versioning

GIR is built on top of NoodleBar and uses two separate API versioning tracks.

## GIR-Specific Endpoints

GIR's own endpoints are versioned independently:

- `POST /v1/api/GIRBasisdataMessage` — Register or update installation data
- `GET /v1/api/GIRBasisdataMessage` — Retrieve a list of installations
- `GET /v1/api/GIRBasisdataMessage/{guid}` — Retrieve a single installation
- `POST /connect/token` — Obtain a DSGO bearer token

These endpoints currently support **v1**. Breaking changes to these endpoints will increment their version number independently of NoodleBar.

## NoodleBar Endpoints

GIR also uses standard NoodleBar endpoints for approval workflows and authorization checks:

- `POST /v1/api/approval-links` — Request approval (Keyper)
- `GET /api/authorization/explained-enforce` — Check authorization (NoodleBar AR)

These follow **NoodleBar's versioning**, which may differ from GIR's endpoint versions.

## Changelog

See the [Changelog](changelog.md) for breaking changes to GIR-specific endpoints.
