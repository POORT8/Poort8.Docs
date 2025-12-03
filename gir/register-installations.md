# Register Installations – "POST /GIRBasisdataMessage"

This guide covers the actual write call that a registrar performs to create or update installation records in GIR.

🔗 **[API Docs](https://gir-preview.poort8.nl/scalar/v1)** – Interactive endpoint testing

## **When to Call**

**You can register installations at any time** – the API automatically handles status based on policy presence:

- **No write policy exists** → Installation stored as `Pending` (registrar sees it, others don't)
- **Write policy already exists** → Installation stored as `Active` (visible to authorized parties)
- **The same endpoint handles both "create" (201) and "update" (200)**

💡 **Tip**: If the response shows `status: "Pending"`, you need to request write approval via the [Registrar Flow](registrar-flow.md)

---

## **1 Prerequisites**

| **Must have** | **Notes** |
| -- | -- |
| Auth0 access token | Audience: `GIR-Dataspace-CoreManager` |
| Scopes | `read:ar:delegated write:ar:delegated` |
| Valid BAG VBO-ID | 16-digit BAG identifier |
| Valid KVK numbers | 8-digit, without `NL.KVK.` prefix |
| Installation with minimum one component | See [DICO GIRBasisdataMessage spec](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/) |

### **Authentication Example**

```bash
curl -X POST https://poort8.eu.auth0.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
        "client_id": "<YOUR_CLIENT_ID>",
        "client_secret": "<YOUR_CLIENT_SECRET>",
        "audience": "GIR-Dataspace-CoreManager",
        "grant_type": "client_credentials"
      }'
```

---

## **2 Endpoint**

```
POST https://gir-preview.poort8.nl/api/GIRBasisdataMessage
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json
```

---

## **3 Body Schema**

The request body follows the **DICO GIRBasisdataMessage** standard.

📖 **[Ketenstandaard GIR API Specification](https://ketenstandaard.semantic-treehouse.nl/docs/api/GIR/)** – Complete schema documentation with all required and optional fields.

---

## **4 Example – Create or Update**

```bash
curl -X POST https://gir-preview.poort8.nl/api/GIRBasisdataMessage \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "guid": "b4d1a2f3-9c6d-4b8e-a317-987654321abc",
        "registrarChamberOfCommerceNumber": "12345678",
        "installation": {
          "installationID": { "value": "INST-987-001", "type": "registrar" },
          "name": "Warmtepomp Installatie",
          "installationOwnerChamberOfCommerceNumber": "87654321",
          "installationLocation": {
            "vboID": "0344010000126888",
            "address": {
              "street": "Energiestraat",
              "houseNumber": 12,
              "postalCode": "1234AB",
              "city": "Amsterdam",
              "country": "NL"
            }
          },
          "installationProperties": {
            "controlSystemType": "smart"
          },
          "component": [
            {
              "componentLineGUID": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
              "name": "Warmtepomp Unit",
              "productInformation": {
                "etimClassification": {
                  "etimClassCode": "EC000001",
                  "version": "9.0"
                },
                "datapoolInformation": {
                  "source": "2BA",
                  "registrationID": "2BA-12345678"
                }
              },
              "componentLogs": {
                "firstCommissioningDateTime": "2025-01-15T10:30:00Z"
              }
            }
          ]
        }
      }'
```

---

## **5 Responses**

| **Code** | **Meaning** | **Body** |
| -- | -- | -- |
| `201 Created` | New installation stored | Full installation object with `metadata.status: "Pending"`<br/>*Status is `Active` if owner had already approved* |
| `200 OK` | `installationID.value` already existed – record updated | Same payload as 201 |
| `400 Bad Request` | Validation error (e.g. bad VBO, wrong lengths)<br/>Body follows Problem-Details format | ```json<br/>{ <br/>  "statusCode": 400,<br/>  "message": "One or more errors occurred!",<br/>  "errors": {<br/>    "installation.installationID.value": [<br/>      "must be unique"<br/>    ]<br/>  }<br/>}``` |
| `401 Unauthorized` | Token missing / expired | — |
| `403 Forbidden` | Write policy missing or token lacks correct scopes | — |
| `415 Unsupported Media Type` | Content-Type not JSON | — |

---

## **6 Lifecycle Recap**

1. **POST succeeds** → record is `Pending` (only visible to registrar)
2. **Owner clicks Approve in Keyper** → Keyper writes policy → GIR promotes record to `Active` automatically
3. **Registrar or owner can later archive** (soft delete) the record

---

## **7 Sequence Diagram (Create + Approve + Update)**

```mermaid
sequenceDiagram
    participant RegistrarApp
    participant GIR
    participant Keyper
    participant Owner
    
    RegistrarApp->>GIR: POST (guid, installationID)
    GIR-->>RegistrarApp: 201 Created, status Pending
    
    Owner->>Keyper: Approve earlier link
    Keyper->>GIR: register write-policy
    GIR->>GIR: Pending → Active
    
    RegistrarApp->>GIR: POST same installationID (updated fields)
    GIR-->>RegistrarApp: 200 OK (record updated)
```

---

## **8 Error-Handling Cheat-Sheet**

| **Problem** | **Typical Fix** |
| -- | -- |
| `400 InvalidVboID` | Verify 16-digit BAG ID; no spaces |
| `400 guid format` | Ensure UUID v4, 36 chars |
| `403 PolicyNotFound` | Owner hasn't approved write-policy yet |
| `409` (no longer used – 200 covers update) | — |

---

## **9 Production Notes**

⚠️ **Key Production Changes:**
- Same JSON contract; base host changes
- Authentication switches from Auth0 to DSGO tokens – token endpoints and scopes will change

---

## **Next Steps**

- **After a record becomes Active**, head back to the [Querying Installations](README.md#4-querying-installations) section
- **Data-consumers can then request read-access** via the [Data-Consumer Flow](data-consumer-flow.md)
