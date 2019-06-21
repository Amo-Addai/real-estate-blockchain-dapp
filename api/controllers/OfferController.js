'use strict';

const PropertyEnlistmentService = require('../services/PropertyEnlistmentService');
const log = require('../../server/logger');

module.exports = {
  async sendOffer(req, res) {
    const offer = await PropertyEnlistmentService.sendOffer(req.params.id, req.body);

    log.info('Offer received');
    res.status(201).json(offer);
  },

  async getOffer(req, res) {
    const offer = !req.query.tenantEmail ? await PropertyEnlistmentService.getOffers(req.params.id)
    :  await PropertyEnlistmentService.getOffer(req.params.id, req.query.tenantEmail);

    res.json(offer);
  },

  async cancelOffer(req, res) {
    const offer = await PropertyEnlistmentService.cancelOffer(req.params.id, req.body.tenantEmail);

    log.info(`Offer cancelled`);

    res.status(200).json(offer);
  },

  async reviewOffer(req, res) {
    const offer = await PropertyEnlistmentService.reviewOffer(req.params.id, req.body.tenantEmail, req.body.approved);

    log.info(`Offer reviewed with resolution ${req.body.approved}`);

    res.status(200).json(offer);
  }
};
