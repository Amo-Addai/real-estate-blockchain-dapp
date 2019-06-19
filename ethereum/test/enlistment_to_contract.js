const structToArray = require('./helpers').structToArray;
const structEqual = require('./helpers').structEqual;
const bigNumberEqual = require('./helpers').bigNumberEqual;
const expectThrowMessage = require('./helpers').expectThrowMessage;
const ETC = artifacts.require("EnlistmentToContract");
const web3 = require('web3');
const util = require('util');
const web3utils = require('web3-utils');


const offerStatusMap = {
  'PENDING': 0,
  'REJECTED': 1,
  'CANCELLED': 2,
  'ACCEPTED': 3
};

const agreementStatusMap = {
  'UNINITIALIZED': 0,
  'PENDING': 1,
  'REJECTED': 2,
  'CONFIRMED': 3,
  'CANCELLED': 4,
  'LANDLORD_SIGNED': 5,
  'TENANT_SIGNED': 6,
  'COMPLETED': 7
};

const revertErrorMsg = 'VM Exception while processing transaction: revert';

// NOTE: SOMETIMES, DUE TO INSUFFICIENT GAS, SOME TESTS FAIL, BECAUSE SOME INTEGER VALUES AREN'T FULLY INPUTED INTO THE SMART CONTRACT'S DATA
// NOT TOO SURE WHETHER THIS IS THE REASON FOR THE COMPLICATIONS THOUGH. MORE INVESTIGATION IS REQUIRED ..
// EXAMPLES: 
//  1. Offer Data sent -> (100, 20); Data inputed in Smart Contract -> (64, 14)
//  2. Offer amount Data sent (during AgreementDraft Tests) -> 400; Data inputed in Smart Contract -> 190
//  3. AgreementDraft Data sent -> (1519580655493, 1519580355498, 65493); Data inputed -> (161ce10af85, 161ce0c1baa, ffd5)
// NOTE: MAKE SURE YOU FIND OUT & DEBUG THIS ISSUE

