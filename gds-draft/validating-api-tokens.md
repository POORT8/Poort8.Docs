# Validating API Tokens

> **Note:** This documentation describes the **future state** of the GDS platform. Some features and `gds-preview` links are not yet available.

This guide is for **Charlie** — a data service provider who exposes APIs in the GDS dataspace. It covers how to validate the JWT access tokens that consumers present when calling your API.

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Organization registered | Your organization is registered and approved in the GDS Participant Registry |
| API registered | Your API is registered in the Self-Service Portal |
| API implemented | You have an API ready to receive requests and validate tokens |

## Overview

```likec4
// view: validating_api_tokens
specification {
  element actor
  element system
}

model {
  david = actor 'David (Consumer)'
  gds = system 'GDS Participant Registry'
  api = system 'Charlie\'s API'
  jwks = system 'JWKS Endpoint'
}

views {
  dynamic view validating_api_tokens {
    title 'Validating API Tokens'
    variant sequence

    api -> jwks 'Fetch signing keys (on startup)'
    jwks -> api 'Public keys (JWKS)'

    david -> gds 'Request token (client_credentials)'
    gds -> david 'Signed JWT access token'

    david -> api 'API call + Authorization: Bearer {token}'
    api -> api 'Verify signature, expiry, issuer, audience'
    api -> api 'Extract organization claim'
    api -> david 'API response'
  }
}
```

## Validation steps

Perform these checks in order. Reject the request immediately if any check fails.

| # | Check | What to verify | On failure |
|---|-------|---------------|------------|
| 1 | **Signature** | JWT signature valid against GDS public keys (JWKS) | `401 Unauthorized` |
| 2 | **Expiration** | `exp` claim is in the future | `401 Unauthorized` |
| 3 | **Issuer** | `iss` equals `https://auth.poort8.nl/realms/gds-preview` | `401 Unauthorized` |
| 4 | **Audience** | `aud` contains your API's client ID | `403 Forbidden` |
| 5 | **Organization** | `organization` claim is present | Use for business logic |

> **Step 4 is critical.** Without audience validation, a token intended for a different API could be used to access yours. Always verify that your API's client ID appears in the `aud` claim.

## JWKS endpoint

The GDS Participant Registry publishes its signing keys at:

```
https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/certs
```

Fetch and cache these keys on application startup. Most JWT libraries handle key rotation automatically by re-fetching when an unknown `kid` (key ID) is encountered.

## Token claims reference

A decoded access token from a GDS consumer:

```json
{
  "iss": "https://auth.poort8.nl/realms/gds-preview",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "YOUR_API_CLIENT_ID",
  "exp": 1711324800,
  "iat": 1711324500,
  "jti": "unique-token-id",
  "scope": "YOUR_API_CLIENT_ID organization",
  "client_id": "CONSUMER_APP_CLIENT_ID",
  "organization": {
    "NLNHR.12345678": {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

| Claim | Type | Description |
|-------|------|-------------|
| `iss` | string | Token issuer — must be the GDS Participant Registry |
| `sub` | string | Service account identifier |
| `aud` | string or string[] | Target audience — must contain your API's client ID |
| `exp` | number | Expiration time (Unix timestamp, 5-minute lifetime) |
| `iat` | number | Issued-at time (Unix timestamp) |
| `scope` | string | Space-separated granted scopes |
| `client_id` | string | Consumer application's client ID |
| `organization` | object | Consumer's verified organization identity |

## Organization claim

The `organization` claim identifies the consumer's organization:

```json
{
  "organization": {
    "NLNHR.12345678": {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

The key (e.g., `NLNHR.12345678`) is the organization's **EUID** — derived from the official KvK registration number and verified during onboarding. This is not a self-declared value.

Use this to:
- Identify which organization is calling your API
- Pass as `subject` to the Authorization Registry for policy enforcement (see [Authorization Enforcement](authorization.md))
- Log API access per organization for auditing

## Code examples

### Node.js (express-oauth2-jwt-bearer)

```javascript
const express = require("express");
const { auth } = require("express-oauth2-jwt-bearer");

const app = express();

const jwtCheck = auth({
  issuerBaseURL: "https://auth.poort8.nl/realms/gds-preview",
  audience: "your-api-client-id",
  tokenSigningAlg: "RS256",
});

app.use(jwtCheck);

app.get("/data", (req, res) => {
  const organization = req.auth.payload.organization;
  const orgId = Object.keys(organization)[0]; // e.g., "NLNHR.12345678"
  res.json({ message: `Data for ${orgId}` });
});

app.listen(3000);
```

### C# (.NET)

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://auth.poort8.nl/realms/gds-preview";
        options.Audience = "your-api-client-id";
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/data", (HttpContext ctx) =>
{
    var organization = ctx.User.FindFirst("organization")?.Value;
    return Results.Ok(new { message = $"Data for {organization}" });
}).RequireAuthorization();

app.Run();
```

## Next steps

Token validation confirms *who* is calling your API. To verify *what data* they're allowed to access (which buildings, which actions), see [Authorization Enforcement](authorization.md).
