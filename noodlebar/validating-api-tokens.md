# Validating API Access Tokens — Guide for Data Service Providers

## Who Is This Guide For?

This guide is for **Charlie** — a data service provider who exposes APIs in the dataspace. It covers how to register your API, manage access requests, and validate the JWT access tokens that consumers present when calling your API.

## Prerequisites

Before you begin, ensure the following:

| Requirement | Description |
|-------------|-------------|
| **Organization registered** | Your organization is registered in the ASR and has been approved by the administrator |
| **User account active** | You have an active user account on the self-service portal (`{domain}.poort8.nl/portal`) |
| **API implemented** | You have an API ready to receive requests and validate tokens |

## Overview

```mermaid
sequenceDiagram
    participant David as David (Consumer)
    participant ASR as Association Registry
    participant API as Charlie's API
    participant JWKS as JWKS Endpoint

    Note over API,JWKS: On startup: fetch signing keys
    API->>JWKS: GET /protocol/openid-connect/certs
    JWKS-->>API: Public keys (JWKS)

    David->>ASR: Request token (client_credentials)
    ASR-->>David: Signed JWT access token

    David->>API: API call + Authorization: Bearer {token}

    Note over API: Token validation
    API->>API: 1. Verify JWT signature (against cached JWKS)
    API->>API: 2. Check exp > now
    API->>API: 3. Check iss == expected issuer
    API->>API: 4. Check aud contains my API client ID
    API->>API: 5. Extract organization claim
    API-->>David: API response
```

## Step 1 — Register Your API

1. Log in to the self-service portal (`{domain}.poort8.nl/portal`)
2. Navigate to **Systems** and select **Register API**
3. Fill in the API details (name, description, base URL)
4. Upload your **OpenAPI specification** — this is rendered in the catalogue for consumers to browse
5. Submit the registration

> Replace `{domain}` with the value provided by your dataspace administrator.

After registration, your API appears in the **Catalogue** where other participants can discover it and request access.

> **Note your API's client ID** — consumers will include this as the `aud` (audience) claim in their tokens, and you must validate it.

## Step 2 — Manage Access Requests

When a consumer (David) requests access to your API:

1. You receive a notification in the self-service portal
2. Navigate to your API's detail page to review pending requests
3. Review the requesting organization's identity
4. **Approve** or **reject** the request

Once approved, the consumer can request tokens that target your API. You can **revoke** access at any time.

## Step 3 — Validate Incoming Tokens

Every API request from a consumer includes a JWT access token in the `Authorization` header. You **must** validate this token before processing the request.

### Validation Steps

Perform these checks in order. Reject the request immediately if any check fails.

| # | Check | What to Verify | On Failure |
|---|-------|---------------|------------|
| 1 | **Signature** | JWT signature is valid against the Association Registry's public keys (JWKS) | `401 Unauthorized` |
| 2 | **Expiration** | `exp` claim is in the future | `401 Unauthorized` |
| 3 | **Issuer** | `iss` claim equals `https://auth.poort8.nl/realms/{realm}` | `401 Unauthorized` |
| 4 | **Audience** | `aud` claim contains your API's client ID | `403 Forbidden` |
| 5 | **Organization** | `organization` claim is present and identifies a known consumer | Use for business logic |

> **Step 4 is critical.** Without audience validation, a token intended for a different API could be used to access yours. Always verify that your API's client ID appears in the `aud` claim.

### JWKS Endpoint

The Association Registry publishes its signing keys at:

```
https://auth.poort8.nl/realms/{realm}/protocol/openid-connect/certs
```

Fetch and cache these keys on application startup. Most JWT libraries handle key rotation automatically by re-fetching when an unknown `kid` (key ID) is encountered.

### Token Claims Reference

A decoded access token from a consumer looks like this:

```json
{
  "iss": "https://auth.poort8.nl/realms/{realm}",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "YOUR_API_CLIENT_ID",
  "exp": 1711324800,
  "iat": 1711324500,
  "jti": "unique-token-id",
  "scope": "YOUR_API_CLIENT_ID organization",
  "client_id": "CONSUMER_APP_CLIENT_ID",
  "organization": {
    "NLNHR.12345678": {
      "id": "ORGANIZATION_UUID"
    }
  }
}
```

| Claim | Type | Description |
|-------|------|-------------|
| `iss` | string | Token issuer — must be the Association Registry |
| `sub` | string | Service account identifier |
| `aud` | string or string[] | Target audience — must contain your API's client ID |
| `exp` | number | Expiration time (Unix timestamp, 5-minute lifetime) |
| `iat` | number | Issued-at time (Unix timestamp) |
| `jti` | string | Unique token identifier |
| `scope` | string | Space-separated granted scopes |
| `client_id` | string | The consumer application's client ID |
| `organization` | object | Consumer's organization identity (see below) |

