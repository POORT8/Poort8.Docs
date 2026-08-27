# GIR Changelog

This page documents customer-visible changes to GIR-specific API endpoints.

## Legacy `/v1/api/GIRBasisdataMessages(s)` routes removed

The `/v1/api/GIRBasisdataMessages` and `/v1/api/GIRBasisdataMessages/{guid}` routes have been **removed**. This supersedes the earlier `v0.102` announcement below, which stated these routes would keep working, unchanged, during a deprecation window — that plan changed: the legacy routes are now gone outright, with no redirect.

| Removed route | Replacement route |
|-----------|-------|
| `POST /v1/api/GIRBasisdataMessages` | `POST /api/gir/v0/gir-basisdata-messages` |
| `GET /v1/api/GIRBasisdataMessages` | `POST /api/gir/v0/gir-basisdata-messages/_search` |
| `GET /v1/api/GIRBasisdataMessages/{guid}` | `GET /api/gir/v0/gir-basisdata-messages/{guid}` |

**Action required:** any client still calling `/v1/api/GIRBasisdataMessages(s)` must migrate to the `/api/gir/v0/gir-basisdata-messages*` routes described in the `v0.102` section below. There is no compatibility shim; requests to the old paths now receive a `404 Not Found`.

## GIR now tracks the DICO specification version (v0.102)

DICO's `v0.102` specification switches to a generic resource-style API template and introduces a new primary route family, replacing the previous `/v1/api/GIRBasisdataMessages` routes (see the removal notice above).

### Primary routes

| Operation | Route |
|-----------|-------|
| Create | `POST /api/gir/v0/gir-basisdata-messages` |
| Retrieve by id | `GET /api/gir/v0/gir-basisdata-messages/{guid}` |
| Search (replaces the list `GET`) | `POST /api/gir/v0/gir-basisdata-messages/_search` |

New integrations should use the routes above; existing integrations still on the legacy routes must migrate per the removal notice above.

An update (`PATCH`) route was not implemented for these primary routes.

### What's new on the primary routes

