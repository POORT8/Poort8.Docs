# Authorization Enforcement

> **Note:** This documentation describes the **future state** of the GDS platform. Some features and `gds-preview` links are not yet available.

This guide is for **Charlie** — a data service provider who needs to verify that incoming data requests are authorized before delivering building data. It covers how to query the GDS Authorization Registry to check whether valid policies exist.

## When to use this

Token validation (see [Validating API Tokens](validating-api-tokens.md)) confirms the caller's identity. Authorization enforcement confirms they have permission to access *specific building data*. Both are required before delivering data.

## Process overview

```likec4
// view: authorization_enforcement
specification {
  element actor
  element system
}

model {
  david = actor 'Data Consumer'
  charlie = system 'Your IoT Platform'
  ar = system 'GDS Authorization Registry'
}

views {
  dynamic view authorization_enforcement {
    title 'Authorization Enforcement'
    variant sequence

    david -> charlie 'GET /buildings/{vboId} + Bearer token'
    charlie -> charlie 'Validate token & extract organization'
    charlie -> ar 'GET /api/authorization/explained-enforce'
    ar -> charlie 'HTTP 200: {allowed: true/false, policies}'
    charlie -> david 'If allowed: 200 + data / If denied: 403'
  }
}
```

## Policy model

When a building owner (Bob) approves an access request through Keyper, policies are registered in the GDS Authorization Registry. Each policy specifies:

| Field | Description | Example |
|-------|-------------|---------|
| `issuerId` | Building owner who granted access | `NLNHR.87654321` |
| `subjectId` | Organization consuming data (David) | `NLNHR.12345678` |
| `serviceProvider` | Your IoT platform organization | `NLNHR.23456789` |
| `type` | Resource type: `building` or `asset` | `building` |
| `resourceId` | Resource identifier (VBO ID or asset ID) | `0363010000659001` |
| `attribute` | Data attributes | `*` (all) |
| `action` | Permitted action: `GET` or `POST` | `GET` |

### Policy levels

| Level | Resource type | Resource ID | Actions | Description |
|-------|--------------|-------------|---------|-------------|
| Building | `building` | VBO ID (16 digits) | `GET` / `POST` | Access to entire building and all assets |
| Asset | `asset` | Asset ID | `GET` / `POST` | Access to a specific sensor or control point |

**Action semantics:**
- `GET` — Read data (sensor measurements, metadata)
- `POST` — Write data or send control commands. A `POST` policy implicitly grants `GET` access

> **Pilot scope:** During the test phase, only a `GET` policy on building level (VBO ID) is used.

## Step 1 — Query the explained enforce endpoint

The explained enforce endpoint is publicly accessible (no authentication required). Call it to check whether a valid policy exists for the incoming request:

```http
GET https://gds-preview.poort8.nl/api/authorization/explained-enforce?issuer={BUILDING_OWNER}&subject={DATA_CONSUMER}&serviceProvider={YOUR_ORG}&action=GET&resource={VBO_ID}&type=building&attribute=*&useCase=ishare
```

### Query parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `issuer` | Building owner who granted access (Bob) | `NLNHR.87654321` |
| `subject` | Organization requesting data (David) | `NLNHR.12345678` |
| `serviceProvider` | Your organization (Charlie) | `NLNHR.23456789` |
| `action` | Requested action | `GET` |
| `resource` | Resource identifier (VBO ID or asset ID) | `0363010000659001` |
| `type` | Resource type | `building` |
| `attribute` | Data attributes | `*` |
| `useCase` | Use case model | `ishare` |

### Example request

```http
GET https://gds-preview.poort8.nl/api/authorization/explained-enforce?issuer=NLNHR.87654321&subject=NLNHR.12345678&serviceProvider=NLNHR.23456789&action=GET&resource=0363010000659001&type=building&attribute=*&useCase=ishare
```

### Response — authorized

```json
{
  "allowed": true,
  "explainPolicies": [
    {
      "policyId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "useCase": "ishare",
      "issuedAt": 1730736000,
      "notBefore": 1730736000,
      "expiration": 2147483647,
      "issuerId": "NLNHR.87654321",
      "subjectId": "NLNHR.12345678",
      "serviceProvider": "NLNHR.23456789",
      "action": "GET",
      "resourceId": "0363010000659001",
      "type": "building",
      "attribute": "*",
      "license": "0005",
      "rules": null,
      "properties": []
    }
  ]
}
```

### Response — not authorized

```json
{
  "allowed": false,
  "explainPolicies": []
}
```

## Step 2 — Validate and respond

The endpoint always returns HTTP 200 — even when authorization is denied. When you receive the enforce response, verify:

| Check | Requirement |
|-------|-------------|
| **Allowed** | `allowed` must be `true` |
| **Subject match** | `explainPolicies[].subjectId` must match the organization extracted from the incoming request's bearer token |

### Recommended responses to your consumers

Based on the enforce result, return appropriate HTTP status codes to the data consumer calling your API:

| Code | Meaning | When to use |
|------|---------|-------------|
| `200 OK` | Authorized | Enforce confirms `allowed: true` and subject matches — deliver data |
| `401 Unauthorized` | Invalid token | Incoming bearer token is missing, invalid, or expired |
| `403 Forbidden` | Not authorized | Enforce returns `allowed: false`, or subject mismatch |
| `400 Bad Request` | Invalid input | Malformed request (e.g., invalid VBO ID format) |
| `500 Internal Server Error` | Technical error | Unexpected failure — log and implement retry logic |

## Implementation pattern

Putting it all together — a simplified enforcement flow:

```
1. Receive request with Bearer token and resource identifier
2. Validate token (signature, expiry, issuer, audience)
3. Extract organization EUID from token's `organization` claim
4. Determine the building owner (issuer) for the requested resource
5. Call explained-enforce (no auth required) with subject=consumer, serviceProvider=you, resource=vboId
6. Enforce always returns HTTP 200 — check the `allowed` field
7. If allowed=true and subject matches: deliver data (200)
8. If allowed=false: reject the request (403)
```

> **Determining the issuer:** Your platform needs to know which building owner (issuer) corresponds to each building/asset in your system. This mapping is typically established during building onboarding in your platform.

## Related pages

- [Validating API Tokens](validating-api-tokens.md) — Token validation (prerequisite)
- [Keyper Approval Workflow](approval-workflow.md) — How policies get registered
- [GDS API documentation ➚](https://gds-preview.poort8.nl/scalar/) — Interactive API reference
