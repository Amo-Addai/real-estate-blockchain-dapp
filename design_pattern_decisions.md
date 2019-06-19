# DESIGN PATTERNS
A Design-Pattern, whether in software architecture or engineering, or in Blockchain or Distributed Ledger Technology, is a general repeatable solution to a commonly occurring problem in software design. A design pattern isn't a finished design that can be transformed directly into code. It is a description or template for how to solve a problem that can be used in many different situations. 
\s\s
Some of the design-patterns employed within this decentralized application project are State-Machine, Self-Destruct, Fallback Function, Circuit Breaker, Auto-Deprecate, and other design patterns. However, the ones mentioned above will be further explained as follows: 
\s\s

## State Machine Design-Pattern
Contracts often act as a state machine, where the contract has certain states in which it behaves differently and different functions can and should be called. A function call often ends a stage and moves the contract to the next stage (especially if the contract models interaction). It is also common that some stages are automatically reached at a certain point in time. The **Colony token weighted voting** protocol implements this design pattern to manage the poll state. In that protocol, Admins can only add poll options in the poll creation stage, and votes can only be submitted when the poll was active. The poll can only be resolved after the poll close time has been reached.
\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *State Machine* design-pattern is implemented within the **EnlistmentToContract.sol** Smart Contract. It works by managing 2 enumerations **OfferStatus** & **AgreementStatus**, where all *Offers* and *Agreements* initiated within the contract must pass through different stages / statuses in an acquisition deal between the landlord and a given tenant. Here marks all the different stages for:
\s **Offer Statuses**
```s
enum OfferStatus { // CURRENT STATE OF ANY OFFER SUBMITTED FOR A PROPERTY
    PENDING,
    REJECTED,
    CANCELLED,
    ACCEPTED
}
```
\s **Agreement Statuses**
```s
enum OfferStatus { // CURRENT STATE OF ANY AGREEMENT REGARDING AN OFFER
    UNINITIALIZED, // internal
    PENDING,
    REJECTED,
    CONFIRMED,
    CANCELLED,
    LANDLORD_SIGNED,
    TENANT_SIGNED,
    COMPLETED
}
```

\s\s

## Auto-Deprecate Design-Pattern
The Auto-Deprecation design pattern is a useful strategy for closing contracts that should expire after a certain amount of time. This can be useful when running alpha or beta testing for your smart contracts. Remember that using timestamps such as the now keyword are subject to manipulation by the block miners in a 30-second window.
\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Auto-Deprecation* design pattern is implemented within the **RentToContract.sol** Smart Contract. It works by setting an expiration date in the constructor when the contract is instantiated. The expiration date is stored in the variable *contractExpired* and it represents the expiration date of the Renting contract between the landlord and the tenant. Therefore, the modifiers *isNotDeprecated* and *isDeprecated* are used in the contract's functions to ensure that tenants cannot pay rent once the renting contract is expired.

\s\s

## Access Control / Restriction Design-Pattern
One cannot prevent people or computer programs from reading your contracts’ state. The state is publicly available information for anyone with access to the blockchain. However, one can restrict other contracts’ access to the state by making state variables private. Here's an example
```s
contract C1 {
 uint private internalNum;
}
```
One can also restrict function access so that only specific addresses are permitted to execute functions. This is useful for allowing only designated users, or other contracts to access administrative methods, such as changing ownership of a contract, implementing an upgrade or stopping the contract. It can be useful to restrict function access to owners, a more general admin class or to any stakeholder in the system.
\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Access Control* design pattern is implemented within the **RentToContract.sol** Smart Contract. It works in 2 ways; either setting the address of the previous Smart Contract that calls or instantiates the RentToContract.sol (in this case, it's the *EnlistmentToContract.sol* Smart Contract) as the owner, or just adding the address to an *admins* mapping, so only admin addresses can access this RentToContract.sol Smart Contract. The 2 corresponding modifiers, *ownerOnly* and *onlyAdmin* are used to verify all addresses trying to call this contract as being the owner or admins respectively.

\s\s

## Circuit Breaker Design-Pattern
Circuit Breakers are design patterns that allow contract functionality to be stopped. This would be desirable in situations where there is a live contract where a bug has been detected. Freezing the contract would be beneficial for reducing harm before a fix can be implemented. Circuit breaker contracts can be set up to permit certain functions in certain situations. For example, if you are implementing a withdrawal pattern, you might want to stop people from depositing funds into the contract if a bug has been detected, while still allowing accounts with balances to withdraw their funds.
\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Circuit Breaker* design pattern is implemented within the **RentToContract.sol** Smart Contract. It works by setting the public state variable *circuitBreakerStopped* to *true* (however, it is set to *false* by default), and using the modifiers *stopInEmergency* and *onlyInEmergency* to break the execution of the smart contract when debugging it.


In a situation such as this, you would also want to restrict access to the accounts that can modify the *circuitBreakerStopped* state variable, maybe to the contract owner (such as *EnlistmentToContract.sol*) or a set of admins, using the *Access Control / Restriction Design-Pattern*.
\s\s


\s\s

## Fallback function Design-Pattern

\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Fallback function* design pattern is implemented within the **RentToContract.sol** Smart Contract. It works by ..

    // FALLBACK FUNCTION TO RUN WHENEVER THERE'S SOME KINDA ISSUE ..
    function () external payable { // NO function name, params, or return values ..
        // THIS FALLBACK FUNCTION WILL EXECUTE IF THE CLIENT CALLS A FUNCTION
        // THAT DOESN'T EXIST IN THIS CONTRACT (i.e. funct's identifier isn't defined)
        // CONTRACTS CAN HAVE ONLY 1 FALLBACK FUNCTION
        // AUTO'LY HAS A GAS LIMIT OF 2300, 
        // MAKE FALLBACK FUNCTIONS AS CHEAP AS POSSIBLE

    }

\s\s

## Self-destruct / Mortal Design-Pattern
Implementing the mortal design pattern means including the ability to destroy the contract and remove it from the blockchain.

You can destroy a contract using the selfdestruct keyword. The function to do it is often called kill.

It takes one parameter which is the address that will receive all of the funds that the contract currently holds.

As an irreversible action, restricting access to this function is important.
\s\s
### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Self-destruct* design pattern is implemented within the **RentToContract.sol** Smart Contract. It works by ..


\s\s