### Organization Claim

The `organization` claim identifies the consumer's organization in the dataspace:

```json
{
  "organization": {
    "NLNHR.12345678": {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

The key of the object (e.g., `NLNHR.12345678`) is the organization's **EUID** — the same identifier that was assigned and verified during registration with the Association Registry. This is not a self-declared value: the EUID is derived from the organization's official business registration number (KvK, KBO, or court registration), verified by the administrator before the organization was approved.

Use this to:

- Identify which organization is calling your API
- Apply business-level access rules (e.g., return only data belonging to this organization)
- Log API access per organization for auditing

## Code Examples

### Node.js (express-oauth2-jwt-bearer)

```javascript
const express = require('express');
const app = express();
const { auth } = require('express-oauth2-jwt-bearer');

const jwtCheck = auth({
  issuerBaseURL: 'https://auth.poort8.nl/realms/{realm}',
  audience: 'your-api-client-id',
  tokenSigningAlg: 'RS256'
});

app.use(jwtCheck);

app.get('/data', function (req, res) {
  const organization = req.auth.payload.organization;
  res.send('Secured Resource for ' + JSON.stringify(organization));
});

app.listen(3000);
```

### C# (.NET)

In .NET, use the built-in JWT Bearer authentication middleware. It handles JWKS fetching, key rotation, signature verification, and claim validation automatically.

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.poort8.nl/realms/{realm}";
        options.Audience = "your-api-client-id";
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/data", (HttpContext ctx) =>
{
    var organization = ctx.User.FindFirst("organization")?.Value;
    return $"Secured Resource for {organization}";
}).RequireAuthorization();

app.Run();
```

### Python (FastAPI + python-jose)

```python
from fastapi import FastAPI, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
import httpx

app = FastAPI()
security = HTTPBearer()

ISSUER = "https://auth.poort8.nl/realms/{realm}"
AUDIENCE = "your-api-client-id"

def get_jwks():
    url = f"{ISSUER}/protocol/openid-connect/certs"
    return httpx.get(url).json()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    jwks = get_jwks()
    claims = jwt.decode(token, jwks, algorithms=["RS256"], audience=AUDIENCE, issuer=ISSUER)
    return claims

@app.get("/data")
def get_data(claims: dict = Depends(verify_token)):
    organization = claims.get("organization")
    return {"message": f"Secured Resource for {organization}"}
```

## Error Responses

Return appropriate HTTP status codes when token validation fails:

| Scenario | Status Code | Response |
|----------|-------------|----------|
| No `Authorization` header | `401 Unauthorized` | `{"error": "Missing Bearer token"}` |
| Invalid or expired token | `401 Unauthorized` | `{"error": "Invalid token"}` |
| Wrong audience | `403 Forbidden` | `{"error": "Token not intended for this API"}` |
| Unknown organization | `403 Forbidden` | `{"error": "Unknown organization"}` |

> **Security note:** Do not include detailed error messages about *why* validation failed in production responses. Log the details server-side for debugging.

## Security Best Practices

| Practice | Rationale |
|----------|-----------|
| **Always validate all claims** | Never skip audience or issuer checks |
| **Cache JWKS keys** | Avoid fetching keys on every request; refresh on unknown `kid` |
| **Use clock tolerance** | Allow a small clock skew (e.g., 30 seconds) for `exp` validation |
| **Reject unsigned tokens** | Ensure your library rejects tokens with `alg: none` |
| **Log access per organization** | Maintain an audit trail of which organizations accessed your API |
| **Do not log tokens** | Tokens are sensitive credentials — log the `jti` claim instead for traceability |

## OpenID Connect Discovery

The Association Registry publishes its full configuration (issuer, endpoints, signing algorithms, supported claims) at:

```
https://auth.poort8.nl/realms/{realm}/.well-known/openid-configuration
```

Most JWT libraries can auto-configure from this endpoint using the `Authority` setting.

## Environment Reference

| Resource | URL |
|----------|-----|
| **Self-Service Portal** | `https://{domain}.poort8.nl/portal` |
| **JWKS endpoint** | `https://auth.poort8.nl/realms/{realm}/protocol/openid-connect/certs` |
| **OIDC Discovery** | `https://auth.poort8.nl/realms/{realm}/.well-known/openid-configuration` |
| **Expected issuer** | `https://auth.poort8.nl/realms/{realm}` |
