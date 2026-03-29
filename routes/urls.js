import { Router } from 'express';
import { queryOne, execute } from '../db.js';
import { nanoid } from 'nanoid';

const router = Router();

function formatRow(row) {
  return {
    short_url: row.short_url,
    url:       row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isValidUrl(str) {
  try {
    const { protocol } = new URL(str);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

// POST /shorten
router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url)             return res.status(400).json({ error: 'url is required' });
    if (!isValidUrl(url)) return res.status(400).json({ error: 'url must be a valid http/https URL' });

    const short_url = nanoid(6);
    await execute(
      'INSERT INTO urls (short_url, url) VALUES (?, ?)',
      [short_url, url]
    );

    const row = await queryOne('SELECT * FROM urls WHERE short_url = ?', [short_url]);
    res.status(201).json(formatRow(row));
  } catch (err) { next(err); }
});
// GET /shorten/:shorten/stats  — must be before /:shorten
router.get('/:shorten/stats', async (req, res, next) => {
  try {
    const row = await queryOne(
      'SELECT * FROM urls WHERE short_url = ?',
      [req.params.shorten]
    );
    if (!row) return res.status(404).json({ error: 'Short URL not found' });

    res.json({ ...formatRow(row), accessCount: row.access_count });
  } catch (err) { next(err); }
});

// GET /shorten/:shorten
router.get('/:shorten', async (req, res, next) => {
  try {
    const row = await queryOne(
      'SELECT * FROM urls WHERE short_url = ?',
      [req.params.shorten]
    );
    if (!row) return res.status(404).json({ error: 'Short URL not found' });

    await execute(
      'UPDATE urls SET access_count = access_count + 1 WHERE short_url = ?',
      [req.params.shorten]
    );

    res.json(formatRow(row));
  } catch (err) { next(err); }
});

// PUT /shorten/:shorten
router.put('/:shorten', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url)             return res.status(400).json({ error: 'url is required' });
    if (!isValidUrl(url)) return res.status(400).json({ error: 'url must be a valid http/https URL' });

    const existing = await queryOne(
      'SELECT short_url FROM urls WHERE short_url = ?',
      [req.params.shorten]
    );
    if (!existing) return res.status(404).json({ error: 'Short URL not found' });

    await execute('UPDATE urls SET url = ? WHERE short_url = ?', [url, req.params.shorten]);

    const updated = await queryOne(
      'SELECT * FROM urls WHERE short_url = ?',
      [req.params.shorten]
    );
    res.json(formatRow(updated));
  } catch (err) { next(err); }
});

// DELETE /shorten/:shorten
router.delete('/:shorten', async (req, res, next) => {
  try {
    const result = await execute(
      'DELETE FROM urls WHERE short_url = ?',
      [req.params.shorten]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Short URL not found' });

    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;