const structToArray = require('./helpers').structToArray;
const structEqual = require('./helpers').structEqual;
const bigNumberEqual = require('./helpers').bigNumberEqual;
const expectThrowMessage = require('./helpers').expectThrowMessage;
const ETC = artifacts.require("RentToContract");
const web3 = require('web3');
const util = require('util');
const web3utils = require('web3-utils');

const revertErrorMsg = 'VM Exception while processing transaction: revert';

contract('RentToContract', async ([owner]) => {
    // AT LEASE 5 TESTS !!!!!
});


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
