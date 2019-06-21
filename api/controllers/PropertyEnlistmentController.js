'use strict';

const PropertyEnlistmentService = require('../services/PropertyEnlistmentService');
const log = require('../../server/logger');

module.exports = {
  async createEnlistment(req, res) {
    const enlistment = await PropertyEnlistmentService.createEnlistment(req.body);

    log.info(`Enlistment created`);

    res.status(201).json(enlistment);
  },

  async approveEnlistment(req, res) {
    const enlistment = await PropertyEnlistmentService.approveEnlistment(req.params.id);

    log.info(`Enlistment with id: ${req.params.id} approved`);

    res.status(200).json(enlistment);
  },

  async rejectEnlistment(req, res) {
    const enlistment = await PropertyEnlistmentService.rejectEnlistment(req.params.id);

    log.info(`Enlistment with id: ${req.params.id} rejected`);

    res.status(200).json(enlistment);
  },

  async findInArea(req, res) {
    if (!req.query.latitude || !req.query.longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const enlistments = await PropertyEnlistmentService.findInArea(
      parseFloat(req.query.latitude), parseFloat(req.query.longitude), parseFloat(req.query.distance)) || [];

    res.json(enlistments);
  },

  async find(req, res) {
    let condition = req.query.condition || null;

    const enlistments = await PropertyEnlistmentService.find(condition) || [];
    console.log("ENLISTMENTS -> " + JSON.stringify(enlistments));

    res.json(enlistments);
  },
};
