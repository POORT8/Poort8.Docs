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

## How does authentication work?

Keyper distinguishes between two kinds of authentication:

- **Approver authentication** — used by the end user who approves a request through the approval link UI. Supported methods include **eHerkenning** (for Dutch organizations) and **email verification**.
- **API authentication** — used by machine-to-machine clients calling the Keyper API. All API endpoints require a bearer token. Keycloak tokens (per dataspace) are the default; existing Auth0 tokens remain supported as a legacy fallback. See [Keyper API Authentication](api-authentication.md) for details on supported token types, read/write access, and trusted clients.

The API supports both human-to-machine (H2M) and machine-to-machine (M2M) integration patterns.
