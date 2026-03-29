export const MIGRATIONS = [
  {
    name: '001_create_urls',
    sql: `
      CREATE TABLE IF NOT EXISTS urls (
        short_url VARCHAR(255) PRIMARY KEY,
        url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      )
    `,
  },

  {
    name: '002_add_id_and_access_count',
    sql: `
        ALTER TABLE urls
        ADD COLUMN access_count INT NOT NULL DEFAULT 0,
        MODIFY COLUMN url       VARCHAR(2048) NOT NULL,
        MODIFY COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        ADD UNIQUE INDEX idx_short_code (short_url)
    `,
    },
];