---
title: "Docs"
nav_order: 1
has_children: true
layout: default
---

# Poort8 Documentation

## Why Poort8?

Poort8 empowers European SMEs with a modular, production-ready data space infrastructure that's as flexible as your business. By combining role-based access control, token-based security, and a decentralized organization registry, we remove the complexity of building trust networks—so you can focus on innovating your services, not wrestling with integration headaches.

With Poort8's composable components and open-source foundations, you gain full visibility and governance over your data flows. Our battle-tested ecosystem accelerates time-to-market, reduces vendor lock-in, and ensures seamless interoperability across partners—making secure, transparent data sharing the new standard for growth.

## Products

### HeyWim

**Container tracking API based on DCSA standards**
HeyWim enables deepsea and inland visibility of container flows using booking or container references. The API supports validation, event retrieval, and milestone extraction based on real-time logistics data.
[HeyWim docs - openAPI](https://poort8.github.io/Poort8.HeyWim.Swagger/)

### NoodleBar

**Dataspace infrastructure – your data, your rules**
NoodleBar gives organizations complete control over how their data is shared.
You define who can access your data and under what conditions — and you can change both at any moment. Data is shared directly from the source, avoiding centralized data silos. NoodleBar includes composable modules like:

- Role-based access control (RBAC) for M2M access
- Authorization register
- Organization register
- Token server
- OpenAPI-powered service catalog

NoodleBar supports everything from proofs of concept to scalable production deployments.
[NoodleBar docs - openAPI](https://noodlebar.poort8.nl/scalar)

### Keyper

**Approval engine for multi-party transactions**
Keyper coordinates approvals for dataspace transactions — such as access policies, organizational registrations, employee onboarding, and resource declarations — between a requester and an approver. Key features include:

- Support for eHerkenning and email authentication
- Signed, auditable approvals
- Optional orchestration steps (notifications, redirects, metadata enrichment)
- JSON-based API designed for automation and composability
[Keyper docs - openAPI](https://keyper-preview.poort8.nl/scalar)

#### Keyper Approve Implementation Guides

These guides provide step-by-step instructions for building apps that initiate and manage approval flows using **Keyper Approve**.

- [DVU Data Services Integration](DVU)
  For DVU service providers that submit structured requests (e.g., policies, registration metadata) for approval via Keyper Approve.

**Coming soon:**

- GIR Installation Registration
- Publishing datasets with access terms
- Federated approval of API access rights
