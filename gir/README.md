# GIR – Gebouw Installatie Registratie

This guide describes the **GIR**-*preview* dataspace for registering and exchanging building-installation metadata.  
It combines NoodleBar modules (Organization Register, Authorization Register, Keyper Approve) with data(space) standards for API interfaces:

* **DICO** — data-model for installation messages ([Ketenstandaard GIR Spec](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/))
* **DSGO** — approval & access rules [DSGO Standards](https://www.digigo.nu/wat-is-dsgo/)

---

## 1 End-to-End Flow in Four Steps

1. **Register installation metadata**  
   *Registrar →* `POST /GIRBasisdataMessage`  
   - If no write-policy is in place, the record is stored as **Pending** (only the registrar can see it).

2. **Request write access to metadata**  
  *Registrar →* `POST /approval-links` (write policy)  
    - Owner receives an e-mail, authenticates, clicks **Approve**.
    - Policy is registered in the GIR Authorization Register.
    - GIR automatically promotes any matching **Pending** records to **Active**.
    - ⚠️ *Only in **GIR**-preview, the RegistrarApp (FormulierenApp), includes the request for read access for EDSN in this approval-link.*
    
3. **Request read access to metadata**  
   *Data-consumer (e.g. EDSN) →* `POST /approval-links` (read policy, optional NL/SfB filter)  
   - As above, Owner receives an e-mail, authenticates, clicks **Approve**.
   - Policy is registered in the GIR Authorization Register.

4. **Retrieve installation metadata**  
   *Any party* calls `GET /GIRBasisdataMessage`  
   - Registrar sees its own **Pending** + **Active** installations.  
   - Other parties see only **Active** installations they are the owner of OR they have a read or write policy for.

---

## 2 Integration Path & Quick Reference

### **Implementation Guides**

| Step | What you build | Guide |
|------|----------------|-------|
| **1. Register installation metadata** | `POST /GIRBasisdataMessage` (create / update) | **[Register or Update an Installation](insert-installation.md)** |
| **2. Ask for *write* access** | `POST /approval-links` (write policy) | **[Activation after write approval](insert-installation.md#activation-after-write-approval)** |
| **3. Ask for *read* access and retrieve data** | `POST /approval-links` (read policy) + `GET /GIRBasisdataMessage` | **[Data Consumer Integration Guide](data-consumer-flow.md)** |
| **4. Retrieve installation metadata** | `GET /GIRBasisdataMessage` (filter by VBO, KVK, etc.) | [Section 4](#4-querying-installations) below |

### **Quick Reference**

| What you need | Where to find it |
|---------------|------------------|
| **DSGO bearer tokens** | GIR `/connect/token` → [Data Consumer Integration Guide](data-consumer-flow.md#step-2-obtain-a-dsgo-bearer-token) |
| **Installation statuses** | [Section 3](#3-status--lifecycle) – Pending/Active/Archived explained |
| **Production changes** | [Section 5](#5-heads-up-for-changes-towards-production) – DSGO, authentication, KVK changes |

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
GET https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage/{guid}
```

🔗 **[API Docs](https://gir-preview.poort8.nl/scalar/#tag/girbasisdatamessage/GET/v1/api/GIRBasisdataMessage/{guid})**

### 4.2 Query Parameters

| **Parameter** | **Format** | **Notes** |
| -- | -- | -- |
| vboID | 16-digit BAG | BAG validation |
| energyConnectionID | string (EAN-18) | Matches `installation.installationInformation.energyConnectionID` |
| installationIDValue | string | Matches `installationID.value` |
| registrarChamberOfCommerceNumber | 8-digit | Omit the did:ishare:EU.NL.NTRNL- prefix |
| installationOwnerChamberOfCommerceNumber | 8-digit | Omit the did:ishare:EU.NL.NTRNL- prefix |

**At least one filter is required.**

### 4.3 Minimal Example

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  "https://gir-preview.poort8.nl/v1/api/GIRBasisdataMessage?vboID=0344010000126888"
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
- **Service-provider KVK** → will switch from Techniek Nederland to Poort8: `did:ishare:EU.NL.NTRNL-76660680`. This impacts policy registration in approval links.
- **Approval authentication** → approvals are currently authenticated bilaterally with GIR using Auth0-tokens. DSGO authentication for approvals may be supported in the future.
- **DSGO token issuance details may still change** between preview and production deployments

---

## 6 All Guides & References

### **Integration Guides**

- **[Registrar Integration Guide](registrar-flow.md)** – orchestrate write approval, token acquisition, installation upserts, and activation verification
- **[Register or Update an Installation](insert-installation.md)** – create / update installs and understand `Pending` versus `Active`
- **[Data Consumer Integration Guide](data-consumer-flow.md)** – request read access and retrieve installation data

### **Technical Reference**

- **[Ketenstandaard GIR API](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/)** – Complete DICO schema specification
- **[Ketenstandaarden Documentation about GIR](https://ketenstandaard.semantic-treehouse.nl/docs/TNL/GIR/)** – GIR framework background
- **[DSGO Standards](https://www.digigo.nu/wat-is-dsgo/)** – Authorization and data governance framework
- **[GIR API Reference](https://gir-preview.poort8.nl/scalar/v1)** – Interactive Scalar Docs
- **[Keyper API Reference](https://keyper-preview.poort8.nl/scalar/v1)** – Interactive Scalar Docs
