# DVU Implementation Context

DVU (Datastelsel Verduurzaming Utiliteit) provides secure access to energy data for buildings through the Keyper approval workflow.

## Overview

This section documents the DVU implementation patterns using Keyper Approve for energy data access requests. DVU enables secure, auditable access to building energy data through standardized approval workflows.

## Implementation Guides

- [Single Building Access](single-building.md) - Request energy data access for individual buildings
- [Bulk Building Access](bulk-buildings.md) - Request energy data access for multiple buildings simultaneously
- [Direct EAN Access](direct-ean.md) - Request energy data access for one or more EAN(s) instead of buildings

## Process Flow

The DVU approval process follows a structured workflow for energy data access:

1. **Data Request**: Users submit requests through DVU applications
2. **Keyper Approval**: Requests are processed through Keyper Approve workflow  
3. **Authorization**: Energy contractors approve data sharing permissions
4. **Data Access**: Authorized applications can access energy data

## Architecture

DVU integrates with several key components:

- **Keyper Approve**: Handles approval workflows and consent management
- **DVU Metadata App**: Manages building metadata and registration
- **DVU Satellite**: Core DVU infrastructure for data processing
- **Authorization Register**: Stores access permissions and policies
- **eHerkenning**: Provides secure identity verification

## Sequence Diagram: Bulk Building Access

The following sequence diagram shows the DVU approval process for multiple buildings:

```mermaid
sequenceDiagram
    participant GE as Gebouwbeheerder<br/>en energiecontractant
    participant DG as dataservice-gebruiker
    participant KA as Keyper Approve
    participant MetadataApp as DVU Metadata-app
    participant DVUSat as DVU Satelliet
    participant AR as Autorisatieregister
    participant Eherkenning as eHerkenning
    participant DA as dataservice-aanbieder
    participant RNB as RNB

    rect rgb(221, 242, 255)
        note right of GE: Gebouwen toevoegen via DG
        
        GE->>+DG: start sessie
        GE->>DG: invoeren gebouwen (adres/vboId)
        DG->>DG: verzamelen gebouwdata
        DG->>+KA: aanmaken transactielink
        KA->>KA: valideren input
        KA->>-DG: status: Active + redirect URL
        DG->>-GE: redirect naar Keyper Approve
    end

    rect rgb(221, 242, 255)
        note right of GE: Bulk-gebouwgegevens aanvullen
        
        GE->>+KA: openen redirect URL
        KA->>-GE: redirect naar MetadataApp (gebouw toevoegen in bulk)
        GE->>+MetadataApp: invullen aanvullende gegevens
        GE->>MetadataApp: doorlopen flow
        MetadataApp->>-GE: terug naar Keyper Approve
    end

    rect rgb(221, 242, 255)
        note right of GE: Transacties bevestigen
        
        GE->>+KA: controleer transacties
        note over KA: (optioneel) registratie<br/>overheidsorganisatie<br/>als DVU-deelnemer
        note over KA: toestemming ophalen<br/>energiedata voor DG:<br/>per gebouw geregistreerd<br/>(later: bulktoestemming)
        
        KA->>GE: overzicht transacties
        GE->>+Eherkenning: inloggen eHerkenning niveau 3
        Eherkenning->>-KA: identity token
        KA->>+DVUSat: registreer inschrijving
        DVUSat-->>-KA: bevestiging
        
        KA->>+AR: registreer metadata & toestemmingen
        AR-->>KA: bevestiging
        KA-->>RNB: afgeven/hergebruiken toestemmingen onder GUE
        AR-->>-KA: 
        KA->>GE: redirect naar DG
        KA->>-DG: notificatie: autorisaties verwerkt
    end

    rect rgb(221, 242, 255)
        note right of DG: Data ophalen via DVU koppelingen
        
        DG->>+AR: ophalen vboIds + EANs (digikoppeling)
        AR-->>-DG: identifiers
        DG->>DA: ophalen energiedata
    end
```

## Next Steps

- Review the specific implementation guides for single and bulk building access
- Understand the authorization flow and integration points
- Implement the Keyper Approve workflow in your DVU application

---

*DVU is part of the broader energy data ecosystem, enabling secure and controlled access to building energy information.*
