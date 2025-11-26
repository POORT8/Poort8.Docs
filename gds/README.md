# GDS Introduction

Welcome to the **Green Data Space (GDS)** documentation. This guide will help you navigate the documentation based on your role and what you want to accomplish.

## What you'll find here
The documentation covers:
- **What GDS is** and the problem it solves
- **How GDS works** architecturally and technically
- **How to implement** GDS integration as a building management platform
- **API references** for all GDS components

## Choose your path
Select the documentation that matches your needs:

### Understanding GDS
Start here if you're new to GDS or want to understand what it does and why it matters.

**[GDS overview](overview.md)**  
Understand what GDS is, what problems it solves, and how different participants benefit. No technical background required.

**You'll learn:**
- What problem GDS solves
- How the approval process works from a user perspective
- Real-world use case examples with personas (Bob, Alice, Charlie, David)
- The two core data transactions
- Benefits for each participant type

### How GDS works
Read this if you want to understand the technical architecture, without diving into code.

**[Architecture guide](architecture.md)**  
Explains how GDS components work together, authorization flows, and technical standards. Accessible to both technical and non-technical readers.

**You'll learn:**
- System components and their responsibilities
- How policy-based authorization works
- The approval workflow step-by-step
- Data exchange processes for all two transactions
- Security layers and authentication mechanisms
- Technical standards (OAuth2, PDOK/BAG)
- Deployment architecture

### For developers: API implementation
Ready to implement GDS integration in your building management platform?

**[Requesting Building Data Access](consumer-approval-guide.md)** – Developer guide for implementing the Keyper approval workflow to request access to building sensor data from building owners.

#### API References
| Resource | Description |
|----------|-------------|
| **[GDS API docs](https://gds-preview.poort8.nl/scalar)** | Interactive API documentation for GDS data transactions (Scalar UI) |
| **[Keyper API docs](https://keyper-preview.poort8.nl/scalar/?api=v1)** | Interactive API documentation for approval workflow (Scalar UI) |
| **[NoodleBar docs](../noodlebar/)** | Documentation for the underlying dataspace platform |


## Quick Start: implementation path
If you're implementing GDS integration as a building management platform, follow this sequence:

### Step 1: Understanding
1. Read [Overview](overview.md) to understand use cases and benefits
2. Read [Architecture](architecture.md) to understand how the system works

### Step 2: Implement approval workflow
3. Review [Requesting Building Data Access](consumer-approval-guide.md)
4. Implement Keyper API authentication
5. Implement approval request creation
6. Implement approval status checking (polling or webhooks)

### Step 3: Test approval workflow
7. Test approval requests in test environment
8. Verify building owner receives approval emails
9. Test approval and rejection flows
10. Confirm policies are registered after approval

### Step 4: Implement data access (coming soon)
11. Implement sensor data retrieval (guide coming soon)
12. (Optional) Implement control commands (guide coming soon)


## Quick reference for developers
| What you need | Where to find it |
|---------------|------------------|
| **Understanding the flow** | [Architecture guide](architecture.md) |
| **Requesting approval** | [Requesting Building Data Access](consumer-approval-guide.md) |
| **Interactive API testing** | [GDS Scalar UI](https://gds-preview.poort8.nl/scalar) |
| **Approval API reference** | [Keyper Scalar UI](https://keyper-preview.poort8.nl/scalar/?api=v1) |


## The two data transactions
GDS enables two types of data exchange between building management platforms and IoT sensor platforms:

| Transaction | Purpose | Required policy |
|-------------|---------|-----------------|
| **Real-time Measurements** | Retrieve current sensor readings | `GET` |
| **Control Commands** | Send setpoint adjustments | `POST` |

Each transaction requires explicit building owner approval via the Keyper Approve flow. See the [Overview](overview.md) for detailed descriptions and [Architecture Guide](architecture.md) for technical details.


## Personas used in documentation
Throughout the documentation, we use personas to clarify roles:
- **Bob** – Building owner (data owner) who approves access requests
- **Alice** – Building manager (data end-user) who uses optimization platforms
- **Charlie** – IoT sensor platform (data service provider) providing sensor data
- **David** – Building management platform (data service consumer) requesting sensor access

These personas help illustrate real-world workflows and use cases.

## Contact
For questions, clarifications, business inquiries, or support with GDS implementation: contact Poort8 by sending an email to hello@poort8.nl.


## Next Step
**New to GDS?** Start with the [Overview](overview.md) to understand what GDS is and how it works.  
**Ready to build?** Jump to [Requesting Building Data Access](consumer-approval-guide.md) to implement the approval workflow.