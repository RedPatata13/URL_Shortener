import 'dotenv/config';
import express from 'express';
import { bootstrapDatabase } from './bootstrap.js';
import { closePool, query, queryOne, execute, transaction } from './db.js';
import urlRoutes from './routes/urls.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
app.use('/shorten', urlRoutes);

async function start() {
  await bootstrapDatabase();

  const PORT = process.env.PORT ?? 3000;
// after all your routes, before app.listen
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(err.status ?? 500).json({ error: err.message });
    });

  const server = app.listen(PORT, () =>
    console.log(`[app] Listening on http://localhost:${PORT}`)
  );

  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, async () => {
      server.close();
      await closePool();
      process.exit(0);
    });
  }
}

start().catch((err) => {
  console.error('[app] Failed to start:', err);
  process.exit(1);
});