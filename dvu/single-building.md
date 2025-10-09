# DVU Implementation: Single Building Access
This guide explains how to implement the Keyper Approve workflow for requesting access to energy data for a single building through DVU in your own application.

## Overview
If you want your application to have access to energy data for a building through DVU, you need approval from the energy contractor. This request for approval will be facilitated by Keyper.

This is how that works, step by step:
1. **Your application** prepares the data that is required in order to create an approval link. This is data about: 
   - The requesting party (you/your application)
   - The approving party (the energy contractor)
   - The building for which you want to access energy data
2. **Your application** sends the approval request to the Keyper API, containing the data from the previous step.
3. **Keyper** uses the data your application provided to create an approval link. This link will then get sent to the approving party - the energy contractor.
4. **The energy contractor** opens the approval link, and gets redirected to the DVU metadata app. There, they will retrieve the data for the building you provided. After this, they will automatically be sent to Keyper Approve.
5. In the Keyper Approve webapp, **the energy contractor** reviews your approval request.
6. If your request is approved, **Keyper** registers a policy in DVU. This policy lets DVU know that you have access to the energy data of the respective building. 
7. **You** can now access the energy data of the respective building.
   - You can now also retrieve the buildings VBO identifier and associated EAN codes via the DVU API. More on this can be found in the [documentation on how to retrieve VBO and EAN data](vbo-ean-data-retrieval.md).

## Implementation steps
In order to implement the Keyper Approve workflow within your application, follow the steps below.

### Step 1: Prepare the required data
Your application needs to prepare the data required for the approval request. How you gather this data (e.g., through a form, API call, configuration file, or database query) is up to your implementation.

#### Requester information
- Name
- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL860730499)

#### Energy contractor information
- Email address
- Organization name
- Organization ID (EORI format, example: EU.EORI.NL860730499)

#### Building information
- Building address:
  - Street name (optional)
  - House number
  - Postal code
  - City (optional)

#### Your application's identifiers
- Application reference - A unique identifier from your system for tracking this specific approval request. This could be:
  - An internal transaction ID
  - A case number
  - A database record ID
  - Any string that helps you correlate this approval request with your business process
- Your organization ID (EORI format, example: EU.EORI.NL860730499)

**Validation requirements**
- All fields are required and cannot be empty.
- All email addresses and EORI numbers must be properly formatted.

### Step 2: Keyper API authentication
Every call your application sends to the Keyper API needs to be authenticated using a token. A token can be retrieved through the following request:
```http
POST https://poort8.eu.auth0.com/oauth/token
Content-Type: application/json
```
With the following JSON body:
```json
{
  "client_id": "<REQUESTER_CLIENT_ID>",
  "client_secret": "<REQUESTER_CLIENT_SECRET>",
  "audience": "Poort8-Dataspace-Keyper-Preview",
  "grant_type": "client_credentials"
}
```

#### Successful response
When your token request was successful, you'll receive the following response.

**200 OK**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Response fields**
- `access_token`: Your access token.
- `token_type`: The token type.
- `expires_in`: Tells you in how many seconds your token will be expired.

### Step 3: Keyper API integration
When the required data is ready, and an access token for the Keyper API has been fetched, send a request to the Keyper API to create an approval link.

