# GIR – Gebouw Installatie Registratie

This guide describes the **GIR**-*preview* dataspace for registering and exchanging building-installation metadata.  
It combines NoodleBar modules (Organization Register, Authorization Register, Keyper Approve) with data(space) standards for API interfaces:

* **DICO** — data-model for installation messages ([Ketenstandaard GIR Spec](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/))
* **DSGO** — approval & access rules

---

## 1 End-to-End Flow in Four Steps

1. **Register installation**  
   *Registrar →* `POST /GIRBasisdataMessage`  
   - If no write-policy is in place, the record is stored as **Pending** (only the registrar can see it).

2. **Request write access**  
  *Registrar →* `POST /approval-links` (write policy)  
    - Owner receives an e-mail, logs in with eHerkenning, clicks **Approve**.
    - Policy is registered in the GIR Authorization Register.
    - GIR automatically promotes any matching **Pending** records to **Active**.
    - ⚠️ *Only in **GIR**-preview, the RegistrarApp (FormulierenApp), includes the request for read access for EDSN in this approval-link.*
    

3. **Request read access**  
   *Data-consumer (e.g. EDSN) →* `POST /approval-links` (read policy, optional NL/SfB filter)  
   - As above, Owner receives an e-mail, logs in with eHerkenning, clicks Approve.
   - Policy is registered in the GIR Authorization Register.

4. **Retrieve data**  
   *Any party* calls `GET /GIRBasisdataMessage`  
   - Registrar sees its own **Pending** + **Active** installations.  
   - Other parties see only **Active** installations they are the owner of OR they have a read-policy for.

---

## 2 Overview

| Area | Highlight |
|------|-----------|
| **Purpose** | Secure, auditable registration and controlled data sharing. |
| **Core modules** | Keyper Approve · Org Register · Auth Register · API Gateway |
| **Auth** | Auth0 Client-Credentials (`audience = GIR-Dataspace-CoreManager`) ⚠️ *Production: iSHARE tokens* |
| **Statuses** | **Pending** – draft · **Active** – approved · **Archived** – soft delete |
| **Preview ↔ Production** | ⚠️ Host & service-provider KVK change; eHerkenning becomes mandatory; iSHARE replaces Auth0 for the data API |

---

## 3 Integration Path

| Step | What you build | Guide |
|------|----------------|-------|
| **1. Register installation** | `POST /GIRBasisdataMessage` (create / update) | **[Register Installations](register-installations.md)** |
| **2. Ask for *write* access** | `POST /approval-links` (write policy) | **[Registrar Flow](registrar-flow.md)** |
| **3. Ask for *read* access** | `POST /approval-links` (read policy) | **[Data-Consumer Flow](data-consumer-flow.md)** |
| **4. Retrieve data** | `GET /GIRBasisdataMessage` (filter by VBO, KVK, etc.) | Section 5 below |

---

## 4 Status & Lifecycle

| Status | Set by | Can transition to | Visibility |
|--------|--------|------------------|------------|
| **Pending** | Registrar API | **Active** once owner approves · **Archived** | Registrar only |
| **Active** | Keyper after approval | **Archived** | All parties with policy |
| **Archived** | Owner (Keyper) or registrar API *(t.b.d.)* | — | None |

If the owner clicks **Reject**, the approval link expires and the installation remains **Pending**; the registrar may send a new link.

---

## 5 Querying Installations

### 5.1 Endpoint  

```text
GET https://gir-preview.poort8.nl/api/GIRBasisdataMessage
```

🔗 **[Live API Documentation](https://gir-preview.poort8.nl/scalar/#tag/girbasisdatamessage/GET/api/GIRBasisdataMessage)** – Interactive endpoint testing

### 5.2 Filters (omit the NL.KVK. prefix)

| **Parameter** | **Format** | **Notes** |
| -- | -- | -- |
| vboID | 16-digit BAG | BAG validation |
| installationIDValue | string | Matches installationID.value |
| registrarChamberOfCommerceNumber | 8-digit |  |
| installationOwnerChamberOfCommerceNumber | 8-digit |  |

**At least one filter is required.**

### 5.3 Minimal Example

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://gir-preview.poort8.nl/api/GIRBasisdataMessage?vboID=0344010000126888"
```

### 5.4 Response (trimmed)

```json
{
  "guid": "b4d1…",
  "installation": { /* … */ },
  "metadata": { "status": "Active", "createdAt": "2025-07-29T13:45:46Z" }
}
```

---

## 6 Heads-up for changes towards Production

⚠️ **Key Production Changes:**
- **Service-provider KVK** → will switch from Techniek Nederland to Stichting Ketenstandaarden: `NL.KVK.41084554`. This impact policy registration in approval links.
- **eHerkenning L3 required** for approvals (email disabled)
- **Keyper API authentication** will soon require OAuth credentials issued by Poort8 (also on Preview). Integration details and onboarding instructions will be provided in upcoming updates.
- **iSHARE tokens replace Auth0** for the GIR data API 

---

## 7 All Guides & References

### **Integration Guides**

- **[Register Installations](register-installations.md)** – create / update installs
- **[Registrar Flow](registrar-flow.md)** – request write access  
- **[Data-Consumer Flow](data-consumer-flow.md)** – request read access

### **Technical Reference**

- **[Ketenstandaard GIR API](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/)** – Complete DICO schema specification
- **[Ketenstandaarden Documentation about GIR](https://ketenstandaard.semantic-treehouse.nl/docs/TNL/GIR/)** – GIR framework background
- **[DSGO Standards](https://www.digigo.nu/wat-is-dsgo/)** – Authorization and data governance framework
- **[GIR Live API Docs](https://gir-preview.poort8.nl/scalar/v1)** – Interactive Scalar UI
- **[Keyper Live API Docs](https://keyper-preview.poort8.nl/scalar)** – Interactive Scalar UI
