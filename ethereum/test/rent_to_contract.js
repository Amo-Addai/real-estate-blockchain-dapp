const structToArray = require('./helpers').structToArray;
const structEqual = require('./helpers').structEqual;
const bigNumberEqual = require('./helpers').bigNumberEqual;
const expectThrowMessage = require('./helpers').expectThrowMessage;
const RTC = artifacts.require("RentToContract");
const web3 = require('web3');
const util = require('util');
const web3utils = require('web3-utils');

const revertErrorMsg = 'VM Exception while processing transaction: revert';


contract('RentToContract', async ([owner]) => {
    // A NEW INSTANCE OF THE SMART CONTRACT IS CREATED FOR ALL TESTING SCENARIOS
    // eg.  instance = await RTC.new(...)
        
    //
    //  TESTING CREATION OF SMART CONTRACT & BASIC FUNCTIONALITIES (RENT SETUP)
    // 

    contract('Rent Setup/contract creation', async ([deployerAddress]) => {

        let instance;
        
        before(async () => { // INSTANTIATE THE SMART CONTRACT WITH THESE INITIAL ARGUMENTS
            instance = await RTC.new('cassian@reply.xd', 'Cassian', 'Waker', 100, 1000000000000);
        });

        it('should deploy a contract instance', async () => {
            assert.isOk(instance.address); // CONFIRMS THE SMART CONTRACT'S EXISTENCE
        });

        it('should instantiate the tenant property', async () => {
            let tenant = await instance.getTenant.call();
            assert.equal(tenant, 'Cassian'); // GET tenant STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the landlord property', async () => {
            let landlord = await instance.getLandlord.call();
            assert.equal(landlord, 'Waker'); // GET landlord STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the totalRentPaid property', async () => {
            let totalRentPaid = await instance.getTotalRentPaid.call();
            assert.equal(totalRentPaid, 100); // GET totalRentPaid STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
        });

        it('should instantiate the numberOfPayments property', async () => {
            let numberOfPayments = await instance.getNumberOfPayments.call();
            assert.equal(numberOfPayments, 1); // GET numberOfPayments & CONFIRM THAT I'S 1 (SINCE IT'S ONLY 1 RENT PAYMENT FOR NOW)
        });

        it('should instantiate the rent', async () => { // GET rent OBJECT & CONFIRM THAT IT HAS SAME PROPERTY VALUES OF THE ARGUMENTS PASSED IN
            let rent = await instance.getRent.call(); // returns an array which represents an rent struct
            // returned data (rentSetup.landlordName, rentSetup.tenantName, rentSetup.firstPaymentDate, rentSetup.rentExpirationDate);
            assert.equal(rent[0], 'Waker');
            assert.equal(rent[1], 'Cassian');
            // FIGURE OUT HOW TO VERIFY .firstPaymentDate & .rentExpirationDate LATER
        });

        it('should set the owner property to the address that was used for deployment', async () => {
            let contractOwner = await instance.getOwner.call();
            assert.equal(deployerAddress, contractOwner); // ENSURES THAT THE OWNER OF THE PROPERTY (ie. SMART CONTRACT) IS THE DEPLOYER ADDRESS
        });
    });
        
    //
    //  TESTING RENT PAYMENT FUNCTIONALITIES OF SMART CONTRACT 
    // 

    contract('Rent Payment contract flow', async () => {

        describe('Collecting the monthly rents', async () => {

            let instance;

            //  INITIATE BY SUCCESSFULLY GOING THROUGH THE FULL rent-OFFER-AGREEMENT-DRAFT-SIGNATURE PROCESS
            beforeEach('create an rent setup, send the next monthly rent', async () => {
                instance = await RTC.new('cassian@reply.xd', 'Cassian', 'Waker', 100, 1000000000000);
                // INSTANTIATION OF THIS CONTRACT GOES WITH THE 1ST RENT PAYMENT - 100
                await instance.receiveMonthlyRent('cassian@reply.xd', 100);
            });

            it('should have received the correct number of monthly rent payments', async () => {
                let numberOfPayments = await instance.getNumberOfPayments.call();
                assert.equal(numberOfPayments, 2); // ENSURE THAT THERE ARE 2 RENT PAYMENTS NOW        
            });

            it('should have received the correct total amount of monthly rent payments', async () => {
                let totalRentPaid = await instance.getTotalRentPaid.call();
                assert.equal(totalRentPaid, 200); // TOTAL RENT PAID NOW MUST BE 200
            });
                
            // CONTINUE TO VERIFY OTHER STUFF 
            // eg. AN EVENT IS EMITTED, FIND OUT HOW TO TEST FOR THAT TOO
    
        });
    });
    
    //
    //  TESTING SECURITY FUNCTIONALITIES OF SMART CONTRACT 
    // 

    contract('Security', async ([fstAccount, sndAccount]) => {

        let instance;

        beforeEach('create an rent setup', async () => {
            instance = await RTC.new('cassian@reply.xd', 'Cassian', 'Waker', 100, 1000000000000);
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

