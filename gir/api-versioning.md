# API Versioning

GIR is built on top of NoodleBar and uses two separate API versioning tracks.

## GIR-Specific Endpoints

GIR's own endpoints are versioned independently:

- `POST /api/gir/v0/gir-basisdata-messages` — Register or update installation data
- `POST /api/gir/v0/gir-basisdata-messages/_search` — Retrieve a list of installations with filtering (search) options
- `GET /api/gir/v0/gir-basisdata-messages/{guid}` — Retrieve a single installation
- `POST /connect/token` — Obtain a DSGO bearer token

The DICO specification version (currently `v0.102`) is tracked separately from the endpoint version above and is not part of the URL.
See the [Changelog](changelog.md) for breaking changes.

## NoodleBar Endpoints

GIR also uses standard NoodleBar endpoints for approval workflows and authorization checks:

- `POST /v1/api/approval-links` — Request approval (Keyper)
- `GET /v1/api/authorization/explained-enforce` — Check authorization (NoodleBar AR)

These follow **NoodleBar's versioning**, which may differ from GIR's endpoint versions.

## Changelog

See the [Changelog](changelog.md) for breaking changes to GIR-specific endpoints.
