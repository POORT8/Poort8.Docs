# DVU Implementation: Bulk Building Access

This guide explains how to implement the Keyper Approve workflow for requesting energy data access for multiple buildings simultaneously through DVU.

## Overview

Users of DVU applications need to request permission from energy contractors to access energy data for multiple buildings. This process uses an extended form for collecting multiple building addresses and follows a specialized bulk approval workflow.

## Implementation Steps

### Step 1: Bulk Building Form

For bulk building access, create an extended form with the following fields:

#### Requester Information (Form User)

- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL123456789)

#### Energy Contractor Information (Approver)

- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL123456789)

#### Building List (Bulk Input)

- **Address List**: Multiple addresses can be added
  - Per address: Postal code + House number (e.g., "3013 AK 45")

**Validation Requirements:**
- Email, EORI number, and at least one valid address
- Client-side validation strongly recommended for user experience

### Step 2: Keyper API Integration

When the form is submitted, send a POST request to the Keyper Approve API:

**Endpoint:** [https://keyper-preview.poort8.nl/api/approval-links](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)

```http
POST https://keyper-preview.poort8.nl/api/approval-links
Content-Type: application/json
```

#### JSON Request Body Example for Bulk Buildings

```json
{
  "authenticationMethods": ["eherkenning"],
  "requester": {
    "email": "<REQUESTER_EMAIL>",
    "organization": "<REQUESTER_ORGANIZATION>",
    "organizationId": "<REQUESTER_EORI>"
  },
  "approver": {
    "email": "<ENERGY_CONTRACTOR_EMAIL>",
    "organization": "<ENERGY_CONTRACTOR_ORGANIZATION>",
    "organizationId": "<ENERGY_CONTRACTOR_EORI>"
  },
  "dataspace": {
    "name": "dvu",
    "policyUrl": "https://dvu-test.azurewebsites.net/api/policies/",
    "organizationUrl": "https://dvu-test.azurewebsites.net/api/organization-registry/__ORGANIZATIONID__",
    "resourceGroupUrl": "https://dvu-test.azurewebsites.net/api/resourcegroups/"
  },
  "description": "DVU bulk building access request",
  "reference": "<YOUR_REFERENCE>",
  "expiresInSeconds": "<VALIDITY_PERIOD>",
  "redirectUrl": "<COMPLETION_REDIRECT_URL>",
  "orchestration": {
    "flow": "dvu.voeg-gebouwen-toe@1",
    "payload": {
      "addresses": ["3013 AK 45", "3161 GD 7a", "3161 GD 7b"]
    }
  }
}
```

### Step 3: Orchestration Configuration

**Important orchestration settings:**
- **`flow`**: `"dvu.voeg-gebouwen-toe@1"` activates the bulk building metadata flow
- **`payload.addresses`**: Array of addresses in "postal code house number" format
- **Automatic redirect**: Keyper detects the flow and automatically directs users to DVU metadata app

**Expected Behavior:**
1. After creation, the application receives an approval link with "Active" status
2. When the approver opens the link, they are automatically redirected to DVU metadata app
3. In the DVU app, the approver can add bulk buildings with additional data
4. After completion, the user returns to Keyper Approve for final approval

## Data Retrieval After Approval

After approval via Keyper Approve, developers can retrieve VBO identifiers and associated EAN codes via the DVU API.

### Step 3: Authentication - Obtaining iSHARE Access Token

All DVU API calls require a valid iSHARE access token. This is obtained in two steps:

#### Step 1: Generate Client Assertion JWT

For iSHARE authentication, you need a client assertion JWT containing your organization data, signed with your private key and including an x5c header with your certificate chain.

**Required JWT Header:**
```json
{
  "alg": "RS256",
  "typ": "JWT", 
  "x5c": ["MIIEfzCCAmegAwIBAgII..."]  // Your certificate chain (base64)
}
```

**Required JWT Claims:**
```json
{
  "iss": "EU.EORI.NL123456789",           // Your EORI number (Party Identifier)
  "sub": "EU.EORI.NL123456789",           // Same as iss  
  "aud": "EU.EORI.NL822555025",           // DVU EORI
  "iat": 1750665132,                      // Unix timestamp (now)
  "exp": 1750665162,                      // Unix timestamp (30 seconds later)
  "jti": "378a47c4-2822-4ca5-a49a-7e5a1cc7ea59"  // Unique UUID for this JWT
}
```

**Implementation Tools:**
- **For .NET developers**: Use the [Poort8.iSHARE.Core NuGet package](https://github.com/POORT8/Poort8.Ishare.Core/blob/master/README.md) for easy JWT generation
- **For Python developers**: See [iSHARE Python code snippets](https://github.com/iSHAREScheme/code-snippets/blob/master/Python/access_token.py) for complete implementation
- **For other platforms**: Follow the [iSHARE Client Assertion specification](https://dev.ishare.eu/reference/ishare-jwt/client-assertion) for JWT creation

#### Step 2: Obtain Access Token

```http
POST https://dvu-test.azurewebsites.net/iSHARE/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=EU.EORI.NL123456789&client_assertion=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Retrieving VBO and EAN Data

With your access token, you can now retrieve VBO and EAN data via the Resource Groups API:

```http
GET https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=EU.EORI.NL123456789
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci...
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issuer` | string | Yes | Your EORI number (same as in client assertion) |
| `vbo` | string | No* | Filter on specific VBO ID |
| `ean` | string | No* | Filter on specific EAN ID |

*At least one of `vbo` or `ean` must be provided for filtering

#### Response Format

**Success Response (200 OK):**
```json
{
  "resourceGroupId": "dvu:resource:871689260010498601",
  "useCase": "DVU",
  "name": "871689260010498601",
  "description": "Verblijfsobject",
  "resources": [
    {
      "resourceId": "dvu:resource:0613010000206776",
      "useCase": "DVU",
      "name": "0613010000206776",
      "description": "EAN"
    }
  ]
}
```

## Energy Data Retrieval from Smart Data Solutions (SDS)

After obtaining VBO identifiers and EAN codes via the DVU API, you can retrieve the actual energy data from Smart Data Solutions using the same iSHARE authentication pattern.

### SDS Authentication

The authentication process for SDS follows the same steps as for DVU, with SDS-specific endpoints and EORI:

**SDS EORI for JWT audience**: `"aud": "EU.EORI.NL851872426"`

```http
POST https://dvu-test.smartdatasolutions.nl/Token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=EU.EORI.NL123456789&client_assertion=eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
```

### SDS Data Endpoints

**⚠️ Note**: Complete documentation for SDS data endpoints will be updated once SDS implements query parameter support.

```http
GET https://dvu-test.smartdatasolutions.nl/service
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci...
```

## Important Notes

- **Token validity**: Access tokens are valid for 1 hour (`expires_in: 3600`)
- **Rate limiting**: Respect any API rate limits
- **EORI validation**: The `issuer` parameter must exactly match the `clientId` in your access token
- **Client assertion**: Use a new `jti` (JWT ID) for each client assertion to prevent replay attacks

## API Examples

### Example 1: Get all VBOs and EANs for an organization

```bash
# Get access token
curl -X POST "https://dvu-test.azurewebsites.net/iSHARE/connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&scope=iSHARE&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_id=EU.EORI.NL123456789&client_assertion=eyJ0eXAiOiJKV1QiLCJhbGci..."

# Get all resources for organization
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

### Example 2: Get specific VBO with all associated EANs

```bash
curl -X GET "https://dvu-test.azurewebsites.net/api/resourcegroups?vbo=0613010000206776&issuer=EU.EORI.NL123456789" \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGci..."
```

## Next Steps

- Implement error handling for API responses
- Set up monitoring for bulk approval workflows
- Test the complete flow in the test environment
- Plan migration to production environment

---

For single building access, see the [Single Building Access](single-building.md) guide.
