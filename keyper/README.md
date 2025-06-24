# Keyper

**Keyper** is an API-first solution developed by Poort8 to enable secure, auditable approval of transactions within dataspaces. It allows organizations to formalize consent and authorization flows across parties, with a focus on traceability, orchestration, and flexible authentication. Keyper can be used to interact with dataspaces, for example Poort8's NoodleBar.

## What is Keyper?

Keyper coordinates approvals between a **requester** (who prepares a set of transactions) and an **approver** (who must authorize them on behalf of an organization). These transactions can include:

- issuing access rights (e.g., iSHARE policies);
- adding employees to a dataspace organization;
- registering an organization in official dataspace registries (like OR or AR);
- registering resources or resource groups with attached metadata (e.g., endpoints, licenses, terms of use).

The flow is triggered by creating an **approval link**, which leads the user to a UI where they can inspect and approve the requested transactions, using an authentication method such as eHerkenning or email verification.

## Getting Started

To start using Keyper in your dataspace application:

1. **Review the API documentation** at [https://keyper-preview.poort8.nl/scalar/](https://keyper-preview.poort8.nl/scalar/)
2. **Contact the Poort8 team** for API access and integration support
3. **Prepare your transaction payloads** according to the API specifications
4. **Configure your approval flows** with the desired orchestration options
5. **Test your integration** with sample approval scenarios

For detailed implementation guidance, see the [FAQ](faq.md) section.

## Approval Flow Overview

A typical Keyper approval flow supports users of a dataspace service that need additional data from another service provider in the data space:

```mermaid
sequenceDiagram
    participant R as Requester
    participant K as Keyper API
    participant A as Approver
    participant DS as Dataspace Components
    
    R->>K: Submit transaction set
    K->>K: Generate approval link
    K->>A: Send notification email
    A->>K: Access approval UI
    K->>A: Display transaction details
    A->>K: Authenticate & approve
    K->>DS: Execute transactions
    K->>R: Notify completion
```

1. **Transaction standards** - The dataspace service facilitates the user (requester) in preparing a set of transactions that must be approved — such as policies, employee additions, organization registration, or metadata for resource groups.
2. **Transaction staging** - The requested transactions are submitted to the Keyper API. Optionally, metadata services may be triggered at this stage to complete or enrich the transaction content.
3. **Approval link** - Keyper generates a unique approval link and optionally sends a notification email to the approver.
4. **Transaction verification** - The approver follows the link, inspects the requested transactions, and signs by authenticating (via eHerkenning or email).
5. **Authentication and signing** - Upon approval, Keyper executes the transactions in the relevant dataspace components (e.g., OR or AR), and may trigger follow-up orchestration steps.

## Orchestration and Flow Control

Keyper includes orchestration options that allow for customized control over the flow of the approval and transaction execution. These orchestration steps are optional and can be configured per approval link. Together, they support flexible workflows that span multiple users, systems, and approval stages. These include:

### Available

- **Notification emails** - configurable notifications are sent to the requester and approver at key lifecycle stages (e.g., request created, approval granted, failure reported).
- **Redirect chaining** - redirect the approver to another app or URL after the approval, allowing chained approval steps or post-approval actions.
- **Context provision** - show transaction with specific context semantics from the underlying dataspace.
- **Auto-forward to next user** - send notifications or links to the next user involved in the flow (e.g., a second approver or external stakeholder).
- **Trigger metadata app** - redirect the user to a dedicated metadata app where they can enrich or add metadata manually.
- **Trigger metadata enrichment** - start a metadata service to complete or validate transaction content before the approver sees it.

### Planned

- **Transaction result notification** - notify systems or users when transactions have been executed.
- **Failure feedback** - return detailed feedback when one or more transactions cannot be processed.
- **Domain verification** - securely verify whether a user is acting on behalf of an organisation by DNS domain verification.

## Use Cases

Keyper is designed for modular, composable dataspaces like **NoodleBar**, where multiple systems and roles interact. Typical use cases include:

- formalizing onboarding of new organizations;
- issuing granular access rights across federated data providers;
- signing off on sensitive data transactions with audit-ready consent records.

The API supports structured JSON requests and handles both **human-to-machine (H2M)** and **machine-to-machine (M2M)** authentication. Bearer token support is optional for now but will soon be required for all endpoints.

For sample payloads or implementation support, contact the Poort8 team or refer to the detailed endpoint documentation.