- **Search via POST**: `POST /api/gir/v0/gir-basisdata-messages/_search` takes filter criteria in the JSON body instead of query parameters.
- **`data`/`meta` response envelope**: `_search` now returns `{ "data": [...], "meta": {...} }` instead of a bare array. `meta.nextCursor` is always `null` and `meta.limit`/`meta.totalItems` reflect the actual result count, since cursor/limit pagination is not implemented — see [Search GIRBasisdataMessages](retrieve-installations.md#response).
- **`installationID` filter is now an object**: instead of a single `installationIDValue` string, the `_search` body takes `installationID: { value, type }`; both fields must match.

| Filter field | Legacy `GET` list endpoint | `_search` endpoint |
|--------------|-----------------------------|---------------------|
| `registrarChamberOfCommerceNumber` | Query parameter | Body field |
| `installationOwnerChamberOfCommerceNumber` | Query parameter | Body field |
| `installationIDValue` (string) | Query parameter | `installationID` object (`{ value, type }`) body field |
| `vboID` | Query parameter | Body field |
| `energyConnectionID` | Query parameter | Body field |
| `componentIdValue` | *(not supported)* | Body field *(new)* |
| `componentIdType` | *(not supported)* | Body field *(new)* |

All filter criteria are optional and combine with AND.

### Installation payload changes (all routes)

| Area | Before | After |
|------|--------|-------|
| `installationLocation.address` | Object with `city`, `street`, `houseNumber`, `postalCode`, etc. | **Removed.** Replaced by five new optional fields directly on `installationLocation`: `collectiveObject`, `clusterNumber`, `premisesNumber`, `realEstateUnitNumber`, `yearOfConstruction`. There is no field-for-field mapping from the old address fields to these — street-level address data is no longer part of this contract. |
| `component[].componentLineGUID` | Required, exactly 36 characters | **Removed.** Stop sending this field; it is no longer required or accepted. |
| `installationLocation.geographicalCoordinates.latitude` / `.longitude` | String | Number (`double`, WGS84 decimal degrees, e.g. `52.370216` instead of `"52.370216"`) |
| `installationBaseData.lifeCycleStatus` enum | `Planned`, `Removed`, `Installed`, `Decommissioned`, `Commissioned`, `Disposed` | `Installed`, `Commissioned`, `Decommissioned`, `Removed` — `Planned` and `Disposed` are no longer accepted |

These apply to both the create/update and retrieve operations (request and response bodies).

### Two validation rules tightened (all routes)

| Field | Before | After |
|-------|--------|-------|
| `installationLocation.yearOfConstruction` | Any non-empty string | Must be exactly 4 digits |
| `installationLocation.additionalLocationInformation[].languageCode` | 2 letters, any case | 2 uppercase letters only |

These apply to both the legacy and new create/update operations.

For general information about how we handle API versions and breaking changes, see the [API Versioning Policy](api-versioning.md).

## GIR now tracks the DICO specification version (v0.101)

**At the time of this `v0.101` update, the endpoint URL kept its `/v1/api/...` base path — only the referenced DICO specification version changed. This was superseded by the `v0.102` update above, which does introduce a new endpoint URL family.**

GIR implements the [Ketenstandaard GIR specification](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/), which DICO maintains and versions independently of Poort8's own endpoint versioning. Since DICO's specification is the actual driver of GIR API changes, this implementation conformed to DICO's `v0.101` specification revision as of this update.

`v0.101` is numerically lower than the API's own `v1` endpoint version - that is expected, not a downgrade: DICO's version numbers do not necessarily increase monotonically between revisions, and are unrelated to Poort8's own endpoint versioning. At the time, GIR's endpoint version (`v1`) and the DICO specification version it implemented (`v0.101`) were tracked separately with the URL fixed at `/v1/api/GIRBasisdataMessages`; see the `v0.102` section above for the current state.

Aligning with DICO's `v0.101` specification also brings the following endpoint and payload changes, unrelated to the version-tracking itself.

### Breaking Changes

| Area | Before | After | Action |
|------|--------|-------|--------|
| Endpoint path | `/v1/api/GIRBasisdataMessage` | `/v1/api/GIRBasisdataMessages` | [Update endpoint URLs to the plural path](#update-endpoint-urls-to-the-plural-path) |

### Update endpoint URLs to the plural path

The GIRBasisdataMessage resource path is now plural. The `/v1/` version segment is unchanged. Update every API call in your client:

| Old URL | New URL |
|---------|---------|
| `POST /v1/api/GIRBasisdataMessage` | `POST /v1/api/GIRBasisdataMessages` |
| `GET /v1/api/GIRBasisdataMessage` | `GET /v1/api/GIRBasisdataMessages` |
| `GET /v1/api/GIRBasisdataMessage/{guid}` | `GET /v1/api/GIRBasisdataMessages/{guid}` |

### Non-breaking Changes

| Area | Before | After | Action |
|------|--------|-------|--------|
| `installationLocation` optional fields | `collectiveObject`, `clusterNumber`, `premisesNumber`, `realEstateUnitNumber`, and `yearOfConstruction` were required | These fields are now optional (nullable); only `vboID` is required | [Update InstallationLocation field handling](#update-installationlocation-field-handling) |

### Update InstallationLocation field handling

`installationBaseData.installationLocation.collectiveObject`, `clusterNumber`, `premisesNumber`, `realEstateUnitNumber`, and `yearOfConstruction` are no longer required and may be omitted or `null`. `vboID` remains the only required field on `installationLocation`. If your client always sent these fields, no change is needed; if you were previously sending placeholder values to satisfy validation, you can now omit them instead. When provided, these fields must still be non-empty strings.

This affects the request body for `POST /v1/api/GIRBasisdataMessages` and the same fields as returned by the GET endpoints.

**No other customer action is required.** The DICO specification version tracking described above is informational only; it is not a breaking or non-breaking API change on its own.

For general information about how we handle API versions and breaking changes, see the [API Versioning Policy](api-versioning.md).

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
| Response metadata field | `metadata.deletedAt` included in responses | `metadata.deletedAt` field removed | [Remove deletedAt field handling](#remove-deletedat-field-handling) |

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

### Remove deletedAt field handling

The `metadata.deletedAt` field has been removed from all GIRBasisdataMessage endpoint responses as part of soft delete cleanup for the Authorization Registry.

**Affected endpoints:**
- `POST /v1/api/GIRBasisdataMessage`
- `GET /v1/api/GIRBasisdataMessage`
- `GET /v1/api/GIRBasisdataMessage/{guid}`

**Migration:** If your client code reads `response.metadata.deletedAt`, remove that logic. Records are no longer soft-deleted.

Example response before:
```json
{
  "metadata": {
    "issuer": "did:ishare:EU.NL.NTRNL-30276543",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": null,
    "deletedAt": null,
    "status": "Active"
  }
}
```

Example response now:
```json
{
  "metadata": {
    "issuer": "did:ishare:EU.NL.NTRNL-30276543",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": null,
    "status": "Active"
  }
}
```

For details on the current API response schema, see [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1).

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

For general information about how we handle API versions and breaking changes, see the [API Versioning Policy](api-versioning.md).
