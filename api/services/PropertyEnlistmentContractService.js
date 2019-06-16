'use strict';

const Web3 = require('web3');
const contract = require('truffle-contract');
const log = require('../../server/logger');

const config = require('../../config/ethereum');
const artifact = require('../../ethereum/build/contracts/EnlistmentToContract.json');

const provider = new Web3.providers.HttpProvider(config.provider);

const PropertyEnlistmentContract = contract(artifact);
PropertyEnlistmentContract.setProvider(provider);
PropertyEnlistmentContract.defaults({
  from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57',
  gas: 6000000,
  gasPrice: 1000000000
});

const offerStatusMap = {
  0: 'PENDING',
  1: 'REJECTED',
  2: 'CANCELLED',
  3: 'ACCEPTED'
};

const agreementStatusMap = {
  0: 'UNINITIALIZED',
  1: 'PENDING',
  2: 'REJECTED',
  3: 'CONFIRMED',
  4: 'CANCELLED',
  5: 'LANDLORD_SIGNED',
  6: 'TENANT_SIGNED',
  7: 'COMPLETED'
};

module.exports = {
  createEnlistment(landlordName, streetName, floor, apartment, house, zipCode) {
    return PropertyEnlistmentContract.new(landlordName, streetName, floor, apartment, house, zipCode).then(contract => {
      log.info(`PropertyEnlistment smart contract created on address: ${contract.address}`);

      return contract.address;
    });
  },

  sendOffer(contractAddress, {amount, tenantName, tenantEmail}) {
    // https://github.com/trufflesuite/truffle-contract#usage
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.sendOffer(amount, tenantName, tenantEmail));
  },

  getOffer(contractAddress, tenantEmail) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.getOffer.call(tenantEmail))
    // TODO: convert BigNumber
      .then(([initialized, amount, tenantName, tenantEmail, status]) =>
        ({initialized, amount, tenantName, tenantEmail, status: offerStatusMap[status]}));
  },

  cancelOffer(contractAddress, tenantEmail) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.cancelOffer(tenantEmail));
  },

  reviewOffer(contractAddress, tenantEmail, approved = true) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.reviewOffer(approved, tenantEmail));
  },

  submitAgreementDraft(contractAddress, {
    tenantEmail, landlordName, agreementTenantName, agreementTenantEmail, leaseStart, handoverDate, leasePeriod, otherTerms, hash
  }) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => {
      return contract.submitDraft(
        tenantEmail,
        landlordName,
        agreementTenantName,
        agreementTenantEmail,
        leaseStart,
        handoverDate,
        leasePeriod,
        otherTerms,
        hash
      );
    });
  },

  getAgreement(contractAddress, tenantEmail) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => {
      return Promise.all([
        contract.getAgreementParticipants.call(tenantEmail),
        contract.getAgreementDetails.call(tenantEmail),
        contract.getAgreementHashes.call(tenantEmail),
        contract.getAgreementStatus.call(tenantEmail)
      ]);
    }).then(([
               [landlordName, tenantName, tenantEmail],
               [amount, leaseStart, handoverDate, leasePeriod, otherTerms], // TODO: convert BigNumber
               [hash, landlordSignatureHash, tenantSignatureHash],
               status
             ]) => {
      return {
        landlordName,
        tenantName,
        tenantEmail,
        amount,
        leaseStart,
        handoverDate,
        leasePeriod,
        otherTerms,
        hash,
        landlordSignatureHash,
        tenantSignatureHash,
        status: agreementStatusMap[status]
      };
    });
  },

  reviewAgreement(contractAddress, tenantEmail, confirmed = true) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.reviewAgreement(tenantEmail, confirmed));
  },

  landlordSignAgreement(contractAddress, tenantEmail, signatureHash) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.landlordSignAgreement(tenantEmail, signatureHash));
  },

  tenantSignAgreement(contractAddress, tenantEmail, signatureHash) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.tenantSignAgreement(tenantEmail, signatureHash));
  },

  cancelAgreement(contractAddress, tenantEmail) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.cancelAgreement(tenantEmail));
  },

  receiveFirstMonthRent(contractAddress, tenantEmail) {
    return PropertyEnlistmentContract.at(contractAddress).then(contract => contract.receiveFirstMonthRent(tenantEmail));
  }
};
