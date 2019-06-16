# Real Estate Blockchain Decentralized Application

Proof of Concept Project; a real-estate property enlistment decentalized application integrated with the Ethereum Blockchain, using Ethereum Smart Contracts written in Solidity.

The DApp consists of 4 main components; the Node.js Express backend server connected to a PostgreSQL Database (with a PostGIS Extension), with the Node.js Express Server serving a basic Html/Javascript frontend Web Application, and an integration with the Ethereum Blockchain Network.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes. 
See deployment for notes on how to deploy the project on a live system.

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
Project is preconfigured to use PostgreSQL.
To connect to the database setup environmental variable **DATABASE_URL** in format:

```
DATABASE_URL = "postgres://<user>:<password>@<host>:<port>/<database_name>"
```

**IMPORTANT:** Postgres should have [POSTGIS](https://postgis.net/) extension installed.
And you should enable it in your database by running:

```sql
CREATE EXTENSION POSTGIS;
```

Database is automatically synchronized with Models definition.

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

Compile smart contracts.

```
cd ethereum/
truffle compile
```

Deploy the contracts onto your network of choice (default "development").
Check [Truffle docs](http://truffleframework.com/docs/) for details.

```
truffle migrate
```

Then run server with 

```
npm start
```

# How it Works

This sections explains all the different functionalities offered by the Decentralized Application

## Server API Documentation

It enables end-users to perform a number of actions regarding Property Enlistment. Such actions are as follows:


### Property Enlistments

Property enlistment is the core entity in the project. This API allows to create property enlistment in the database. Once created, it should be validated and either approved or rejected. Aproval triggers the deployment of Ethereum smart contract. 

#### Create enlistment
Allows to create property enlistment
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
GET http://localhost:8080/enlistments?latitude=58.37947&longitude=26.7321715&distance=3000
```


### Property Offers

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


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```


#### 
```

```



