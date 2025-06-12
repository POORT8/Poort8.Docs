---
title: "HeyWim - Data Sources"
parent: "HeyWim"
nav_order: 15
layout: default
---


# HeyWim — Data Sources
*This catalogue is under construction.*
 
HeyWim currently connects to over 50 data sources for vessel and container information, including ocean carriers, deepsea terminals, and inland terminals.

Would you like to connect a specific data provider? That’s possible — we offer the flexibility to onboard new sources upon request.

Would you like to know exactly which sources we currently support, or do you have a specific data provider in mind? Please contact our team at hello@poort8.nl, and we’ll be happy to help.

## Ocean carrier sources
Underneath, you will find a list of connected carrier sources. For some carrier API's, customer action is required to retrieve data, such as making an account for the carrier API developer portal and requesting API credentials. Whilst it's possible to retrieve data without it, using the offical carrier API is recommended, as it is more efficient and reliable. It will also result in better data quality, and most of the time, more data overall.

| Carrier         | Connection type | Customer action required | Information supplied by customer  | DCSA from source | Vessel data      | Container data   | Notes                               |
| --------------- | --------------- | ------------------------ | --------------------------------- | ---------------- | ---------------- | ---------------- | ----------------------------------- |
| **Arkas**       | External source | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           | EDT available; No times, dates only |
| **CMA CGM**     | API             | ❌                       | Container number                  | ✅               | Estimated/actual | Estimated/actual |                                     |
| **COSCO**       | API             | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
| **Evergreen**   | API             | ✅                       | Container number, bill of lading¹ | ✅               | Estimated/actual | Actual           |                                     |
|                 | API             | ✅                       | Container number                  | ✅               | Not available    | Actual           |                                     |
|                 |                 | ❌                       | Container number, bill of lading¹ | ❌               | Estimated        | Actual           | No times, dates only                |
|                 |                 | ❌                       | Container number                  | ❌               | Not available    | Actual           | No times, dates only                |
| **Hapag-Lloyd** | API             | ✅                       | Container number                  | ✅               | Estimated/actual | Estimated/actual |                                     |
|                 |                 | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
| **HMM**         | API             | ❌                       | Container number, bill of lading² | ✅               | Estimated/actual | Estimated/actual |                                     |
|                 | API             | ❌                       | Container number                  | ✅               | Estimated/actual | Estimated/actual |                                     |
| **Maersk**      | API             | ✅                       | Container number, bill of lading² | ✅               | Estimated/actual | Actual           | Truck/rail ETA/ETD's available      |
|                 | API             | ✅                       | Container number                  | ✅               | Estimated/actual | Actual           | Truck/rail ETA/ETD's available      |
|                 |                 | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
| **MSC**         | API             | ❌                       | Container number, bill of lading² | ✅               | Estimated/actual | Actual           |                                     |
|                 | API             | ❌                       | Container number                  | ✅               | Estimated/actual | Actual           |                                     |
| **ONE**         | API             | ❌                       | Container number                  | ❌               | Estimated/actual | Estimated/actual |                                     |
| **OOCL**        | API             | ✅                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
|                 |                 | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
| **Yang Ming**   | API             | ✅                       | Container number                  | ✅               | Estimated/actual | Actual           |                                     |
|                 |                 | ❌                       | Container number                  | ❌               | Estimated/actual | Actual           |                                     |
| **ZIM**         | API             | ❌                       | Container number                  | ✅               | Estimated/actual | Actual           |                                     |

¹ This parameter is optional, but recommended because it results in retrieving more information.

² This parameter is optional, but will help with getting data related to your booking only.


## Deepsea terminal sources
Underneath, you will find a list of connected deepsea terminal sources.

| Deepsea terminal | Location(s)            | Connection type | Vessel data       | Container data              | Cargo opening/closing |
| ---------------- | ---------------------- | --------------- | ----------------- | --------------------------- | --------------------- |
| **APM**          | Rotterdam, Netherlands | API             | ETA/ATA, ETD/ATD  | Discharge/load, gate in/out | Yes                   |
| **CSP**          | Zeebrugge, Belgium     | API (NxtPort)   | ETA/ATA, ETD      | Not available               | Opening only          |
| **Delta2**       | Rotterdam, Netherlands | API             | ETA/ATA, ETD/ATD  | Discharge/load, gate in/out | Yes                   |
| **DP World**     | Antwerp, Belgium       | API (NxtPort)   | ETA/ATA, ETD      | Not available               | Opening only          |
| **ECT**          | Rotterdam, Netherlands | API             | ETA/ATA, ETD/ATD  | Discharge/load, gate in/out | Yes                   |
| **MPET**         | Antwerp, Belgium       | API             | ETA/ATA, ETD/ATD  | Discharge/load, gate in/out | Yes                   |
| **PSA**          | Antwerp, Belgium       | API (NxtPort)   | ETA/ATA, ETD/ATD  | Not available               | Opening only          |
| **RWG**          | Rotterdam, Netherlands | API             | ETA/ATA, ETD/ATD  | Discharge/load, gate in/out | Yes                   |

---
*Last updated: 6 June 2025*