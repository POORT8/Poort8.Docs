---
title: DVU Machine-to-Machine Toegang
description: Business & technische context voor M2M toegang tot energieverbruiksdata binnen DVU
---

# Machine-to-Machine Toegang tot Energiedata (DVU)

Deze pagina biedt een zakelijke én technische introductie voor het implementeren van geautoriseerde machine-to-machine (M2M) toegang tot energieverbruiksdata binnen DVU.

## 1. Managementsamenvatting

### Projectoverzicht
De DVU (Datastelsel Verduurzaming Utiliteit) faciliteert gecontroleerde, auditeerbare en iSHARE-conforme toegang tot energieverbruiksdata. Deze toegang ondersteunt gebouwoptimalisatie, energiebesparing en transparante data‑soevereiniteit.

### Doelstelling
Een datadienstgebruiker (M2M client) vraagt namens een gebouweigenaar toestemming voor toegang tot dagelijkse verbruiksdata. Met deze toegang kan de dienst verbruiksprofielen analyseren en optimalisatie‑inzichten leveren. In dit document focussen we op dagelijkse granulariteit (dagstanden) als eerste stap.

### Belangrijkste voordelen
- Real‑time(achtig) gebouwoptimalisatie: dagelijkse dataset voor operationele verbeteringen
- Geautomatiseerde M2M service: geen handmatige data-extracties
- Regelgevingscompliance: iSHARE + eSeal (eIDAS) borging
- Schaalbaar: geschikt voor portefeuillebeheer (meerdere gebouwen/EANs)
- Datasoevereiniteit: expliciete toestemming en intrekbaarheid op elk moment

## 2. Gebruikersreis & Persona's

### Gestandaardiseerde DVU persona's
| Persona | Rol (NL) | Korte Omschrijving |
|---------|----------|--------------------|
| Bob | Data-eigenaar (energiecontractant) | Autoriseert datatoegang |
| Alice | Eindgebruiker (gebouwbeheerder) | Ontvangt optimalisatie-inzichten |
| Charlie | Datadienstaanbieder (SDS) | Levert platform / distributie |
| David | Datadienstgebruiker | Bouwt optimalisatie- of analyse‑dienst |

### Voorbeeld gebruikersreis
Situatie: Alice wil een optimalisatiedienst inzetten; David faciliteert dit namens Charlie; Bob moet toestemming geven.

1. Service discovery – Alice kiest een optimalisatiedienst.
2. Toestemmingsaanvraag – David initieert via Keyper een approval‑link richting Bob.
3. Toestemmingsflow – Bob doorloopt de DVU/Keyper autorisatie (dagelijkse verbruiksdata).
4. Activatie – M2M connector valideert tokens en zet datastromen op.
5. Levering – Alice ontvangt inzichten / rapportage.
6. Technische validatie – DVU controleert integriteit & iSHARE conformiteit.

## 3. Technische Implementatiearchitectuur

### 3.1 Kerncomponenten
- iSHARE compliance engine – identiteit & autorisatie (tokens, trust)
- Autorisatieregister – opslag van toestemmingen & beleidsregels
- Datasoevereiniteitsservices – inzicht & controle voor gebouweigenaar
- DVU M2M connector – verwerkt dataverzoeken, valideert rechten
- Keyper Approve – orchestratie van toestemmingsflows

> Verdere technische diepte: zie [Single Building Access](single-building.md) voor een concrete instapflow.

### 3.2 Integratie-eisen Datadienstgebruiker

De datadienstgebruiker moet de volgende lagen/onderdelen voorzien:

#### Applicatiewebsite / Portaal
- Portaal voor eindgebruikers (Alice) met dienstselectie
- Optioneel integratie binnen omgeving van datadienstaanbieder (Charlie)
- Redirect naar Keyper voor autorisatie

#### Backend API / Security
- iSHARE client implementatie (token retrieval / JWT validatie)
- eSeal certificaatbeheer (veilig sleutelbeheer & rotatiebeleid)
- M2M datakoppeling (dagelijkse ingest pipeline)

#### Service Delivery Platform
- Analytics engine (profilering & optimalisatie)
- Rapportage / notificaties (dashboards, e-mail, API)
- Monitoring & observability (latency, foutpercentages)
- Dataretentie & compliance (beleid + audit)

## 4. Gedetailleerde Technische Specificaties

### 4.1 iSHARE conformiteit (kernpunten)
- Toelating: voldoe aan iSHARE Adhering Party criteria
- Registratie: inschrijving in DVU participant registry (preview & productie) – contact: BeheerDVU@rvo.nl
- eSeal certificaat: vereist voor M2M authenticatie (eIDAS compliant)
- Audittrail: volledige log van toegangsverzoeken & gebruik

### 4.2 Implementatiereferentie
Zie implementatiegids: [Single Building Access](single-building.md) voor stap‑voor‑stap autorisatieflow. Meer uitgebreide multi‑building en directe EAN varianten: [Bulk Buildings](bulk-buildings.md), [Direct EAN Access](direct-ean.md).

## 5. Implementatieproces & Fases

| Fase | Doel | Checklist |
|------|------|-----------|
| 1. Registratie (preview) | Toegang tot testomgeving | [ ] iSHARE testcertificaat <br/> [ ] Adhering Party (preview) |
| 2. Toestemmingsaanvraag | UX + approval flow | [ ] Portaal implementatie <br/> [ ] Approval link genereren |
| 3. Data-connector | M2M basis actief | [ ] Connector bouw <br/> [ ] iSHARE authenticatie <br/> [ ] Data ingestion |
| 4. Integratie & Test | End-to-end validatie | [ ] Toestemmingsflow validatie <br/> [ ] E2E M2M test <br/> [ ] Datakwaliteit check |
| 5. Productie registratie | Productierijpe trust | [ ] eSeal aanschaf <br/> [ ] Adhering Party (prod) |
| 6. Lancering | Operationaliseren | [ ] Pilot <br/> [ ] Feedback verwerken <br/> [ ] Volledige uitrol |

## 6. Klantervaring & Gebruikersinterface

### 6.1 Eindgebruiker (Alice)
**Service discovery**
- Heldere waardepropositie gericht op dagelijkse optimalisatie
- Transparante verwachtingen & scope

**Autorisatieproces**
- Naadloze redirect naar DVU/Keyper
- Uitleg verschil dagelijkse data vs jaar-/historische aggregaties
- Duidelijke toestemmingssamenvatting vóór bevestigen

**Servicelevering**
- Dagelijkse verbruiksprofielen / inzichten
- Periodieke rapportages (API / dashboard)

### 6.2 Data-eigenaar (Bob)
**Toestemmingsbeheer dashboard**
- Overzicht actieve services (dagelijks vs jaarlijks)
- Intrek / wijzig functionaliteit per EAN
- Transparantie over laatste datatoegang

**Privacy & controle**
- Gebouwfocus: geen persoonsgedraganalyse
- Audittrail raadpleegbaar
- Onmiddellijke stop bij intrekking