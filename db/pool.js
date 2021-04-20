const { Pool } = require('pg');
const config = require('config');

const databaseConfig = { connectionString: config.get('dbUrl') };
const pool = new Pool(databaseConfig);

module.exports = pool;