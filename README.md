# Real Estate Blockchain Decentralized Application

Proof of Concept Project; a real-estate property enlistment decentalized application integrated with the Ethereum Blockchain, using Ethereum Smart Contracts written in Solidity.

The DApp consists of 4 main components; the Node.js Express backend server connected to a PostgreSQL Database (with a PostGIS Extension), with the Node.js Express Server serving a basic Html/Javascript frontend Web Application, and an integration with the Ethereum Blockchain Network.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes. 
See deployment for notes on how to deploy the project on a live system.


You can view the [Demo](https://www.youtube.com/watch?v=JOLwPSKo-jA) here.

### Prerequisites and Installation

You need Node.js >= 8.0.0.

Install [Truffle](http://truffleframework.com/)

```
npm install -g truffle
```

Install [Ganache](http://truffleframework.com/ganache/) or [ganache-cli](https://github.com/trufflesuite/ganache-cli) to run local Ethereum blockchain.

```
npm install -g ganache-cli
```

### Installing the DApp

Clone the repository

```
git clone https://github.com/Amo-Addai/real-estate-blockchain.git
```

Install dependencies

```
npm install
```

### Database
DApp uses [Sequelize](http://docs.sequelizejs.com/) for database manipulation.
Project is preconfigured to use PostgreSQL for storing some data that does not require decentralization.


**NOTE:** You can download [POSTGRES](https://www.postgresql.org/download/) right here.
Install PostgreSQL and set it up on localhost on port 5432, then create a new database (eg. *real_estate_database*). 
To connect to your created database, setup environmental variable **DATABASE_URL** in format:

```
DATABASE_URL = "postgres://<user>:<password>@<host>:<port>/<database_name>"

eg. DATABASE_URL = "postgres://postgres:password@localhost:5432/real_estate_database"
```

**IMPORTANT:** Postgres should have [POSTGIS](https://postgis.net/) extension installed.
And you should enable it in your database by running this SQL query:

```sql
CREATE EXTENSION POSTGIS;
```
Or, you can download and add it as an extension with the **Stack Builder** during the installation process.
Database is automatically synchronized with Model definitions.

### Run

Before starting the app start local ethereum blockchain with Ganache. 
For this either open Ganache app or run:

```
npm run start:eth
```

NOTE: Project uses next mnemonic for development purposes, some configs are predefined.
```
candy maple cake sugar pudding cream honey rich smooth crumble sweet treat
```

**NOTE:** The **Truffle** Project is in the *ethereum/* directory, where all the smart contracts and their corresponding test scripts reside.


Compile the Smart Contracts.

```
cd ethereum/
truffle compile
```

Deploy the Smart contracts onto your network of choice (default "development").
Check [Truffle docs](http://truffleframework.com/docs/) for details.

```
truffle migrate
```

Test the Smart contracts on your network of choice.
Check [Truffle docs](http://truffleframework.com/docs/) for details.

```
truffle test
```

Then run server with 

```
npm start
```

# How it Works

This sections explains all the different functionalities offered by the Decentralized Application. It enables end-users to perform a number of actions regarding Property Enlistment. The DApp has a simple easy-to-use User Interface which communicates with the Node.js Express Server through a REST API, using HTTP and JSON Data format.

## Server API Documentation

The Express Server contains a number of actions / functions packaged as handlers for incoming HTTP Requests from the DApp client. Such actions are as follows:


## Property Enlistments

Property enlistment is the core entity in the project. This API allows to create property enlistment in the database. Once created, it should be validated and either approved or rejected. Aproval triggers the deployment of Ethereum smart contract. 

#### Get all enlistments
This method allows to retreive all property enlistments available.
```
GET http://localhost:8080/enlistments?condition=***
```

#### Create enlistment
Allows to create property enlistment, but only to store it in the PostGreSQL Database.
```
POST http://localhost:8080/enlistments
```
BODY
```json
{
    "landlordName": "John Doe",
	"streetName": "Raatuse",
	"floor": 6,
	"apartment": 628,
	"house": 22,
	"zipCode": 51009,
	"latitude": 58.3817947,
	"longitude": 26.7321715
}
```

#### Approve enlistment
Approve property enlistment after manual validation. Successful aproval triggers Ethereum smart contract deployment. 
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/approve
```
BODY
```json
{}
```

#### Reject enlistment
Allows to reject the PENDING property enlistment in case of failed manual validation. Sets the status to REJECTED. rejected enlistments cannot be queried.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/reject
```
BODY
```json
{}
```

#### Geosearch
This method allows to retreive all property enlistments in a given location, where location is defined by:
- latitude
- longitude
- distance in meters
```
GET http://localhost:8080/enlistments/geolocation?latitude=58.37947&longitude=26.7321715&distance=3000
```

## Property Offers

This section of the API handles all offers for available properties that are sent to landlords by interested individuals. These offers are then reviewed (either approved or rejected) by the landlords of the corresponding properties.

#### Send offer to enlistment
When tenant is ready to make an offer, this method allows to do it, specifying tenant name, email and amount he is ready to pay.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/offers
```
BODY
```json
{
	"tenantName": "Vlad Kopylash",
	"amount": 250,
	"tenantEmail": "kopylash@ut.ee"
}
```

#### Review offer
This method allows to accept of reject the offer identified by tenantEmail.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/offers/review
```
BODY
```json
{
	"tenantEmail": "kopylash@ut.ee",
	"approved": true
}
```

#### Get offer
Returns the offer for a specific tenant identified by tenantEmail.
```
GET http://localhost:8080/enlistments/{{enlistmentId}}/offers?tenantEmail=kopylash@ut.ee
```


## Rental Agreements

Once after landlord and tenant agreed on the offer, the landlord issues a rental agreement draft and the contract negotiation starts. Eventually, both parties sign the agreement and the deal is considered closed.

#### Send agreement draft
Alows to create agreement draft.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/agreements
```
BODY
```json
{
    "tenantEmail": "kopylash@ut.ee",
	"landlordName": "Vlad Kopylash",
	"agreementTenantName": "Vlad Kopylash",
	"agreementTenantEmail": "kopylash@ut.ee",
	"leaseStart": 1526228716370,
	"handoverDate": 1526229189241,
	"leasePeriod": 6,
	"otherTerms": "not provided",
	"hash": "QmVrQUcG6XjUjtPuYRCfeKRaKZKkt8NBXYAEz4CiqczTLM"
}
```

#### Get agreement
Gets agreement created for a specific tenant identified by tenantEmail.
```
GET http://localhost:8080/enlistments/{{enlistmentId}}/agreements?tenantEmail=kopylash@ut.ee
```

#### Review agreement
This method allows to accept of reject the agreement identified by tenantEmail.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/agreements/review
```
BODY
```json
{
    "tenantEmail": "kopylash@ut.ee",
	"confirmed": true
}
```

#### Sign agreement
This method allows to sign the agreement by providing:
- signing party
- signature hash
- tenant email to identify the agreement
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/agreements/sign
```
BODY
```json
{
	"tenantEmail": "kopylash@ut.ee",
	"party": "tenant",
	"signatureHash": "Tenant0x11e"
}
```

#### Cancel agreement
Allows to cancel agreement before it was sealed with 2 signatures.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/agreements/cancel
```
BODY
```json
{
	"tenantEmail": "kopylash@ut.ee"
}
```

### First Payment received
For testing purposes only. Simulates the receiving of first month payment and sets the final status to the rental agreement.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/payments
```
BODY
```json
{
	"tenantEmail": "kopylash@ut.ee"
}
```

### Monthly Rent Payment received
For testing purposes only. Simulates the receiving of other monthly rent payment.
```
POST http://localhost:8080/enlistments/{{enlistmentId}}/monthlypayments
```
BODY
```json
{
	"tenantEmail": "kopylash@ut.ee",
	"amount": 100
}
```
