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

## 2 Integration Path & Quick Reference

### **Step-by-Step Implementation**

| Step | What you build | Guide |
|------|----------------|-------|
| **1. Register installation** | `POST /GIRBasisdataMessage` (create / update) | **[Register Installations](register-installations.md)** |
| **2. Ask for *write* access** | `POST /approval-links` (write policy) | **[Registrar Flow](registrar-flow.md)** ¹ |
| **3. Ask for *read* access** | `POST /approval-links` (read policy) | **[Data-Consumer Flow](data-consumer-flow.md)** ² |
| **4. Retrieve data** | `GET /GIRBasisdataMessage` (filter by VBO, KVK, etc.) | [Section 4](#4-querying-installations) below |

¹ This guide covers version 1 (v1) of the Keyper API, of which the POST endpoint has been updated. If you're looking for coverage of the previous version (v0) of the Keyper API, please refer to the [legacy version of this guide](legacy/registrar-flow.md) instead.

² This guide covers version 1 (v1) of the Keyper API, of which the POST endpoint has been updated. If you're looking for coverage of the previous version (v0) of the Keyper API, please refer to the [legacy version of this guide](legacy/data-consumer-flow.md) instead.

### **Quick Reference**

| What you need | Where to find it |
|---------------|------------------|
| **Auth tokens** | Auth0 `audience = GIR-Dataspace-CoreManager` → [Authentication examples](registrar-flow.md#authentication-example) |
| **Installation statuses** | [Section 3](#3-status--lifecycle) – Pending/Active/Archived explained |
| **Production changes** | [Section 5](#5-heads-up-for-changes-towards-production) – iSHARE, eHerkenning, KVK changes |

---

## 3 Status & Lifecycle

| Status | Set by | Can transition to | Visibility |
|--------|--------|------------------|------------|
| **Pending** | Registrar API | **Active** once owner approves · **Archived** | Registrar only |
| **Active** | Keyper after approval | **Archived** | All parties with policy |
| **Archived** | Owner (Keyper) or registrar API *(t.b.d.)* | — | None |

If the owner clicks **Reject**, the approval link expires and the installation remains **Pending**; the registrar may send a new link.

---

## 4 Querying Installations

### 4.1 Endpoint  

```text
GET https://gir-preview.poort8.nl/api/GIRBasisdataMessage
```

🔗 **[Live API Documentation](https://gir-preview.poort8.nl/scalar/#tag/girbasisdatamessage/GET/api/GIRBasisdataMessage)** – Interactive endpoint testing

### 4.2 Filters (omit the NL.KVK. prefix)

| **Parameter** | **Format** | **Notes** |
| -- | -- | -- |
| vboID | 16-digit BAG | BAG validation |
| installationIDValue | string | Matches installationID.value |
| registrarChamberOfCommerceNumber | 8-digit |  |
| installationOwnerChamberOfCommerceNumber | 8-digit |  |

**At least one filter is required.**

### 4.3 Minimal Example

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://gir-preview.poort8.nl/api/GIRBasisdataMessage?vboID=0344010000126888"
```

### 4.4 Response (trimmed)

```json
{
  "guid": "b4d1…",
  "installation": { /* … */ },
  "metadata": { "status": "Active", "createdAt": "2025-07-29T13:45:46Z" }
}
```

---

## 5 Heads-up for changes towards Production

⚠️ **Key Production Changes:**
- **Service-provider KVK** → will switch from Techniek Nederland to Stichting Ketenstandaarden: `NL.KVK.41084554`. This impact policy registration in approval links.
- **eHerkenning L3 required** for approvals (email disabled)
- **iSHARE tokens replace Auth0** for the GIR data API 

---

## 6 All Guides & References

### **Integration Guides**

- **[Register Installations](register-installations.md)** – create / update installs
- **[Registrar Flow](registrar-flow.md)** – request write access  
- **[Data-Consumer Flow](data-consumer-flow.md)** – request read access

### **Technical Reference**

- **[Ketenstandaard GIR API](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/)** – Complete DICO schema specification
- **[Ketenstandaarden Documentation about GIR](https://ketenstandaard.semantic-treehouse.nl/docs/TNL/GIR/)** – GIR framework background
- **[DSGO Standards](https://www.digigo.nu/wat-is-dsgo/)** – Authorization and data governance framework
- **[GIR Live API Docs](https://gir-preview.poort8.nl/scalar/v1)** – Interactive Scalar UI
- **[Keyper Live API Docs](https://keyper-preview.poort8.nl/scalar/v1)** – Interactive Scalar UI
