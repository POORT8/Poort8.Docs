# Datastekker – Installer Access Flow

> **⚠️ Design document — not ready for implementation**
>
> Several open questions remain unresolved (see [Open Questions](#open-questions)), in particular componentId-to-installationId resolution and license conditions.

Datastekker (developed by 2BA) retrieves performance data from installation manufacturers and translates it into uniform performance data using the Heatpump Common Ontology. To access this data, an installer needs explicit consent from the building owner. GIR manages that authorization.

This guide describes how an installer requests access through a form on the TechniekNederland website, how the building owner approves the request via Keyper, and how Datastekker validates authorization against GIR on every data request.

## Parties

| Party | DSGO role | Description |
|-------|-----------|-------------|
| Installer | Data service consumer | Installation company requesting access to performance data for buildings they maintain. |
| Building owner | Data service rights holder | Approves the access request; has authority over the installations in the building. |
| TechniekNederland | — | Hosts the form through which the access request is initiated. |
| Datastekker (2BA) | Data service provider | Retrieves installation data from manufacturers and exposes it via an API. |
| Keyper *(Poort8)* | — | Orchestrates the approval flow via eHerkenning. Registers the policy in GIR on approval. |
| GIR | Authorization registry | Stores and enforces the delegation policies at every data request. |

## End-to-end flow

The flow has two phases: a **one-time approval flow** and a **recurring operational data access pattern**.

```likec4
// view: datastekker_overview
specification {
  element actor
  element system
}

model {
  form = system 'TechniekNederland Form'
  keyper = system 'Keyper'
  owner = actor 'Building Owner'
  gir = system 'GIR'
  ds = system 'Datastekker (2BA)'
  inst = actor 'Installer'
}

views {
  dynamic view datastekker_overview {
    title 'Datastekker – Installer Access Flow'
    variant sequence

    form -> keyper 'Create access request (vboId, installer KvK, validity)'
    keyper -> owner 'Approval link by email'
    owner -> keyper 'Authenticate and approve'
    keyper -> gir 'Register policy (installer ↔ vboId)'

    inst -> ds 'Data request with componentId'
    ds -> gir 'Obtain DSGO bearer token'
    gir -> ds 'Bearer token'
    ds -> gir 'Resolve componentId → installationId [TBD]'
    gir -> ds 'GIRBasisdataMessage (installationId + manufacturer info)'
    ds -> gir 'Check delegation for installer + installationId'
    gir -> ds 'Delegation evidence (Permit or Deny)'
    ds -> inst 'Authorised performance data'
  }
}
```

## Three phases

| Phase | What happens | Frequency |
|-------|-------------|-----------|
| [Phase 1 — Approval Flow](./approval-flow.md) | Building owner approves the installer via Keyper. Policy is registered in GIR. | Once per installer / building |
| [Phase 2 — Token Acquisition](./token-acquisition.md) | Datastekker obtains a DSGO bearer token from GIR. | Per token expiry (3600 s) |
| [Phase 3 — Authorization Check](./authorization-check.md) | Datastekker resolves the componentId, checks the delegation policy, and returns authorised data to the installer. | Every data request |

## Policy parameters

| Parameter | Description | Status |
|-----------|-------------|--------|
| `issuerId` | DID of the building owner (policy issuer) | Required |
| `subjectId` | DID of the installer (access subject) | Required |
| `serviceProvider` | DID of Datastekker / 2BA | Required |
| `resourceId` / `identifiers` | vboId (building level) or installationId (installation level). Consent at building level covers all its installations. | Required |
| `notBefore` / `expiration` | Validity period of the granted access | Required |
| `type` | Resource type identifier: `GIRDatastekkerAccess` | Required |
| `action` | Permitted action: `read` | Required |
| `attribute` | `*` (wildcard); future: predefined dataset identifier — see [Open Question 4](#open-questions) | `*` |
| `license` | License identifier for terms of use — see [Open Question 5](#open-questions) | `[PLACEHOLDER]` |

## Open questions

The following points are unresolved and must be answered before the integration can be fully specified.

**1. Legal versus technical boundary**
The line between what is legal and what is technical is still unclear. It would be beneficial to document the legal framework separately before locking in technical choices.

**2. Requirements on software parties versus installers**
Why must a software party operating on behalf of an installer meet more requirements than an installer who has written their own software and acts directly? The basis for this distinction needs to be clarified.

**3. Validation of the installer with the manufacturer**
Should an installer also be validated by the installation manufacturer before being allowed to access data? One option is for Datastekker to forward the `delegationEvidence` it receives from GIR to manufacturers, so they can independently verify the authorization envelope and enforce their own access control without a separate authorization check.

**4. Predefined data-element sets**
Which fixed sets of data elements can be authorized? The definition of these sets is a prerequisite before the `attribute` field in policy and delegation requests can be filled in.

**5. License conditions**
Which license conditions apply to performance data? Relevant considerations: obligation to delete data after use, prohibition on re-use or onward sharing, GDPR requirements for buildings with occupants.

**6. Attribute hierarchy in GIR *(optional)***
Consent is granted at the level of a predefined data-element set. At runtime, Datastekker may need to evaluate access at individual data-element level. This could be supported by declaring an attribute hierarchy on GIR modelled on the Heatpump Common Ontology (SAREF-based). Open sub-points: Does GIR support attribute hierarchies today? How are sets mapped to ontology terms? What is the governance process for versioning?

**7. ComponentId-to-installationId resolution**
The installer provides a componentId (such as an SGTIN or serial number). GIR does not currently support filtering `GET /v1/api/GIRBasisdataMessage` by componentId. The mechanism for resolving a componentId to an installationId — for example via a new GIR endpoint, an external registry, or a mapping table maintained by 2BA — has not yet been specified.

---

## Further reading

- [Data-Consumer Flow](../data-consumer-flow.md)
- [Retrieve Multiple Installations](../retrieve-installations.md)
- [GIR API Docs ➚](https://gir-preview.poort8.nl/scalar/v1)
- [Keyper API Docs ➚](https://keyper-preview.poort8.nl/scalar/v1)
