# 13: Resource Group Scoping (Shared vs Issuer-Scoped)

A **resource group** bundles related resources (for example a set of energy connection
EANs, documents, or datasets) so that a single policy can grant access to the whole group
instead of to each resource individually.

The Authorization Registry can resolve resource groups during authorization in two ways.
Which one applies is a configuration choice made by the **dataspace administrator**, per
[use case](12%20-%20Use%20Case%20Authorization%20Models.md) — it is not something
individual data owners decide per request.

## Shared resource groups (default)

A resource group is a **shared catalog**. Any organization's policy on the group grants
access to every member of the group, regardless of which organization contributed each
resource.

Use shared groups when the grouped resources are common or reference data that is meant to
be reachable across organizations in the dataspace.

## Issuer-scoped resource groups

A policy grants access only to the resources **owned by the policy's own issuer** — the
organization the policy was issued for — even when the same group also contains resources
belonging to other organizations.

Use issuer-scoped groups when resources from multiple organizations are grouped together
but each organization must only be able to reach its own resources.

## Example

A resource group `MeteringPoints` contains EANs registered by two organizations:

- Organization A contributes EANs 1, 2, 3, 4
- Organization B contributes EANs 5, 6

Both organizations issue a policy on the group `MeteringPoints`.

| Scoping | What Organization A's policy grants | What Organization B's policy grants |
|---------|-------------------------------------|-------------------------------------|
| **Shared** | EANs 1–6 (the whole group) | EANs 1–6 (the whole group) |
| **Issuer-scoped** | EANs 1–4 (only A's own resources) | EANs 5, 6 (only B's own resources) |

In both cases the group itself stays a single shared container; issuer-scoping only changes
**which members a given policy resolves to**.

## Choosing the model

The scoping behaviour is determined by the use case's authorization model:

- Shared resolution applies to the `default`, `ishare`, and `isharerules` models.
- Issuer-scoped resolution applies to the `isharescoped` model.

Issuer-scoping builds on the iSHARE model, so it is available for iSHARE-based use cases.
The dataspace administrator assigns each use case to a model; see
[Use Case Authorization Models](12%20-%20Use%20Case%20Authorization%20Models.md) for the
current mappings and how a use case string resolves to a model.

> Scoping only changes outcomes when a resource group actually contains resources owned by
> more than one organization. For groups whose resources all belong to a single
> organization, shared and issuer-scoped resolution behave identically.
