# Dataproducten

DVU geeft toegang tot energieverbruiksdata van utiliteitsgebouwen. De daadwerkelijke uitlevering verloopt via een datadienst-aanbieder zoals Smart Data Solutions (SDS), na een policy-check in het DVU Autorisatieregister.

## Beschikbaar product

DVU heeft één dataproduct: **meterdata / energieverbruiksgegevens** van utiliteitsgebouwen. De exacte inhoud en het leveringsformaat worden bepaald door de datadienst-aanbieder.

## Levering

Levering vindt plaats via een datadienst-aanbieder. Zie [Aansluiten als datadienst-aanbieder](aansluiten-datadienst-aanbieder.md) voor de enforcement-flow waarmee de aanbieder vóór elke uitlevering een policy in het DVU AR controleert.

Voor de dataservice consumer (afnemer) is alleen relevant dat:

- de juiste policy is aangemaakt via Keyper (zie [Aansluiten als dataservice consumer](aansluiten-dataservice-consumer.md));
- het verzoek aan de datadienst-aanbieder de juiste EAN bevat;
- het meegestuurde bearer token afkomstig is uit het DVU Keycloak-realm.
