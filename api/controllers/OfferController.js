'use strict';

const PropertyEnlistmentService = require('../services/PropertyEnlistmentService');
const log = require('../../server/logger');

module.exports = {
  async sendOffer(req, res) {
    await PropertyEnlistmentService.sendOffer(req.params.id, req.body);

    log.info('Offer received');
    res.status(201).send();
  },

  async getOffer(req, res) {
    const offer = await PropertyEnlistmentService.getOffer(req.params.id, req.query.tenantEmail);

    res.json(offer);
  },

  async cancelOffer(req, res) {
    await PropertyEnlistmentService.cancelOffer(req.params.id, req.body.tenantEmail);

    log.info(`Offer cancelled`);

    res.status(200).send();
  },

  async reviewOffer(req, res) {
    await PropertyEnlistmentService.reviewOffer(req.params.id, req.body.tenantEmail, req.body.approved);

    log.info(`Offer reviewed with resolution ${req.body.approved}`);

    res.status(200).send();
  }
};
