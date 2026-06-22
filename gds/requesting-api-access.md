# Requesting API Access

This guide is for **David** — a data service consumer who wants to call APIs registered in the GDS dataspace. It covers the full process from registering your application through to making API calls.

## Prerequisites

| Requirement | Description |
|-------------|-------------|
| Organization registered | Your organization is registered and approved in the GDS Participant Registry |
| User account active | You have an active account on the [Self-Service Portal](https://gds-preview.poort8.nl/portal) |
| Target API known | You know which API you want to integrate with |

## Overview

```likec4
// view: requesting_api_access
specification {
  element actor
  element system
}

model {
  david = actor 'David (Consumer)'
  portal = system 'Self-Service Portal'
  charlie = actor 'Charlie (Provider)'
  gds = system 'GDS Participant Registry'
  api = system 'Charlie\'s API'
}

views {
  dynamic view requesting_api_access {
    title 'Requesting API Access'
    variant sequence

    david -> portal 'Register application'
    portal -> gds 'Create application client'
    portal -> david 'Client credentials'

    david -> portal 'Browse catalogue & request access'
    portal -> charlie 'Access request notification'

    charlie -> portal 'Approve access'
    portal -> gds 'Assign API scope to application'

    david -> gds 'Request token (client_credentials)'
    gds -> david 'Access token (JWT)'

    david -> api 'Call API with Bearer token'
    api -> david 'API response'
  }
}
```

## Step 1 — Register your application

1. Log in to the [Self-Service Portal](https://gds-preview.poort8.nl/portal)
2. Navigate to **Systems** → **Register Application**
3. Fill in application details (name, description)
4. Submit the registration

After registration, the portal shows your **client credentials**:

| Credential | Description |
|------------|-------------|
| `client_id` | Your application's unique identifier |
| `client_secret` | Your application's secret — **store securely** |

> **Important:** The client secret is shown only once. Copy and store it in a secure location. If lost, you will need to generate a new one.

## Step 2 — Request API access

1. Navigate to the **Catalogue** in the Self-Service Portal
2. Browse or search for the API you want to integrate with
3. View the API documentation (OpenAPI spec) to understand available endpoints
4. Click **Request Access**

Your request now has status **Pending**. The API owner (Charlie) is notified and will approve or reject.

## Step 3 — Request an access token

After your access request is approved, use the **OAuth 2.0 Client Credentials** grant to obtain an access token.

### Token endpoint

```
POST https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token
```

### Request

```http
POST /realms/gds-preview/protocol/openid-connect/token HTTP/1.1
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
| `client_id` | Your application's client ID | Shown in the portal after registration |
| `client_secret` | Your application's client secret | Shown in the portal after registration |
| `scope` | The API's client ID | Found in the API catalog in the portal |

### Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "target-api-client-id organization"
}
```

> **Token lifetime:** Access tokens are valid for **5 minutes**. Request a new token before the current one expires. Do not cache tokens beyond their expiry.

### Code examples

**cURL:**
```bash
curl -X POST https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=TARGET_API_CLIENT_ID"
```

**C#:**
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
    "https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token",
    new FormUrlEncodedContent(tokenRequest));

var tokenResponse = await response.Content.ReadFromJsonAsync<JsonDocument>();
var accessToken = tokenResponse.RootElement.GetProperty("access_token").GetString();
```

**Node.js:**
```javascript
const response = await fetch(
  "https://auth.poort8.nl/realms/gds-preview/protocol/openid-connect/token",
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
GET https://api.example-provider.nl/data
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

The provider will validate your token and check that your organization is authorized. See [Authorization Enforcement](authorization.md) for details on how providers verify policies.

## Token structure

The access token is a signed JWT containing these claims:

```json
{
  "iss": "https://auth.poort8.nl/realms/gds-preview",
  "sub": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aud": "target-api-client-id",
  "exp": 1711324800,
  "iat": 1711324500,
  "jti": "unique-token-id",
  "scope": "target-api-client-id organization",
  "client_id": "YOUR_APP_CLIENT_ID",
  "organization": {
    "NLNHR.12345678": {
      "id": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

| Claim | Description |
|-------|-------------|
| `iss` | Token issuer (GDS Participant Registry) |
| `aud` | Target API's client ID |
| `exp` | Expiration time (Unix timestamp) |
| `client_id` | Your application's client ID |
| `organization` | Your organization's verified EUID and ID |

The `organization` claim key (e.g., `NLNHR.12345678`) is your organization's EUID — verified during registration, not self-declared.

## Next steps

API access allows you to call the provider's API. For building-level data access, you also need **data authorization** — policies that grant your organization access to specific buildings. See [Keyper Approval Workflow](approval-workflow.md) for requesting building data access from building owners.
