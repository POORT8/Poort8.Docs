# GDS – Green Data Space

This guide describes the **Green Data Space (GDS)**, a proof-of-concept project demonstrating secure, sovereign data sharing for building management and energy optimization. It enables controlled data exchange between an IoT sensor platform (data service provider) and a building management/optimization system (data service consumer), orchestrated by Poort8's NoodleBar dataspace technology.

This dataspace combines NoodleBar modules (Organization Register, Authorization Register, Keyper Approve) with emerging dataspace standards for API interfaces.

---

## 1. End-to-End Flow in 5 Steps

> ⚠️ **Illustrative flow**  
> For clarity, the approval for different permissions (discovering sensors, reading data, sending commands) are described here as separate steps. In a real-world implementation, these can be bundled into a single approval request to the requesting *data service consumer*.

1.  **Request Sensor Discovery Access**  
    *Data Service Consumer → Keyper API:* `POST <KEYPER_API_URL>/approval-links` (policy for `read` on sensor metadata)
    - The consumer first requests permission to see which sensors are available for a building.
    - The Building Owner approves via eHerkenning, creating a policy in the GDS Authorization Register.

2.  **Discover and Import Sensors**  
    *Data Service Consumer → Data Service Provider API:* `GET /{sensors-endpoint}`, `POST /{sensors-endpoint}/import`  
    - With the initial policy in place, the consumer application discovers the available sensors and imports their configurations.

3.  **Request Data & Control Access**  
    *Data Service Consumer → Keyper API:* `POST /approval-links` (policies for `read` on data and optionally `control`)
    - The consumer then requests permissions to read real-time measurement data and to send control commands.
    - The Building Owner approves these specific permissions.

4.  **Retrieve Real-time Data**  
    *Data Service Consumer → Data Service Provider API:* `GET /{measurements-endpoint}`  
    - With the data `read` policy active, the data service consumer can fetch the live data stream from the data service provider.

5.  **Send Control Commands**  
    *Data Service Consumer → Data Service Provider API:* `POST /{setpoints-endpoint}`  
    - With the `control` policy active, the consumer can send setpoint adjustments back to the provider's systems to optimize the building's performance.

---

## 2. Implementation Path & Quick Reference

### **Step-by-Step Implementation**

| Step | What you build | Guide |
|------|----------------|-------|
| **1. Approval Workflow** | `POST /approval-links` (request policies) | **[Data Exchange Flow](data-exchange-flow.md)** |
| **2. Sensor Setup** | `GET /{sensors-endpoint}` (discover) <br> `POST /{sensors-endpoint}/import` (import) | **[Setup Flow](setup-flow.md)** |
| **3. Data Exchange** | `GET /{measurements-endpoint}` (read data) <br> `POST /{setpoints-endpoint}` (send commands) | **[Data Exchange Flow](data-exchange-flow.md)** |

### **Quick Reference**

| What you need | Where to find it |
|---------------|------------------|
| **Auth tokens** | Auth0 `audience = GDS-Dataspace-CoreManager` |
| **Approval workflow** | Keyper `POST /approval-links` |
| **Live API Docs** | [GDS Live API Docs](https://gds-preview.poort8.nl/scalar) – Interactive Scalar UI |
| **Keyper API Docs** | [Keyper Live API Docs](https://keyper-preview.poort8.nl/scalar) – Interactive Scalar UI |

---

## 3. All Guides & References

### **Integration Guides**

- **[Setup Flow](setup-flow.md)** – Discover and import sensor configurations.
- **[Data Exchange Flow](data-exchange-flow.md)** – Request permissions and exchange data.

### **Technical & External Reference**

- **[GDS Live API Docs](https://gds-preview.poort8.nl/scalar)** – Interactive Scalar UI for the GDS APIs.
- **[Keyper Live API Docs](https://keyper-preview.poort8.nl/scalar)** – Interactive Scalar UI for the Keyper approval API.
- **[NoodleBar Docs](../noodlebar/)** – Documentation for the underlying dataspace components.
