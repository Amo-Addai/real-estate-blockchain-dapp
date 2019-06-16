module.exports = {
  url: process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/real_estate_database",
  options: { // "postgres://postgres:password@localhost:5432/real_estate_database",
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    logging: false
  }
};
