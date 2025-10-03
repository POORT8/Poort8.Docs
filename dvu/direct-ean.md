# DVU Implementation: Access to EAN(s) directly
This guide explains how to implement the Keyper Approve workflow for requesting access to energy data for EAN codes directly, so without providing an address. This can be achieved by providing the data access policy yourself when creating the approval link, dismissing the need to use the DVU metadata services.

## Overview
If you want your application to have access to energy data for a building through DVU, you need approval from the energy contractor. This request for approval will be facilitated by Keyper.

This is how that works, step by step:
1. **Your application** prepares the data that is required in order to create an approval link. This is data about: 
   - The requesting party (you/your application)
   - The approving party (the energy contractor)
   - The building for which you want to access energy data
2. **Your application** sends the approval request to the Keyper API, containing the data from the previous step.
3. **Keyper** uses the data your application provided to create an approval link. This link will then get sent to the approving party - the energy contractor.
4. **The energy contractor** opens the approval link, and arrives in the Keyper Approve webapp. The energy contractor then reviews your approval request.
5. If your request is approved, **Keyper** registers a policy in DVU. This policy lets DVU know that you have access to the energy data of the respective building. 
6. **You** can now access the energy data of the respective building.
   - You can now also retrieve the buildings VBO identifier and associated EAN codes via the DVU API. More on this can be found in the [documentation on how to retrieve VBO and EAN data](vbo-ean-data-retrieval.md).

This approach differs from the standard DVU flow, which uses DVU metadata services to assemble the required policies based on address lookups. In the direct EAN flow, your application constructs the policy and provides this with the request to create an approval link.

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
- VBO ID
- EAN code(s)

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
Every call to the Keyper API needs to be authenticated using a token. A token can be retrieved through the following request:
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

### Step 3: Keyper API integration
When the required data is ready, and an access token for the Keyper API has been fetched, send a request to the Keyper API to create an approval link.

The following request needs to be made, with the authentication from the previous step:
```http
POST https://keyper-preview.poort8.nl/v1/api/approval-links
Accept: application/json
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```
The provided JSON body must include an `addPolicyTransactions` array containing the policy that grants access to the specified EAN.
```json
{
  "requester": {
    "name": "<REQUESTER_NAME>",
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
    "baseUrl": "https://dvu-test.azurewebsites.net"
  },
  "description": "Request for access to EAN via DVU",
  "reference": "<YOUR_REFERENCE>",
  "addPolicyTransactions": [
    {
      "useCase": "dvu",
      "issuedAt": "<NOW>", // Unix timestamp - Not active in the DVU dataspace as it will always default to NOW
      "notBefore": "<NOW>", // Unix timestamp - Not active in the DVU dataspace as it will always default to NOW
      "expiration": "<EXPIRATION>", // Expiration date (up to you) as a unix timestamp
      "issuerId": "<ENERGY_CONTRACTOR_ORGANIZATION_ID>",
      "subjectId": "<YOUR_ORGANIZATION_ID>",
      "serviceProvider": "EU.EORI.NL851872426", // Organisation ID of Smart Data Solutions (SDS)
      "action": "Read",
      "resourceId": "<BUILDING_VBO_ID>",
      "type": "P4",
      "attribute": "*",
      "license": "iSHARE.0002" // Not active in the DVU dataspace as it will always default to iSHARE.0002
    }
  ],
  "addResourceGroupTransactions": [
    {
      "resourceGroupId": "dvu:resource:<BUILDING_VBO_ID>",
      "useCase": "dvu",
      "name": "<BUILDING_VBO_ID>",
      "description": "vbo: <BUILDING_VBO_ID>",
      "provider": "DVU",
      "resources": [ // For each EAN code
        {
          "resourceId": "dvu:resource:<EAN_CODE_1>",
          "useCase": "dvu",
          "name": "<EAN_CODE_1>",
          "description": "ean: <EAN_CODE_1>",
          "properties": [] // Additional properties should be supplied by CAR-connection when available
        },
        {
          "resourceId": "dvu:resource:<EAN_CODE_2>",
          "useCase": "dvu",
          "name": "<EAN_CODE_2>",
          "description": "ean: <EAN_CODE_2>",
          "properties": [] // Additional properties should be supplied by CAR-connection when available
        }
      ]
    }
  ],
  "orchestration": {
    "flow": "dvu.basic@v1" // Providing this triggers the CAR metadata flow
  }
}
```

**Note:**
- DVU needs additional info on EANs to be able to get the data (stored in the `properties` of each EAN `resource`), it is not expected that users will supply this info. Therefore, the availability of this flow depends on the implementation of info from CAR (Centraal Aansluitingen Register).
- DVU requires EANs to be grouped. For this direct EAN flow, you choose a user-friendly group name, as it will be shown to the approver.
- When requesting access to a single EAN, use a resourceGroup with the single EAN as resource.

#### Test environment
As Keyper is still in development, it is only available in a test environment. This environment does **not perform complete verifications** such as organization data validation.

Use the test environment only for functional testing.

## Sequence Diagram (Direct EAN Flow)
```mermaid
sequenceDiagram
  participant DG as dataservice-gebruiker
  participant KP as Keyper
  participant AR as Autorisatieregister
  participant SDS as Smart Data Solutions

  rect rgb(221, 242, 255)
    note right of DG: Aanvraag met directe policy transacties
    DG->>+KP: POST /approval-links (addPolicyTransactions[])
    KP->>KP: valideren + registreren
    KP->>-DG: approval link (Active)
  end

  rect rgb(221, 242, 255)
    note right of DG: Goedkeuring
    DG->>+KP: openen link (approver)
    KP->>KP: tonen policy details
    KP->>-DG: bevestiging gereed
  end

  rect rgb(221, 242, 255)
    note right of DG: Data ophalen
    DG->>+AR: optionele metadata lookup (indien nodig)
    AR-->>-DG: identifiers
    DG->>+SDS: ophalen meterdata (P4 / jaar / volledig)
    SDS-->>-DG: data payload
  end
```

## Next steps
- Read the [documentation on how to retrieve VBO and EAN data](vbo-ean-data-retrieval.md)
- Implement error handling for API responses
- Set up monitoring for approval link usage
- Test the complete flow in the test environment
- Plan migration to production environment