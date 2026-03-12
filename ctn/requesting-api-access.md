# Requesting API Access — Guide for Data Service Consumers

## Who Is This Guide For?

This guide is for **David** — a data service consumer who wants to call APIs registered in the CTN dataspace. It covers the full process: registering your application, requesting access to an API, obtaining access tokens, and calling the API.

## Prerequisites

Before you begin, ensure the following:

| Requirement | Description |
|-------------|-------------|
| **Organization registered** | Your organization is registered in the CTN ASR and has been approved by the administrator |
| **User account active** | You have an active user account on the [Self-Service Portal](https://ctn-preview.poort8.nl/portal) |
| **Target API known** | You know which API you want to integrate with |

## Overview

```mermaid
sequenceDiagram
    participant David as David (Consumer)
    participant Portal as Self-Service Portal
    participant Charlie as Charlie (Provider)
    participant CTN as CTN Association Registry
    participant API as Charlie's API

    David->>Portal: 1. Register application
    Portal->>CTN : Create APP client
    Portal-->>David: Client credentials

    David->>Portal: 2. Browse catalogue & request access
    Portal-->>Charlie: Access request notification

    Charlie->>Portal: 3. Approve access
    Portal->>CTN : Assign API scope to APP

    David->>CTN : 4. Request token (client_credentials)
    CTN -->>David: Access token

    David->>API: 5. Call API with Bearer token
    API-->>David: API response
```

## Step 1 — Register Your Application

1. Log in to the [Self-Service Portal](https://ctn-preview.poort8.nl/portal)
2. Navigate to **Systems** and select **Register Application**
3. Fill in the application details (name, description)
4. Submit the registration

After registration, the portal shows your **client credentials**:

| Credential | Description |
|------------|-------------|
| `client_id` | Your application's unique identifier |
| `client_secret` | Your application's secret — **store this securely** |

> **Important:** The client secret is shown only once. Copy and store it in a secure location (e.g., a secrets manager). If lost, you will need to generate a new one.

## Step 2 — Request API Access

1. Navigate to the **Catalogue** in the self-service portal
2. Browse or search for the API you want to integrate with
3. View the API documentation (OpenAPI spec rendered via Scalar) to understand the available endpoints
4. Click **Request Access**

Your request now has status **Pending** and the API owner (Charlie) is notified. Once Charlie approves the request, you can start requesting tokens.

## Step 3 — Request an Access Token

After your access request is approved, use the **OAuth 2.0 Client Credentials** grant to obtain an access token.

### Token Endpoint

```
POST https://auth.poort8.nl/realms/ctn-preview/protocol/openid-connect/token
```

### Request

```http
POST /realms/ctn-preview/protocol/openid-connect/token HTTP/1.1
Host: auth.poort8.nl
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
scope=TARGET_API_CLIENT_ID
```

| Parameter | Value | Description |
|-----------|-------|-------------|
| `grant_type` | `client_credentials` | Always this value for M2M authentication |
| `client_id` | Your application's client ID | As shown in the portal after registration |
| `client_secret` | Your application's client secret | As shown in the portal after registration |
| `scope` | The API's client ID | The scope that was granted when Charlie approved your access request |

### Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "target-api-client-id organization"
}
```

| Field | Description |
|-------|-------------|
| `access_token` | The JWT access token to use in API calls |
| `token_type` | Always `Bearer` |
| `expires_in` | Token lifetime in seconds (5 minutes) |
| `scope` | The scopes included in the token |

> **Token lifetime:** Access tokens are valid for **5 minutes**. Request a new token before the current one expires. Do not cache tokens beyond their expiry.

### Code Example (cURL)

```bash
curl -X POST https://auth.poort8.nl/realms/ctn-preview/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=TARGET_API_CLIENT_ID"
```

### Code Example (C#)

```csharp
using var httpClient = new HttpClient();

var tokenRequest = new Dictionary<string, string>
{
    ["grant_type"] = "client_credentials",
    ["client_id"] = "YOUR_CLIENT_ID",
    ["client_secret"] = "YOUR_CLIENT_SECRET",
    ["scope"] = "TARGET_API_CLIENT_ID"
};

var response = await httpClient.PostAsync(
    "https://auth.poort8.nl/realms/ctn-preview/protocol/openid-connect/token",
    new FormUrlEncodedContent(tokenRequest));

var tokenResponse = await response.Content.ReadFromJsonAsync<JsonDocument>();
var accessToken = tokenResponse.RootElement.GetProperty("access_token").GetString();
```

### Code Example (Node.js)

```javascript
const response = await fetch(
  "https://auth.poort8.nl/realms/ctn-preview/protocol/openid-connect/token",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: "YOUR_CLIENT_ID",
      client_secret: "YOUR_CLIENT_SECRET",
      scope: "TARGET_API_CLIENT_ID",
    }),
  }
);

const { access_token } = await response.json();
```

## Step 4 — Call the API

Include the access token as a Bearer token in the `Authorization` header:

```http
GET /shipments HTTP/1.1
Host: api.example-provider.nl
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Code Example (cURL)

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://api.example-provider.nl/shipments
```

## Token Structure Reference

The access token is a signed JWT. Decoded, it contains these claims:

```json
{
  "iss": "https://auth.poort8.nl/realms/ctn-preview",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "target-api-client-id",
  "exp": 1711324800,
  "iat": 1711324500,
  "jti": "unique-token-id",
  "scope": "target-api-client-id organization",
  "client_id": "your-app-client-id",
  "organization": {
    "your-organization-identifier": {
      "id": "organization-uuid"
    }
  }
}
```

| Claim | Description |
|-------|-------------|
| `iss` | Token issuer — the CTN Association Registry |
| `sub` | Service account identifier |
| `aud` | Target API — the provider's client ID |
| `exp` | Expiration time (Unix timestamp) |
| `scope` | Granted scopes (space-separated) |
| `client_id` | Your application's client ID |
| `organization` | Your organization's identity in the dataspace |

> The `organization` claim identifies your organization to the API provider. The provider uses this to determine which data to return.

## Error Handling

### Token Request Errors

| HTTP Status | Error Code | Cause | Resolution |
|-------------|------------|-------|------------|
| 401 | `invalid_client` | Wrong client ID or secret | Verify your credentials |
| 400 | `invalid_grant` | Client credentials grant not enabled | Contact the administrator |
| 400 | `invalid_scope` | Requested scope not available | Verify the API scope was approved; check for typos |
| 403 | `access_denied` | Access not granted or revoked | Request access via the catalogue, or contact the API owner |

### API Call Errors

| HTTP Status | Cause | Resolution |
|-------------|-------|------------|
| 401 | Token expired or invalid | Request a new token |
| 403 | Insufficient scope or access revoked | Verify your access is still active in the portal |

## OpenID Connect Discovery

The CTN Association Registry publishes its configuration at the standard OpenID Connect discovery endpoint:

```
https://auth.poort8.nl/realms/ctn-preview/.well-known/openid-configuration
```

This endpoint returns the token endpoint URL, supported grant types, signing algorithms, and other metadata.

## Environment Reference

| Resource | URL |
|----------|-----|
| **Self-Service Portal** | [ctn-preview.poort8.nl/portal](https://ctn-preview.poort8.nl/portal) |
| **Token endpoint** | `https://auth.poort8.nl/realms/ctn-preview/protocol/openid-connect/token` |
| **OIDC Discovery** | `https://auth.poort8.nl/realms/ctn-preview/.well-known/openid-configuration` |
