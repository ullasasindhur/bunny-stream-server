import pg from 'pg';
const { Pool } = pg;
const videosTableName = 'videos';

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME || !DB_PORT) {
  console.error(
    'Missing DB env vars. Ensure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT are set.'
  );
  process.exit(1);
}

const dbConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT
};

let db;

async function initializeDatabase() {
  try {
    db = new Pool({
      ...dbConfig
    });

    await db.query(`
    CREATE TABLE IF NOT EXISTS ${videosTableName} (
        guid UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        thumbnail_url TEXT,
        genres JSONB DEFAULT '[]'::jsonb NOT NULL,
        category VARCHAR(10) NOT NULL DEFAULT 'movie' CHECK (category IN ('movie', 'shorts')),
        created_at timestamptz DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_videos_genres ON ${videosTableName} USING GIN (genres jsonb_path_ops);
  `);
    console.log('✅ Database and tables are ready.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
}

await initializeDatabase();

function getDb() {
  return db;
}

export { videosTableName, getDb };
