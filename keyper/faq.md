# FAQ

## What is Keyper?

Keyper is an approval engine for multi-party transactions within dataspaces. It enables organizations to formalize consent and authorization flows across parties with a focus on traceability, orchestration, and flexible authentication.

## How does Keyper work?

Keyper coordinates approvals for dataspace transactions between a **requester** (who prepares transactions) and an **approver** (who authorizes them). The process involves:

1. Creating approval links for transaction sets
2. Notifying approvers via email or other channels
3. Authenticating approvers (via eHerkenning or email verification)
4. Executing approved transactions in relevant dataspace components

## What types of transactions does Keyper support?

Keyper can handle various dataspace transactions including:

- Issuing access rights (e.g., iSHARE policies)
- Adding employees to dataspace organizations
- Registering organizations in official dataspace registries (OR/AR)
- Registering resources or resource groups with metadata

## What orchestration features are available?

Keyper includes several orchestration options:

- **Notification emails** for lifecycle stages
- **Redirect chaining** for multi-step approval flows
- **Context provision** with dataspace-specific semantics
- **Auto-forward** to next users in the workflow

## Where can I find the API documentation?

You can find the complete Keyper API documentation at: [Keyper API reference ➚](https://keyper-preview.poort8.nl/scalar/v1)

## What does the `status` field on an approval link mean?

The `status` field returned by the Keyper API describes the state of the **approval link itself** — it is not a reflection of any policy or resource that is created as a result of the approval.

| Status | Meaning |
|--------|---------|
| `Active` | The approval link has been created and sent; the approver has not yet responded |
| `Approved` | The approver accepted the request; Keyper has attempted to execute the transactions |
| `Rejected` | The approver declined the request |
| `Expired` | The approval link timed out before the approver responded |

> A status of `Approved` confirms that the approver accepted the request and Keyper has attempted to register the transactions (e.g., policies, organizations, resources). It does **not** guarantee that the resulting policy or resource is active and valid. Policy state is managed separately in the Authorization Registry of the relevant dataspace. Always verify the outcome in the target registry if your integration depends on the policy being effective.

## How long is an approval link valid, and can an expired link be renewed?

By default, an approval link is valid for **1 hour** after creation. If the approver has not responded within that time, the link's status changes to `Expired`.

An expired link can still be renewed for up to **7 days** after it was created. Renewing a link creates a new, active approval link with the same transactions, requester, and approver, and sends a new notification to the approver. Once the 7-day window since creation has passed, the link can no longer be renewed and a new approval link must be created from scratch.

Both the validity period and the renewal window are workflow-configurable and may differ per flow.

## How does authentication work?

Keyper distinguishes between two kinds of authentication:

- **Approver authentication** — used by the end user who approves a request through the approval link UI. Supported methods include **eHerkenning** (for Dutch organizations) and **email verification**.
- **API authentication** — used by machine-to-machine clients calling the Keyper API. All API endpoints require a bearer token. Keycloak tokens (per dataspace) are the default; existing Auth0 tokens remain supported as a legacy fallback. See [Keyper API Authentication](api-authentication.md) for details on supported token types, read/write access, and trusted clients.

The API supports both human-to-machine (H2M) and machine-to-machine (M2M) integration patterns.
