# Obtaining a DSGO Bearer Token (`POST /connect/token`)

🔗 [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)

All GIR data endpoints require a DSGO bearer token. This guide walks you through calling `POST /connect/token` to obtain one.

> If you are here as part of the data-consumer integration, you can also read this section in context: [Data-Consumer Flow — Step 2](data-consumer-flow.md#step-2-obtain-a-dsgo-bearer-token).

## When you need this

Request a fresh DSGO bearer token before calling any of these endpoints:

- `GET /v1/api/GIRBasisdataMessage`
- `GET /v1/api/GIRBasisdataMessage/{guid}`
- `POST /v1/api/GIRBasisdataMessage`

Tokens expire after **3600 seconds (1 hour)**. Request a new one before the current token expires.

## Prerequisites

Before you can call this endpoint your organization must meet the following conditions:

1. **DSGO membership** — Your organization must be registered in the DSGO satellite with an active `dataspaceMembership` claim for `EU.DS.NL.DSGO`. Contact DSGO to obtain membership.
2. **An RSA key pair** — You need a private key to sign the client assertion JWT. The corresponding certificate chain must be recognized by the DSGO satellite.
3. **Your organization DID** — Format: `did:ishare:EU.NL.NTRNL-<KVK>`, where `<KVK>` is your 8-digit Dutch Chamber of Commerce (KvK) number.

## How it works

```mermaid
sequenceDiagram
    participant App as Your Application
    participant GIR as GIR API
    participant SAT as DSGO Satellite

    App->>App: Create signed JWT client assertion
    App->>GIR: POST /connect/token<br/>(form-urlencoded)
    GIR->>SAT: Validate party membership for client_id
    SAT-->>GIR: Party found, membership active
    GIR->>GIR: Validate JWT signature, claims, and replay
    GIR-->>App: 200 OK — DSGO bearer token
    App->>GIR: GET /v1/api/GIRBasisdataMessage?vboID=...<br/>Authorization: Bearer <access_token>
```

## Step 1: Create a client assertion JWT

A **client assertion** is a short-lived signed JWT that proves your identity to GIR. You must generate a fresh one for every token request — assertions that have been used before are rejected.

The DSGO Developer Portal is the authoritative guide for creating this JWT, including how to sign it and how to embed the certificate chain in the `x5c` header:

➔ [DSGO Developer Portal ➚](https://digigo-nu.gitbook.io/dsgo-developer-portal/)

When following that guide, use these exact values for GIR:

| JWT field | Value | Notes |
|-----------|-------|-------|
| `alg` (header) | `RS256` | Fixed |
| `typ` (header) | `JWT` | Fixed |
| `x5c` (header) | Your certificate chain | See DSGO Developer Portal |
| `iss` | `did:ishare:EU.NL.NTRNL-<YOUR_KVK>` | Your organization's DID |
| `sub` | `did:ishare:EU.NL.NTRNL-<YOUR_KVK>` | Must be identical to `iss` |
| `aud` | `did:ishare:EU.NL.NTRNL-76660680` | GIR's own DID (preview) |
| `iat` | Current Unix timestamp | Seconds since epoch |
| `exp` | `iat + 30` | **Exactly** 30 seconds after `iat` |

> **`exp - iat` must be exactly 30 seconds.** Any other value — including values less than 30 — is rejected.

> **Each JWT can only be used once.** GIR maintains a token replay cache. Always generate a new JWT for each token request, even if the previous request failed.

## Step 2: Send the token request

Send a `POST` request with an `application/x-www-form-urlencoded` body:

```http
POST https://gir-preview.poort8.nl/connect/token
Content-Type: application/x-www-form-urlencoded
```

| Parameter | Value | Notes |
|-----------|-------|-------|
| `grant_type` | `client_credentials` | Fixed |
| `scope` | `iSHARE` | Fixed |
| `client_id` | `did:ishare:EU.NL.NTRNL-<YOUR_KVK>` | Your organization's DID |
| `client_assertion_type` | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` | Fixed |
| `client_assertion` | `<JWT_CLIENT_ASSERTION>` | The JWT you created in Step 1 |

### Example (curl)

```bash
curl -X POST https://gir-preview.poort8.nl/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=iSHARE" \
  --data-urlencode "client_id=did:ishare:EU.NL.NTRNL-<YOUR_KVK>" \
  --data-urlencode "client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer" \
  --data-urlencode "client_assertion=<JWT_CLIENT_ASSERTION>"
```

## Step 3: Use the token

A successful response returns HTTP `200`:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Add the `access_token` as a `Bearer` header in all subsequent GIR data calls:

```http
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID=0344010000126888
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

The token is valid for **3600 seconds**. When it expires, repeat Steps 1 and 2 to obtain a new one.

## Errors

| HTTP status | Message | Cause |
|-------------|---------|-------|
| `400 Bad Request` | `Invalid client_assertion.` | JWT signature invalid, claims incorrect, party not found in DSGO satellite, no active `dataspaceMembership` for `EU.DS.NL.DSGO`, assertion already used, or certificate chain rejected |
| `400 Bad Request` | Validation error on `grant_type`, `scope`, or `client_assertion_type` | One of the fixed parameters has an incorrect value |

GIR returns a generic `Invalid client_assertion.` message for all JWT-related failures to avoid leaking validation details. Use the [Common issues](#common-issues) table to narrow down the cause.

## Common issues

| Symptom | Likely cause |
|---------|-------------|
| Every request returns 400 | `aud` claim is not `did:ishare:EU.NL.NTRNL-76660680` |
| Every request returns 400 | `iss` and `sub` claims differ from each other |
| Every request returns 400 | `exp - iat` is not exactly 30 seconds |
| Second use of the same JWT fails | Token replay: generate a new JWT for every request |
| 400 despite a valid-looking JWT | Organization is not registered in the DSGO satellite, or doesn't have an active `dataspaceMembership` claim for `EU.DS.NL.DSGO` |
| 400 on certificate validation | Certificate chain in the `x5c` header is malformed or not trusted by the DSGO satellite |

## API reference

- Interactive endpoint reference: [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- DSGO Developer Portal (client assertion guide): [DSGO Developer Portal ➚](https://digigo-nu.gitbook.io/dsgo-developer-portal/)
