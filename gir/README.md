# GIR: Gebouw Installatie Registratie

## Introduction

GIR (Gebouw Installatie Registratie) is a specialized implementation of NoodleBar for managing building installation registrations. This dataspace enables secure, auditable registration and sharing of building installation metadata between installers, approvers, and authorized third parties like EDSN (Energie Data Services Nederland).

## Live API Documentation

🔗 **[GIR API Documentation](https://gir-preview.poort8.nl/scalar/v1)** - Interactive API reference with live testing capabilities

## Key Features

### 1. **DSGO Authorization Register**
Enables users to set permissions for installation companies or other registrants and for data consumers to view and manage building installation data.

### 2. **Installation Registration & Metadata Processing** 
Supports installation companies in registering and updating installation details, allowing data consumers to retrieve and analyze this data.

### 3. **GIRBasisdataMessage API**
Comprehensive endpoints following the DICO standard for:
- **Registration**: Creating new installation records via `POST /api/GIRBasisdataMessage`
- **Retrieval**: Querying installation data via `GET /api/GIRBasisdataMessage` with filters for:
  - `vboID` (Building Object ID)
  - `installationID` 
  - `registrarChamberOfCommerceNumber`
  - `installationOwnerChamberOfCommerceNumber`
- **Individual Access**: Getting specific installations via `GET /api/GIRBasisdataMessage/{guid}`

## Process Flow

### 1. **Installation Registration**
Installers submit installation data through their applications (e.g., Formulierenapp) using the standardized `GIRBasisdataMessage` format. Installations initially receive 'pending' status if proper permissions aren't yet in place.

### 2. **Approval Workflow** 
- Installer applications create approval links via [Keyper Approve](https://keyper-preview.poort8.nl/scalar/#tag/approval-links/POST/api/approval-links)
- Keyper validates all required dataspace transactions (organization enrollment, permissions)
- Valid approval links trigger email notifications to installation owners

### 3. **Authentication & Authorization**
- Installation owners authenticate via **eHerkenning** for secure identity verification
- Upon approval, data becomes available to authorized data consumers
- All transactions follow DSGO standards for integrity and validity

### 4. **Data Access**
Authorized data consumers can query and retrieve installation metadata, with access rights managed by the data owner.

## Alternative Flows

### **Verification & Access Control**
- Data owners can verify installations are correctly registered using [Keyper (preview)](https://keyper-preview.poort8.nl/)
- Building managers can directly set access rights for installers and data consumers
- Self-service authorization registration via eHerkenning authentication

## Technical Specifications

### **Authentication**
- **OAuth 2.0 Client Credentials Flow** via `https://poort8.eu.auth0.com/oauth/token`
- **Audience**: `GIR-Dataspace-CoreManager`
- **Available Scopes**:
  - `read:or` / `write:or` - Organization Register permissions
  - `read:ar` / `write:ar` - Authorization Register permissions  
  - `read:or:delegated` / `write:ar:delegated` - Delegated permissions for trusted apps

### **Data Standards**
- **DICO Standard**: Compliance for building installation data exchange
- **DSGO Standards**: Authorization and permission management
- **NLSfB Classification**: Currently using first classification field only
- **eTIM Classification**: Product information standards

### **Key Endpoints**
```
GET  /api/GIRBasisdataMessage           # Query installations
POST /api/GIRBasisdataMessage           # Register new installation  
GET  /api/GIRBasisdataMessage/{guid}    # Get specific installation
POST /api/authorization/unsigned-delegation  # Test delegated access
```

## Architecture

GIR is built on NoodleBar's proven modular components:

- **Organization Register**: Managing participant identities in the building sector
- **Authorization Register**: Controlling access to sensitive installation data
- **Keyper Approve**: Handling multi-party approval workflows
- **API Gateway**: Secure data exchange following DICO standards

## Stakeholders

- **Installers**: Submit building installation data via standardized APIs
- **Installation Owners**: Approve data sharing via eHerkenning authentication  
- **Data Consumers**: Access authorized installation data (e.g., EDSN)
- **Approvers**: Validate installation registrations and authorize data sharing
- **GIR System**: Manages the complete registration and authorization ecosystem

## Data Model Highlights

The GIRBasisdataMessage supports comprehensive installation data including:
- **Installation Details**: ID, name, location (VBO), geographical coordinates
- **Classifications**: Electricity transformers, installation types per DICO standard
- **Component Information**: Detailed component data with eTIM classification
- **Product Information**: GTIN, manufacturer details, technical specifications
- **Metadata**: Registration status, creation/update timestamps, issuer information

For detailed process information, see the [GIR Process](GIR-process.md) documentation.

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
