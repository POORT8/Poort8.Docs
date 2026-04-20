# GIR Changelog

This page documents customer-visible changes to GIR-specific API endpoints.

## Changes from v0 to v1

This comparison covers the transition from the earlier, non-versioned Registratie endpoints in `/Poort8.Dataspace.API/Registratie` to the current v1 GIRBasisdataMessage endpoints:

- `POST /v1/api/GIRBasisdataMessage`
- `GET /v1/api/GIRBasisdataMessage`
- `GET /v1/api/GIRBasisdataMessage/{guid}`

### Breaking Changes

| Area | v0 | v1 | Action |
|------|----|----|------------------|
| Endpoint base path | `/api/GIRBasisdataMessage` | `/v1/api/GIRBasisdataMessage` | [Update endpoint URLs](#update-endpoint-urls) |
| Authentication | Auth0 bearer tokens | DSGO client assertion bearer tokens | [Migrate to DSGO authentication](#migrate-to-dsgo-authentication) |
| Top-level payload property | `installation` | `installationBaseData` | [Rename payload property](#rename-payload-property) |
| Required status fields | Optional | `installationBaseData.operationalStatus` and `installationBaseData.lifeCycleStatus` required | [Add required status fields](#add-required-status-fields) |
| `controlSystemType` type | Array of strings (e.g. `["GBS"]`) | Single enum value (e.g. `GBS`) | [Update controlSystemType](#update-controlsystemtype) |
| Enum constraints | Arbitrary strings accepted for key enum fields | Defined enum values required | [Update enum-constrained fields](#update-enum-constrained-fields) |

### Update endpoint URLs

All three GIR Registratie endpoints have moved to a versioned base path. Update every API call in your client:

| Old URL | New URL |
|---------|---------|
| `POST /api/GIRBasisdataMessage` | `POST /v1/api/GIRBasisdataMessage` |
| `GET /api/GIRBasisdataMessage` | `GET /v1/api/GIRBasisdataMessage` |
| `GET /api/GIRBasisdataMessage/{guid}` | `GET /v1/api/GIRBasisdataMessage/{guid}` |

### Migrate to DSGO authentication

**GIR Registratie endpoints now require DSGO bearer tokens instead of Auth0 tokens.**

#### Obtaining DSGO Bearer Tokens

Before calling any GIR Registratie endpoint, first obtain a bearer token via the DSGO token exchange endpoint:

For a detailed implementation guide, see [Obtaining a DSGO Bearer Token](connect-token.md).

**Endpoint:** `POST /connect/token`

**Request Format:**
- Content-Type: `application/x-www-form-urlencoded`
- Required form parameters:
  - `grant_type`: `client_credentials`
  - `scope`: `iSHARE`
  - `client_id`: Your organization DID in the format `did:ishare:EU.NL.NTRNL-<KVK>` (replace `<KVK>` with your Chamber of Commerce number)
  - `client_assertion_type`: `urn:ietf:params:oauth:client-assertion-type:jwt-bearer`
  - `client_assertion`: A JWT signed with your organization's private key per DSGO specifications

**Response:** You receive an `access_token` (valid for 1 hour) and `token_type: Bearer`.

#### Using the Token

Include the token in all GIR Registratie API requests using the `Authorization` header:
```
Authorization: Bearer <access_token>
```

### Rename payload property

The top-level property that wraps all installation data has been renamed in both requests and responses. Rename `installation` to `installationBaseData` everywhere it appears in your serialization code.

### Add required status fields

`POST /v1/api/GIRBasisdataMessage` now validates two fields that were previously optional. Requests missing either field receive a `400 Bad Request`.

Add both to every POST request body:

- `installationBaseData.operationalStatus` — accepted values: `Down`, `ExternallyDisabled`, `TemporarilyDisabled`, `Standby`, `Operational`, `Degraded`
- `installationBaseData.lifeCycleStatus` — accepted values: `Planned`, `Removed`, `Installed`, `Decommissioned`, `Commissioned`, `Disposed`

For an implementation walkthrough and complete request payload example, see [Post a GIRBasisdataMessage](insert-installation.md).

### Update controlSystemType

`installationBaseData.installationProperties.controlSystemType` now accepts a **single enum value** instead of an array. Replace `["GBS"]` with `"GBS"` in your request body. Accepted values: `GBS`, `EMS`, `APP`, `GEE`.

### Update enum-constrained fields

Several fields that previously accepted any string now require a value from a fixed enum. Update clients to send only the supported values below:

| Field | Accepted values |
|-------|----------------|
| `installationBaseData.installationID.type` | `GUID`, `GIAI` |
| `installationBaseData.installationLocation.installationLocationID[].type` | `GLN` |
| `installationBaseData.classifications[].classificationType` | `NLSFB_tabel1` |
| `installationBaseData.component[].componentID[].type` | `SGTIN`, `SerialNumber` |
| `installationBaseData.component[].productInformation.datapoolInformation.source` | `2baValid`, `2baNonValid` |

### Non-breaking Changes

| Area | v0 | v1 | Action |
|------|----|----|--------|
| Installation status fields | Allowed values were not formalized in the published contract | `operationalStatus` and `lifeCycleStatus` now use defined value sets | [Migrate status enum handling](#migrate-status-enum-handling) |
| Component logs model | Commissioning data expected for each component | `componentLogs` is optional and `firstCommissioningDateTime` is nullable | [Update component logs handling](#update-component-logs-handling) |
| GET endpoint documentation | GET behavior was less explicit for external consumers | GET endpoints are documented and clarify authorization-based filtering | [Use documented GET endpoint behavior](#use-documented-get-endpoint-behavior) |

### Migrate status enum handling

The v1 contract now formalizes the accepted values for installation status fields. `installationBaseData.operationalStatus` accepts `Down`, `ExternallyDisabled`, `TemporarilyDisabled`, `Standby`, `Operational`, or `Degraded`. `installationBaseData.lifeCycleStatus` accepts `Planned`, `Removed`, `Installed`, `Decommissioned`, `Commissioned`, or `Disposed`.

### Update component logs handling

The component logs model is now more flexible in v1. `installationBaseData.component[].componentLogs` is optional, and `installationBaseData.component[].componentLogs.firstCommissioningDateTime` is nullable. Clients no longer need to send commissioning data for every component.

### Use documented GET endpoint behavior

The GET endpoints are now documented as DSGO-based GIR endpoints, and the public documentation clarifies that returned objects are filtered by the caller's authorization.

Implementation guides:
- [Retrieve a GIRBasisdataMessage by GUID](retrieve-installation.md) for single-item lookups
- [Retrieve Multiple GIRBasisdataMessages](retrieve-installations.md) for filtered queries

For general information about how we handle API versions and breaking changes, see the [API Versioning Policy](/api-versioning.md).
