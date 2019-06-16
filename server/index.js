'use strict';

const routes = require('../config/routes');
const dbConfig = require('../config/database');
const _port = require('../config/globals').port;
const log = require('./logger');

module.exports = {
  start({port = _port, env = process.env.NODE_ENV || 'development'}) {
    const sequelize = require('./dbConnector')(dbConfig);

    sequelize.authenticate().then(() => {
      log.info(`Connected to ${sequelize.config.database} db on ${sequelize.config.host}:${sequelize.config.port}`);

      global.Models = require('../api/models')(sequelize);
    }).catch(error => {
      log.error('DB connection error: ', error);
    });

    const express = require('express'),
      app = express(),
      server = require('http').createServer(app);

    let controllersMap = require('./controllersMapper');
    let middlewaresMap = require('./middlewareMapper');

    let httpRequestsHandler = require('./httpRequestsHandler');
    httpRequestsHandler.createHandlers(app, routes, controllersMap, middlewaresMap);

    return server.listen(port, () => {
      log.info('----------------------------------------------------------------');
      log.info('Server listening on port:' + server.address().port);
      log.info(`Log: ${log.transports.console.level}`);
      log.info(`ENV: ${env}`);
    });
  }
};
