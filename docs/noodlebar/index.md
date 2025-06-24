---
title: "NoodleBar"
nav_order: 4
has_children: true
layout: default
---

# What is NoodleBar?
Dataspaces use standardized components to enable controlled and secure management of access to data (services). NoodleBar is Poort8's modularized solution for dataspace initiators and/or dataspace managers to set up a dataspace. The use of IAA principles and data standards ensures that functions can be federated e.g. according to iSHARE.

## More technical details
An extensive description of components is available on [https://github.com/POORT8/Poort8.Dataspace.NoodleBar].

# Request and approval flows

In very many cases, a typical user process in a dataspace use case does not start with the data owner or data service provider, but instead with a data service user who wants to start using a new data service or data set. To facilitate this, it helps to establish standardized flows for requesting access or fulfilling other conditions for access. Poort8 recognizes the following 3 steps:

1. Request: A prospective data user starts a request flow. A data owner is informed about the request (in an understandable way) and manually or automatically accepts the request
2. Registration: The approval and its conditions are registered in the relevant dataspace components, for instance by registering metadata or storing a policy.
3. Enforce: The data service can evaluate whether all conditions are met and enforce the outcome using NoodleBar's enforce endpoints, making sure only to share data with the data user it has permission for.

In  dataspace standards only step 3 is standardized. E.g. for DSGO and iSHARE, the endpoint delegation is used for this. NoodleBar provides various enforce endpoints out of the box, see Authorization.

The process for Step 1, requesting access, and Step 2, registering conditions, is often a domain of even usecase specific process, that needs to tie in tightly to existing access management or collaboration processes. In NoodleBar, dataspace managers have the discretion to give access to trusted control plane apps for facilitating these processes, such as [Keyper Approve](../keyper/index.html).
