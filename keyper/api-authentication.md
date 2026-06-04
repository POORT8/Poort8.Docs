# Keyper API Authentication

Keyper API endpoints can be called with bearer tokens for machine-to-machine integrations. This page explains how API clients are identified, how read and write access is evaluated, and when a client can access approval links created by other applications.

For endpoint schemas and request examples, use the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).

## Supported Bearer Tokens

Keyper accepts Keycloak bearer tokens per dataspace when the dataspace is configured for Keyper API access.

A Keycloak bearer token must be issued for the Keyper API audience configured for that dataspace. During token validation, Keyper resolves the caller organization from the token's `organization` claim. If the organization cannot be resolved, the token is rejected for Keyper API access.

## Read and Write Access

Keyper uses separate read and write policies on the API endpoints:

| Operation | Example endpoints | Required access |
| --- | --- | --- |
| Read approval links | `GET /api/approval-links/{id}` | Read |
| Create or update approval links | `POST /api/approval-links`, `PUT /api/approval-links/{id}` | Write |

For Keycloak bearer tokens, a valid token for the configured Keyper API audience with a resolvable organization can satisfy the Keyper API read and write policies. Access to an individual approval link is then checked separately against the caller organization and trusted-client configuration.

## Approval Link Ownership

Approval links are owned by the application or organization that created them. Keyper stores this owner as the approval link's requesting app.

For normal API clients, access is owner-scoped:

1. The API token identifies the caller organization.
2. Keyper looks up the approval link by ID in that caller's partition.
3. The caller can read or update the approval link only when it belongs to that caller.

If an approval link exists but belongs to another caller, a normal client cannot access it by using only the approval link ID.

## Trusted API Clients

Some integrations need to retrieve approval links created by other applications in the same dataspace. For example, a metadata application may receive only an approval link ID after an approval flow redirect, while the approval link itself may have been created by a different application.

Poort8 can configure such an integration as a trusted API client for a specific dataspace. Trusted clients are still authenticated by Keycloak and still tied to an organization. The trusted configuration allows the client to perform a lookup by approval link ID when the link is not found in the caller's own partition.

Trusted access is constrained to the dataspace of the token. A trusted client for one dataspace is not allowed to access approval links that belong to another dataspace.

## Legacy Auth0 Support

Existing Auth0 bearer tokens remain supported during the migration to Keycloak. For Auth0 tokens, read and write access is controlled by the token's `scope` claim. A token with the `read` scope can call read endpoints. A token with the `write` scope can call write endpoints.

New integrations should use the Keycloak bearer-token flow for their dataspace unless Poort8 explicitly instructs otherwise.

## Responses

Approval link endpoints can return the following access-related responses:

| Response | Meaning |
| --- | --- |
| `401 Unauthorized` | The bearer token is missing, invalid, expired, or not accepted by the configured identity provider. |
| `403 Forbidden` | The token is valid, but the caller is not allowed to access or update the specific approval link. |
| `404 Not Found` | The approval link was not found for the caller, or a trusted lookup did not find a matching approval link. |

## Integration Checklist

Before calling the Keyper API with Keycloak client credentials:

1. Ask Poort8 to configure the dataspace for Keyper API access.
2. Request a token for the configured Keyper API audience.
3. Ensure the token includes an `organization` claim that resolves to the caller organization.
4. Use the approval link endpoints documented in the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).
5. Ask Poort8 whether your integration should be configured as a trusted API client if it must access links created by other applications in the same dataspace.