'use strict';

const DataTypes = require('sequelize/lib/data-types');
const Status = require('./enums/PropertyEnlistmentStatus');

module.exports = (sequelize) => {
  const PropertyEnlistment = sequelize.define('property_enlistments', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    landlordName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    streetName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    house: {
      type: DataTypes.STRING,
      allowNull: false
    },
    floor: {
      type: DataTypes.INTEGER
    },
    apartment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zipCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contractAddress: {
      type: DataTypes.STRING
    },
    status: {
      type: DataTypes.ENUM,
      values: [Status.PENDING, Status.APPROVED, Status.REJECTED, Status.CANCELLED],
      defaultValue: Status.PENDING
    },
    geolocation: DataTypes.GEOMETRY('POINT') // eslint-disable-line new-cap
  }, {
    freezeTableName: true
  });

  PropertyEnlistment.prototype.approve = function() {
    this.status = Status.APPROVED;
  };

  PropertyEnlistment.prototype.reject = function() {
    this.status = Status.REJECTED;
  };

  PropertyEnlistment.findInArea = function(latitude, longitude, distance) {
    const query = `
    SELECT
        *, ST_Distance_Sphere(ST_MakePoint(:latitude, :longitude), "geolocation") AS distance
    FROM
        "property_enlistments"
    WHERE
        status = '${Status.APPROVED}' AND
        ST_Distance_Sphere(ST_MakePoint(:latitude, :longitude), "geolocation") < :maxDistance
    `;

    return sequelize.query(query, {
      replacements: {
        latitude,
        longitude,
        maxDistance: distance
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  return PropertyEnlistment;
};
