import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? 'localhost',
  port:               Number(process.env.DB_PORT ?? 3306),
  user:               process.env.DB_USER     ?? 'root',
  password:           process.env.DB_PASSWORD ?? '',
  database:           process.env.DB_NAME     ?? 'myapp',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',           // store/retrieve as UTC
  decimalNumbers:     true,
});

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/**
 * Run a SELECT (or any query returning rows).
 * Returns an array of row objects.
 *
 * @example
 * const users = await query('SELECT * FROM users WHERE id = ?', [id]);
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Run an INSERT / UPDATE / DELETE.
 * Returns the ResultSetHeader (affectedRows, insertId, etc.)
 *
 * @example
 * const result = await execute('UPDATE users SET name = ? WHERE id = ?', [name, id]);
 * console.log(result.affectedRows);
 */
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/**
 * Convenience: return only the first row, or null if none found.
 *
 * @example
 * const user = await queryOne('SELECT * FROM users WHERE email = ?', [email]);
 */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/**
 * Run multiple statements inside a single transaction.
 * Automatically commits on success or rolls back on error.
 *
 * @example
 * await transaction(async (conn) => {
 *   await conn.execute('INSERT INTO orders ...', [...]);
 *   await conn.execute('UPDATE inventory ...', [...]);
 * });
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  await conn.beginTransaction();
  try {
    await fn(conn);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Gracefully drain the pool (call during process shutdown).
 */
export async function closePool() {
  await pool.end();
}

export default pool;