The following request needs to be made, using the access token from the previous step:
```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Accept: application/json
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

The provided JSON body should look like this, the placeholders are to be replaced with the data from step 1.
```json
{
  "requester": {
    "name": "<REQUESTER_NAME>",
    "email": "<REQUESTER_EMAIL>",
    "organization": "<REQUESTER_ORGANIZATION_NAME>",
    "organizationId": "<REQUESTER_ORGANIZATION_ID>"
  },
  "approver": {
    "email": "<ENERGY_CONTRACTOR_EMAIL>",
    "organization": "<ENERGY_CONTRACTOR_ORGANIZATION_NAME>",
    "organizationId": "<ENERGY_CONTRACTOR_ORGANIZATION_ID>"
  },
  "dataspace": {
    "baseUrl": "https://dvu-test.azurewebsites.net"
  },
  "description": "DVU energy data access request for single building",
  "reference": "<YOUR_APPLICATION_REFERENCE>",
  "orchestration": {
    "flow": "dvu.voeg-gebouw-toe@v1",
    "payload": {
      "address": "<BUILDING_ADDRESS>", // See "Building address formatting" for the preferred formatting of this value
      "dataServiceConsumer": "<YOUR_ORGANIZATION_ID>"
    }
  }
}
```

**Building address formatting**
If only the postal code and house number were provided, format the address as `"<postal code> <house number>"` (example: `"3013 AK 45"`). If the street name and/or city was also provided, format the address as `"<street name> <house number> <postal code> <city>"` (example: `"Stationsplein 45 3013 AK Rotterdam"`).

#### Successful response
When the approval link is successfully created, you'll receive the following response.

**201 Created**
```json
{
  "id": "474e19af-8165-4b85-ad03-be81f9f8dcc2",
  "reference": "<YOUR_APPLICATION_REFERENCE>",
  "url": "https://keyper-preview.poort8.nl/approve?id=474e19af-8165-4b85-ad03-be81f9f8dcc2&app=dvu",
  "expiresAtUtc": 1759834340,
  "status": "Active"
}
```

**Response fields**
- `id`: Unique identifier for the approval link (generated by Keyper).
- `reference`: Your application reference (from the request).
- `url`: The approval link, which has now been sent to the energy contractor via email.
- `expiresAtUtc`: Unix timestamp of when the link expires (1 hour after creation).
- `status`: Current status of the approval link, which will be `Active` upon successful creation. Other status include:
  - `Approved`: The energy contractor has approved the approval request.
  - `Rejected`: The energy contractor has rejected the approval request.
  - `Expired`: The approval link has expired and can no longer be used.

#### Error responses
The Keyper API may return the following error responses:

##### 400 Bad Request
This response indicates that your request is missing required data, or contains invalid data. Keyper validates the contents of your request. When an error occurs during this process, you'll receive a response that looks like this:
```json
{
  "statusCode": 400,
  "message": "One or more errors occurred!",
  "errors": {
    "requester.email": [
      "Email cannot be empty."
    ]
  }
}
```

**Response fields**
- `statusCode`: The HTTP status code describing your request, in this case 400 (bad request).
- `message`: A message explaining what went wrong.
- `errors`: This object lists which input fields could not be validated, and explains per input what the issue is.

>**Note**: There is no set format for organization identifiers within Keyper, so the API will not validate any organization identifier field for a valid EORI. Within DVU, invalid EORI numbers can cause issues surrounding access policies and data retrieval, hence we expect EORI format validation to be performed on the client side.

**What to do:** Review the `errors` object in the response and correct the indicated fields in your request.

##### 401 Unauthorized - Missing or invalid access token
If you don't provide an access token or provide an invalid/expired token, you'll receive an empty response with HTTP status 401.

**What to do:** Ensure you've included the `Authorization: Bearer <ACCESS_TOKEN>` header with a valid token from Step 2. If your token has expired, request a new one.

##### 500 Internal Server Error
This response indicates that there was a server-side error, meaning that something went wrong within Keyper. In this case, you'll receive a response that looks like this:
```json
{
  "status": "Internal Server Error!",
  "code": 500,
  "reason": "Object reference not set to an instance of an object.",
  "note": "See application log for stack trace."
}
```

**What to do:** 
1. Retry your request after a short delay (the error may be transient).
2. If the error persists, contact Poort8 support at **hello@poort8.nl** with:
   - Your application reference value
   - The timestamp of the request
   - The complete error response

>**Note:** Poort8's monitoring system automatically tracks 500 errors, so the team may already be investigating the issue.

#### Test environment
As Keyper is still in development, it is only available in a test environment. This environment does **not perform complete verifications** such as organization data validation.

Use the test environment only for functional testing.

## Sequence diagram
```mermaid
sequenceDiagram
  participant GE as Gebouwbeheerder<br/>en energiecontractant
  participant DG as dataservice-gebruiker
  participant KP as Keyper
  participant MetadataApp as DVU App
  participant DVUSat as DVU Satelliet
  participant AR as Autorisatieregister
  participant Eherkenning as eHerkenning

  rect rgb(221, 242, 255)
    note right of GE: Gebouw toevoegen via DG
    GE->>+DG: start sessie
    DG->>+KP: aanmaken Keyper Approve link (single)
    KP->>KP: valideren input
    KP->>-DG: status: Active + redirect URL
    DG->>-GE: redirect naar Keyper Approve
  end

  rect rgb(221, 242, 255)
    note right of GE: Gebouwgegevens aanvullen
    GE->>+KP: openen redirect URL
    KP->>-GE: redirect naar MetadataApp (gebouw toevoegen)
    GE->>+MetadataApp: invullen gegevens
    MetadataApp->>-GE: redirect naar Keyper Approve
  end

  rect rgb(221, 242, 255)
    note right of GE: Toegangsaanvraag controleren
    GE->>+KP: controleer transactie
    GE->>+Eherkenning: inloggen niveau 3
    Eherkenning->>-KP: identity token
    KP->>+DVUSat: registreer inschrijving
    DVUSat-->>-KP: bevestiging
    KP->>+AR: registreer metadata & toestemming
    AR-->>-KP: bevestiging
    KP->>GE: redirect naar DG
  end
```

## Next steps
- Read the [documentation on how to retrieve VBO and EAN data](vbo-ean-data-retrieval.md)
- Implement error handling for API responses
- Set up monitoring for approval link usage
- Test the complete flow in the test environment
- Plan migration to production environment

---
For bulk building access, see the [Bulk Building Access](bulk-buildings.md) guide.