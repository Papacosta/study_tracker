const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  database: process.env.PGDATABASE || 'study_tracker',
  user: process.env.PGUSER || process.env.USER,
  password: process.env.PGPASSWORD || undefined,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no cliente PostgreSQL:', err);
});

module.exports = pool;
