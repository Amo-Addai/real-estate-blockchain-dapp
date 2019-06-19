# SECURITY MEASURES
Smart contracts are “immutable”. Once they are deployed, their code is impossible to change, making it impossible to fix any discovered bugs. In a potential future where whole organizations are governed by smart contract code, there is an immense need for proper security. Past hacks such as TheDAO or this year’s Parity hacks (July, November) have raised developers’ awareness, but we still have a long way to go.


In this document we will go through some of the famous security pitfalls and the measures or design patterns taken within the project to mitigate them.


## Integer Overflow and Underflow Vulnerability
An overflow/underflow happens when an arithmetic operation reach the maximum or minimum size of the type. For example if you store your number in the uint256  type, it means your number will be stored in a 256 bits unsigned number ranging from 0 to 2^256. In computer programming, an integer overflow occurs when an arithmetic operation attempts to create a numeric value that is outside of the range that can be represented with a given number of bits – either larger than the maximum or lower than the minimum representable value.


#### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Integer Overflow and Underflow* security threat is combated within the **RentToContract.sol** Smart Contract. The overflow risk is mitigated with the use of the **SafeMath.sol** library (specifically, its *add()* function), where all mathematical calculations are performed with the aim of preventing any integer overflow/underflow vulnerabilities from springing up.


## Access Control / Restriction Design-Pattern
As described in the **design_pattern_decisions.md** file, some functions and variables within the *RentToContract.sol* have been made private, to prevent access to them from external contracts. Also, the implementation of **owner** and **admins** access-control pattern helps prevent unwanted access to the smart contract unauthorized by parties.


## Withdrawal / Pull over Push Payments Design-Pattern
As described in the *Conclusion* of the **design_pattern_decisions.md** file, the *Withdrawal* design pattern, although not implemented yet, has a very good potential of being included during expansion of the project as it will play a major role in guarding against many security vulnerabilities such as **Re-entrancy / cross function re-entrancy** and **Denial of Service** vulnerabilities. These vulnerabilities are further explained below:

### Re-entrancy
Reentrancy attacks can be problematic because calling external contracts passes control flow to them. The called contract may end up calling the smart contract function again in a recursive manner. 
```
mapping (address => uint) private userBalances;

function withdrawBalance() public {
    uint amountToWithdraw = userBalances[msg.sender];
    require(msg.sender.call.value(amountToWithdraw)()); // At this point, the caller's code is executed, and can call withdrawBalance again
    userBalances[msg.sender] = 0;
}
```
Using the withdrawal design pattern to separate the contract accounting logic from the transfer logic will guard against this issue.

### Cross-function Re-entrancy
Another thing to be aware of is potential cross function re-entrancy. This can be problematic if your contract has multiple functions that modify the same state.
```
mapping (address => uint) private userBalances;

function transfer(address to, uint amount) {
    if (userBalances[msg.sender] >= amount) {
       userBalances[to] += amount;
       userBalances[msg.sender] -= amount;
    }
}

function withdrawBalance() public {
    uint amountToWithdraw = userBalances[msg.sender];
    require(msg.sender.call.value(amountToWithdraw)()); // At this point, the caller's code is executed, and can call transfer()
    userBalances[msg.sender] = 0;
}
```
In this case, the attacker calls transfer() when their code is executed on the external call in withdrawBalance. Since their balance has not yet been set to 0, they are able to transfer the tokens even though they already received the withdrawal. This vulnerability was also used in the DAO attack. It is generally a good idea to handle your internal contract state changes before calling external contracts, such as in the withdrawal design pattern, or to implement a mutual exclusion (*mutex*) between the execution of both functions involved.

### Denial of Service
Another danger of passing execution to another contract is a denial of service attack.
```
// INSECURE
contract Auction {
    address currentLeader;
    uint highestBid;

    function bid() payable {
        require(msg.value > highestBid);

        require(currentLeader.send(highestBid)); // Refund the old leader, if it fails then revert

        currentLeader = msg.sender;
        highestBid = msg.value;
    }
}
```
In the provided example, the highestBidder could be another contract and transferring funds to the contract triggers the contract’s fallback function. If the contract’s fallback always reverts, the Auction contract’s bid function becomes unusable - it will always revert. The bid function requires the transfer operation to succeed to fully execute. The contract at the provided address throws an exception, execution halts and the exception is passed into the calling contract and prevents further execution. This problem is avoidable using the withdrawal pattern.


## Forcefully Sending Ether Vulnerability
Another danger is using logic that depends on the contract balance. Be aware that it is possible to send ether to a contract without triggering its fallback function. Using the selfdestruct function on another contract and using the target contract as the recipient will force the destroyed contract’s funds to be sent to the target. It is also possible to precompute a contracts address and send ether to the address before the contract is deployed. The contract’s balance will be greater than 0 when it is finally deployed.


#### How it Works
In this **Real Estate Blockchain Decentralized Application** project, the *Forcefully Sending Ether* security threat is combated within the **RentToContract.sol** Smart Contract. This risk is mitigated by ensuring that only the **owner** address within the contract receives any ether whenever it self destructs (see `selfdestruct(address(uint160(owner)));` in *killContract()*), and the *ownerOnly* modifier that only the owner of the contract can call the *killContract()* function.
