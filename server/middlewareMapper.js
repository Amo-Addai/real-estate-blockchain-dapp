'use strict';

const path = require('path');
const log = require('./logger');

const middlewareRootPath = 'api/middlewares/';
const middlewareList = require('./utils').getFolderFilesRecursivelyWithPath(middlewareRootPath);

let importedMiddleware = {};

middlewareList.forEach((middleware) => {
  let folderPath = middleware.folder.split(path.normalize(middlewareRootPath))[1] || '';
  let middlewareFileName = middleware.file.split('.')[0];
  let fullFilePath = `../${middleware.folder}${middleware.file}`;

  try {
    importedMiddleware[`${folderPath}${middlewareFileName}`] = require(fullFilePath);
    log.info(`Middleware :: loading middleware "${path.normalize(middleware.folder) + middlewareFileName}"`);
  } catch(error) {
    log.error(`Middleware :: error loading middleware "${path.normalize(middleware.folder) + middlewareFileName}"`, error);
    process.exit(1); // eslint-disable-line
  }
});

module.exports = importedMiddleware;
