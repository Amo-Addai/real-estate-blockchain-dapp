'use strict';

const PropertyEnlistmentService = require('../services/PropertyEnlistmentService');
const log = require('../../server/logger');

module.exports = {
  async submitAgreementDraft(req, res) {
    const agreement = await PropertyEnlistmentService.submitAgreementDraft(req.params.id, req.body);

    log.info('Agreement draft submitted');
    res.status(201).json(agreement);
  },

  async getAgreement(req, res) {
    const agreement = !req.query.tenantEmail ? await PropertyEnlistmentService.getAgreements(req.params.id)
    : await PropertyEnlistmentService.getAgreement(req.params.id, req.query.tenantEmail);

    res.json(agreement);
  },

  async reviewAgreement(req, res) {
    const agreement = await PropertyEnlistmentService.reviewAgreement(req.params.id, req.body.tenantEmail, req.body.confirmed);

    log.info(`Agreement reviewed with resolution ${req.body.confirmed}`);
    res.status(200).json(agreement);
  },

  async signAgreement(req, res) {
    const agreement = await PropertyEnlistmentService.signAgreement(req.params.id, req.body.tenantEmail, req.body.party, req.body.signatureHash);

    log.info(`Agreement signed by ${req.body.party}`);
    res.status(200).json(agreement);
  },

  async cancelAgreement(req, res) {
    const agreement = await PropertyEnlistmentService.cancelAgreement(req.params.id, req.body.tenantEmail);

    log.info(`Agreement cancelled`);
    res.status(200).json(agreement);
  },

  async receiveFirstMonthRent(req, res) {
    const agreement = await PropertyEnlistmentService.receiveFirstMonthRent(req.params.id, req.body.tenantEmail);

    log.info(`First month payment received`);
    res.status(200).json(agreement);
  },

  async receiveMonthlyRent(req, res) {
    const agreement = await PropertyEnlistmentService.receiveMonthlyRent(req.params.id, req.body.tenantEmail, req.body.amount);

    log.info(`Other Monthly Rent payment received`);
    res.status(200).json(agreement);
  }
  
};
