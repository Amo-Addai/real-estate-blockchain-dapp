# Real Estate Blockchain Decentralized Application

Proof of Concept Project; a real-estate property enlistment decentalized application integrated with the Ethereum Blockchain, using Ethereum Smart Contracts written in Solidity.

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
We use [Sequelize](http://docs.sequelizejs.com/) for database manipulation.
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

NOTE: we use next mnemonic for development purposes, some configs are predefined.
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
