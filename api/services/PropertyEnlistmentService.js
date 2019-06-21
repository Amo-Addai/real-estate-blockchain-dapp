'use strict';

const PropertyEnlistmentContractService = require('./PropertyEnlistmentContractService');

module.exports = {
  createEnlistment(enlistment) {
    enlistment.geolocation = {
      type: 'Point',
      coordinates: [enlistment.latitude, enlistment.longitude]
    };

    return Models.PropertyEnlistment.create(enlistment);
  },

  find(condition = null) {
    return Models.PropertyEnlistment.find(condition);
  },

  findInArea(latitude, longitude, distance = 5000) {
    return Models.PropertyEnlistment.findInArea(latitude, longitude, distance);
  },

  async approveEnlistment(enlistmentId) {
    const enlistment = await Models.PropertyEnlistment.findOne({where: {id: enlistmentId}});

    enlistment.approve();

    enlistment.contractAddress = await PropertyEnlistmentContractService.createEnlistment(
      enlistment.landlordName,
      enlistment.streetName,
      enlistment.floor,
      enlistment.apartment,
      enlistment.house,
      enlistment.zipCode
    );

    return enlistment.save();
  },

  async rejectEnlistment(enlistmentId) {
    const enlistment = await Models.PropertyEnlistment.findOne({where: {id: enlistmentId}});

    enlistment.reject();

    return enlistment.save();
  },

  async sendOffer(enlistmentId, {amount, tenantName, tenantEmail}) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    if(tenantEmail){
      if(!enlistment.offerTenantEmails) enlistment.offerTenantEmails = [];
      if(!enlistment.offerTenantEmails.includes(tenantEmail))
        enlistment.offerTenantEmails.push(tenantEmail);
      Models.PropertyEnlistment.update(
        {offerTenantEmails: enlistment.offerTenantEmails},
        {where: {id: enlistment.id}}
      ).then(function(rowsUpdated) {})
      .catch(err => {
        console.log(err);
        console.log("ERROR -> " + JSON.stringify(err));
      });
    }

    return PropertyEnlistmentContractService.sendOffer(enlistment.contractAddress, {amount, tenantName, tenantEmail});
  },

  async getOffers(enlistmentId) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });
    console.log("ENLISTMENT -> " + JSON.stringify(enlistment));
    var offers = [];
    if(enlistment.offerTenantEmails.length > 0){
      var offer = null, email = null;
      for(email of enlistment.offerTenantEmails){
        console.log("GETTING OFFER FROM -> " + email);
        offer = await PropertyEnlistmentContractService.getOffer(enlistment.contractAddress, email);
        if(offer) {
          console.log("APPEND OFFER -> " + JSON.stringify(offer));
          offers.push(offer);
        }
      }
    }
    return offers;
  },

  async getOffer(enlistmentId, tenantEmail) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.getOffer(enlistment.contractAddress, tenantEmail);
  },

  async cancelOffer(enlistmentId, tenantEmail) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.cancelOffer(enlistment.contractAddress, tenantEmail);
  },

  async reviewOffer(enlistmentId, tenantEmail, approved = true) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.reviewOffer(enlistment.contractAddress, tenantEmail, approved);
  },

  async submitAgreementDraft(enlistmentId, agreementDraft) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    if(agreementDraft.agreementTenantEmail){
      if(!enlistment.agreementTenantEmails) enlistment.agreementTenantEmails = [];
      if(!enlistment.agreementTenantEmails.includes(agreementDraft.agreementTenantEmail))
        enlistment.agreementTenantEmails.push(agreementDraft.agreementTenantEmail);
      Models.PropertyEnlistment.update(
        {agreementTenantEmails: enlistment.agreementTenantEmails},
        {where: {id: enlistment.id}}
      ).then(function(rowsUpdated) {})
      .catch(err => {
        console.log(err);
        console.log("ERROR -> " + JSON.stringify(err));
      });
    }

    return PropertyEnlistmentContractService.submitAgreementDraft(enlistment.contractAddress, agreementDraft);
  },

  async getAgreements(enlistmentId) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    }); 
    console.log("ENLISTMENT -> " + JSON.stringify(enlistment));
    var agreements = [];
    if(enlistment.agreementTenantEmails.length > 0){
      var agreement = null, email = null;
      for(email of enlistment.agreementTenantEmails){
        agreement = await PropertyEnlistmentContractService.getAgreement(enlistment.contractAddress, email);
        if(agreement) agreements.push(agreement);
      }
    }
    return agreements;
  },

  async getAgreement(enlistmentId, tenantEmail) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.getAgreement(enlistment.contractAddress, tenantEmail);
  },

  async reviewAgreement(enlistmentId, tenantEmail, confirmed = true) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.reviewAgreement(enlistment.contractAddress, tenantEmail, confirmed);
  },

  async signAgreement(enlistmentId, tenantEmail, party, signatureHash) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    if (party === 'landlord') {
      return PropertyEnlistmentContractService.landlordSignAgreement(enlistment.contractAddress, tenantEmail, signatureHash);
    } else {
      return PropertyEnlistmentContractService.tenantSignAgreement(enlistment.contractAddress, tenantEmail, signatureHash);
    }
  },

  async cancelAgreement(enlistmentId, tenantEmail) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.cancelAgreement(enlistment.contractAddress, tenantEmail);
  },

  async receiveFirstMonthRent(enlistmentId, tenantEmail) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.receiveFirstMonthRent(enlistment.contractAddress, tenantEmail);
  },

  async receiveMonthlyRent(enlistmentId, tenantEmail, amount) {
    const enlistment = await Models.PropertyEnlistment.findOne({
      where: {
        id: enlistmentId
      }
    });

    return PropertyEnlistmentContractService.receiveMonthlyRent(enlistment.contractAddress, tenantEmail, amount);
  }

};
