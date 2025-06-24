# TSL: Instantie voor Topsector Logistiek

## Introduction

TSL (Instantie voor Topsector Logistiek) is a specialized implementation of NoodleBar designed for the logistics sector in the Netherlands. This dataspace demonstrates how NoodleBar's modular infrastructure enables secure, controlled, and efficient data sharing among logistics stakeholders including transport companies, freight forwarders, ports, terminals, and supply chain partners.

## Live API Documentation

🔗 **[TSL API Documentation](https://tsl-dataspace-coremanager.azurewebsites.net/scalar/v1)** - Interactive API reference with live testing capabilities

## Core Components

### **Organization Registry**
Central database storing information about all logistics organizations participating in the dataspace:

- **Identifiers**: Unique IDs for each logistics organization
- **Names**: Official company names and trading names
- **Adherence Status**: Compliance information with TSL dataspace standards
- **Roles**: Data provider, data consumer, logistics service provider, etc.
- **Additional Properties**: Contact information, certificates, and logistics services offered
- **Agreements**: Framework agreements, compliance verification, contract management
- **Sectors**: Specific logistics sectors (freight, maritime, inland shipping, etc.)

### **Authorization Registry**
Manages access control for sensitive logistics data:

- **Policy Management**: Creation and enforcement of data sharing policies
- **Access Control**: Fine-grained permissions for logistics data resources
- **Delegation Evidence**: Signed proofs of authorization for audit compliance
- **Real-time Verification**: Instant permission checks for logistics operations

## API Capabilities

### **Organization Registry Endpoints**
```
GET  /api/organization-registry/{id}    # Get organization details
POST /api/organization-registry         # Register new logistics organization
```

**Organization Data Model:**
- Company information and logistics capabilities
- Service offerings and specializations
- Compliance certificates and adherence status
- Authorization registry connections
- Countries of operation and sector classifications

### **Authorization Management**
```
POST /api/authorization/unsigned-delegation     # Test delegated access
GET  /api/authorization/explained-enforce       # Detailed access decisions  
GET  /api/authorization/enforce                 # Real-time permission checks
```

### **Employee & Access Management**
```
POST /api/authorization-registry-organizations/{organizationId}/employees
GET  /api/authorization-registry-organizations/{id}
```

## Authentication & Security

### **OAuth 2.0 Client Credentials Flow**
- **Token Endpoint**: `https://topsector-logistiek.eu.auth0.com/oauth/token`
- **Audience**: `TSL-Dataspace-CoreManager`
- **Grant Type**: `client_credentials`

### **Available Scopes**
- `read:or` / `write:or` - Organization Register permissions
- `read:ar` / `write:ar` - Authorization Register permissions  
- `read:or:delegated` / `write:or:delegated` - Delegated Organization Registry access
- `read:ar:delegated` / `write:ar:delegated` - Delegated Authorization Registry access

*Note: The OAuth token authenticates your application to the TSL API. Authorization between logistics participants is managed separately through the Authorization Registry policies.*

## Logistics Sector Benefits

### **Enhanced Supply Chain Visibility**
- Real-time tracking and tracing capabilities across logistics networks
- End-to-end supply chain transparency for all stakeholders
- Improved cargo and fleet management through shared data

### **Operational Efficiency**
- Reduced manual data entry and processing between logistics partners
- Automated information exchange following industry standards
- Optimized routing and scheduling through collaborative data sharing

### **Regulatory Compliance**
- Standardized data formats and protocols for logistics reporting
- Comprehensive audit trails for regulatory compliance
- Secure handling of sensitive logistics and cargo data

### **Collaborative Data Sharing**
- Secure data exchange between logistics service providers
- Port community system integration capabilities
- Customs and regulatory platform connectivity

## Integration with Existing Systems

TSL is designed to integrate seamlessly with existing logistics platforms:

- **TMS (Transportation Management Systems)**: Route optimization and fleet management
- **WMS (Warehouse Management Systems)**: Inventory and fulfillment operations  
- **Port Community Systems**: Maritime cargo handling and documentation
- **Customs and Regulatory Platforms**: Compliance reporting and clearance
- **Supply Chain Platforms**: End-to-end visibility and coordination

## Architecture

TSL leverages NoodleBar's proven modular components specifically configured for logistics:

- **Organization Register**: Managing logistics sector participants and their capabilities
- **Authorization Register**: Controlling access to sensitive logistics and cargo data
- **Data Exchange APIs**: Standardized interfaces for logistics data protocols
- **Compliance Framework**: Ensuring adherence to logistics sector regulations and standards

## Stakeholders

- **Transport Companies**: Freight carriers and logistics service providers
- **Freight Forwarders**: Intermediaries coordinating multi-modal logistics operations  
- **Ports and Terminals**: Infrastructure operators managing cargo flows and documentation
- **Supply Chain Partners**: Manufacturers, distributors, retailers, and end customers
- **Regulatory Bodies**: Authorities overseeing logistics compliance and customs
- **Technology Providers**: Software vendors serving the logistics ecosystem

## Key Focus Areas

- **Supply Chain Data Exchange**: Secure sharing of logistics data across the complete supply chain
- **Transportation Management**: Real-time data sharing for transport optimization and coordination
- **Port and Terminal Integration**: Seamless data exchange with maritime and inland port systems  
- **Compliance and Traceability**: Meeting regulatory requirements for logistics and cargo data

## Getting Started

1. **Organization Registration**: Register your logistics organization in the TSL dataspace
2. **Authentication Setup**: Obtain OAuth credentials for API access
3. **Policy Configuration**: Define data sharing policies with your logistics partners
4. **Integration**: Connect your existing logistics systems via standardized APIs
5. **Go Live**: Begin secure data sharing within the TSL logistics ecosystem

For general NoodleBar concepts and deployment options, refer to the [NoodleBar Demo](../NoodleBar/) documentation.

For other use case implementations, visit:
- [GIR Instance](../GIR/) - Building Installation Registration

---

*TSL represents Poort8's commitment to transforming data sharing in the logistics sector through secure, standardized dataspace technology powered by proven NoodleBar infrastructure.*

### 1.7 Context and Objective

The project is under the Basis Data Infrastructuur (BDI) umbrella, pending its ongoing development. The objective is to facilitate setting up dataspaces that follow certain principles, serving as an initial platform for data providers, apps, and data consumers.

### 1.8 Roles

- **Data Providers**: Organizations that either offer a data source with raw data or an app with processed data. In all cases, access conditions are set by the data owner.
- **App Providers**: Organizations that act as intermediaries, adding value to raw data. They act as a Data Consumer on behalf of their end users, and as a Data Provider for their end users.
- **Data Consumers**: Organizations that use data via Service Providers or directly.
- **Dataspace Initiators**: Organizations that setup and manage the dataspace.

### 1.9 Principles

- **Data Sovereignty**: Data owners (issuers) can issue access to their data, even if through federated apps.
- **Data Localization**: Data stays at its source unless caching or staging is essential.
- **Identity Flexibility**: Data consumers choose their identity providers.

### 1.10 Customer Journeys

The wiki describes the following Customer Journeys in more detail:

- **Initiating Dataspace Core**
- **Onboarding Data Sources**
- **Onboarding Data Owners and Consumers**
- **Data Sources Becoming Independent**
- **Adding Providers and Apps**

The first three journeys comprise the launch of a first (prototype) of a dataspace. Journeys 4 and 5 allow data sources and Service Providers to become independent contributors to the dataspace.
