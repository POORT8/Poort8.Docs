# Keyper API Authentication

Keyper API endpoints can be called with bearer tokens for machine-to-machine integrations. This page explains how API clients are authenticated and when they can access approval links created by other applications.

For endpoint schemas and request examples, use the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).

## Supported Bearer Tokens

Keyper accepts only Keycloak bearer tokens for dataspaces configured for Keyper API access. Auth0 bearer tokens are no longer accepted.

Each configured dataspace has its own Keycloak realm and Keyper API audience. Request a token from the realm and for the audience configured for the dataspace. During token validation, Keyper resolves the caller organization from the token's `organization` claim. If the organization cannot be resolved, the token is rejected for Keyper API access.

## API Authorization

All Keyper API endpoints use the same authentication requirement: a valid bearer token issued by one of the configured Keycloak dataspace realms. Keyper does not require separate `read` or `write` scopes for API calls.

Authentication does not grant access to every approval link. Keyper checks the caller's organization and dataspace against the approval link and any trusted API client configuration.

## Approval Link Ownership

Approval links are owned by the application or organization that created them. Keyper stores this owner as the approval link's requesting app.

For normal API clients, access is owner-scoped:

1. The API token identifies the caller organization.
2. Keyper looks up the approval link by ID in that caller's partition.
3. The caller can read or update the approval link only when it belongs to that caller and its orchestration flow belongs to the caller's dataspace.

When creating an approval link, Keyper sets the requesting app to the caller organization. The selected orchestration flow must belong to the caller's dataspace. Updates must also keep the effective flow in that dataspace.

Ownership does not bypass the dataspace requirement. A dataspace mismatch returns `403 Forbidden`. If an update replaces the orchestration flow, the replacement flow must also belong to the caller's dataspace; a flow from another dataspace is rejected with `403 Forbidden`.

If an approval link exists but belongs to another caller, a normal client cannot access it by using only the approval link ID.

## Trusted API Clients

Some integrations need to retrieve approval links created by other applications in the same dataspace. For example, a metadata application may receive only an approval link ID after an approval flow redirect, while the approval link itself may have been created by a different application.

Poort8 can configure such an integration as a trusted API client for a specific dataspace. Trusted clients are still authenticated by Keycloak and tied to an organization. The trusted configuration must match the client's ID and organization. It allows the client to perform a lookup by approval link ID when the link is not found in the caller's own partition.

Trusted access is constrained to the dataspace of the token. A trusted client for one dataspace is not allowed to access approval links that belong to another dataspace.

## Personal Dataset Access Requests

The NoodleBar flow `datasetaccess@v1` can create an approval link for a personal dataset-read policy. Ask Poort8 to configure the calling client and its organization as a pair in the dataspace's `PersonAccessRequestClients` list. Keyper matches the token's `azp` client ID and resolved organization against the pair, within the token's dataspace. Missing or unmatched configuration or claims do not grant this permission.

This list is separate from `TrustedApiClients`: it permits eligible clients to request person subjects, but does not grant access to approval links owned by another organization. A trusted API client does not automatically have permission to request person subjects. Normal ownership and dataspace checks still apply.

For a personal request, provide the person's UUID in `subjectId`, in hyphenated UUID format. The requesting application must obtain the unchanged user identifier from a validated user token and is responsible for connecting it to the signed-in user. Keyper checks the UUID format and client permission; it does not check whether that user exists or whether the identifier belongs to the signed-in user. These checks also apply when updating a link while retaining a personal subject.

Use the published dataset's `@id` IRI as `resourceId` and its publisher as the approver organization. The policy issuer defaults to the approver organization; if supplied, it must match. Keyper sets the following policy fields when omitted and rejects conflicting values:

| Field | Value |
| --- | --- |
| `useCase` | `datasetaccess` |
| `action` | `can_read` |
| `type` | `dataset` |
| `attribute` | `*` |
| `rules` | `HasRole(digilab-data-user)` |

`rules` must match exactly, including case. The flow supplies defaults for `serviceProvider` and `license` when omitted; provide the appropriate values for your integration if they differ. `serviceProvider` must be a valid EUID. If omitted, `notBefore` defaults to the current time and `expiration` to one calendar year later; clients may supply either timestamp instead. Approval links expire after seven days and cannot be renewed. This link lifetime is separate from the resulting policy's validity.

The approver verifies their email using a one-time code. For a Keycloak-backed NoodleBar, the approver's organization must be active and the email must belong to a member of that organization. Keyper does not check whether the approver is the owner or steward of this particular dataset; the integration must account for this limitation. This flow does not send an approval-link notification; the requester must securely provide the link to the approver.

For dataset publication and enforcement requirements, see [Dataset Access](../noodlebar/15%20-%20Dataset%20Access.md). See the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1) for the approval-link request and response schemas.

## Responses

Approval link endpoints can return the following access-related responses:

| Response | Meaning |
| --- | --- |
| `401 Unauthorized` | The bearer token is missing, invalid, expired, issued by an unconfigured identity provider, or does not contain an organization that Keyper can resolve. |
| `403 Forbidden` | The token is valid, but the caller is not allowed to access or update the approval link, or the caller's dataspace does not match the orchestration flow's dataspace when creating, reading, or updating a link. |
| `404 Not Found` | The approval link was not found for the caller, or a trusted lookup did not find a matching approval link. |

## Integration Checklist

Before calling the Keyper API with Keycloak client credentials:

1. Ask Poort8 to configure the dataspace for Keyper API access.
2. Request a token for the configured Keyper API audience.
3. Ensure the token includes an `organization` claim that resolves to the caller organization.
4. Use the approval link endpoints documented in the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).
5. Ask Poort8 whether your integration should be configured as a trusted API client if it must access links created by other applications in the same dataspace.