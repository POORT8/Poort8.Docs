# Retrieving VBO and EAN Data via DVU

The following steps describe how to retrieve VBO and EAN data via DVU. All DVU API calls require a valid iSHARE access token — more information on iSHARE can be found on the iSHARE [website ➚](https://ishare.eu/) or [developer portal ➚](https://dev.ishare.eu/).

## Steps

### Step 1: Generate a client assertion JWT

An iSHARE access token is required to use the DVU API. Generate a client assertion JWT signed with your private key and including your X.509 certificate chain.

Headers:
```json
{
  "alg": "RS256",
  "typ": "JWT",
  "x5c": ["MIIEfzCCAmegAwIBAgII..."]
}
```

Claims:
```json
{
  "iss": "NL.KVK.<YOUR_KVK>",
  "sub": "NL.KVK.<YOUR_KVK>",
  "aud": "NL.KVK.27378529",
  "iat": "<UNIX_TIMESTAMP_NOW>",
  "exp": "<UNIX_TIMESTAMP_NOW_PLUS_30>",
  "jti": "<UUID>"
}
```

| Claim | Value |
|-------|-------|
| `iss` / `sub` | Your organization identifier (`NL.KVK.<your KVK>`) |
| `aud` | DVU (RVO): `NL.KVK.27378529` |

### Implementation tools

- **.NET**: [Poort8.iSHARE.Core NuGet package ➚](https://github.com/POORT8/Poort8.Ishare.Core/blob/master/README.md)
- **Python**: [iSHARE Python code snippets ➚](https://github.com/iSHAREScheme/code-snippets/blob/master/Python/access_token.py)
- **Other**: [iSHARE Client Assertion specification ➚](https://dev.ishare.eu/reference/ishare-jwt/client-assertion)

### Step 2: Obtain an iSHARE access token

```http
POST https://dvu-test.azurewebsites.net/iSHARE/connect/token
Content-Type: application/x-www-form-urlencoded
```

| Key | Value |
|-----|-------|
| `grant_type` | `client_credentials` |
| `scope` | `iSHARE` |
| `client_assertion_type` | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` |
| `client_id` | `NL.KVK.<YOUR_KVK>` |
| `client_assertion` | `<CLIENT_ASSERTION>` |

**200 OK**
```json
{
  "access_token": "<ACCESS_TOKEN>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 3: Retrieve VBO and EAN data

```http
GET https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=NL.KVK.<YOUR_KVK>&vbo=<VBO_ID>&ean=<EAN_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issuer` | string | Yes | Your organization identifier (`NL.KVK.<your KVK>`) |
| `vbo` | string | No* | Filter on specific VBO ID |
| `ean` | string | No* | Filter on specific EAN ID |

*At least one of `vbo` or `ean` must be provided.

**Example response:**
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

## Next steps

Using the EAN codes, you can retrieve energy data from Smart Data Solutions (SDS) — see [Energy Data Retrieval from SDS](sds-data-retrieval.md).

## Important notes

- **Token validity**: Access tokens are valid for 1 hour (`expires_in: 3600`)
- **Rate limiting**: Respect any API rate limits
- **Client assertion**: Use a new `jti` (JWT ID) for each client assertion to prevent replay attacks