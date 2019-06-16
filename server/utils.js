'use strict';

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

module.exports = {
  getFolderFilesRecursivelyWithPath(folderPath) {
    let files = [];

    fs.readdirSync(folderPath).forEach((file) => {
      let fullFilePath = path.join(folderPath, file);

      if (fs.statSync(fullFilePath).isFile()) {
        files.push({
          folder: folderPath,
          file: file
        });
      } else if (fs.statSync(fullFilePath).isDirectory()) {
        files = [...files, ...this.getFolderFilesRecursivelyWithPath(path.join(fullFilePath, '/'))];
      }
    });

    return files;
  },

  asyncMiddleware: (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  }
};
