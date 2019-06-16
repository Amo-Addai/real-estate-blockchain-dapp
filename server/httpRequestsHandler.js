'use strict';

const bodyParser = require('body-parser');
const path = require('path');
const asyncMiddleware = require('./utils').asyncMiddleware;
const log = require('./logger');
const middlewaresConfig = require('../config/middlewares');

module.exports = {
  createHandlers(app, routes, controllers, middlewares) {
    app.use(bodyParser.json({limit: '10mb'}));
    app.use(bodyParser.urlencoded({limit: '10mb', extended: true})); // for parsing application/x-www-form-urlencoded

    app.use((req, res, next) => {
      log.verbose(`HTTP Request :: Method: ${req.method}, Url: ${req.url}`);
      next();
    });

    // CORS support
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });

    let middlewareMap = _mapMiddlewaresToControllers(middlewares, middlewaresConfig);

    Object.keys(routes).forEach((routePath) => {
      let handleRoute = _getParsedRoute(routes[routePath], routePath);

      if (_isRouteValidated(app, handleRoute, controllers)) {
        log.info(`Routes :: Route: "${routePath}" is loaded`);

        _mapRouteAndApplyMiddleware(app, handleRoute,
          controllers[handleRoute.controller][handleRoute.action],
          middlewareMap[handleRoute.controller]);
      } else {
        process.exit(1); //eslint-disable-line
      }
    });

    app.use((error, req, res, next) => {
      log.error(error);
      res.status(500).send(error.message);
    });
  }
};

function _getParsedRoute(route, routePath) {
  let splitRoute = routePath.split(' ', 2);

  return {
    url: splitRoute[1],
    method: splitRoute[0].toLowerCase(),
    action: route.action,
    controller: path.normalize(route.controller)
  };
}

function _isRouteValidated(app, route, controllers) {
  if (!controllers.hasOwnProperty(route.controller)) {
    log.error(`Routes :: Controller: "${route.controller}" undefined`);
    return false;
  }

  if (!controllers[route.controller].hasOwnProperty(route.action)) {
    log.error(`Routes :: Action: "${route.action}" in Controller: "${route.controller}" undefined`);
    return false;
  }

  if (!app.hasOwnProperty(route.method)) {
    log.error(`Routes :: Http method: "${route.method}" undefined`);
    return false;
  }

  return true;
}

function _mapMiddlewaresToControllers(middlewares, config) {
  let map = {};
  const normalizedConfig = {};

  const requireMiddleware = (middlewareList = []) => {
    if (!Array.isArray(middlewareList)) {
      throw new Error(`Middleware should be an array`);
    }

    return middlewareList.map(p => {
      let normalizedActionMiddleware = path.normalize(p);

      if (!middlewares[normalizedActionMiddleware]) {
        throw new Error(`Middleware "${p}" is not found`);
      }
      return middlewares[normalizedActionMiddleware];
    });
  };

  Object.keys(config).forEach(controller => {
    normalizedConfig[path.normalize(controller)] = config[controller];
  });

  Object.keys(normalizedConfig).forEach(controller => {
    map[controller] = {};

    Object.keys(normalizedConfig[controller]).forEach(action => {
      const actionMiddleware = normalizedConfig[controller][action];
      map[controller][action] = requireMiddleware(actionMiddleware);
    });
  });

  return map;
}

function _mapRouteAndApplyMiddleware(app, route, controllerAction, controllerMiddlewareMap) {
  if (controllerMiddlewareMap) {
    let middleware = [];

    Object.keys(controllerMiddlewareMap).forEach(action => {
      if (action === '*' || route.action === action) {
        middleware = middleware.concat(asyncMiddleware(controllerMiddlewareMap[action]));
      }
    });

    middleware.push(asyncMiddleware(controllerAction));
    app[route.method](route.url, middleware);
  } else {
    app[route.method](route.url, asyncMiddleware(controllerAction));
  }
}
