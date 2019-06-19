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
        contract = await ETC.new('landlord@email.xd', 'Waker', 3, 2, 1, 15000);
        });

        it('should deploy a contract instance', async () => {
        assert.isOk(contract.address); // CONFIRMS THE SMART CONTRACT'S EXISTENCE
        });

        it('should instantiate the landlord property', async () => {
        let landlord = await contract.getLandlord.call();
        assert.equal(landlord, 'landlord@email.xd'); // GET landlord OBJECT & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the enlistment', async () => { // GET enlistment OBJECT & CONFIRM THAT IT HAS SAME PROPERTY VALUES OF THE ARGUMENTS PASSED IN
        let enlistment = await contract.getEnlistment.call(); // returns an array which represents an enlistment struct
        assert.equal(enlistment[0], 'Waker');
        assert.equal(enlistment[1], 3);
        assert.equal(enlistment[2], 2);
        assert.equal(enlistment[3], 1);
        assert.equal(enlistment[4], 15000);
        });

        it('should set locked property to false', async () => {
        let isLocked = await contract.locked.call();
        assert.isFalse(isLocked); // ENSURES THAT PROPERTY ISN'T LOCKED (ie. IT HASN'T HAD ANY SIGNED AGREEMENT BETWEEN THE LANDLORD & A TENANT)
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
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        });

        // ENSURE THAT ONLY THE OWNER'S ADDRESS (THE INSTANTIATOR) CAN ACCESS THE SMART CONTRACT eg. submit an offer
        it('should not access any other address other than the instantiator to access', async () => {
        // THE sndAccount ADDRESS ISN'T THE OWNER, THE fstAccount ADDRESS IS THE OWNER RATHER
        await expectThrowMessage(instance.getOffer.call('cassian@reply.xd', {from: sndAccount}), revertErrorMsg);
        await expectThrowMessage(instance.sendOffer(500, 'Spambot', 'fake@email.com', {from: sndAccount}), revertErrorMsg);
        });
    });

    //
    //  FEEL FREE TO ADD MORE TESTING SCENARIOS (for expansion of project) IF YOU WANT ..
    // 

});

