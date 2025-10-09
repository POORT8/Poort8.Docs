**⚠️ Note**: This documentation is a work in progress, and therefore not yet complete.

# Energy data retrieval from Smart Data Solutions (SDS) via DVU
The following steps describe how you can retrieve energy data from Smart Data Solutions (SDS). All API calls to SDS require a valid iSHARE access token - more information on iSHARE can be found on the iSHARE [website](https://ishare.eu/) or [developer portal](https://dev.ishare.eu/).

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

And the following claims, including the SDS EORI:
```json
{
  "iss": "<YOUR_EORI>",                   // Your EORI number (e.g., EU.EORI.NL123456789)
  "sub": "<YOUR_EORI>",                   // Same as iss, your EORI number
  "aud": "EU.EORI.NL851872426",           // SDS EORI
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
POST https://dvu-test.smartdatasolutions.nl/token
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

### Step 3: Retrieving SDS energy data
**⚠️ Note**: Complete documentation for SDS data endpoints will be updated once SDS implements query parameter support.

With the iSHARE access token obtained in the previous step, you can retrieve SDS energy data via the DVU API. This can be done with the following request, including the access token, and your EORI number:
```http
GET https://dvu-test.smartdatasolutions.nl/service
Authorization: Bearer <ACCESS_TOKEN>
```

## Important notes
- **Token validity**: Access tokens are valid for 1 hour (`expires_in: 3600`)
- **Rate limiting**: Respect any API rate limits
- **Client assertion**: Use a new `jti` (JWT ID) for each client assertion to prevent replay attacks