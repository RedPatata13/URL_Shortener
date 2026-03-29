import mysql from 'mysql2/promise';
import { configDotenv } from 'dotenv';
import { MIGRATIONS } from './migrations.js';

configDotenv();

const {
  DB_HOST = 'localhost',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = '',
} = process.env;

export async function bootstrapDatabase() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
  });

  try {
    await conn.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[db] Database "${DB_NAME}" ready`);

    await conn.query(`USE \`${DB_NAME}\``);
    await runMigrations(conn);
  } finally {
    await conn.end();
  }
}

async function runMigrations(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      run_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const migration of MIGRATIONS) {
    const [rows] = await conn.execute(
      'SELECT id FROM _migrations WHERE name = ?',
      [migration.name]
    );
    if (rows.length > 0) continue; 

    console.log(`[db] Running migration: ${migration.name}`);
    await conn.execute(migration.sql);
    await conn.execute('INSERT INTO _migrations (name) VALUES (?)', [migration.name]);
  }
}

