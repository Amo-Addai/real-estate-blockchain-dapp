const structToArray = require('./helpers').structToArray;
const structEqual = require('./helpers').structEqual;
const bigNumberEqual = require('./helpers').bigNumberEqual;
const expectThrowMessage = require('./helpers').expectThrowMessage;
const RTC = artifacts.require("RentToContract");
const web3 = require('web3');
const util = require('util');
const web3utils = require('web3-utils');

const revertErrorMsg = 'VM Exception while processing transaction: revert';

/*

var SelfDestruct = artifacts.require('./SelfDestruct.sol');

module.exports = function(cb){
    var sd = null;
    return SelfDestruct.deployed().then((instance) => {
        sd = instance;
        sd.setValue("sth");
        return sd.someValue.call(); // CALL PUBLIC PROPERTY someValue
    }).then((result) => {
        console.log("RESULT -> " + result);
        return sd.killContract();
    }).then((result) => {
        console.log("SMART CONTRACT HAS BEEN DESTROYED");
        sd.setValue("SOME NEW VALUE"); // THIS CALL WILL THROW AN EXCEPTION, COZ THE SMART CONTRACT HAS BEEN DESTROYED NOW ..
    });
}

*/

contract('RentToContract', async ([owner]) => {
        
    //
    //  TESTING CREATION OF SMART CONTRACT & BASIC FUNCTIONALITIES (RENT SETUP)
    // 

    contract('Rent Setup/contract creation', async ([deployerAddress]) => {

        let contract;
        
        before(async () => { // INSTANTIATE THE SMART CONTRACT WITH THESE INITIAL ARGUMENTS
            contract = await RTC.new('cassian@reply', 'Cassian', 'Waker', 100, 1000000000000);
        });

        it('should deploy a contract instance', async () => {
            assert.isOk(contract.address); // CONFIRMS THE SMART CONTRACT'S EXISTENCE
        });

        it('should instantiate the tenant property', async () => {
            let tenant = await contract.getTenant.call();
            assert.equal(tenant, 'Cassian'); // GET tenant STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the landlord property', async () => {
            let landlord = await contract.getLandlord.call();
            assert.equal(landlord, 'Waker'); // GET landlord STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the totalRentPaid property', async () => {
            let totalRentPaid = await contract.getTotalRentPaid.call();
            assert.equal(totalRentPaid, 100); // GET totalRentPaid STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the numberOfPayments property', async () => {
            let numberOfPayments = await contract.getNumberOfPayments.call();
            assert.equal(numberOfPayments, 1); // GET numberOfPayments & CONFIRM THAT I'S 1 (SINCE IT'S ONLY 1 RENT PAYMENT FOR NOW)
        });

        it('should instantiate the rent', async () => { // GET rent OBJECT & CONFIRM THAT IT HAS SAME PROPERTY VALUES OF THE ARGUMENTS PASSED IN
            let rent = await contract.getRent.call(); // returns an array which represents an rent struct
            // returned data (rentSetup.landlordName, rentSetup.tenantName, rentSetup.firstPaymentDate, rentSetup.rentExpirationDate);
            assert.equal(rent[0], 'Waker');
            assert.equal(rent[1], 'Cassian');
            // FIGURE OUT HOW TO VERIFY .firstPaymentDate & .rentExpirationDate LATER
        });

        it('should set the owner property to the address that was used for deployment', async () => {
            let contractOwner = await contract.getOwner.call();
            assert.equal(deployerAddress, contractOwner); // ENSURES THAT THE OWNER OF THE PROPERTY (ie. SMART CONTRACT) IS THE DEPLOYER ADDRESS
        });
    });

    //
    //  TESTING SECURITY FUNCTIONALITIES OF SMART CONTRACT 
    // 

    
    contract('Security', async ([fstAccount, sndAccount]) => {

        let instance;

        beforeEach('create an enlistment, send an offer', async () => {
            contract = await RTC.new('cassian@reply', 'Cassian', 'Waker', 100, 1000000000000);
        });

        // ENSURE THAT ONLY THE OWNER'S ADDRESS (THE INSTANTIATOR) CAN ACCESS THE SMART CONTRACT eg. submit an offer
        it('should not access any other address other than the instantiator to access', async () => {
            // THE sndAccount ADDRESS ISN'T THE OWNER, THE fstAccount ADDRESS IS THE OWNER RATHER
            await expectThrowMessage(instance.getRent.call({from: sndAccount}), revertErrorMsg);
            await expectThrowMessage(instance.receiveMonthlyRent.call('cassian@reply.xd', 50, {from: sndAccount}), revertErrorMsg);
        });
    });
    

    //
    //  FEEL FREE TO ADD MORE TESTING SCENARIOS (for expansion of project) IF YOU WANT ..
    // 

});

