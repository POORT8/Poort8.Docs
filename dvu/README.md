# DVU - Intro

Welkom bij de DVU (Datastelsel Verduurzaming Utiliteit) documentatie. Deze documentatie helpt je bij het integreren met DVU om gecontroleerde toegang te krijgen tot energiedata voor verduurzamingsdoeleinden.

## Voor wie is deze documentatie?

Deze documentatie is bedoeld voor:
- **Developers** die DVU integreren in hun applicatie → Start met [Getting Started](getting-started.md)
- **Architecten** die de technische werking willen begrijpen → Lees [Overzicht & Kernconcepten](overview.md)
- **Product owners** die de mogelijkheden willen verkennen → Lees [Dataproducten](data-products.md)
- **Gebouweigenaren** die willen weten hoe toegangsbeheer werkt → Lees [Toegangsmodel](access-model.md)

## Documentatie-overzicht

### Beginnen

**[Getting Started](getting-started.md)** - *DVU integratie*
- Van nul naar je eerste API call
- Credentials aanvragen en configureren
- Je eerste approval link maken
- Volledige flow begrijpen
- **→ Nieuw bij DVU? Start hier!**

**[Overzicht & Kernconcepten](overview.md)** - *Achtergrond & context*
- Wat lost DVU op?
- Hoe werkt het toegangsproces?
- Welke dataproducten zijn beschikbaar?
- Wat heb je nodig voor integratie?

**[Woordenlijst](glossary.md)** - *Begrippen opzoeken*
- Definities van 40+ termen (VBO, EAN, P4, CAR, etc.)
- Uitleg van authenticatie (iSHARE, EORI, eHerkenning)
- Snelle referentietabel met afkortingen

**[Veelgestelde Vragen (FAQ)](faq.md)** - *Snelle antwoorden*
- 30+ veelgestelde vragen en antwoorden
- Onderwerpen: authenticatie, implementatie, data-toegang, troubleshooting
- Praktische voorbeelden

### Kernconcepten

**[Toegangsmodel](access-model.md)**
- Uitleg van Variant 1 (Self-service) vs Variant 2 (Externe aanvraag)
- Segmentatie: kleinverbruik vs grootverbruik
- Automatische vs handmatige toestemming
- Procesflow met visuele diagrammen

**[Dataproducten](data-products.md)**
- Overzicht van beschikbare dataproducten
- P4-meterdata, RVO-benchmark, dagstanden
- Keuze tussen producten voor jouw use case

### Implementatiegidsen

> **Let op:** Deze gidsen zijn voor **Variant 2** (externe aanvraag via dataservice consumer).
> Voor **Variant 1** (self-service) verloopt het proces via de DVU-applicatie zelf.

**[Single Building Access](single-building.md)**
- Toegang aanvragen voor één gebouw via VBO-ID
- Stap-voor-stap technische implementatie
- Sequence-diagrammen en API-voorbeelden

**[Bulk Building Access](bulk-buildings.md)**
- Toegang aanvragen voor meerdere gebouwen tegelijk
- Batch-verwerking van VBO-ID's
- Efficiënte implementatie voor portfolios

**[Direct EAN Access](direct-ean.md)**
- Directe toegang via EAN-codes
- Wanneer te gebruiken vs VBO-based access
- Technische flow en API-calls

**[VBO/EAN Data Retrieval](vbo-ean-data-retrieval.md)**
- Data ophalen na verkregen toestemming
- API-endpoints en parameters
- Response-formaten

**[SDS Data Retrieval](sds-data-retrieval.md)**
- Data ophalen via Smart Data Solutions
- Endpoints voor verschillende dataproducten
- Authenticatie en error handling

### Business Context

**[Access Energy Data](access-energydata.md)**
- Business context van beide varianten
- Marktperspectief voor dataservice consumers
- Strategische overwegingen

## Aanbevolen leesroute

### Voor developers
1. **[Getting Started](getting-started.md)** - Maak je eerste API call (30 min)
2. **[Overzicht & Kernconcepten](overview.md)** - Begrijp de basis (10 min)
3. **[Woordenlijst](glossary.md)** - Leer de terminologie
4. **Kies je implementatiegids** - Afhankelijk van je use case:
   - [Single Building Access](single-building.md) - Een gebouw per keer
   - [Bulk Building Access](bulk-buildings.md) - Meerdere gebouwen tegelijk
   - [Direct EAN Access](direct-ean.md) - Direct via EAN-codes (geavanceerd)
5. **[FAQ](faq.md)** - Bij vragen tijdens implementatie

### Voor architecten
1. **[Overzicht & Kernconcepten](overview.md)** - High-level begrip
2. **[Toegangsmodel](access-model.md)** - Procesarchitectuur
3. **[Dataproducten](data-products.md)** - Mogelijkheden verkennen
4. **[Access Energy Data](access-energydata.md)** - Business context

### Voor troubleshooting
1. **[FAQ](faq.md)** - Controleer of je vraag al beantwoord is
2. **[Woordenlijst](glossary.md)** - Verifieer begrippen
3. **Relevante implementatiegids** - Controleer technische details
4. **Contact support** - Als het probleem blijft bestaan

## Extra informatie
**Intern**
- **[Keyper](../keyper/)** - Goedkeurings- en autorisatiesysteem
- **[NoodleBar](../noodlebar/)** - Aanvullende dataproducten

**Extern**
- **[DVU](https://www.rvo.nl/onderwerpen/verduurzaming-utiliteitsbouw/dvu)**
- **[iSHARE](https://ishare.eu/)**

## Tips voor effectief gebruik

- **Gebruik de woordenlijst** regelmatig tijdens het lezen van technische documentatie
- **Bookmark de FAQ** voor snelle antwoorden op veelvoorkomende vragen
- **Volg de sequence-diagrammen** stap voor stap tijdens implementatie
- **Test eerst met één gebouw** voordat je bulk-operaties uitvoert
- **Lees error messages zorgvuldig** - ze bevatten vaak bruikbare informatie

## Hulp nodig?

- **Technische vragen**: Raadpleeg eerst de [FAQ](faq.md)
- **Begrippen onduidelijk**: Zie de [Woordenlijst](glossary.md)
- **Implementatieproblemen**: Controleer de relevante implementatiegids
- **API-credentials**: Neem contact op met het Poort8-team via hello@poort8.nl
- **DVU-deelnemersregistratie**: E-mail naar BeheerDVU@rvo.nl

---

**Klaar om te beginnen?** Start met het [Overzicht & Kernconcepten](overview.md)