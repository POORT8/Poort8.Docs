# Authorization Enforcement

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
  kc = system 'GDS Participant Registry'
  ar = system 'GDS Authorization Registry'
}

views {
  dynamic view authorization_enforcement {
    title 'Authorization Enforcement'
    variant sequence

    david -> charlie 'GET /buildings/{vboId} + Bearer token'
    charlie -> charlie 'Validate token & derive organization EUID'
    charlie -> kc 'Request token (client_credentials, scope=noodlebar-api)'
    kc -> charlie 'Access token'
    charlie -> ar 'GET /api/authorization/explained-enforce + Bearer token'
    ar -> charlie 'HTTP 200: {allowed: true/false, policies}'
    charlie -> david 'If allowed: 200 + data / If denied: 403'
  }
}
```

## Policy model

When a building owner (Bob) approves an access request through Keyper, policies are registered in the GDS Authorization Registry. Each policy specifies:

For GDS, EUID is the chosen identifier format for policy identities. This means `issuerId`, `subjectId`, and `serviceProvider` are EUID values.

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
- `POST` — Write data or send control commands.

## Step 1 — Obtain an access token

Authenticate using the OAuth 2.0 client credentials grant with the application you registered for the NoodleBar API (see [Validating API Tokens — Prerequisites](validating-api-tokens.md)):

```http
POST https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=YOUR_APP_CLIENT_ID
&client_secret=YOUR_APP_CLIENT_SECRET
&scope=noodlebar-api
```

> **Note:** This token authenticates your IoT platform as an *application* against the Authorization Registry. It is not an identity token between David and your platform — the consumer's organization identity is passed explicitly as the `subject` query parameter.

## Step 2 — Query the explained enforce endpoint

Call the endpoint with the access token from Step 1 to check whether a valid policy exists for the incoming request:

```http
GET https://gds-preview.poort8.nl/api/authorization/explained-enforce?issuer={BUILDING_OWNER}&subject={DATA_CONSUMER}&serviceProvider={YOUR_ORG}&action=GET&resource={VBO_ID}&type=building&attribute=*&useCase=ishare
Authorization: Bearer {token}
```

### Query parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `issuer` | Building owner who granted access (Bob), as EUID | `NLNHR.87654321` |
| `subject` | Organization requesting data (David), as EUID | `NLNHR.12345678` |
| `serviceProvider` | Your organization (Charlie), as EUID | `NLNHR.23456789` |
| `action` | Requested action | `GET` |
| `resource` | Resource identifier (VBO ID or asset ID) | `0363010000659001` |
| `type` | Resource type | `building` |
| `attribute` | Data attributes | `*` |
| `useCase` | Use case model | `ishare` |

### Example request

```http
GET https://gds-preview.poort8.nl/api/authorization/explained-enforce?issuer=NLNHR.87654321&subject=NLNHR.12345678&serviceProvider=NLNHR.23456789&action=GET&resource=0363010000659001&type=building&attribute=*&useCase=ishare
Authorization: Bearer {token}
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

## Step 3 — Validate and respond

The endpoint always returns HTTP 200 — even when authorization is denied. When you receive the enforce response, verify:

| Check | Requirement |
|-------|-------------|
| **Allowed** | `allowed` must be `true` |
| **Subject match** | `explainPolicies[].subjectId` must match the EUID derived from the incoming request's `organization` claim |

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
3. Derive the organization EUID from the token's `organization` claim
4. Determine the building owner (issuer) for the requested resource
5. Obtain an access token for the Authorization Registry (client credentials, scope `noodlebar-api`)
6. Call explained-enforce with `Authorization: Bearer {token}`, subject=consumer, serviceProvider=you, resource=vboId
7. Enforce always returns HTTP 200 — check the `allowed` field
8. If allowed=true and subject matches: deliver data (200)
9. If allowed=false: reject the request (403)
```

> **Determining the issuer:** Your platform needs to know which building owner (issuer) corresponds to each building/asset in your system. This mapping is typically established during building onboarding in your platform.

## Related pages

- [Validating API Tokens](validating-api-tokens.md) — Token validation (prerequisite)
- [Keyper Approval Workflow](approval-workflow.md) — How policies get registered
- [GDS API documentation ➚](https://gds-preview.poort8.nl/scalar/) — Interactive API reference
