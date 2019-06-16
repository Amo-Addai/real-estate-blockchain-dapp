'use strict';

module.exports = (sequelize) => {
  sequelize.sync();

  return {
    PropertyEnlistment: sequelize.import('PropertyEnlistment')
  };
};
