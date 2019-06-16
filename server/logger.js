'use strict';

const winston = require('winston');
const config = require('../config/log');

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      colorize: true,
      level: config.level,
      timestamp: true
    })
  ]
});

