'use strict';

const Sequelize = require('sequelize');

module.exports = (config) => {
  return config.url
    ? new Sequelize(config.url, config.options)
    : new Sequelize(config.database, config.user, config.password, config.options);
};
