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

You can find the complete Keyper API documentation at: [https://keyper-preview.poort8.nl/scalar/v1](https://keyper-preview.poort8.nl/scalar/v1)

## How does authentication work?

Keyper supports multiple authentication methods:

- **eHerkenning** for Dutch organization verification
- **Email verification** for simpler use cases
- **Bearer token support** (optional now, will be required soon)

The API handles both human-to-machine (H2M) and machine-to-machine (M2M) authentication patterns.
