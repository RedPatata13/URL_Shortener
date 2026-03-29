# snip — URL Shortener API

A REST API for creating and managing short URLs, built with Node.js, Express, and MySQL. From 'Roadmap.sh': https://roadmap.sh/projects/url-shortening-service

## Requirements

- Node.js 18+
- MySQL 8+

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=url_shortener
PORT=3000
```

### 3. Start the server

```bash
node app.js
```

On first run the server will automatically create the database and run all pending migrations. You should see:

```
[db] Database "url_shortener" ready
[db] Running migration: 001_create_urls
[app] Listening on http://localhost:3000
```

---

## Project Structure

```
├── app.js          # Entry point, Express setup, graceful shutdown
├── bootstrap.js    # Database creation and migrations
├── db.js           # Connection pool and query helpers
└── routes/
    └── urls.js     # All /shorten endpoints
```

---

## API Reference

All endpoints are prefixed with `/shorten`. Request and response bodies use JSON.

### Create a short URL

```
POST /shorten
```

**Body**

| field | type   | required | description          |
|-------|--------|----------|----------------------|
| url   | string | yes      | A valid http/https URL |

**Example**

```bash
curl -X POST http://localhost:3000/shorten \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.example.com/some/long/url\"}"
```

**Response `201 Created`**

```json
{
  "shortCode": "abc123",
  "url": "https://www.example.com/some/long/url",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z"
}
```

**Response `400 Bad Request`**

```json
{ "error": "url must be a valid http/https URL" }
```

---

### Retrieve a short URL

```
GET /shorten/:shortCode
```

**Example**

```bash
curl http://localhost:3000/shorten/abc123
```

**Response `200 OK`**

```json
{
  "shortCode": "abc123",
  "url": "https://www.example.com/some/long/url",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z"
}
```

**Response `404 Not Found`**

```json
{ "error": "Short URL not found" }
```

---

### Update a short URL

```
PUT /shorten/:shortCode
```

**Body**

| field | type   | required | description            |
|-------|--------|----------|------------------------|
| url   | string | yes      | The new destination URL |

**Example**

```bash
curl -X PUT http://localhost:3000/shorten/abc123 \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://www.example.com/updated\"}"
```

**Response `200 OK`**

```json
{
  "shortCode": "abc123",
  "url": "https://www.example.com/updated",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:30:00.000Z"
}
```

**Response `404 Not Found`**

```json
{ "error": "Short URL not found" }
```

---

### Delete a short URL

```
DELETE /shorten/:shortCode
```

**Example**

```bash
curl -X DELETE http://localhost:3000/shorten/abc123
```

**Response `204 No Content`** — empty body on success.

**Response `404 Not Found`**

```json
{ "error": "Short URL not found" }
```

---

### Get URL statistics

```
GET /shorten/:shortCode/stats
```

**Example**

```bash
curl http://localhost:3000/shorten/abc123/stats
```

**Response `200 OK`**

```json
{
  "shortCode": "abc123",
  "url": "https://www.example.com/some/long/url",
  "createdAt": "2021-09-01T12:00:00.000Z",
  "updatedAt": "2021-09-01T12:00:00.000Z",
  "accessCount": 10
}
```

**Response `404 Not Found`**

```json
{ "error": "Short URL not found" }
```

---

## Database

The database schema is managed through a simple migration system in `bootstrap.js`. Migrations are append-only — never edit an existing entry, only add new ones.

```js
const MIGRATIONS = [
  {
    name: '001_create_urls',
    sql: `CREATE TABLE IF NOT EXISTS urls (...)`,
  },
  // add new migrations here
];
```

Each migration runs exactly once and is tracked in a `_migrations` table. On every startup, only migrations that haven't been recorded yet will execute.

---

## Query Helpers

`db.js` exports four helpers for use in routes and services:

| helper | use for |
|--------|---------|
| `query(sql, params)` | SELECT — returns array of rows |
| `queryOne(sql, params)` | SELECT — returns first row or `null` |
| `execute(sql, params)` | INSERT / UPDATE / DELETE — returns `ResultSetHeader` |
| `transaction(fn)` | Multiple statements in a single commit/rollback |

All queries use prepared statements via `pool.execute()`, which prevents SQL injection automatically.
