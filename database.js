import pg from 'pg';
const { Pool } = pg;
import {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
  videosTableName,
  usersTableName
} from './constants/common.js';

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

    CREATE EXTENSION IF NOT EXISTS citext;

    CREATE TABLE IF NOT EXISTS ${usersTableName} (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(50) UNIQUE NOT NULL,
      email CITEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name VARCHAR(100),
      google_id TEXT UNIQUE
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

export { getDb };
