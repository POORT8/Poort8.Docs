# Keyper API Authentication

Keyper API endpoints can be called with bearer tokens for machine-to-machine integrations. This page explains how API clients are authenticated and when they can access approval links created by other applications.

For endpoint schemas and request examples, use the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).

## Supported Bearer Tokens

Keyper accepts Keycloak bearer tokens for dataspaces configured for Keyper API access. In dataspaces that use the DSGO participant registry, such as GIR, Keyper also issues and accepts DSGO bearer tokens; see [DSGO Bearer Tokens](#dsgo-bearer-tokens). Auth0 bearer tokens are not accepted.

For GIR integrations, a Keyper-issued DSGO token is recommended. Keycloak tokens are also possible; contact Poort8 to configure the Keycloak client and its organization for GIR.

Each configured dataspace has its own Keycloak realm and Keyper API audience. For a Keycloak token, request a token from the realm and for the audience configured for the dataspace. During token validation, Keyper resolves the caller organization from the token's `organization` claim. If the organization cannot be resolved, the token is rejected for Keyper API access.

## API Authorization

All Keyper API endpoints use the same authentication requirement: a valid bearer token issued by a configured Keycloak dataspace realm or, in a DSGO dataspace, by Keyper's DSGO token endpoint. Keyper does not require separate `read` or `write` scopes for API calls.

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

Poort8 can configure such a Keycloak integration as a trusted API client for a specific dataspace. The client must be authenticated by Keycloak and tied to an organization, and the trusted configuration must match its client ID and organization. This allows the client to look up an approval link by ID when it is not found in the caller's own partition. DSGO bearer tokens remain owner-scoped and do not use trusted-client lookup.

Trusted access is constrained to the dataspace of the token. A trusted client for one dataspace is not allowed to access approval links that belong to another dataspace.

## DSGO Bearer Tokens

DSGO participants can call the Keyper API with their DSGO identity instead of a Keycloak client. Keyper validates the client assertion in the same way as the GIR `/connect/token` endpoint and then issues its own bearer token. Only dataspaces that use the DSGO participant registry, such as GIR, issue this token.

1. Create a client assertion JWT as described in [Obtaining a DSGO Bearer Token](../gir/connect-token.md#step-1-create-a-client-assertion-jwt), with `aud` set to `did:ishare:EU.NL.NTRNL-76660680` (preview). Each assertion can be used only once.
2. Request a token from the Keyper token endpoint of the dataspace, with the same form parameters as for GIR:

```http
POST https://keyper-preview.poort8.nl/GIR/connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&scope=iSHARE&client_id=did:ishare:EU.NL.NTRNL-<YOUR_KVK>&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=<JWT_CLIENT_ASSERTION>
```

3. Send the `access_token` from the response as a bearer token to the Keyper API. The token is valid for 3600 seconds.

The token is for the Keyper API only. For GIR data endpoints, request a separate token from the [GIR `/connect/token` endpoint](../gir/connect-token.md).

Keyper uses your `client_id` as the caller organization and the dataspace in the token URL as the caller's dataspace. The ownership and dataspace rules on this page apply in the same way as for Keycloak tokens: a token requested for GIR can only be used with GIR orchestration flows.

Keyper rate-limits authenticated DSGO API calls per client identity, across IP addresses. Token requests are anonymous and rate-limited by IP address.

| Response | Meaning |
| --- | --- |
| `200 OK` | The response contains `access_token`, `token_type` (`Bearer`), and `expires_in`. |
| `400 Bad Request` | The response uses `application/problem+json`. Its `errors` object names the rejected field: `client_assertion` for an invalid assertion, or `grant_type`, `scope`, or `client_assertion_type` for an incorrect form value. |
| `404 Not Found` | The dataspace does not exist or does not use the DSGO participant registry. |

For the request schema, see the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).

## Personal Policy Requests

Keyper can create approval links for policies with a person as the subject. Personal policies are available only when the selected workflow enables person subjects and the calling client is authorized. Available flows and their policy requirements depend on the dataspace.

Ask Poort8 to authorize the calling client and its organization for personal requests in the relevant dataspace. Keyper matches the token's `azp` client ID and resolved organization against the configured pair. Missing or unmatched configuration or claims do not grant this permission.

This permission is separate from trusted-client access: it permits eligible clients to request person subjects, but does not grant access to approval links owned by another organization. A trusted API client does not automatically have permission to request person subjects. Normal ownership and dataspace checks still apply.

For a personal request, provide the person's UUID in `subjectId`, in hyphenated UUID format. The requesting application must obtain the unchanged user identifier from a validated user token and is responsible for connecting it to the signed-in user. Keyper checks the UUID format and client permission; it does not check whether that user exists or whether the identifier belongs to the signed-in user. These checks also apply when updating a link while retaining a personal subject.

For a personal request, `requester.name` and `requester.email` must identify the same person as `subjectId`: a person can only request access for themselves. Requests on behalf of another person, such as a manager requesting access for an employee, are not supported. Keyper cannot resolve `subjectId` to a name, so the approval page shows the requester as the person who receives access. Keyper does not verify that the requester and `subjectId` are the same person; the requesting application is responsible for this.

In the `datasetaccess@v1` flow, the approver must be the data steward named in the dataset's published catalogue record and a member of their own organization. That organization may differ from the dataset's publisher, which is the issuer of the policy: provide the publisher's organization identifier in `issuerId` on every policy, or Keyper rejects the request. Validity updates and revocations in this flow can only be approved by a member of the issuing organization. Keyper checks the catalogue right after it creates the link, so `201 Created` does not mean the link can be approved: if the check fails, the steward sees the error when opening the link. An update to a link that passed the check returns `403 Forbidden` when the updated link no longer passes it. Other flows do not check whether the approver is the owner or steward of a dataset. Policy fields, approver authentication, link expiry, renewal and notifications depend on the selected flow. Contact Poort8 for the requirements of your integration and see the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1) for request and response schemas.

## Responses

Approval link endpoints can return the following access-related responses:

| Response | Meaning |
| --- | --- |
| `401 Unauthorized` | The bearer token is missing, invalid, expired, issued by an unconfigured identity provider, or does not contain an organization that Keyper can resolve. |
| `403 Forbidden` | The token is valid, but the caller is not allowed to access or update the approval link, or the caller's dataspace does not match the orchestration flow's dataspace when creating, reading, or updating a link. Updating a link that already passed a flow's additional validation, such as the steward check in `datasetaccess@v1`, also returns `403` when the updated link fails that validation. |
| `404 Not Found` | The approval link was not found for the caller, or a trusted lookup did not find a matching approval link. |

## Integration Checklist

Before calling the Keyper API:

1. Ask Poort8 to configure the dataspace for Keyper API access.
2. Obtain a Keycloak token for the configured Keyper API audience, or use the DSGO token flow above if the dataspace uses the DSGO participant registry.
3. Ensure Keyper can resolve the caller organization from the token.
4. Use the approval link endpoints documented in the [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1).
5. If your Keycloak integration must access links created by other applications in the same dataspace, ask Poort8 whether it should be configured as a trusted API client.