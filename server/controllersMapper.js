'use strict';

const path = require('path');
const log = require('./logger');

const controllersRootPath = 'api/controllers/';
const controllerList = require('./utils').getFolderFilesRecursivelyWithPath(controllersRootPath);

let importedControllers = {};

controllerList.forEach((controller) => {
  let folderPath = controller.folder.split(path.normalize(controllersRootPath))[1] || '';
  let controllerFileName = controller.file.split('.')[0];
  let fullFilePath = `../${controller.folder}${controller.file}`;

  try {
    importedControllers[`${folderPath}${controllerFileName}`] = require(fullFilePath);
    log.info(`Controllers :: loading controller "${path.normalize(controller.folder) + controllerFileName}"`);
  } catch(error) {
    log.error(`Controllers :: error loading controller "${path.normalize(controller.folder) + controllerFileName}"`, error);
    process.exit(1); // eslint-disable-line
  }
});

module.exports = importedControllers;
