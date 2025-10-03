# DVU Implementation: Retrieving VBO and EAN Data via DVU
The following steps describe how you can retrieve VBO and EAN Data via DVU. All DVU API calls require a valid iSHARE access token - more information on iSHARE can be found on the iSHARE [website](https://ishare.eu/) or [developer portal](https://dev.ishare.eu/).

## Steps

### Step 1: Generate a client assertion JWT
An iSHARE access token is required in order to use the DVU API. To retrieve an iSHARE access token, you will need a client assertion JWT containing your organization data, signed with your private key and including a header with your X.509 certificate chain.

Generate this JWT with the following headers:
```json
{
  "alg": "RS256",
  "typ": "JWT", 
  "x5c": ["MIIEfzCCAmegAwIBAgII..."]  // Your X.509 certificate chain (base64)
}
```

And the following claims, including the DVU EORI:
```json
{
  "iss": "<YOUR_EORI>",                   // Your EORI number (e.g., EU.EORI.NL123456789)
  "sub": "<YOUR_EORI>",                   // Same as iss, your EORI number
  "aud": "EU.EORI.NL822555025",           // DVU EORI
  "iat": "<UNIX_TIMESTAMP_NOW>",          // Unix timestamp (now, example: 1750665132)
  "exp": "<UNIX_TIMESTAMP_NOW_PLUS_30>",  // Unix timestamp (now increased by 30 seconds, example: 1750665162)
  "jti": "<UUID>"                         // A unique UUID for this JWT
}
```

#### Implementation tools
To make JWT generation easier, you can use the following tools:
- For .NET developers, use the [Poort8.iSHARE.Core NuGet package](https://github.com/POORT8/Poort8.Ishare.Core/blob/master/README.md)
- For Python developers, see [iSHARE Python code snippets](https://github.com/iSHAREScheme/code-snippets/blob/master/Python/access_token.py) for complete implementation
- For other platforms, follow the [iSHARE Client Assertion specification](https://dev.ishare.eu/reference/ishare-jwt/client-assertion)

### Step 2: Obtain an iSHARE access token
To obtain an iSHARE access token, make the following API request:
```http
POST https://dvu-test.azurewebsites.net/iSHARE/connect/token
Content-Type: application/x-www-form-urlencoded
```

With the following x-www-form-urlencoded body, including the client assertion from the previous step:
| Key                     | Value                                                    |
| ----------------------- | -------------------------------------------------------- |
| `grant_type`            | `client_credentials`                                     |
| `scope`                 | `iSHARE`                                                 |
| `client_assertion_type` | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` |
| `client_id`             | `<YOUR_EORI>`                                            |
| `client_assertion`      | `<CLIENT_ASSERTION>`                                     |

You should get a successful response, including your access token, that looks like this:
```json
{
  "access_token": "<ACCESS_TOKEN>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 3: Retrieving VBO and EAN Data
With the iSHARE access token obtained in the previous step, you can retrieve VBO and EAN data via the DVU API. This can be done with the following request, including the access token, and your EORI number:
```http
GET https://dvu-test.azurewebsites.net/api/resourcegroups?issuer=<YOUR_EORI>&vbo=<VBO_ID>&ean=<EAN_ID>
Authorization: Bearer <ACCESS_TOKEN>
```

With these query parameters:
| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `issuer`  | string | Yes      | Your EORI number (same as in client assertion) |
| `vbo`     | string | No*      | Filter on specific VBO ID                      |
| `ean`     | string | No*      | Filter on specific EAN ID                      |

*At least one of `vbo` or `ean` must be provided.

You should get a successful response, that looks like this:
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

## Smart Data Solutions (SDS)
Using an EAN, you can retrieve energy data from Smart Data Solutions (SDS). More information can be found in the [energy data retrieval from Smart Data Solutions (SDS) via DVU documentation](sds-data-retrieval.md), but **please note that this documentation is a work in progress, and therefore not yet complete.**

## Important notes
- **Token validity**: Access tokens are valid for 1 hour (`expires_in: 3600`)
- **Rate limiting**: Respect any API rate limits
- **Client assertion**: Use a new `jti` (JWT ID) for each client assertion to prevent replay attacks