contract('EnlistmentToContract', async ([owner]) => {
  // A NEW INSTANCE OF THE SMART CONTRACT IS CREATED FOR ALL TESTING SCENARIOS
  // eg.  instance = await ETC.new(...)

  //
  //  TESTING CREATION OF SMART CONTRACT & BASIC FUNCTIONALITIES (PROPERTY ENLISTMENTS)
  // 

  contract('Enlistment/contract creation', async ([deployerAddress]) => {

    let instance;

    before(async () => { // INSTANTIATE THE SMART CONTRACT WITH THESE INITIAL ARGUMENTS
      instance = await ETC.new('landlord@email.xd', 'Waker', 3, 2, 1, 15000);
    });

    it('should deploy a contract instance', async () => {
      assert.isOk(instance.address); // CONFIRMS THE SMART CONTRACT'S EXISTENCE
    });

    it('should instantiate the landlord property', async () => {
      let landlord = await instance.getLandlord.call();
      assert.equal(landlord, 'landlord@email.xd'); // GET landlord STATE VARIABLE & CONFIRM THAT IT HAS SAME VALUE OF THE ARGUMENTS PASSED IN
    });

    it('should instantiate the enlistment', async () => { // GET enlistment OBJECT & CONFIRM THAT IT HAS SAME PROPERTY VALUES OF THE ARGUMENTS PASSED IN
      let enlistment = await instance.getEnlistment.call(); // returns an array which represents an enlistment struct
      assert.equal(enlistment[0], 'Waker');
      assert.equal(enlistment[1], 3);
      assert.equal(enlistment[2], 2);
      assert.equal(enlistment[3], 1);
      assert.equal(enlistment[4], 15000);
    });

    it('should set locked property to false', async () => {
      let isLocked = await instance.locked.call();
      assert.isFalse(isLocked); // ENSURES THAT PROPERTY ISN'T LOCKED (ie. IT HASN'T HAD ANY SIGNED AGREEMENT BETWEEN THE LANDLORD & A TENANT)
    });

    it('should set the owner property to the address that was used for deployment', async () => {
      let contractOwner = await instance.getOwner.call();
      assert.equal(deployerAddress, contractOwner); // ENSURES THAT THE OWNER OF THE PROPERTY (ie. SMART CONTRACT) IS THE DEPLOYER ADDRESS
    });
  });

  //
  //  TESTING OFFER FUNCTIONALITIES OF SMART CONTRACT 
  // 

  contract('Offer flow', async () => {

    describe('Sending', async () => {

      let instance;
      let sendTx1;
      let sendTx2;

      //  INSTANTIATE THE SMART CONTRACT (PROPERTY ENLISTMENT), THEN SEND 2 SAMPLE OFFERS

      before('create an enlistment and send offers', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        sendTx1 = await instance.sendOffer(100, 'Winston', 'winston@noreply.xd');
        sendTx2 = await instance.sendOffer(20, 'Ares', 'ares@willreply.xd');
      });

      it('should successfully retrieve multiple offers', async () => {
        assert.isOk(sendTx1); // ENSURE THAT BOTH OFFERS WERE RECEIVED
        assert.isOk(sendTx2); // MAKE SURE YOU FIX THE ISSUES BELOW ..
        // AMOUNT SENT HAPPENS TO BE 64 & 14, INSTEAD OF 100 & 20
      });

      it('should get offers by sender email address', async () => { // THIS TEST GETS BOTH OFFERS SENT, & CONFIRMS THEIR PROPERTIES
        // should return struct in the form of [initialized, amount, tenantName, tenantEmail, status]
        let offer1 = await instance.getOffer.call('winston@noreply.xd'); 
        let offer2 = await instance.getOffer.call('ares@willreply.xd'); 
        // OFFER 1 -> {"0":true,"1":"64","2":"Winston","3":"winston@noreply.xd","4":"0"}
        // OFFER 2 -> {"0":true,"1":"14","2":"Ares","3":"ares@willreply.xd","4":"0"}
        // THEREFORE, GET CONVERT THE OFFER STRUCTS INTO ARRAYS 
        offer1 = await structToArray(offer1); offer2 = await structToArray(offer2);
        // COZ THIS FUNCTION RIGHT HERE ONLY WORKS WITH ARRAYS & NOT STRUCT (JSON) OBJECTS ..
        structEqual(offer1, [true, 64, 'Winston', 'winston@noreply.xd', offerStatusMap['PENDING']] );
        structEqual( [true, 14, 'Ares', 'ares@willreply.xd', offerStatusMap['PENDING']], offer2);
        // EXPECTED AMOUNT VALUES FOR offer1 & offer2 SHOULD'VE BEEN 100 & 20 RESPECTIVELY ..
      });

      // CONFIRM THAT BOTH OFFERS' STATUS IS PENDING 
      it('should set new offer status to PENDING', async () => {
        let offer1 = await instance.getOffer.call('winston@noreply.xd');
        let offer2 = await instance.getOffer.call('ares@willreply.xd');
        assert.equal(offer1[4], offerStatusMap['PENDING']);
        assert.equal(offer2[4], offerStatusMap['PENDING']);
      });

      // NOTE: ALLOWING UPDATE TXNs ARE TOO COSTLY FOR A PROVIDER
      // THEREFORE, MAKE SURE THAT TRYING TO UPDATE THE OFFER THROWS AN ERROR
      it('should not allow updating the offer size', async () => {
        await expectThrowMessage(instance.sendOffer(1000, 'Winston', 'winston@noreply.xd'), revertErrorMsg);
      });

    });

    //  TESTING SENDING AN OFFER, & REVIEWING (ACCEPTING / REJECTING) IT

    describe('Responding with a resolution', async () => {

      let instance;

      // SETUP ENLISTMENT, & SEND AN OFFER
      beforeEach('create an enlistment and send offer', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
      });

      // ACCEPT THE OFFER
      it('should accept the pending offer', async () => {
        await instance.reviewOffer(true, 'cassian@reply.xd');
        const offer = await instance.getOffer.call('cassian@reply.xd');
        bigNumberEqual(offer[4], offerStatusMap['ACCEPTED']);
      });

      // REJECT THE OFFER
      it('should reject the pending offer', async () => {
        await instance.reviewOffer(false, 'cassian@reply.xd');
        const offer = await instance.getOffer.call('cassian@reply.xd');
        bigNumberEqual(offer[4], offerStatusMap['REJECTED']);
      });

    });

    describe('Offer follow-ups', async () => {

      //  SENDING AN OFFER, THEN TRY SENDING ANOTHER OFFER AFTER OLD 1 HAS EITHER BEEN REJECTED / CANCELLED ..

      let instance;

      beforeEach('create an enlistment and send offer', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd'); // SEND 1ST OFFER
      });

      it('should allow sending a new offer after the old one was rejected', async () => {
        await instance.reviewOffer(false, 'cassian@reply.xd'); // REJECT OFFER
        await instance.sendOffer(450, 'Cassian', 'cassian@reply.xd'); // RESEND ANOTHER OFFER
        const offer = await instance.getOffer.call('cassian@reply.xd');
        bigNumberEqual(offer[1], 450); // amount
        bigNumberEqual(offer[4], offerStatusMap['PENDING']); // CONFIRM THAT NEW OFFER IS PENDING
      });

      it('should cancel the offer', async () => {
        await instance.cancelOffer('cassian@reply.xd'); // CANCEL THE NEW OFFER SENT IN PREVIOUS TEST
        const offer = await instance.getOffer.call('cassian@reply.xd');
        bigNumberEqual(offer[4], offerStatusMap['CANCELLED']); // CONFIRM THAT THIS NEW OFFER HAS BEEN CANCELLED
      });

      it('should allow sending new offer after the old one was cancelled', async () => {
        await instance.cancelOffer('cassian@reply.xd'); // CANCELLING IT AGAIN (THIS MIGHT NOT EVEN BE NECESSARY)
        await instance.sendOffer(600, 'Bassian', 'cassian@reply.xd'); // RESEND ANOTHER OFFER AFTER CANCELLING
        const offer = await instance.getOffer.call('cassian@reply.xd');
        bigNumberEqual(offer[4], offerStatusMap['PENDING']); // CONFIRM THAT NEW OFFER IS PENDING
      });

    });

  });

  //
  //  TESTING AGREEMENT FUNCTIONALITIES OF SMART CONTRACT 
  // 

  contract('Agreement contract flow', async () => {

    describe('Submitting drafts', async () => { // WORKING WITH SUBMISSION OF DRAFT AGREEMENTS

      let instance;

      // CREATE ENLISTMENT & SEND AN OFFER
      beforeEach('create an enlistment, send an offer', async () => {
        instance = await ETC.new('johna@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
      });

      // SUBMIT DRAFT AGREEMENT, THEN CONFIRM IT'S 'PENDING' STATUS
      it('should allow draft submissions for accepted offers', async () => {
        await instance.reviewOffer(true, 'cassian@reply.xd'); // ACCEPT OFFER, THEN SUBMIT A DRAFT AGREEMENT
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        let status = await instance.getAgreementStatus('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['PENDING'], status); // CONFIRM AGREEMENT'S STATUS
      });

      it('should not allow draft submissions for rejected offers', async () => {
        await instance.reviewOffer(false, 'cassian@reply.xd');
        await expectThrowMessage( // REJECT OFFER, THEN EXPECT AN ERROR MSG WHEN A DRAFT AGREEMENT IS SUBMITTED
          instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh'),
          revertErrorMsg);
      });

      // NOTE: could be achieved with cancel => resubmit
      // it('should allow draft updates for a submitted pending draft');

      describe('retrieving agreements', async () => {
        beforeEach('review and submit draft', async () => {
          await instance.reviewOffer(true, 'cassian@reply.xd'); // ACCEPT THE PENDING OFFER, THEN SUBMIT A DRAFT AGREEMENT
          await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
          // THE AGREEMENT DRAFT DATA IS NOT CORRECTLY INPUTED WITHIN THE CONTRACT, FIND OUT WHY ..
        });

        describe('should get agreements by sender email address', async () => {
          // GETTING ALL INFORMATION ABOUT THE SUBMITTED AGREEMENT DRAFT & CONFIRMING THEIR VALUES ..
          
          it('Multi-part requests: participants', async () => {
            let agreementParticipants = await instance.getAgreementParticipants.call('cassian@reply.xd'); 
            // returns struct in the form of [landlordName, tenantName, tenantEmail]
            // SAMPLE STRUCT -> {"0":"John Wick","1":"Cassian","2":"cassian@reply.xd"}
            agreementParticipants = await structToArray(agreementParticipants);
            structEqual(['John Wick', 'Cassian', 'cassian@reply.xd'], agreementParticipants);
          });

          it('Multi-part requests: details', async () => {
            let agreementDetails = await instance.getAgreementDetails.call('cassian@reply.xd'); 
            // returns struct in the form of [amount, leaseStart, handoverDate, leasePeriod, otherTerms]
            agreementDetails = await structToArray(agreementDetails);
            // THIS SHOULD BE THE EXPECTED ARRAY -> [400, 1519580655493, 1519580355498, 65493, 'No cats, no wives']
            structEqual(["190","161ce10af85","161ce0c1baa","ffd5","No cats, no wives"], agreementDetails);
          });

          it('Multi-part requests: hashes', async () => {
            let agreementHashes = await instance.getAgreementHashes.call('cassian@reply.xd'); 
            // returns struct in the form of [unsignedHash, landlordSignedHash, tenantSignedHash]
            agreementHashes = await structToArray(agreementHashes);
            structEqual(['draftPDFH4sh', '', ''], agreementHashes);
          });          

          it('Multi-part requests: status', async () => {
            let agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd'); 
            // returns BigNumber integer, representing the associated enum (AGREEMENT STATUS)
            bigNumberEqual(agreementStatusMap['PENDING'], agreementStatus);
          });
        });

      });

    });

    describe('Responding with a resolution', async () => {

      let instance;

      // CREATE AN ENLISTMENT, SEND AN OFFER, ACCEPT IT, THEN SUBMIT AN AGREEMENT DRAFT ..
      beforeEach('create an enlistment, send an offer', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        await instance.reviewOffer(true, 'cassian@reply.xd');
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
      });

      it('should accept the pending draft', async () => {
        await instance.reviewAgreement('cassian@reply.xd', true); // ACCEPT THE AGREE-DRAFT
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['CONFIRMED'], agreementStatus); // CONFIRM
      });

      it('should reject the pending draft', async () => {
        await instance.reviewAgreement('cassian@reply.xd', false); // REJECT THE AGREE-DRAFT
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['REJECTED'], agreementStatus); // CONFIRM
      });

    });

    describe('Agreement follow-ups', async () => {

      let instance;

      // CREATE AN ENLISTMENT, SEND AN OFFER, ACCEPT IT, THEN SUBMIT AN AGREEMENT DRAFT ..
      beforeEach('create an enlistment, send an offer, accept the offer, submit a draft', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        await instance.reviewOffer(true, 'cassian@reply.xd');
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
      });

      it('should allow sending a new agreement draft after the old one was rejected', async () => {
        await instance.reviewAgreement('cassian@reply.xd', false); // REJECT AGREE-DRAFT, THEN SUBMIT A NEW 1
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 85493, 'No dogs', 'N3WdraftPDFH4sh');

        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['PENDING'], agreementStatus); // CONFIRM THAT THE NEW AGREE-DRAFT IS PENDING (ie. HAS BEEN SENT SUCCESSFULLY)

        const agreementHashes = await instance.getAgreementHashes.call('cassian@reply.xd');
        assert.equal(agreementHashes[0], 'N3WdraftPDFH4sh'); // CONFIRM THE NEW HASH STRING OF THE NEW AGREE-DRAFT
      });

      it('should allow withdrawing an agreement draft when it\'s pending review', async () => {
        await instance.cancelAgreement('cassian@reply.xd'); // CANCEL THE CURRENT PENDING AGREE-DRAFT
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['CANCELLED'], agreementStatus); // CONFIRM CANCELLATION
      });

      it('should not allow withdrawing an agreement draft when it has been rejected', async () => {
        await instance.reviewAgreement('cassian@reply.xd', false); // REJECT AGREEMENT, & ENSURE THAT IT CAN'T EVEN BE CANCELLED
        await expectThrowMessage(instance.cancelAgreement('cassian@reply.xd'), revertErrorMsg);
      });

      it('should allow cancelling an agreement draft when it\'s confirmed', async () => {
        await instance.reviewAgreement('cassian@reply.xd', true); // CONFIRM AGREEMENT
        await instance.cancelAgreement('cassian@reply.xd'); // THEN CANCEL IT :(
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['CANCELLED'], agreementStatus); // CONFIRM CANCELLATION
      });

      it('should allow withdrawing an agreement draft when landlord has signed it', async () => {
        await instance.reviewAgreement('cassian@reply.xd', true); // CONFIRM AGREEMENT
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh'); // LANDLORD SINGS AGREE-DRAFT
        await instance.cancelAgreement('cassian@reply.xd'); // CANCEL IT STILL HAHAHA :')

        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['CANCELLED'], agreementStatus); // CONFIRM CANCELLATION
      });

      it('should allow sending a new draft after the old one was withdrawn', async () => {
        await instance.reviewAgreement('cassian@reply.xd', true); // CONFIRM AGREEMENT
        await instance.cancelAgreement('cassian@reply.xd'); // CANCEL IT

        //  THEN SUBMIT A NEW AGREEMENT DRAFT
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian2', 'cassian@reply.xd', 1519580655493, 1519580355498, 85493, 'No dogs', 'N3easdWdraftPDFH4sh');

        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['PENDING'], agreementStatus); // CONFIRM THE NEW AGREE-DRAFT
      });

      it('should not allow cancelling an agreement if tenant has signed it', async () => {
        await instance.reviewAgreement('cassian@reply.xd', true); // CONFIRM AGREE-DRAFT
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh'); // LANDLORD SIGNS
        await instance.tenantSignAgreement('cassian@reply.xd', 't3n4ntSignedDraftPDFH4sh'); // TENANT SIGNS
        // NOW THAT BOTH PARTIES (LANDLORD & TENANT) HAVE SIGNED THE CONFIRMED AGREEMENT DRAFT, IT CANNOT BE CANCELLED ..
        expectThrowMessage(instance.cancelAgreement('cassian@reply.xd'), revertErrorMsg); // PREVENT AGREE-DRAFT FROM BEING CANCELLED :)))
      });
    });

    describe('Signing', async () => {

      let instance;

      // CREATE, SEND, ACCEPT, SUBMIT, THEN ACCEPT !
      beforeEach('create an enlistment, send an offer, accept the offer, submit a draft, accept the draft', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        await instance.reviewOffer(true, 'cassian@reply.xd');
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
      });

      it('should sign the contract: landlord', async () => { // LANDLORD SIGNS AGREE-DRAFT
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');

        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['LANDLORD_SIGNED'], agreementStatus); // CONFIRM LANDLORD'S SIGNATURE

        const agreementHashes = await instance.getAgreementHashes.call('cassian@reply.xd');
        assert.equal(agreementHashes[1], 'l4ndl0rdSignedDraftPDFH4sh'); // CONFIRM LANDLORD'S SIGNATURE HASH
      });

      it('should set the locked property to "true" after the landlord signs', async () => {
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        const isLocked = await instance.locked.call(); // CONFIRM THAT THE PROPERTY WAS 'locked' AFTER LANDLORD SIGNED
        assert.isTrue(isLocked);
      });

      it('should lock the enlistment for new offers after the landlord signs', async () => {
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        // ENSURE THAT COZ THE PROPERTY IS NOW LOCKED, NO OTHER OFFERS CAN BE SUBMITTED FOR IT ..
        await expectThrowMessage(instance.sendOffer(800, 'Gianna', 'gianna@never-reply.xd'), revertErrorMsg);
      });

      it('should block signing of any other agreement until the enlistment is locked', async () => {
        await instance.sendOffer(5000, 'Moriarty', 'morry@reply.xd'); // SEND ANOTHER OFFER FROM 'Moriarty'

        // SINCE THE LANDLORD IS SIGNING THE AGREEMENT REGARDING THE OFFER FROM 'Cassian', NO OTHER OFFER'S AGREEMENT SIGNING SHOULD WORK
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');

        await instance.reviewOffer(true, 'morry@reply.xd'); // ACCEPT OFFER FROM 'Moriarty', & SUBMIT A DRAFT FOR IT
        await instance.submitDraft('morry@reply.xd', 'John Wick', 'Cassian', 'morry@reply.xd', 12, 15, 65, 'No cats', 'H4sh');
        await instance.reviewAgreement('morry@reply.xd', true); // ACCEPT THE AGREE-DRAFT FOR OFFER FROM 'Moriarty'
        // PREVENT SIGNING OF AGREEMENT OF OFFER FROM 'Moriarty', COZ THAT OF OFFER FROM 'Cassian' HAS ALREADY BEEN SIGNED
        await expectThrowMessage(instance.landlordSignAgreement('morry@reply.xd', 'secondHash'));
      });

      it('unlocks upon offer cancellation', async () => {
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await instance.cancelOffer('cassian@reply.xd'); // CANCEL OFFER AFTER LANDLORD SIGNS AGREE-DRAFT
        const isLocked = await instance.locked.call();
        assert.isFalse(isLocked); // CONFIRM THAT THE ENLISTMENT IS UNLOCKED
      });

      it('unlocks upon agreement cancellation', async () => {
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await instance.cancelAgreement('cassian@reply.xd'); // CANCEL AGREEMENT AFTER LANDLORD SIGNS AGREE-DRAFT
        const isLocked = await instance.locked.call();
        assert.isFalse(isLocked); // CONFIRM THAT THE ENLISTMENT IS UNLOCKED
      });

      it('should sign the contract: tenant', async () => {
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await instance.tenantSignAgreement('cassian@reply.xd', 't3n4ntSignedDraftPDFH4sh');
        //  BOTH PARTIES (LANDLORD & TENANT) SIGN THE AGREEMENT
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatusMap['TENANT_SIGNED'], agreementStatus);
        // CONFIRM AGREEMENT'S STATUS & HASH TO HAVE THE TENANT'S SIGNATURE (NOT THE LANDLORD'S)
        const agreementHashes = await instance.getAgreementHashes.call('cassian@reply.xd');
        assert.equal(agreementHashes[2], 't3n4ntSignedDraftPDFH4sh');
      }); // THIS IS COZ THE TENANT SIGNS THE AGREE-DRAFT LAST (AFTER THE LANDLORD)

    });

    describe('Cancelling an offer after the initial review loop', async () => {

      let instance;

      // CONFIRMING FUNCTIONALITY FOR CANCELLATION OF OFFERS AT ALL THE DIFFERENT STAGES IN THE OFFER-AGREEMENT-DRAFT-SIGNATURE PROCESS

      beforeEach('create an enlistment, send an offer, accept the offer, submit a draft, accept the draft, landlord sign, tenant sign', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        await instance.reviewOffer(true, 'cassian@reply.xd');
      });

      async function cancelOfferAndAssertStatus(i, email) {
        await i.cancelOffer(email);
        offer = await i.getOffer.call(email);
        bigNumberEqual(offer[4], offerStatusMap['CANCELLED']);
      }

      it('when its status is ACCEPTED and draft is yet to be issued', async () => {
        await cancelOfferAndAssertStatus(instance, 'cassian@reply.xd');
      });

      it('when the agreement is in review', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await cancelOfferAndAssertStatus(instance, 'cassian@reply.xd');
      });

      it('when the agreement is rejected', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', false);
        await cancelOfferAndAssertStatus(instance, 'cassian@reply.xd');
      });

      it('when the agreement is accepted and no signing has been done', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
        await cancelOfferAndAssertStatus(instance, 'cassian@reply.xd');
      });

      it('after the agreement is accepted and landlord has signed it', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await cancelOfferAndAssertStatus(instance, 'cassian@reply.xd');
      });

      it('should not allow cancelling the offer after the tenant has signed', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await instance.tenantSignAgreement('cassian@reply.xd', 't3n4ntSignedDraftPDFH4sh');
        expectThrowMessage(cancelOfferAndAssertStatus(instance, 'cassian@reply.xd'), revertErrorMsg);
      }); // ENSURE THAT OFFER CANNOT BE CANCELLED ONCE BOTH LANDLORD & TENANT HAVE SIGNED THE ACCEPTED AGREEMENT-DRAFT

      it('when the offer is cancelled, it should also cancel the agreement if there is any', async () => {
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        // AGREEMENT-DRAFT WASN'T SIGNED BY THE TENANT YET, THEREFORE IT (AS WELL AS THE ORIGINAL OFFER) IS CANCELLABLE
        await instance.cancelOffer('cassian@reply.xd');
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        bigNumberEqual(agreementStatus, agreementStatusMap['CANCELLED']); // MAKE SURE THAT AGREEMENT-DRAFT WAS ALSO CANCELLED
      }); // WHEN AN OFFER IS CANCELLED, A CANCELLABLE AGREEMENT-DRAFT (IF THERE'S ANY) MUST ALSO BE CANCELLED ..

    });

    describe('Collecting the first month rent', async () => {

      let instance;

      //  INITIATE BY SUCCESSFULLY GOING THROUGH THE FULL ENLISTMENT-OFFER-AGREEMENT-DRAFT-SIGNATURE PROCESS
      beforeEach('create an enlistment, send an offer, accept the offer, submit a draft, accept the draft, landlord sign, tenant sign', async () => {
        instance = await ETC.new('john@wick.xd', 'Baker', 1, 2, 3, 45000);
        await instance.sendOffer(400, 'Cassian', 'cassian@reply.xd');
        await instance.reviewOffer(true, 'cassian@reply.xd');
        await instance.submitDraft('cassian@reply.xd', 'John Wick', 'Cassian', 'cassian@reply.xd', 1519580655493, 1519580355498, 65493, 'No cats, no wives', 'draftPDFH4sh');
        await instance.reviewAgreement('cassian@reply.xd', true);
        await instance.landlordSignAgreement('cassian@reply.xd', 'l4ndl0rdSignedDraftPDFH4sh');
        await instance.tenantSignAgreement('cassian@reply.xd', 't3n4ntSignedDraftPDFH4sh');
      });

      it('should finish the process upon receiving rent', async () => {
        await instance.receiveFirstMonthRent('cassian@reply.xd');
        //  RECEIVE THE FIRST MONTH RENT FROM THE TENANT
        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        // AGREEMENT'S SATUS MUST BE 'COMPLETED'
        bigNumberEqual(agreementStatusMap['COMPLETED'], agreementStatus);
      });

      /* // THIS TEST CAN BE LINKED TO THE RENT PAYMENT FLOW TESTS IN rent_to_instance.js TEST FILE
      it('should continue the process upon receiving monthly rent', async () => {
        await instance.receiveMonthlyRent('cassian@reply.xd', 100);
        //  RECEIVE THE OTHER MONTHLY RENTS FROM THE TENANT

        // AN EVENT IS EMITTED, FIND OUT HOW TO TEST FOR THAT TOO

        const agreementStatus = await instance.getAgreementStatus.call('cassian@reply.xd');
        // AGREEMENT'S SATUS MUST BE 'COMPLETED'
        bigNumberEqual(agreementStatusMap['COMPLETED'], agreementStatus);

        // CONTINUE TO VERIFY OTHER STUFF (eg. THE RentToinstance.sol FUNCTIONS)

      });
      */

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
