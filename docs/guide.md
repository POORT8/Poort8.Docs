---
title: "Product Guide"
nav_order: 2
layout: default
---

# Poort8 Dataspace Product Guide

*A high‑level orientation for business stakeholders and architects starting with Poort8’s modular dataspace tooling.*

---

## 1. An intro to Approval Flows: How a Dataspace Facilitates Trusted Access

**Goal:** a requester obtains controlled access to another party’s data without a central hub.

1. **Compose request & create approval link** – A third‑party or federative app gathers the required transaction data and calls **`POST /approval‑links`** on **Keyper Approve**.
2. **Email hand‑off** – Keyper Approve emails the generated approval URL to the data owner (sometimes the same user if they want to access their own info through the federated app).
3. **Explicit consent & policy capture** – Within Keyper Approve the owner reviews the request, sets conditions, and approves. The resulting policies are stored in (one of) the Dataspace's federated catalogues, e.g. NoodleBar’s Authorization Registry and Organization Registry.
4. **Identity proof** – The owner authenticates via **eHerkenning** or **email**. Identity attributes are verified against the Dataspace's organization or participant registry, e.g. NoodleBar’s Organisation Registry.
5. **Runtime authentication** – Connectors retrieve OAuth/iSHARE tokens from the data service, which can be provided by NoodleBar’s Secure Token Service (STS). The STS verifies identity attributes against the Dataspace's organization or participant registry, e.g. NoodleBar’s Organisation Registry.
6. **Runtime authorization** – The data service’s connector enforces access control, by checking  access conditions for the request against the Dataspace’s authorization registry, e.g. NoodleBar’s Authorization Registry.

This single flow simultaneously solves:

* **User consent** (step 3)
* **Organisational identity** (step 4)
* **Policy enforcement at runtime** (step 6)

---

## 2. Focused Perspectives

### 2.1 Consent & Policy Management

*Pain‑point:* “I need explicit, auditable approval.”
*Product:* **Keyper Approve**
*Capabilities:* approval‑link orchestration, email notifications, multi‑step approvals, policy editor, audit trail.

### 2.2 Party Onboarding & Identity

*Pain‑point:* “I must be sure who I’m dealing with.”
*Product:* **NoodleBar Organization Registry and Authorization Registry**
*Capabilities:* organisation registration, attribute validation, eHerkenning integration, DNS‑based email binding, OAuth M2M setup.

### 2.3 Runtime Access Enforcement

*Pain‑point:* “Policies must hold during data exchange.”
*Products:* **NoodleBar + Connectors** & **Keyper Approve tokens**
*Capabilities:* iSHARE/OAuth scopes, request–offer matching, connector packages, execution notifications & failure callbacks.

---

## 3. Optional Orchestration Enhancements

Keyper Approve supports several enhancements to the introductory approval flow:

* **Metadata enrichment (auto)** – support integration of backend services to augment transactions before approval.
* **Metadata app (manual)** – support integration of redirects to web apps for a user to add extra metadata.
* **Chained redirects** – After approval, forward the same user to the next app in a composite journey.
* **Execution notifications** – Push success messages to stakeholders.
* **Failure feedback** – Callback or email when transactions cannot be executed.

---

## 4. Supporting Flows & Demonstrator

* **Party onboarding** – Administrators register participants in OR/AR and configure authentication.
* **Federated matching** – NoodleBar matches requests and offers without a central hub.
* **DRIAD “Ready‑in‑a‑Day”** – Workshop that walks through onboarding → approval flow → data access using a prototype federative app.

---

## 5. Quick Product‑to‑Need Matrix

| Role / Need           | Keyper Approve          | NoodleBar                   | Connectors         |   |
| --------------------- | ----------------------- | --------------------------- | ------------------ | - |
| Initiator             | Dataspace Prototyping   |           Dataspace Prototyping |           –
| Administrator         | –      | Management of organisations, Support for policy holders | –                  |   |
| Data Owner            | Consent & policy manager | –                           | –                  |   |
| Provider              | –    | Registry checks             | Provider connector |   |
| Consumer              |Requests or view status  | –           | Consumer connector |   |

> **Next steps:** Deep‑dive into [Keyper Approve API](https://keyper-preview.poort8.nl/scalar/) or [NoodleBar API](https://noodlebar.poort8.nl/scalar/) when you’re ready to implement.
