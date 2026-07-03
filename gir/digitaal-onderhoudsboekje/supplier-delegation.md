# Phase 2 — SupplierDelegation

> **Context**: This is Phase 2 of the [Digitaal Onderhoudsboekje flow](./digitaal-onderhoudsboekje-flow.md). It is only required if an Installation Service Company uses a third party (software company) to act on their behalf. This phase can be executed independently or simultaneously with Phase 1 (building owner authorized the New Installation Service Company via Keyper) has completed. Phase 3 can only start after this phase completes.

## Functional Overview

The New Installation Service Company delegates their `AccessRight` to their software platform (the data consumer) via Keyper. Because the New Installation Service Company is both requester and approver, Keyper forwards the requester directly to the approval link. On approval, Keyper registers a `SupplierDelegation` policy in GIR.

| Actor | Role |
|-------|------|
| **New Installation Service Company** | Initiates and approves the delegation to their software platform. |
| **TN GIR App** | Collects software platform details and hands off to Keyper. |
| **Keyper** | Orchestrates the self-approval flow and registers the policy in GIR. |
| **New Installation Service Company's software** | Receives the delegation; authorized to retrieve maintenance data in Phase 3. |
| **GIR** | Stores the resulting `SupplierDelegation` policy. |

```likec4
// view: dob_phase2
specification {
  element actor
  element system
}

model {
  ni = actor 'New Installation Service Company'
  app = system 'TN GIR App'
  keyper = system 'Keyper'
  gir = system 'GIR'
  ni_software = system 'NI software'
}

views {
  dynamic view dob_phase2 {
    title 'Phase 2 — SupplierDelegation'
    variant sequence

    ni -> app 'Supply software platform details'
    app -> keyper 'SupplierDelegation request (NI as requester and approver)'
    keyper -> ni 'Approval link by email'
    ni -> keyper 'Authenticate via eHerkenning and approve'
    keyper -> gir 'Register SupplierDelegation (New Installation Service Company → NI software)'
    gir -> keyper 'Confirm'
    keyper -> ni_software 'Notify [optional]'
  }
}
```

## Technical Implementation

### Prerequisites

| Requirement | Details |
|-------------|---------|
| Software platform details | Name and DSGO DID of the New Installation Service Company's software party |

### Step 1: Submit the SupplierDelegation request

The New Installation Service Company supplies the software platform details in the TN GIR App and selects for what GIR data services the software platform gets delegated access. For `digitaal onderhoudsboekje`, this must be `GIRBasisdataMessage` and `GIRMaintenanceLog`. The TN GIR App forwards the user to the Approval confirmation screen. The New Installation Service Company authenticates via eHerkenning and approves. On approval, Keyper registers the `SupplierDelegation` policy in GIR, scoped to the data service types

> The `SupplierDelegation` mechanism is defined in the [DSGO afsprakenstelsel ➚](https://afsprakenstelseldsgo.atlassian.net/wiki/spaces/dsgo/pages/1025933400). Exact field values are determined during technical configuration.

🔗 [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)

### Step 2: Inform the software platform

After approval, the New Installation Service Company shares the delegation details and the relevant VBO-id(s) with their software platform. The software platform uses these to call the previous installation service company's platform in Phase 3.

---

## Known blockers

| Blocker | Status |
|---------|--------|
| **SupplierDelegation field values** — Exact data format and field values for the `SupplierDelegation` policy have not yet been finalized. | Open |
