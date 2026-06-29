# TSL: Instantie voor Topsector Logistiek

## Introductie

TSL (Instantie voor Topsector Logistiek) is een gespecialiseerde implementatie van NoodleBar voor de logistieke sector in Nederland. Deze dataspace laat zien hoe NoodleBar's modulaire infrastructuur veilig, gecontroleerd en efficiënt gegevensuitwisseling mogelijk maakt tussen logistieke partijen, waaronder transportbedrijven, expediteurs, havens, terminals en ketenpartners.

## Live API-documentatie

🔗 **[TSL API-documentatie](https://tsl.poort8.nl/scalar/v1)** - Interactieve API-referentie met live testmogelijkheden

## Kerncomponenten

### **Participantenregister**
Centrale database met informatie over alle organisaties die deelnemen aan de dataspace:

- **Identifiers**: Unieke ID's voor elke organisatie
- **Namen**: Officiële bedrijfsnamen en handelsnamen
- **Adhesiestatus**: Nalevingsinformatie ten aanzien van de TSL-dataspacestandaarden
- **Rollen**: Dataprovider, dataconsumer, logistieke dienstverlener, etc.
- **Aanvullende eigenschappen**: Contactgegevens, certificaten en aangeboden logistieke diensten
- **Overeenkomsten**: Raamovereenkomsten, nalevingsverificatie, contractbeheer
- **Sectoren**: Specifieke logistieke sectoren (vracht, maritiem, binnenvaart, etc.)

### **Autorisatieregister**
Beheert toegangscontrole voor gevoelige logistieke data:

- **Policybeheer**: Aanmaken en handhaven van datauitwisselingsbeleid
- **Toegangsbeheer**: Fijnmazige rechten voor logistieke databronnen
- **Delegatiebewijs**: Ondertekend bewijs van autorisatie voor auditdoeleinden
- **Realtime verificatie**: Directe rechtenchecks voor logistieke operaties

## API-mogelijkheden

### **Autorisatiebeheer**
```
POST /v1/api/authorization/unsigned-delegation     # Gedelegeerde toegang testen
GET  /v1/api/authorization/explained-enforce       # Gedetailleerde toegangsbeslissingen
GET  /v1/api/authorization/enforce                 # Realtime rechtenchecks
```

## Authenticatie & Beveiliging

TSL gebruikt **Keycloak** voor identiteits- en toegangsbeheer.

### **API-toegang aanvragen**

1. Registreer je applicatie in het [TSL Self-Service Portal](https://tsl.poort8.nl/portal) — je ontvangt direct een `client_id` en `client_secret`.
2. Blader door de catalogus en vraag toegang aan tot de **NoodleBar API**.
3. Zodra je toegangsverzoek is goedgekeurd, kan je applicatie access tokens ophalen voor de TSL API.

### **OAuth 2.0 Client Credentials Flow**

```http
POST https://auth.poort8.nl/realms/tsl/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=<YOUR_CLIENT_ID>
&client_secret=<YOUR_CLIENT_SECRET>
&scope=noodlebar-api
```

## Voordelen voor de logistieke sector

### **Verbeterde zichtbaarheid in de supply chain**
- Realtime track-and-trace mogelijkheden binnen logistieke netwerken
- End-to-end transparantie in de keten voor alle betrokkenen
- Verbeterd vracht- en wagenparkbeheer door gedeelde data

### **Operationele efficiëntie**
- Minder handmatige gegevensinvoer en -verwerking tussen logistieke partners
- Geautomatiseerde informatie-uitwisseling conform industriestandaarden
- Geoptimaliseerde routering en planning door collaboratief datagebruik

### **Wet- en regelgeving & Compliance**
- Gestandaardiseerde dataformaten en -protocollen voor logistieke rapportage
- Uitgebreide audittrails voor naleving van wet- en regelgeving
- Veilige verwerking van gevoelige logistieke en vrachtdata

### **Gezamenlijk datagebruik**
- Veilige gegevensuitwisseling tussen logistieke dienstverleners
- Integratiemogelijkheden met havencommunitysystemen
- Connectiviteit met douane- en regelgevingsplatforms

## Integratie met bestaande systemen

TSL is ontworpen om naadloos aan te sluiten op bestaande logistieke platforms:

- **TMS (Transportation Management Systems)**: Routeoptimalisatie en wagenparkbeheer
- **WMS (Warehouse Management Systems)**: Voorraadbeheer en fulfilment
- **Havencommunitysystemen**: Maritieme vrachtafhandeling en documentatie
- **Douane- en regelgevingsplatforms**: Nalevingsrapportage en inklaring
- **Supply chain-platforms**: End-to-end zichtbaarheid en coördinatie

## Architectuur

TSL maakt gebruik van NoodleBar's bewezen modulaire componenten, specifiek geconfigureerd voor de logistieke sector:

- **Participantenregister**: Beheer van deelnemers in de logistieke sector en hun capaciteiten
- **Autorisatieregister**: Toegangsbeheer voor gevoelige logistieke en vrachtdata
- **Datakoppelings-API's**: Gestandaardiseerde interfaces voor logistieke dataprotocollen
- **Complianceframework**: Naleving van regelgeving en standaarden in de logistieke sector

## Betrokkenen

- **Transportbedrijven**: Vrachtvervoeders en logistieke dienstverleners
- **Expediteurs**: Intermediairs die multimodale logistieke operaties coördineren
- **Havens en terminals**: Infrastructuurbeheerders die vrachtstromen en documentatie afhandelen
- **Ketenpartners**: Fabrikanten, distributeurs, retailers en eindklanten
- **Toezichthoudende instanties**: Autoriteiten die toezicht houden op logistieke naleving en douane
- **Technologieleveranciers**: Softwareleveranciers voor het logistieke ecosysteem

## Kernthema's

- **Gegevensuitwisseling in de supply chain**: Veilig delen van logistieke data in de gehele keten
- **Transportbeheer**: Realtime datadeling voor transportoptimalisatie en -coördinatie
- **Haven- en terminalintegratie**: Naadloze gegevensuitwisseling met maritieme en binnenhavensystemen
- **Compliance en traceerbaarheid**: Voldoen aan regelgevingsvereisten voor logistieke en vrachtdata

## Aan de slag

1. **Organisatieregistratie**: Registreer je organisatie in de TSL-dataspace
2. **Authenticatie instellen**: Registreer je app in het self-serviceportal en vraag toegang aan tot de `noodlebar-api` audience om Keycloak-clientcredentials te verkrijgen
3. **Policyconfiguratie**: Definieer policies voor gegevensuitwisseling met je logistieke partners
4. **Integratie**: Koppel je bestaande logistieke systemen via gestandaardiseerde API's
5. **Live gaan**: Begin met veilig gegevens uitwisselen binnen het TSL-logistieke ecosysteem

Voor algemene NoodleBar-concepten en implementatieopties, raadpleeg de [NoodleBar Docs](../noodlebar/) documentatie.

Voor andere use case-implementaties:
- [GIR-instantie](../gir/) — Gebouw Installatie Registratie

---

*TSL vertegenwoordigt Poort8's toewijding aan het transformeren van gegevensuitwisseling in de logistieke sector door middel van veilige, gestandaardiseerde dataspacetechnologie, aangedreven door bewezen NoodleBar-infrastructuur.*

### 1.7 Context en doelstelling

Dit project valt onder de Basis Data Infrastructuur (BDI), die momenteel nog in ontwikkeling is. Het doel is het faciliteren van dataspaces die bepaalde principes volgen, als initieel platform voor dataproviders, apps en dataconsumers.

### 1.8 Rollen

- **Dataproviders**: Organisaties die een databron met ruwe data of een app met verwerkte data aanbieden. In alle gevallen worden de toegangsvoorwaarden bepaald door de data-eigenaar.
- **App-providers**: Organisaties die optreden als tussenpersoon en waarde toevoegen aan ruwe data. Ze treden op als dataconsumer namens hun eindgebruikers en als dataprovider voor hun eindgebruikers.
- **Dataconsumers**: Organisaties die data gebruiken via serviceproviders of rechtstreeks.
- **Dataspace-initiatiefnemers**: Organisaties die de dataspace opzetten en beheren.

### 1.9 Principes

- **Datasoevereiniteit**: Data-eigenaren (issuers) kunnen toegang tot hun data verlenen, ook via gefedereerde apps.
- **Datalokalisatie**: Data blijft bij de bron, tenzij caching of staging noodzakelijk is.
- **Identiteitsflexibiliteit**: Dataconsumers kiezen hun eigen identiteitsproviders.

### 1.10 Klantreizen

De wiki beschrijft de volgende klantreizen in detail:

- **Dataspace-kern initiëren**
- **Databronnen onboarden**
- **Data-eigenaren en -consumers onboarden**
- **Databronnen zelfstandig maken**
- **Providers en apps toevoegen**

De eerste drie reizen omvatten de lancering van een eerste (prototype)dataspace. Reizen 4 en 5 stellen databronnen en serviceproviders in staat om zelfstandige bijdragers aan de dataspace te worden.
